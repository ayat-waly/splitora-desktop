/* Caption editing and preview use the same document passed to the exporter. */
(()=>{
 let cues=null,style=CaptionModel.options(),page=0,history=[],future=[],invalid=new Set(),request=0;
 const PAGE_SIZE=8;
 Object.assign(I18N.ar,{csText:'النص والتوقيت',csLook:'الشكل',csFont:'الخط',csSize:'حجم الخط',csPosition:'الموضع الرأسي',csUndo:'تراجع',csRedo:'إعادة',csSave:'حفظ SRT',csAdd:'إضافة سطر عند المؤشر',csEmpty:'اختاري ملف ترجمة أو ولّدي الترجمة لبدء التحرير.',csPrev:'السابق',csNext:'التالي',csInvalid:'راجعي التوقيت: البداية أقل من النهاية وداخل مدة الفيديو.',csSeek:'عرض',csDelete:'حذف',csStart:'البداية بالثواني',csEnd:'النهاية بالثواني',csCaption:'نص الترجمة',csSaved:'تم حفظ ملف الترجمة',csHelp:'التعديل يظهر في المعاينة ويُطبّق عند التصدير. موضع 10% أعلى الفيديو و90% أسفله.',csPresetbold:'كلاسيكي',csPresetbar:'شريط داكن',csPresetpill:'أزرق',csPresetgold:'ذهبي',csPresetmint:'نعناعي',csPresetclean:'بسيط'});
 Object.assign(I18N.en,{csText:'Text & timing',csLook:'Appearance',csFont:'Font',csSize:'Font size',csPosition:'Vertical position',csUndo:'Undo',csRedo:'Redo',csSave:'Save SRT',csAdd:'Add cue at playhead',csEmpty:'Import or generate captions to start editing.',csPrev:'Previous',csNext:'Next',csInvalid:'Check timing: start must precede end and stay within the video.',csSeek:'Preview',csDelete:'Delete',csStart:'Start in seconds',csEnd:'End in seconds',csCaption:'Caption text',csSaved:'Subtitle file saved',csHelp:'Edits appear in preview and exports. Position 10% is near the top; 90% is near the bottom.',csPresetbold:'Classic',csPresetbar:'Dark bar',csPresetpill:'Blue',csPresetgold:'Gold',csPresetmint:'Mint',csPresetclean:'Minimal'});
 const studio=document.createElement('div');studio.id='captionStudio';
 studio.innerHTML=`<div class="cs-tabs" role="tablist" aria-label="Caption editor"><button type="button" id="csTextTab" role="tab" aria-controls="csTextPanel" aria-selected="true" data-i18n="csText"></button><button type="button" id="csLookTab" role="tab" aria-controls="csLookPanel" aria-selected="false" data-i18n="csLook"></button></div>
 <div class="cs-actions"><button id="csUndo" data-i18n="csUndo"></button><button id="csRedo" data-i18n="csRedo"></button><button id="csSave" data-i18n="csSave"></button></div>
 <div id="csError" role="alert"></div>
 <section id="csTextPanel" role="tabpanel" aria-labelledby="csTextTab"><div id="csCueList"></div><div class="cs-pages"><button id="csPrev" data-i18n="csPrev"></button><output id="csPage"></output><button id="csNext" data-i18n="csNext"></button></div><button id="csAdd" class="cs-add" data-i18n="csAdd"></button></section>
 <section id="csLookPanel" role="tabpanel" aria-labelledby="csLookTab" hidden><div class="cs-presets" id="csPresets"></div><label for="csFont" data-i18n="csFont"></label><select id="csFont"></select><label for="csSize"><span data-i18n="csSize"></span><output id="csSizeValue"></output></label><input id="csSize" type="range" min="2" max="8" step=".25"><label for="csPosition"><span data-i18n="csPosition"></span><output id="csPositionValue"></output></label><input id="csPosition" type="range" min="10" max="90" step="1"><p class="inspector-help" data-i18n="csHelp"></p></section>`;
 captionPanel.append(studio);
 const source=document.createElement('details');source.className='cs-source';source.open=true;
 const sourceTitle=document.createElement('summary');sourceTitle.dataset.i18n='csSource';
 I18N.ar.csSource='استيراد أو توليد الترجمة';I18N.en.csSource='Import or generate captions';source.append(sourceTitle);
 for(const child of Array.from(captionPanel.children))if(child!==studio)source.append(child);
 captionPanel.prepend(source);
 const surface=document.querySelector('.media-surface');
 const layer=document.createElement('div');layer.id='captionLayer';layer.setAttribute('aria-hidden','true');surface.append(layer);
 const caption=document.createElement('span');caption.id='captionRendered';layer.append(caption);
 for(const font of CaptionModel.fonts){const option=document.createElement('option');option.value=font;option.textContent=font;$('csFont').append(option);}
 for(const [key,preset] of Object.entries(CaptionModel.presets)){
  const button=document.createElement('button');button.type='button';button.dataset.preset=key;
  const sample=document.createElement('span');sample.className='cs-sample';sample.textContent='Splitora';sample.style.color=preset.color;sample.style.background=preset.background||'transparent';sample.style.fontWeight=preset.weight;
  const label=document.createElement('span');label.dataset.i18n='csPreset'+key;button.append(sample,label);
  button.onclick=()=>{remember();style.preset=key;syncStyle();};$('csPresets').append(button);
 }
 function remember(){history.push(JSON.stringify({cues,style}));if(history.length>60)history.shift();future=[];}
 function restore(from,to){if(!from.length)return;to.push(JSON.stringify({cues,style}));const saved=JSON.parse(from.pop());cues=saved.cues;style=saved.style;invalid.clear();renderList();syncStyle();}
 function status(){
  $('csUndo').disabled=!history.length;$('csRedo').disabled=!future.length;$('csSave').disabled=!cues?.length||invalid.size>0;
  $('csError').textContent=invalid.size?t('csInvalid'):'';
 }
 let scrubTime=null,frameHandle=null;
 function draw(at){
  const time=typeof at==='number'?at:(scrubTime??prevVideo.currentTime);
  caption.textContent=(cues||[]).filter(c=>c.start<=time&&c.end>time).map(c=>c.text).join('\n');
  layer.hidden=!caption.textContent;
  studio.querySelectorAll('.cs-cue').forEach(row=>{const c=cues?.[+row.dataset.index];row.classList.toggle('active',!!c&&c.start<=time&&c.end>time);});
 }
 function syncStyle(){
  style=CaptionModel.options(style);const p=CaptionModel.presets[style.preset];
  $('csFont').value=style.font;$('csSize').value=style.size;$('csPosition').value=style.position;
  $('csSizeValue').textContent=style.size+'%';$('csPositionValue').textContent=style.position+'%';
  studio.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===style.preset)));
  const box=surface.getBoundingClientRect();
  prevVideo.style.width=reels?Math.min(box.width,box.height*9/16)+'px':'100%';
  const rect=prevVideo.getBoundingClientRect(),vw=reels?9:(videoW||16),vh=reels?16:(videoH||9),scale=Math.min(rect.width/vw,rect.height/vh);
  const w=vw*scale,h=vh*scale,fontSize=Math.min(w,h)*style.size/100;
  layer.style.width=w+'px';layer.style.height=h+'px';
  caption.style.cssText=`top:${style.position}%;font-family:"${style.font}";font-size:${fontSize}px;font-weight:${p.weight};color:${p.color};background:${p.background||'transparent'};padding:${p.background?'.18em .25em':'0'};text-shadow:${p.outline?'0 1px 2px '+p.outline:'none'};-webkit-text-stroke:${p.outline?fontSize*.025:0}px ${p.outline||'transparent'};`;
  draw();status();
 }
 function renderList(){
  const list=$('csCueList');list.replaceChildren();const total=cues?.length||0;
  page=Math.max(0,Math.min(page,Math.ceil(total/PAGE_SIZE)-1));
  if(!total){const empty=document.createElement('p');empty.className='inspector-help';empty.dataset.i18n='csEmpty';empty.textContent=t('csEmpty');list.append(empty);}
  (cues||[]).slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE).forEach((cue,offset)=>{
   const index=page*PAGE_SIZE+offset,row=document.createElement('div');row.className='cs-cue';row.dataset.index=index;
   const header=document.createElement('div');header.className='cs-cue-head';
   const number=document.createElement('span');number.textContent=String(index+1).padStart(2,'0');
   const seek=document.createElement('button');seek.textContent=t('csSeek');seek.onclick=()=>{prevVideo.currentTime=cue.start;draw();};
   const del=document.createElement('button');del.textContent=t('csDelete');del.onclick=()=>{remember();cues.splice(index,1);invalid.clear();renderList();draw();};header.append(number,seek,del);
   const times=document.createElement('div');times.className='cs-times';
   for(const key of ['start','end']){
    const label=document.createElement('label');label.textContent=t(key==='start'?'csStart':'csEnd');
    const input=document.createElement('input');input.type='number';input.min='0';input.step='.001';input.value=cue[key].toFixed(3);input.setAttribute('aria-label',label.textContent+' '+(index+1));
    input.oninput=()=>{const value=Number(input.value),valid=input.value!==''&&Number.isFinite(value)&&value>=0&&(key==='start'?value<cue.end:value>cue.start)&&(!videoDur||value<=videoDur);input.setAttribute('aria-invalid',String(!valid));const id=index+key;if(!valid){invalid.add(id);status();return;}invalid.delete(id);remember();cue[key]=value;draw();status();};label.append(input);times.append(label);
   }
   const text=document.createElement('textarea');text.rows=2;text.value=cue.text;text.dir='auto';text.maxLength=2000;text.setAttribute('aria-label',t('csCaption')+' '+(index+1));
   text.oninput=()=>{if(!text.value.trim()){invalid.add(index+'text');text.setAttribute('aria-invalid','true');status();return;}invalid.delete(index+'text');text.setAttribute('aria-invalid','false');remember();cue.text=text.value;draw();status();};
   row.append(header,times,text);list.append(row);
  });
  $('csPage').textContent=total?`${page+1} / ${Math.ceil(total/PAGE_SIZE)} · ${total}`:'0';
  $('csPrev').disabled=page===0;$('csNext').disabled=(page+1)*PAGE_SIZE>=total;status();draw();
 }
 $('csUndo').onclick=()=>restore(history,future);$('csRedo').onclick=()=>restore(future,history);
 $('csPrev').onclick=()=>{if(invalid.size)return;page--;renderList();};$('csNext').onclick=()=>{if(invalid.size)return;page++;renderList();};
 $('csAdd').onclick=()=>{if(!videoDur)return;remember();if(!cues)cues=[];const start=Math.min(prevVideo.currentTime,Math.max(0,videoDur-.1));cues.push({start,end:Math.min(videoDur,start+2),text:lang==='ar'?'نص جديد':'New caption'});page=Math.floor((cues.length-1)/PAGE_SIZE);renderList();};
 $('csSave').onclick=async()=>{try{const file=await window.splitora.saveCaptions(getCues());if(file){captionStatus.textContent=t('csSaved');captionStatus.removeAttribute('data-i18n');}}catch(e){showErr(String(e.message||e));}};
 for(const [id,key] of [['csFont','font'],['csSize','size'],['csPosition','position']])$(id).oninput=()=>{remember();style[key]=$(id).value;syncStyle();};
 for(const name of ['Text','Look'])$('cs'+name+'Tab').onclick=()=>{for(const n of ['Text','Look']){$('cs'+n+'Panel').hidden=n!==name;$('cs'+n+'Tab').setAttribute('aria-selected',String(n===name));}};
 function getCues(){if(invalid.size)throw Error(t('csInvalid'));return cues===null?null:CaptionModel.validate(cues);}
 function followPlayhead(){
  if(invalid.size||studio.contains(document.activeElement))return;
  const time=scrubTime??prevVideo.currentTime;
  const index=(cues||[]).findIndex(c=>c.start<=time&&c.end>time);
  if(index>=0&&Math.floor(index/PAGE_SIZE)!==page){page=Math.floor(index/PAGE_SIZE);renderList();}
 }
 window.captionStudio={getCues,getSettings:()=>({...style}),resetSettings:()=>{style=CaptionModel.options();syncStyle();},
  previewAt:time=>{scrubTime=time;draw(time);},
  finishSeek:()=>{scrubTime=null;followPlayhead();draw();}};
 loadCaptionPreview=async file=>{
  const version=++request;
  cues=[];invalid.clear();renderList();draw();
  try{const loaded=await window.splitora.readCaptions(file);if(version!==request||captionsPath!==file)return;
   cues=CaptionModel.validate(loaded);history=[];future=[];invalid.clear();page=0;source.open=false;renderList();syncStyle();
   captionStatus.removeAttribute('data-i18n');captionStatus.textContent=lang==='ar'?`${cues.length} سطر جاهز للتحرير`:`${cues.length} cues ready to edit`;
  }catch(e){if(version===request){captionStatus.textContent=String(e.message||e);showErr(String(e.message||e));}}
 };
 clearCaptionPreview=()=>{request++;cues=null;history=[];future=[];invalid.clear();source.open=true;if(captionTrack)captionTrack.mode='disabled';renderList();draw();};
 updateCaptionPreviewStyle=syncStyle;
 function stopFrame(){
  if(frameHandle!==null){if(prevVideo.cancelVideoFrameCallback)prevVideo.cancelVideoFrameCallback(frameHandle);else cancelAnimationFrame(frameHandle);frameHandle=null;}
 }
 function nextFrame(){
  if(prevVideo.paused||prevVideo.ended)return;
  if(prevVideo.requestVideoFrameCallback)frameHandle=prevVideo.requestVideoFrameCallback((_now,meta)=>{frameHandle=null;if(scrubTime===null)draw(meta.mediaTime);nextFrame();});
  else frameHandle=requestAnimationFrame(()=>{frameHandle=null;draw();nextFrame();});
 }
 prevVideo.addEventListener('play',()=>{stopFrame();nextFrame();});
 prevVideo.addEventListener('pause',()=>{stopFrame();draw();});
 prevVideo.addEventListener('ended',()=>{stopFrame();draw();});
 prevVideo.addEventListener('emptied',()=>{stopFrame();scrubTime=null;draw();});
 prevVideo.addEventListener('seeking',()=>{if(scrubTime===null)followPlayhead();draw();});
 prevVideo.addEventListener('timeupdate',()=>draw());prevVideo.addEventListener('seeked',()=>draw());prevVideo.addEventListener('loadedmetadata',syncStyle);
 new ResizeObserver(syncStyle).observe(surface);
 const toggleReels=$('reelsSwitch').onclick;$('reelsSwitch').onclick=()=>{toggleReels();syncStyle();};
 $('langBtn').addEventListener('click',()=>{if(!invalid.size)renderList();});
 // Enter fullscreen on the surface so captions remain visible with the video.
 fullscreen.onclick=()=>surface.requestFullscreen().catch(()=>{});
 Object.assign(I18N.ar,{
  inspectorCaptions:'التفريغ الصوتي',xCaptions:'التفريغ الصوتي',exportSettings:'إعدادات التصدير والتفريغ',
  whisperToggleBtn:'تفريغ كلام المتحدث',whisperGoBtn:'بدء التفريغ الصوتي',
  whisperLangLbl:'لغة المتحدث (وليست لغة الترجمة)',whisperAuto:'اكتشاف لغة المتحدث تلقائيًا',
  whisperBase:'متوازن (142MB)',whisperSmall:'دقة أعلى — موصى به (466MB، أبطأ)',
  whisperDone:'تم تفريغ الكلام بلغته الأصلية — راجعي النص والتوقيت',whisperNeedVideo:'اختاري فيديو قبل التفريغ الصوتي.',
  csSource:'تفريغ صوتي أو استيراد SRT',csEmpty:'افرغي صوت الفيديو أو استوردي SRT لبدء تحرير النص والتوقيت.',
  csCaption:'نص التفريغ',csSaved:'تم حفظ ملف التفريغ',
  captionPreviewHelp:'كتابة كلام المتحدث بلغته الأصلية، دون ترجمته. يتبع النص موضع المؤشر أثناء السحب والتشغيل.',
  captionTimingNote:'أعيدي التفريغ للملفات المولّدة بالإصدارات القديمة: توقيتها لا يُصلح تلقائيًا. تُحفظ توقيتات SRT المستورد كما هي. الدقة تعتمد على وضوح الصوت واللغة؛ راجعي النص قبل التصدير.'
 });
 Object.assign(I18N.en,{
  inspectorCaptions:'Transcription',xCaptions:'Audio transcription',exportSettings:'Export & transcription',
  whisperToggleBtn:'Transcribe speech',whisperGoBtn:'Start transcription',whisperLangLbl:'Spoken language (not translation target)',
  whisperAuto:'Auto-detect spoken language',whisperBase:'Balanced (142MB)',whisperSmall:'Higher accuracy — recommended (466MB, slower)',
  whisperDone:'Speech transcribed in its original language — review text and timing',whisperNeedVideo:'Choose a video before transcribing.',
  csSource:'Transcribe or import SRT',csEmpty:'Transcribe the video or import SRT to edit text and timing.',csCaption:'Transcript text',csSaved:'Transcript saved',
  captionPreviewHelp:'Transcribes speech in its original language, without translation. Text follows the playhead during scrubbing and playback.',
  captionTimingNote:'Regenerate transcripts made with older versions; their timing cannot be repaired automatically. Imported SRT timings are preserved. Accuracy depends on audio clarity and language; review before export.'
 });
 renderList();syncStyle();applyLang();
})();

