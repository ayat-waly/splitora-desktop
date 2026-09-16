const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const fontkit = require('fontkit');

module.exports = function setupFonts(app, dialog, ipcMain, getWindow) {
  const directory = () => path.join(app.getPath('userData'), 'caption-fonts');
  function describe(file, withData = false) {
    const data = fs.readFileSync(file);
    if (data.length > 20 * 1024 * 1024) throw Error('Font exceeds 20 MB');
    const font = fontkit.create(data);
    const family = font.familyName;
    if (!family || /[,\r\n{}\\]/.test(family)) throw Error('Unsupported font family');
    if (Object.keys(font.variationAxes || {}).length) throw Error('Please import a static TTF/OTF font, not a variable font');
    return {id:path.basename(file), family, label:font.fullName || family,
      ...(withData ? {data:data.toString('base64')} : {})};
  }
  function list(withData = false) {
    fs.mkdirSync(directory(), {recursive:true});
    return fs.readdirSync(directory()).filter(n=>/^[a-f0-9]{64}\.(ttf|otf)$/.test(n)).flatMap(n=>{
      try { return [describe(path.join(directory(),n),withData)]; } catch { return []; }
    });
  }
  ipcMain.handle('caption-fonts',()=>list(true));
  ipcMain.handle('import-caption-font',async()=>{
    const result=await dialog.showOpenDialog(getWindow(),{properties:['openFile'],filters:[{name:'Fonts (TTF / OTF)',extensions:['ttf','otf']}]});
    if(result.canceled||!result.filePaths[0])return null;
    const source=result.filePaths[0],ext=path.extname(source).toLowerCase();
    if(!['.ttf','.otf'].includes(ext)||fs.statSync(source).size>20*1024*1024)throw Error('Choose a TTF/OTF font under 20 MB');
    describe(source);
    const data=fs.readFileSync(source),id=crypto.createHash('sha256').update(data).digest('hex')+ext;
    fs.mkdirSync(directory(),{recursive:true});
    const destination=path.join(directory(),id);
    if(!fs.existsSync(destination))fs.writeFileSync(destination,data,{flag:'wx'});
    return describe(destination,true);
  });
  return {directory,list};
};
