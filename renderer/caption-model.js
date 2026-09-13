/* Shared preview/export model. No filesystem or DOM dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CaptionModel=factory();})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 const fonts=['Arial','Tahoma','Verdana','Georgia','Times New Roman'];
 const presets={
  bold:{color:'#ffffff',background:null,outline:'#000000',weight:700},
  bar:{color:'#ffffff',background:'#171c29',outline:null,weight:700},
  pill:{color:'#ffffff',background:'#2869dc',outline:null,weight:700},
  gold:{color:'#ffda38',background:null,outline:'#151515',weight:700},
  mint:{color:'#68f5cf',background:null,outline:'#102a25',weight:700},
  clean:{color:'#ffffff',background:null,outline:'#202637',weight:400}
 };
 function options(value={}){return {preset:presets[value.preset]?value.preset:'bold',font:fonts.includes(value.font)?value.font:'Arial',size:Math.min(8,Math.max(2,Number(value.size)||4)),position:Math.min(90,Math.max(10,Number(value.position)||82))};}
 function validate(cues){
  if(!Array.isArray(cues)||cues.length>20000)throw Error('Invalid caption list');
  return cues.map(c=>{
   const start=Number(c.start),end=Number(c.end),text=String(c.text||'').replace(/\r/g,'').trim();
   if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||!text||text.length>2000)throw Error('Invalid caption text or timing');
   return {start,end,text};
  }).sort((a,b)=>a.start-b.start);
 }
 function clip(cues,start=0,length=Infinity){return cues.filter(c=>c.end>start&&c.start<start+length).map(c=>({start:Math.max(0,c.start-start),end:Math.min(length,c.end-start),text:c.text}));}
 function stamp(t){const n=Math.max(0,Math.round(t*100));return Math.floor(n/360000)+':'+String(Math.floor(n/6000)%60).padStart(2,'0')+':'+String(Math.floor(n/100)%60).padStart(2,'0')+'.'+String(n%100).padStart(2,'0');}
 function color(hex){return '&H00'+hex.slice(5,7)+hex.slice(3,5)+hex.slice(1,3);}
 function ass(cues,settings,aspect=16/9){
  const o=options(settings),p=presets[o.preset],w=1000,h=Math.round(w/Math.max(.1,Math.min(10,aspect))),size=Math.min(w,h)*o.size/100;
  const outline=p.background?size*.18:p.outline?size*.055:0;
  const header=`[Script Info]\nScriptType: v4.00+\nPlayResX: ${w}\nPlayResY: ${h}\nWrapStyle: 0\nScaledBorderAndShadow: yes\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,${o.font},${size},${color(p.color)},${color(p.color)},${color(p.background||p.outline||'#000000')},${color(p.background||'#000000')},${p.weight===700?-1:0},0,0,0,100,100,0,0,${p.background?3:1},${outline},0,5,80,80,0,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  // Never interpret user text as ASS override tags.
  return header+cues.map(c=>`Dialogue: 0,${stamp(c.start)},${stamp(c.end)},Default,,0,0,0,,{\\pos(${w/2},${Math.round(h*o.position/100)})}${c.text.replace(/\\/g,'＼').replace(/\{/g,'｛').replace(/\}/g,'｝').replace(/\n/g,'\\N')}`).join('\n');
 }
 return {fonts,presets,options,validate,clip,ass};
});