// Drag the playhead anywhere on the timeline; preserve clip-edge resizing.
(()=>{
 const track=$('filmstrip'),head=$('filmstripPlayhead');let active=null,wasPlaying=false;
 head.setAttribute('role','slider');head.tabIndex=0;head.setAttribute('aria-label','Playhead / مؤشر التشغيل');head.setAttribute('aria-valuemin','0');
 let targetTime=0,seekFrame=0,lastSeek=0;
 function flushSeek(){
  seekFrame=0;
  if(active===null)return;
  if(prevVideo.seeking||performance.now()-lastSeek<60){seekFrame=requestAnimationFrame(flushSeek);return;}
  lastSeek=performance.now();prevVideo.currentTime=targetTime;
 }
 function seek(e){
  const r=track.getBoundingClientRect();
  targetTime=Math.max(0,Math.min(trimDur,(e.clientX-r.left)/r.width*trimDur));
  head.style.left=(targetTime/trimDur*100)+'%';
  head.setAttribute('aria-valuenow',String(targetTime));
  $('playerCurrent').textContent=fmtPlayerTime(targetTime);
  window.captionStudio?.previewAt(targetTime);
  if(!seekFrame)seekFrame=requestAnimationFrame(flushSeek);
 }
 track.addEventListener('pointerdown',e=>{
  if(e.button!==0||!trimDur||e.target.closest('.segment-handle'))return;
  e.preventDefault();active=e.pointerId;wasPlaying=!prevVideo.paused;prevVideo.pause();
  const pill=e.target.closest('.seg-pill');if(pill){const row=$('rangeRows').children[+pill.dataset.rowIndex];if(row)selectClip(row);}
  track.setPointerCapture(active);track.classList.add('scrubbing');seek(e);
 });
 track.addEventListener('pointermove',e=>{if(e.pointerId===active)seek(e);});
 function stop(e){
  if(e.pointerId!==active)return;
  if(e.type==='pointerup')seek(e);
  active=null;cancelAnimationFrame(seekFrame);seekFrame=0;
  prevVideo.currentTime=targetTime;
  window.captionStudio?.finishSeek();
  track.classList.remove('scrubbing');segmentClickBlockedUntil=performance.now()+300;
  if(track.hasPointerCapture(e.pointerId))track.releasePointerCapture(e.pointerId);
  if(wasPlaying&&e.type==='pointerup')setPlayback(true);
 }
 track.addEventListener('pointerup',stop);track.addEventListener('pointercancel',stop);track.addEventListener('lostpointercapture',stop);
 head.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();if(e.key==='Home')prevVideo.currentTime=0;else if(e.key==='End')prevVideo.currentTime=trimDur;else seekBy((e.key==='ArrowLeft'?-1:1)*(e.shiftKey?1:1/videoFps));};
 prevVideo.addEventListener('timeupdate',()=>{head.setAttribute('aria-valuemax',String(trimDur));head.setAttribute('aria-valuenow',String(prevVideo.currentTime));});
})();
