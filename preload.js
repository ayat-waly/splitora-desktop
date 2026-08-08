const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('splitora', {
  pickVideo: () => ipcRenderer.invoke('pick-video'),
  probe: (file) => ipcRenderer.invoke('probe', file),
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
  // drag & drop: resolve the real filesystem path of a dropped File
  pathOf: (file) => { try { return webUtils.getPathForFile(file); } catch (_) { return file.path || null; } }
});
