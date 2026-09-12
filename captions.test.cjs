const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),os=require('node:os');
const source=fs.readFileSync(path.join(__dirname,'main.js'),'utf8');
const ctx={fs,path};vm.createContext(ctx);
vm.runInContext(source.slice(source.indexOf('function srtTimeToSec'),source.indexOf('/* ---------- license')),ctx);
const paragraph=Array.from({length:30},(_,i)=>'كلمة'+i).join(' ');
test('long Arabic paragraphs become sequential two-line pages without lost words',()=>{
 const cues=ctx.parseSrt(`1\n00:00:00,000 --> 00:00:20,000\n${paragraph}\n`);
 assert.ok(cues.length>1);assert.equal(cues[0].start,0);assert.equal(cues.at(-1).end,20);
 assert.equal(cues.map(c=>c.text).join(' ').replace(/\s+/g,' '),paragraph);
 for(let i=0;i<cues.length;i++){assert.ok(cues[i].text.split('\n').length<=2);assert.ok(cues[i].end>cues[i].start);if(i)assert.equal(cues[i-1].end,cues[i].start);}
 assert.equal(ctx.writeSrt(ctx.parseSrt(ctx.writeSrt(cues))),ctx.writeSrt(cues));
});
test('timestamp rounding carries milliseconds into the next minute',()=>assert.equal(ctx.secToSrtTime(59.9998),'00:01:00,000'));
test('manual cuts preserve absolute pagination before shifting',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'splitora-caption-test-'));
 try{const file=path.join(dir,'input.srt');fs.writeFileSync(file,`1\n00:00:00,000 --> 00:00:20,000\n${paragraph}`);
 const shifted=ctx.parseSrt(fs.readFileSync(ctx.shiftSrtForClip(file,5,4,dir),'utf8'));
 assert.ok(shifted.length);for(const cue of shifted){assert.ok(cue.start>=0);assert.ok(cue.end<=4);}
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
