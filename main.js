/* Splitora Desktop — main process */
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

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
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

/* ---------- helpers ---------- */
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

function hms(sec) {
  sec = Math.max(0, sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = (sec % 60).toFixed(2);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(5, '0')}`;
}

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

ipcMain.handle('pick-outdir', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'اختر مجلد الحفظ', properties: ['openDirectory', 'createDirectory'] });
  if (r.canceled || !r.filePaths[0]) return null;
  return r.filePaths[0];
});

ipcMain.handle('default-outdir', () => app.getPath('videos') || app.getPath('downloads'));

ipcMain.handle('split', async (_e, opts) => {
  const { input, outDir, clipSec, quality, reels, duration,
          mode, ranges, fps, overlayPng, thumbnail } = opts;
  if (!fs.existsSync(input)) throw new Error('input not found');

  // dedicated subfolder per job: <video name>_parts, deduped
  const base = path.basename(input).replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 60) || 'video';
  let jobDir = path.join(outDir, base + '_parts');
  let k = 2;
  while (fs.existsSync(jobDir)) jobDir = path.join(outDir, `${base}_parts_${k++}`);
  fs.mkdirSync(jobDir, { recursive: true });

  const hasOverlay = overlayPng && fs.existsSync(overlayPng);
  const useFps = fps && fps > 0;
  const needsEncode = reels || quality !== 'copy' || hasOverlay || useFps;

  // scale/pad/fps chain; when a text overlay exists we switch to filter_complex
  function filterArgs() {
    const vf = [];
    if (reels) {
      const w = quality === '720' ? 720 : 1080, h = quality === '720' ? 1280 : 1920;
      vf.push(`scale=${w}:${h}:force_original_aspect_ratio=decrease`, `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black`);
    } else if (quality === '1080') vf.push('scale=-2:min(1080\\,ih)');
    else if (quality === '720') vf.push('scale=-2:min(720\\,ih)');
    if (useFps) vf.push('fps=' + fps);
    if (!hasOverlay) return vf.length ? ['-vf', vf.join(',')] : [];
    const chain = vf.length
      ? `[0:v]${vf.join(',')}[v0];[v0][1:v]overlay=(W-w)/2:(H-h)/2:format=auto[vout]`
      : `[0:v][1:v]overlay=(W-w)/2:(H-h)/2:format=auto[vout]`;
    return ['-filter_complex', chain];
  }
  function mapArgs() {
    return hasOverlay ? ['-map', '[vout]', '-map', '0:a?'] : ['-map', '0:v:0', '-map', '0:a?'];
  }
  const codecArgs = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '160k'];

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
        if (code !== 0) return reject(new Error(err.slice(-800) || ('ffmpeg exit ' + code)));
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
      if (hasOverlay) args.push('-i', overlayPng);
      args.push('-t', String(len));
      if (needsEncode) { args.push(...filterArgs(), ...codecArgs); }
      else { args.push('-c', 'copy', '-avoid_negative_ts', 'make_zero'); }
      args.push(...mapArgs(), out);
      await runFfmpeg(args, i / ranges.length, 1 / ranges.length, len);
    }
  } else {
    // ===== automatic equal splitting (segment muxer, single pass) =====
    const outPat = path.join(jobDir, 'Splitora_Part_%03d.mp4');
    const args = ['-hide_banner', '-y', '-i', input];
    if (hasOverlay) args.push('-i', overlayPng);
    if (needsEncode) {
      args.push(...filterArgs(), ...codecArgs, '-force_key_frames', `expr:gte(t,n_forced*${clipSec})`);
    } else {
      args.push('-c', 'copy');
    }
    args.push(...mapArgs(), '-f', 'segment', '-segment_time', String(clipSec));
    if (needsEncode) args.push('-segment_time_delta', '0.05'); // second-accurate cuts with forced keyframes
    args.push('-reset_timestamps', '1', '-segment_start_number', '1', outPat);
    await runFfmpeg(args, 0, 1, duration || 0);
  }

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

ipcMain.handle('open-folder', (_e, dir) => shell.openPath(dir));
ipcMain.handle('open-file', (_e, f) => shell.openPath(f));
