/* Splitora Desktop — main process */
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');
const license = require('./license');

/* ffmpeg/ffprobe binaries bundled via ffmpeg-static & ffprobe-static.
   Inside a packaged app they live in app.asar.unpacked (see asarUnpack in package.json). */
function unpacked(p) {
  return p ? p.replace('app.asar', 'app.asar.unpacked') : p;
}
const FFMPEG = unpacked(require('ffmpeg-static'));
const FFPROBE = unpacked(require('ffprobe-static').path);

let win = null;
let currentJob = null; // active ffmpeg child process

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 780,
    minWidth: 720,
    minHeight: 600,
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  license.init(app.getPath('userData'));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

/* ---------- helpers ---------- */
/* يدوّر على أقرب سطر فيه كلمة خطأ فعلية بدل ما ياخد آخر جزء عشوائي من اللوج
   (اللي غالباً بيكون بس معلومات الفيديو العادية) */
function extractFfmpegError(stderrText) {
  const lines = String(stderrText || '').split('\n').map(l => l.trim()).filter(Boolean);
  const errLines = lines.filter(l => /error|invalid|failed|no such|unable|unrecognized|cannot|could not/i.test(l));
  if (errLines.length) return errLines.slice(-3).join(' — ').slice(0, 500);
  return lines.slice(-5).join(' — ').slice(-500);
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { windowsHide: true });
    let out = '', err = '';
    p.stdout.on('data', d => out += d);
    p.stderr.on('data', d => err += d);
    p.on('error', reject);
    p.on('close', code => code === 0 ? resolve(out) : reject(new Error(err.slice(-800) || ('exit ' + code))));
  });
}

function runBuffer(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { windowsHide: true });
    const chunks = [];
    let err = '';
    p.stdout.on('data', d => chunks.push(d));
    p.stderr.on('data', d => { err += d; if (err.length > 4000) err = err.slice(-2000); });
    p.on('error', reject);
    p.on('close', code => code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error(err.slice(-500) || ('exit ' + code))));
  });
}

