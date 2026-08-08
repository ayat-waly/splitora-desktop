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
  return { duration, size, width: v.width || 0, height: v.height || 0, name: path.basename(file) };
});

ipcMain.handle('pick-outdir', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'اختر مجلد الحفظ', properties: ['openDirectory', 'createDirectory'] });
  if (r.canceled || !r.filePaths[0]) return null;
  return r.filePaths[0];
});

ipcMain.handle('default-outdir', () => app.getPath('videos') || app.getPath('downloads'));

ipcMain.handle('split', async (_e, opts) => {
  const { input, outDir, clipSec, quality, reels, duration } = opts;
  if (!fs.existsSync(input)) throw new Error('input not found');

  // dedicated subfolder per job: <video name>_parts, deduped
  const base = path.basename(input).replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 60) || 'video';
  let jobDir = path.join(outDir, base + '_parts');
  let k = 2;
  while (fs.existsSync(jobDir)) jobDir = path.join(outDir, `${base}_parts_${k++}`);
  fs.mkdirSync(jobDir, { recursive: true });

  const outPat = path.join(jobDir, 'Splitora_Part_%03d.mp4');
  const needsEncode = reels || quality !== 'copy';

  const args = ['-hide_banner', '-y', '-i', input];
  if (needsEncode) {
    const vf = [];
    if (reels) {
      const w = quality === '720' ? 720 : 1080, h = quality === '720' ? 1280 : 1920;
      vf.push(`scale=${w}:${h}:force_original_aspect_ratio=decrease`, `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black`);
    } else if (quality === '1080') vf.push('scale=-2:min(1080\\,ih)');
    else if (quality === '720') vf.push('scale=-2:min(720\\,ih)');
    if (vf.length) args.push('-vf', vf.join(','));
    args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
      '-c:a', 'aac', '-b:a', '160k',
      '-force_key_frames', `expr:gte(t,n_forced*${clipSec})`);
  } else {
    args.push('-c', 'copy');
  }
  args.push('-map', '0:v:0', '-map', '0:a?',
    '-f', 'segment', '-segment_time', String(clipSec));
  if (needsEncode) args.push('-segment_time_delta', '0.05'); // second-accurate cuts with forced keyframes
  args.push('-reset_timestamps', '1', '-segment_start_number', '1', outPat);

  return await new Promise((resolve, reject) => {
    const p = spawn(FFMPEG, args, { windowsHide: true });
    currentJob = p;
    let err = '';
    p.stderr.on('data', d => {
      const s = d.toString();
      err += s;
      if (err.length > 6000) err = err.slice(-3000);
      // progress: time=HH:MM:SS.xx
      const m = s.match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (m && duration > 0 && win && !win.isDestroyed()) {
        const t = (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]);
        win.webContents.send('split-progress', Math.min(0.999, t / duration));
      }
    });
    p.on('error', e => { currentJob = null; reject(e); });
    p.on('close', code => {
      currentJob = null;
      if (code !== 0 && code !== null) return reject(new Error(err.slice(-800) || ('ffmpeg exit ' + code)));
      let files = [];
      try {
        files = fs.readdirSync(jobDir)
          .filter(f => /^Splitora_Part_\d+\.mp4$/.test(f))
          .sort()
          .map(f => {
            const full = path.join(jobDir, f);
            return { name: f, size: fs.statSync(full).size, path: full };
          });
      } catch (_) {}
      if (code === null) return reject(new Error('cancelled'));
      if (!files.length) return reject(new Error(err.slice(-800) || 'no output produced'));
      resolve({ dir: jobDir, files });
    });
  });
});

ipcMain.handle('cancel-split', () => {
  if (currentJob) { try { currentJob.kill('SIGKILL'); } catch (_) {} currentJob = null; return true; }
  return false;
});

ipcMain.handle('open-folder', (_e, dir) => shell.openPath(dir));
ipcMain.handle('open-file', (_e, f) => shell.openPath(f));
