const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('splitora', {
  pickVideo: () => ipcRenderer.invoke('pick-video'),
  probe: (file) => ipcRenderer.invoke('probe', file),
  genThumbstrip: (input, duration, count) => ipcRenderer.invoke('gen-thumbstrip', { input, duration, count }),
  genWaveform: (input, points) => ipcRenderer.invoke('gen-waveform', { input, points }),
  pickSrt: () => ipcRenderer.invoke('pick-srt'),
  pickOutDir: () => ipcRenderer.invoke('pick-outdir'),
  defaultOutDir: () => ipcRenderer.invoke('default-outdir'),
  split: (opts) => ipcRenderer.invoke('split', opts),
  cancel: () => ipcRenderer.invoke('cancel-split'),
  openFolder: (dir) => ipcRenderer.invoke('open-folder', dir),
  openFile: (f) => ipcRenderer.invoke('open-file', f),
  onProgress: (cb) => {
    ipcRenderer.removeAllListeners('split-progress');
    ipcRenderer.on('split-progress', (_e, ratio) => cb(ratio));
  },
  saveTempPng: (dataUrl) => ipcRenderer.invoke('save-temp-png', dataUrl),
  pickImage: () => ipcRenderer.invoke('pick-image'),
  urlInfo: (url) => ipcRenderer.invoke('url-info', url),
  urlDownload: (url) => ipcRenderer.invoke('url-download', url),
  cancelDownload: () => ipcRenderer.invoke('cancel-download'),
  licenseStatus: () => ipcRenderer.invoke('license-status'),
  licenseActivate: (key) => ipcRenderer.invoke('license-activate', key),
  onUrlProgress: (cb) => {
    ipcRenderer.removeAllListeners('url-progress');
    ipcRenderer.on('url-progress', (_e, ratio) => cb(ratio));
  },
  // drag & drop: resolve the real filesystem path of a dropped File
  pathOf: (file) => { try { return webUtils.getPathForFile(file); } catch (_) { return file.path || null; } }
});