function hms(sec) {
  sec = Math.max(0, sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = (sec % 60).toFixed(2);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(5, '0')}`;
}

/* ---------- captions (SRT) ---------- */
function srtTimeToSec(t) {
  const m = t.match(/(\d+):(\d{2}):(\d{2})[,.](\d{3})/);
  if (!m) return 0;
  return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / 1000;
}
function secToSrtTime(s) {
  s = Math.max(0, s);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  const ms = Math.round((s - Math.floor(s)) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}
function parseSrt(text) {
  const blocks = text.replace(/\r/g, '').trim().split(/\n\n+/);
  const cues = [];
  for (const b of blocks) {
    const lines = b.split('\n').filter(Boolean);
    const timeLine = lines.find(l => l.includes('-->'));
    if (!timeLine) continue;
    const [a, c] = timeLine.split('-->').map(x => x.trim());
    const start = srtTimeToSec(a), end = srtTimeToSec(c);
    const textLines = lines.slice(lines.indexOf(timeLine) + 1);
    if (textLines.length) cues.push({ start, end, text: textLines.join('\n') });
  }
  return cues;
}
function writeSrt(cues) {
  return cues.map((c, i) => `${i + 1}\n${secToSrtTime(c.start)} --> ${secToSrtTime(c.end)}\n${c.text}\n`).join('\n');
}
/** يرجع مسار ملف SRT جديد بتوقيتات منزاحة لمقطع معين (لوضع المقاطع المخصصة) */
function shiftSrtForClip(srtPath, clipStart, clipLen, tmpDir) {
  const cues = parseSrt(fs.readFileSync(srtPath, 'utf8'));
  const shifted = [];
  for (const c of cues) {
    const s = c.start - clipStart, e = c.end - clipStart;
    if (e <= 0 || s >= clipLen) continue; // خارج المقطع تماماً
    shifted.push({ start: Math.max(0, s), end: Math.min(clipLen, e), text: c.text });
  }
  const out = path.join(tmpDir, 'cap_' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.srt');
  fs.writeFileSync(out, writeSrt(shifted), 'utf8');
  return out;
}
/** يجهز مسار ملف للاستخدام جوه فلتر ffmpeg (تهريب \ و : و ') */
function ffFilterPath(p) {
  let s = String(p).replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "'\\''");
  return `'${s}'`;
}
const CAPTION_STYLES = {
  bold: 'FontName=Arial,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2.5,Shadow=0,Bold=1,Alignment=2',
  bar: 'FontName=Arial,PrimaryColour=&H00FFFFFF,BackColour=&H80000000,BorderStyle=3,Outline=0,Shadow=0,Bold=1,Alignment=2',
  pill: 'FontName=Arial,PrimaryColour=&H00FFFFFF,BackColour=&H00F67C2F,BorderStyle=3,Outline=0,Shadow=0,Bold=1,Alignment=2',
};
function captionForceStyle(styleKey, outH) {
  const base = CAPTION_STYLES[styleKey] || CAPTION_STYLES.bold;
  const fontSize = Math.max(14, Math.round((outH || 1080) * 0.045));
  const marginV = Math.round((outH || 1080) * 0.05);
  return `${base},FontSize=${fontSize},MarginV=${marginV}`;
}

/* ---------- license ---------- */
ipcMain.handle('license-status', () => license.getStatus());
ipcMain.handle('license-activate', (_e, key) => license.activate(key));

/* ---------- IPC ---------- */
ipcMain.handle('pick-video', async () => {
  const r = await dialog.showOpenDialog(win, {
    title: 'اختر فيديو',
    properties: ['openFile'],
    filters: [{ name: 'Videos', extensions: ['mp4', 'mov', 'webm', 'mkv', 'm4v', 'avi'] }]
  });
  if (r.canceled || !r.filePaths[0]) return null;
  return r.filePaths[0];
});

ipcMain.handle('probe', async (_e, file) => {
  const out = await run(FFPROBE, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file]);
  const j = JSON.parse(out);
  const v = (j.streams || []).find(s => s.codec_type === 'video') || {};
  const duration = parseFloat(j.format?.duration || v.duration || 0);
  const size = parseInt(j.format?.size || 0, 10) || fs.statSync(file).size;
  let fps = 30;
  const rate = v.avg_frame_rate || v.r_frame_rate || '';
  if (rate && rate.includes('/')) {
    const [num, den] = rate.split('/').map(Number);
    if (den > 0 && num > 0) fps = num / den;
  } else if (rate && !isNaN(+rate) && +rate > 0) {
    fps = +rate;
  }
  return { duration, size, width: v.width || 0, height: v.height || 0, name: path.basename(file), fps };
});

ipcMain.handle('gen-thumbstrip', async (_e, opts) => {
  const { input, duration, count } = opts;
  if (!fs.existsSync(input) || !duration || duration <= 0) return [];
  const n = Math.max(4, Math.min(24, count || 14));
  const tmpDir = path.join(os.tmpdir(), 'splitora-thumbstrip-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });
  const results = [];
  try {
    for (let i = 0; i < n; i++) {
      const t = Math.min(duration - 0.05, Math.max(0, (duration * (i + 0.5)) / n));
      const out = path.join(tmpDir, `f${i}.jpg`);
      try {
        await run(FFMPEG, ['-hide_banner', '-y', '-ss', String(t), '-i', input,
          '-frames:v', '1', '-vf', 'scale=160:-1', '-q:v', '4', out]);
        if (fs.existsSync(out)) {
          const b64 = fs.readFileSync(out).toString('base64');
          results.push('data:image/jpeg;base64,' + b64);
        }
      } catch (_e2) { /* skip failed frame, keep the rest */ }
    }
  } finally {
    fs.rm(tmpDir, { recursive: true, force: true }, () => {});
  }
  return results;
});

ipcMain.handle('gen-waveform', async (_e, opts) => {
  const { input, points } = opts;
  if (!fs.existsSync(input)) return [];
  const n = Math.max(20, Math.min(600, points || 200));
  try {
    // صوت خام أحادي بمعدل عينات منخفض — كفاية لرسم شكل الموجة، وسريع جداً
    const buf = await runBuffer(FFMPEG, ['-hide_banner', '-v', 'error', '-i', input,
      '-vn', '-ac', '1', '-ar', '8000', '-f', 's16le', 'pipe:1']);
    const sampleCount = Math.floor(buf.length / 2); // 16-bit = 2 bytes/sample
    if (sampleCount < 1) return [];
    const perBucket = Math.max(1, Math.floor(sampleCount / n));
    const peaks = [];
    for (let i = 0; i < n; i++) {
      const start = i * perBucket;
      const end = Math.min(sampleCount, start + perBucket);
      if (start >= sampleCount) { peaks.push(0); continue; }
      let maxAbs = 0;
      for (let j = start; j < end; j += 4) { // نأخذ عينة كل 4 لسرعة الحساب
        const v = Math.abs(buf.readInt16LE(j * 2));
        if (v > maxAbs) maxAbs = v;
      }
      peaks.push(maxAbs / 32768);
    }
    return peaks;
  } catch (_e2) {
    return []; // الفيديو من غير صوت أو فشل الاستخراج — نتجاهل ونسيب الفيلم سترip يشتغل لوحده
  }
});

ipcMain.handle('pick-srt', async () => {
  const r = await dialog.showOpenDialog(win, {
    title: 'اختاري ملف الترجمة',
    filters: [{ name: 'SubRip Subtitle', extensions: ['srt'] }],
    properties: ['openFile'],
  });
  if (r.canceled || !r.filePaths[0]) return null;
  return r.filePaths[0];
});

ipcMain.handle('pick-outdir', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'اختر مجلد الحفظ', properties: ['openDirectory', 'createDirectory'] });
  if (r.canceled || !r.filePaths[0]) return null;
  return r.filePaths[0];
});

ipcMain.handle('default-outdir', () => app.getPath('videos') || app.getPath('downloads'));

ipcMain.handle('split', async (_e, opts) => {
  const { input, outDir, clipSec, quality, reels, duration,
          mode, ranges, fps, overlayPng, thumbnail,
          captionsPath, captionsStyle, videoW, videoH } = opts;
  if (!fs.existsSync(input)) throw new Error('input not found');

  const licStatus = license.getStatus();
  if (licStatus.mode === 'locked') throw new Error('E_LICENSE_LOCKED');
  const watermarkPath = licStatus.watermark ? unpacked(path.join(__dirname, 'build', 'icon.png')) : null;
  const hasWatermark = !!(watermarkPath && fs.existsSync(watermarkPath));
  const hasCaptions = !!(captionsPath && fs.existsSync(captionsPath));

  // نفس منطق حساب أبعاد المخرج المستخدم في الواجهة، لتحجيم خط الترجمة تناسبياً
  function computeOutH() {
    if (reels) return quality === '720' ? 1280 : 1920;
    let h = videoH || 720;
    const cap = quality === '1080' ? 1080 : quality === '720' ? 720 : 0;
    if (cap && h > cap) h = cap;
    return h;
  }
  // عرض المخرج الفعلي — لازم يتحسب عشان نديه لـ libass كـ original_size (شوفي الشرح تحت)
  function computeOutW(h) {
    if (reels) return quality === '720' ? 720 : 1080;
    if (videoW && videoH) {
      let w = Math.round(videoW * (h / videoH));
      if (w % 2 !== 0) w -= 1; // scale=-2 دايماً بتطلّع عرض زوجي
      return w;
    }
    return videoW || 1280;
  }
  const outH = computeOutH();
  const outW = computeOutW(outH);
  const capForceStyle = hasCaptions ? captionForceStyle(captionsStyle, outH) : '';
  const capsTmpDir = hasCaptions ? path.join(os.tmpdir(), 'splitora-caps-' + Date.now()) : null;
  if (capsTmpDir) fs.mkdirSync(capsTmpDir, { recursive: true });

  // دالة بتاخد مسار SRT للمقطع الحالي (بدون إزاحة للأوتوماتيك، بإزاحة للمقاطع المخصصة)
  function captionsFilterFor(srtPathForThisClip) {
    if (!srtPathForThisClip) return null;
    // original_size بيقول لـ libass إن قيم FontSize/MarginV محسوبة أصلاً على دقة outW×outH،
    // فمايعملش تكبير تلقائي إضافي بناءً على دقة PlayRes الافتراضية (384×288) اللي بييجي بيها SRT بدون ASS header.
    // ده هو سبب ظهور الترجمة عملاقة/متراكبة.
    return `subtitles=filename=${ffFilterPath(srtPathForThisClip)}:force_style='${capForceStyle}':original_size=${outW}x${outH}`;
  }

  // dedicated subfolder per job: <video name>_parts, deduped
  const base = path.basename(input).replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 60) || 'video';
  let jobDir = path.join(outDir, base + '_parts');
  let k = 2;
  while (fs.existsSync(jobDir)) jobDir = path.join(outDir, `${base}_parts_${k++}`);
  fs.mkdirSync(jobDir, { recursive: true });

  const hasOverlay = overlayPng && fs.existsSync(overlayPng);
  const useFps = fps && fps > 0;
  const needsEncode = reels || quality !== 'copy' || hasOverlay || useFps || hasWatermark || hasCaptions;

  // ترتيب مداخل الـ overlay: العلامة المائية (لو الفترة تجريبية) ثم النص المخصص للمستخدم
  function overlayInputs() {
    const list = [];
    if (hasWatermark) list.push(watermarkPath);
    if (hasOverlay) list.push(overlayPng);
    return list;
  }

  // scale/pad/fps/captions chain، وسلسلة overlay عامة بتدعم علامة مائية + نص فوق بعض
  function filterArgs(capFilterStr) {
    const vf = [];
    if (reels) {
      const w = quality === '720' ? 720 : 1080, h = quality === '720' ? 1280 : 1920;
      vf.push(`scale=${w}:${h}:force_original_aspect_ratio=decrease`, `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black`);
    } else if (quality === '1080') vf.push('scale=-2:min(1080\\,ih)');
    else if (quality === '720') vf.push('scale=-2:min(720\\,ih)');
    if (useFps) vf.push('fps=' + fps);
    if (capFilterStr) vf.push(capFilterStr);

    if (!hasWatermark && !hasOverlay) return vf.length ? ['-vf', vf.join(',')] : [];

    const filters = [];
    let cur = '[0:v]';
    if (vf.length) { filters.push(`${cur}${vf.join(',')}[vbase]`); cur = '[vbase]'; }

    const steps = [];
    let inputIdx = 1;
    if (hasWatermark) steps.push({ input: inputIdx++, scale: 'iw*0.16:-1', pos: 'W-w-16:H-h-16' });
    if (hasOverlay) steps.push({ input: inputIdx++, scale: null, pos: '(W-w)/2:(H-h)/2' });

    steps.forEach((s, i) => {
      const isLast = i === steps.length - 1;
      const outLabel = isLast ? '[vout]' : `[vtmp${i}]`;
      if (s.scale) {
        filters.push(`[${s.input}:v]scale=${s.scale}[ov${i}]`);
        filters.push(`${cur}[ov${i}]overlay=${s.pos}:format=auto${outLabel}`);
      } else {
        filters.push(`${cur}[${s.input}:v]overlay=${s.pos}:format=auto${outLabel}`);
      }
      cur = outLabel;
    });
    return ['-filter_complex', filters.join(';')];
  }
  function mapArgs() {
    return (hasWatermark || hasOverlay) ? ['-map', '[vout]', '-map', '0:a?'] : ['-map', '0:v:0', '-map', '0:a?'];
  }
  const codecArgs = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k'];

  function runFfmpeg(args, progressBase, progressSpan, totalSec) {
    return new Promise((resolve, reject) => {
      const p = spawn(FFMPEG, args, { windowsHide: true });
      currentJob = p;
      let err = '';
      p.stderr.on('data', d => {
        const s = d.toString();
        err += s; if (err.length > 6000) err = err.slice(-3000);
        const m = s.match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/);
        if (m && totalSec > 0 && win && !win.isDestroyed()) {
          const t = (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]);
          const ratio = progressBase + Math.min(1, t / totalSec) * progressSpan;
          win.webContents.send('split-progress', Math.min(0.999, ratio));
        }
      });
      p.on('error', e => { currentJob = null; reject(e); });
      p.on('close', code => {
        currentJob = null;
        if (code === null) return reject(new Error('cancelled'));
        if (code !== 0) return reject(new Error(extractFfmpegError(err) || ('ffmpeg exit ' + code)));
        resolve();
      });
    });
  }

  if (mode === 'ranges' && Array.isArray(ranges) && ranges.length) {
    // ===== custom from→to clips =====
    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i];
      const len = Math.max(0.1, r.end - r.start);
      const out = path.join(jobDir, `Splitora_Part_${String(i + 1).padStart(3, '0')}.mp4`);
      const args = ['-hide_banner', '-y', '-ss', String(r.start), '-i', input];
      for (const ov of overlayInputs()) args.push('-i', ov);
      args.push('-t', String(len));
      let capFilterStr = null;
      if (hasCaptions) {
        const shiftedSrt = shiftSrtForClip(captionsPath, r.start, len, capsTmpDir);
        capFilterStr = captionsFilterFor(shiftedSrt);
      }
      if (needsEncode) { args.push(...filterArgs(capFilterStr), ...codecArgs); }
      else { args.push('-c', 'copy', '-avoid_negative_ts', 'make_zero'); }
      args.push(...mapArgs(), out);
      await runFfmpeg(args, i / ranges.length, 1 / ranges.length, len);
    }
  } else {
    // ===== automatic equal splitting (segment muxer, single pass) =====
    const outPat = path.join(jobDir, 'Splitora_Part_%03d.mp4');
    const args = ['-hide_banner', '-y', '-i', input];
    for (const ov of overlayInputs()) args.push('-i', ov);
    const capFilterStr = hasCaptions ? captionsFilterFor(captionsPath) : null; // بدون إزاحة — التوقيت مطلق على طول الفيديو الأصلي
    if (needsEncode) {
      args.push(...filterArgs(capFilterStr), ...codecArgs, '-force_key_frames', `expr:gte(t,n_forced*${clipSec})`);
    } else {
      args.push('-c', 'copy');
    }
    args.push(...mapArgs(), '-f', 'segment', '-segment_time', String(clipSec));
    if (needsEncode) args.push('-segment_time_delta', '0.05'); // second-accurate cuts with forced keyframes
    args.push('-reset_timestamps', '1', '-segment_start_number', '1', outPat);
    await runFfmpeg(args, 0, 1, duration || 0);
  }
  if (capsTmpDir) fs.rm(capsTmpDir, { recursive: true, force: true }, () => {});

  // ===== collect parts =====
  let files = fs.readdirSync(jobDir)
    .filter(f => /^Splitora_Part_\d+\.mp4$/.test(f)).sort()
    .map(f => ({ name: f, path: path.join(jobDir, f) }));
  if (!files.length) throw new Error('no output produced');

  // ===== embed thumbnail as cover art (attached_pic) =====
  if (thumbnail && fs.existsSync(thumbnail)) {
    for (const f of files) {
      const tmp = f.path + '.cover.mp4';
      try {
        await run(FFMPEG, ['-hide_banner', '-y', '-i', f.path, '-i', thumbnail,
          '-map', '0', '-map', '1', '-c', 'copy', '-c:v:1', 'mjpeg', '-disposition:v:1', 'attached_pic', tmp]);
        fs.renameSync(tmp, f.path);
      } catch (e) { try { fs.rmSync(tmp, { force: true }); } catch (_) {} }
    }
  }

  files = files.map(f => ({ name: f.name, path: f.path, size: fs.statSync(f.path).size }));
  return { dir: jobDir, files };
});

/* ---------- overlay / thumbnail helpers ---------- */
ipcMain.handle('save-temp-png', (_e, dataUrl) => {
  const m = /^data:image\/png;base64,(.+)$/.exec(dataUrl || '');
  if (!m) throw new Error('bad png data');
  const dir = path.join(app.getPath('userData'), 'tmp');
  fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, 'overlay_' + Date.now() + '.png');
  fs.writeFileSync(p, Buffer.from(m[1], 'base64'));
  return p;
});

ipcMain.handle('pick-image', async () => {
  const r = await dialog.showOpenDialog(win, {
    title: 'اختر صورة الثامنيل',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }]
  });
  if (r.canceled || !r.filePaths[0]) return null;
  return r.filePaths[0];
});

/* ---------- yt-dlp: download videos from URLs (YouTube, TikTok, 1800+ sites) ---------- */
const YTDLP_NAME = process.platform === 'win32' ? 'yt-dlp.exe' : (process.platform === 'darwin' ? 'yt-dlp_macos' : 'yt-dlp');
function bundledYtdlp() {
  const candidates = [
    path.join(process.resourcesPath || '', 'bin', YTDLP_NAME), // packaged app
    path.join(__dirname, 'bin', YTDLP_NAME)                    // dev mode
  ];
  return candidates.find(p => { try { return fs.existsSync(p); } catch (_) { return false; } }) || null;
}
function ytdlpPath() {
  // writable copy in userData so self-update (-U) works even when the app dir is read-only
  try {
    const dir = path.join(app.getPath('userData'), 'bin');
    const target = path.join(dir, YTDLP_NAME);
    if (!fs.existsSync(target)) {
      const src = bundledYtdlp();
      if (!src) return null;
      fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(src, target);
    }
    if (process.platform !== 'win32') { try { fs.chmodSync(target, 0o755); } catch (_) {} }
    return target;
  } catch (_) { return bundledYtdlp(); }
}
let YTDLP = null;
app.whenReady().then(() => {
  YTDLP = ytdlpPath();
  // silent self-update in the background (YouTube changes often; yt-dlp patches fast)
  if (YTDLP) { try { spawn(YTDLP, ['-U'], { windowsHide: true }).on('error', () => {}); } catch (_) {} }
});

function mapYtdlpError(err) {
  if (/Private video|This video is private/i.test(err)) return 'E_PRIVATE';
  if (/confirm your age|age-restricted/i.test(err)) return 'E_AGE';
  if (/Unsupported URL|is not a valid URL/i.test(err)) return 'E_UNSUPPORTED';
  if (/not a bot|Sign in to confirm/i.test(err)) return 'E_BOTCHECK';
  if (/Video unavailable|has been removed/i.test(err)) return 'E_UNAVAILABLE';
  if (/getaddrinfo|timed out|Network|Temporary failure|unable to download/i.test(err)) return 'E_NETWORK';
  return (err || '').trim().slice(-400) || 'E_UNKNOWN';
}

let currentDl = null;

ipcMain.handle('url-info', async (_e, url) => {
  if (!YTDLP) throw new Error('E_NO_YTDLP');
  try {
    const out = await run(YTDLP, ['-J', '--no-playlist', '--no-warnings', url]);
    const j = JSON.parse(out);
    const info = j.entries ? j.entries[0] : j;
    return {
      title: info.title || 'video',
      duration: info.duration || 0,
      uploader: info.uploader || info.channel || '',
      thumbnail: info.thumbnail || ''
    };
  } catch (e) { throw new Error(mapYtdlpError(String(e.message || e))); }
});

ipcMain.handle('url-download', async (_e, url) => {
  if (!YTDLP) throw new Error('E_NO_YTDLP');
  const dir = path.join(app.getPath('userData'), 'downloads');
  fs.mkdirSync(dir, { recursive: true });
  const args = ['--no-playlist', '--newline', '--no-warnings', '--no-quiet', '--restrict-filenames',
    '-f', 'bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b',
    '--merge-output-format', 'mp4',
    '--ffmpeg-location', path.dirname(FFMPEG),
    '-o', path.join(dir, '%(title).80B [%(id)s].%(ext)s'),
    '--print', 'after_move:filepath',
    url];
  return await new Promise((resolve, reject) => {
    const p = spawn(YTDLP, args, { windowsHide: true });
    currentDl = p;
    let err = '', fileOut = '';
    p.stdout.on('data', d => {
      for (const line of d.toString().split(/\r?\n/)) {
        const m = line.match(/\[download\]\s+([\d.]+)%/);
        if (m && win && !win.isDestroyed()) win.webContents.send('url-progress', Math.min(0.999, parseFloat(m[1]) / 100));
        const t2 = line.trim();
        if (t2 && (t2.startsWith('/') || /^[A-Za-z]:\\/.test(t2))) fileOut = t2; // printed final filepath
      }
    });
    p.stderr.on('data', d => { err += d; if (err.length > 6000) err = err.slice(-3000); });
    p.on('error', e => { currentDl = null; reject(e); });
    p.on('close', code => {
      currentDl = null;
      if (code === null) return reject(new Error('cancelled'));
      if (code !== 0) return reject(new Error(mapYtdlpError(err)));
      if (fileOut && fs.existsSync(fileOut)) return resolve(fileOut);
      // fallback: newest video file in the downloads dir
      try {
        const c = fs.readdirSync(dir).map(f => path.join(dir, f))
          .filter(f => /\.(mp4|mkv|webm|mov)$/i.test(f))
          .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
        if (c) return resolve(c);
      } catch (_) {}
      reject(new Error(mapYtdlpError(err)));
    });
  });
});

ipcMain.handle('cancel-download', () => {
  if (currentDl) { try { currentDl.kill('SIGKILL'); } catch (_) {} currentDl = null; return true; }
  return false;
});

ipcMain.handle('cancel-split', () => {
  if (currentJob) { try { currentJob.kill('SIGKILL'); } catch (_) {} currentJob = null; return true; }
  return false;
});

/* ---------- Whisper: توليد ترجمة تلقائي محلياً بالكامل (offline, مجاني) ---------- */
/* نفس منطق تجهيز yt-dlp بالظبط: باينري whisper.cpp بيتحمّل وقت البناء (bin/)،
   وموديل الصوت (ggml) بيتحمّل مرة واحدة عند أول استخدام لملف المستخدم (userData) — عشان منكبرش حجم المثبّت. */
const WHISPER_NAME = process.platform === 'win32' ? 'whisper-cli.exe' : 'whisper-cli';
function bundledWhisper() {
  const candidates = [
    path.join(process.resourcesPath || '', 'bin', WHISPER_NAME), // packaged app
    path.join(__dirname, 'bin', WHISPER_NAME)                    // dev mode
  ];
  return candidates.find(p => { try { return fs.existsSync(p); } catch (_) { return false; } }) || null;
}
function whisperBinPath() {
  try {
    const dir = path.join(app.getPath('userData'), 'bin');
    const target = path.join(dir, WHISPER_NAME);
    if (!fs.existsSync(target)) {
      const src = bundledWhisper();
      if (!src) return null;
      fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(src, target);
    }
    if (process.platform !== 'win32') { try { fs.chmodSync(target, 0o755); } catch (_) {} }
    return target;
  } catch (_) { return bundledWhisper(); }
}
let WHISPER = null;
app.whenReady().then(() => { WHISPER = whisperBinPath(); });

// موديلات ggml الرسمية من مستودع whisper.cpp — متعددة اللغات (تدعم العربي والإنجليزي وغيرهم)
const WHISPER_MODELS = {
  tiny:  { file: 'ggml-tiny.bin',  sizeMB: 75,  url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin' },
  base:  { file: 'ggml-base.bin',  sizeMB: 142, url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin' },
  small: { file: 'ggml-small.bin', sizeMB: 466, url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin' },
};
function whisperModelsDir() {
  const dir = path.join(app.getPath('userData'), 'whisper-models');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function whisperModelPath(size) {
  const m = WHISPER_MODELS[size];
  return m ? path.join(whisperModelsDir(), m.file) : null;
}

ipcMain.handle('whisper-status', () => {
  const models = {};
  for (const key of Object.keys(WHISPER_MODELS)) {
    const p = whisperModelPath(key);
    models[key] = { sizeMB: WHISPER_MODELS[key].sizeMB, downloaded: fs.existsSync(p) };
  }
  return { available: !!WHISPER, models };
});

let currentModelDl = null;
function downloadWithRedirects(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        file.close(); fs.unlink(dest, () => {});
        resolve(downloadWithRedirects(res.headers.location, dest, onProgress));
        return;
      }
      if (res.statusCode !== 200) {
        file.close(); fs.unlink(dest, () => {});
        return reject(new Error('HTTP ' + res.statusCode));
      }
      const total = parseInt(res.headers['content-length'] || '0', 10);
      let loaded = 0;
      res.on('data', chunk => { loaded += chunk.length; if (total && onProgress) onProgress(loaded / total); });
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
      file.on('error', reject);
    });
    currentModelDl = req;
    req.on('error', e => { file.close(); fs.unlink(dest, () => {}); reject(e); });
  });
}
ipcMain.handle('whisper-download-model', async (_e, size) => {
  const m = WHISPER_MODELS[size];
  if (!m) throw new Error('E_BAD_MODEL');
  const dest = whisperModelPath(size);
  const tmp = dest + '.part';
  try {
    await downloadWithRedirects(m.url, tmp, ratio => {
      if (win && !win.isDestroyed()) win.webContents.send('whisper-model-progress', ratio);
    });
    fs.renameSync(tmp, dest);
    return true;
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch (_) {}
    throw new Error(/cancel/i.test(String(e.message)) ? 'cancelled' : 'E_DOWNLOAD_FAILED');
  } finally {
    currentModelDl = null;
  }
});
ipcMain.handle('cancel-whisper-model-download', () => {
  if (currentModelDl) { try { currentModelDl.destroy(); } catch (_) {} currentModelDl = null; return true; }
  return false;
});

let currentWhisperJob = null;
ipcMain.handle('whisper-transcribe', async (_e, opts) => {
  const { input, model, language } = opts; // language: 'auto' | 'ar' | 'en' | ...
  if (!WHISPER) throw new Error('E_NO_WHISPER');
  const modelPath = whisperModelPath(model || 'base');
  if (!modelPath || !fs.existsSync(modelPath)) throw new Error('E_NO_MODEL');
  if (!fs.existsSync(input)) throw new Error('input not found');

  const tmpDir = path.join(os.tmpdir(), 'splitora-whisper-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });
  const wavPath = path.join(tmpDir, 'audio.wav');
  const outBase = path.join(tmpDir, 'out'); // whisper-cli بيضيف .srt لوحده

  try {
    // whisper.cpp محتاج WAV أحادي 16kHz بالظبط
    await run(FFMPEG, ['-hide_banner', '-y', '-i', input, '-vn', '-ac', '1', '-ar', '16000', wavPath]);

    await new Promise((resolve, reject) => {
      const args = ['-m', modelPath, '-f', wavPath, '-osrt', '-of', outBase, '-l', language || 'auto', '-nt'];
      const p = spawn(WHISPER, args, { windowsHide: true });
      currentWhisperJob = p;
      let err = '';
      p.stderr.on('data', d => {
        const s = d.toString();
        err += s; if (err.length > 6000) err = err.slice(-3000);
        if (win && !win.isDestroyed()) win.webContents.send('whisper-transcribe-log', s);
      });
      p.on('error', e => { currentWhisperJob = null; reject(e); });
      p.on('close', code => {
        currentWhisperJob = null;
        if (code === null) return reject(new Error('cancelled'));
        if (code !== 0) return reject(new Error(extractFfmpegError(err) || ('whisper exit ' + code)));
        resolve();
      });
    });

    const srtOut = outBase + '.srt';
    if (!fs.existsSync(srtOut)) throw new Error('E_NO_OUTPUT');
    // ننقلها لملف دائم بره الـ tmp عشان تفضل موجودة وقابلة للتعديل بعد ما نمسح المجلد المؤقت
    const finalDir = path.join(app.getPath('userData'), 'whisper-out');
    fs.mkdirSync(finalDir, { recursive: true });
    const finalSrt = path.join(finalDir, 'auto_' + Date.now() + '.srt');
    fs.copyFileSync(srtOut, finalSrt);
    return finalSrt;
  } finally {
    fs.rm(tmpDir, { recursive: true, force: true }, () => {});
  }
});
ipcMain.handle('cancel-whisper', () => {
  if (currentWhisperJob) { try { currentWhisperJob.kill('SIGKILL'); } catch (_) {} currentWhisperJob = null; return true; }
  return false;
});

ipcMain.handle('open-folder', (_e, dir) => shell.openPath(dir));
ipcMain.handle('open-file', (_e, f) => shell.openPath(f));
