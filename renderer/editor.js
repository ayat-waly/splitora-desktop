/* Desktop editor composition: one persistent player, timeline and clip inspector. */
const mainColumn=document.querySelector('.col-main');
const inspector=document.querySelector('.col-inspector');
const inspectorScroll=document.querySelector('.inspector-scroll');
const exportFooter=document.querySelector('.action-footer');
const settings=document.createElement('details');
settings.className='export-settings';
settings.innerHTML='<summary data-i18n="exportSettings"></summary>';
settings.append(document.querySelector('.inspector-section'),document.querySelector('.advanced'));
const modeTabs=document.querySelector('.mode-tabs');
inspectorScroll.prepend(modeTabs,$('panelAuto'),$('estimate'),$('panelRanges'));
inspectorScroll.append(settings);
inspector.append(exportFooter);
mainColumn.append($('trimmer'));
const timelineTools=document.createElement('div');
timelineTools.className='timeline-tools';
timelineTools.innerHTML='<span data-i18n="timelineTitle"></span><span class="timeline-shortcuts">Space · I · O · ← →</span><button id="zoomOut" type="button" aria-label="Zoom out">−</button><output id="zoomValue">1×</output><button id="zoomIn" type="button" aria-label="Zoom in">+</button>';
$('trimmer').prepend(timelineTools);
const selection=document.createElement('div');
selection.id='trimSelection';
$('filmstrip').append(selection);
$('filmstrip').append($('segmentsStrip'));
// Keep the transport and cut points together at the visual center.
const cutControls=document.querySelector('.mark-row');
document.querySelector('.player-toolbar').after(cutControls);
document.querySelector('.trim-summary').hidden=true;
let pendingCut=false;
const markStartOriginal=markStartBtn.onclick,markEndOriginal=markEndBtn.onclick;
markStartBtn.onclick=()=>{
 if(prevVideo.readyState<1)return;
 setMode('ranges');trimEnd=null;markStartOriginal();pendingCut=true;
 cutControls.classList.add('awaiting-end');
};
markEndBtn.onclick=()=>{
 if(!pendingCut||prevVideo.readyState<1)return;
 markEndOriginal();
 if(trimStart!=null&&trimEnd>trimStart){
  trimAddBtn.onclick();pendingCut=false;cutControls.classList.remove('awaiting-end');
  const row=$('rangeRows').lastElementChild;
  document.querySelectorAll('.range-row').forEach(r=>r.classList.toggle('selected',r===row));
 }
};
prevVideo.addEventListener('emptied',()=>{pendingCut=false;cutControls.classList.remove('awaiting-end');});
const scrubber=document.createElement('input');
scrubber.type='range';scrubber.min='0';scrubber.max='1000';scrubber.step='1';scrubber.value='0';
scrubber.id='playerSeek';scrubber.setAttribute('aria-label','Seek video');
document.querySelector('.player-toolbar').before(scrubber);
const frameBack=document.createElement('button'),frameForward=document.createElement('button');
frameBack.className=frameForward.className='transport-btn';
frameBack.textContent='‹';frameForward.textContent='›';
frameBack.id='frameBack';frameForward.id='frameForward';
document.querySelector('.transport-controls').prepend(frameBack);
document.querySelector('.transport-controls').append(frameForward);
const mute=document.createElement('button'),fullscreen=document.createElement('button');
mute.className=fullscreen.className='transport-btn';mute.textContent='♪';fullscreen.textContent='⛶';
mute.title='Mute / إيقاف الصوت';fullscreen.title='Fullscreen / ملء الشاشة';
mute.onclick=()=>{prevVideo.muted=!prevVideo.muted;mute.textContent=prevVideo.muted?'×♪':'♪';mute.setAttribute('aria-pressed',String(prevVideo.muted));};
fullscreen.onclick=()=>prevVideo.requestFullscreen().catch(()=>{});
document.querySelector('.transport-controls').append(mute,fullscreen);
frameBack.title='Previous frame / الإطار السابق';frameForward.title='Next frame / الإطار التالي';
Object.assign(I18N.ar,{exportSettings:'إعدادات التصدير والترجمة',timelineTitle:'الخط الزمني',go:'تصدير المقاطع',modeAuto:'تقسيم تلقائي',modeRanges:'قص يدوي',playerHint:'المعاينة',trimHint:'I بداية • O نهاية • Space تشغيل • الأسهم: إطار واحد • Shift + سهم: ثانية',markStart:'بداية  I',markEnd:'نهاية  O'});
Object.assign(I18N.en,{exportSettings:'Export settings & captions',timelineTitle:'Timeline',go:'Export clips',modeAuto:'Auto split',modeRanges:'Manual cut',playerHint:'Preview',trimHint:'I start • O end • Space play • Arrows: one frame • Shift + arrow: one second',markStart:'Start  I',markEnd:'End  O'});
function seekBy(seconds){
 if(prevVideo.readyState<1)return;
 prevVideo.currentTime=Math.max(0,Math.min(trimDur,prevVideo.currentTime+seconds));
}
frameBack.onclick=()=>seekBy(-1/videoFps);
frameForward.onclick=()=>seekBy(1/videoFps);
scrubber.oninput=()=>{if(prevVideo.readyState>=1)prevVideo.currentTime=trimDur*(+scrubber.value/1000);};
prevVideo.addEventListener('timeupdate',()=>{scrubber.value=trimDur?String(prevVideo.currentTime/trimDur*1000):'0';});
$('zoomIn').onclick=()=>{setZoom(zoomLevel+1);$('zoomValue').value=zoomLevel.toFixed(1)+'×';};
$('zoomOut').onclick=()=>{setZoom(zoomLevel-1);$('zoomValue').value=zoomLevel.toFixed(1)+'×';};
function selectClip(row){
 document.querySelectorAll('.range-row').forEach(r=>r.classList.toggle('selected',r===row));
 const start=parseTime(row.querySelector('.r-from').value),end=parseTime(row.querySelector('.r-to').value);
 if(Number.isFinite(start)&&Number.isFinite(end)&&end>start){
  trimStart=start;trimEnd=end;renderTrim();
  if(prevVideo.readyState>=1)prevVideo.currentTime=Math.min(trimDur,start);
 }
}
$('rangeRows').addEventListener('click',e=>{
 const row=e.target.closest('.range-row');
 if(row&&!e.target.closest('input,button'))selectClip(row);
});
$('segDelLastBtn').onclick=()=>{
 const row=document.querySelector('.range-row.selected')||$('rangeRows').lastElementChild;
 if(row){row.remove();renumberRanges();updateEstimate();}
};
document.addEventListener('keydown',e=>{
 if(e.target.closest('input,textarea,select,button,[contenteditable="true"]')||!filePath||$('lockScreen').classList.contains('show'))return;
 const key=e.key.toLowerCase();
 if(![' ','i','o','arrowleft','arrowright'].includes(key)||e.ctrlKey||e.altKey||e.metaKey)return;
 e.preventDefault();
 if(key===' ')$('previewPlayBtn').click();
 else if(key==='i'||key==='o'){setMode('ranges');(key==='i'?markStartBtn:markEndBtn).click();}
 else seekBy((key==='arrowleft'?-1:1)*(e.shiftKey?1:1/videoFps));
});
new ResizeObserver(()=>drawWaveform(lastPeaks)).observe($('filmstrip'));
// Surface captions directly in the inspector instead of hiding them in extras.
const captionPanel=$('captionBtn').closest('.extra-block');
captionPanel.classList.add('caption-panel');
inspectorScroll.insertBefore(captionPanel,settings);
const captionStatus=document.createElement('p');captionStatus.id='captionPreviewStatus';
captionStatus.dataset.i18n='captionPreviewHelp';captionPanel.append(captionStatus);
const captionNote=document.createElement('p');captionNote.className='inspector-help';captionNote.dataset.i18n='captionTimingNote';captionPanel.append(captionNote);
Object.assign(I18N.ar,{captionTimingNote:'الفقرات الطويلة تُقسّم إلى سطرين متتابعين. توقيت تقسيم ملفات SRT القديمة تقديري؛ أعيدي التوليد من الفيديو الأصلي لتوقيت أدق. راجعي الكلمات قبل التصدير.'});
Object.assign(I18N.en,{captionTimingNote:'Long paragraphs are paginated into two-line cues. Timing within old SRT paragraphs is estimated; regenerate from the original video for better timing. Review wording before export.'});
Object.assign(I18N.ar,{captionPreviewHelp:'اختاري ملف SRT أو ولّدي الترجمة لظهورها أثناء تشغيل الفيديو وفي التصدير.',trimHint:'حددي البداية ثم النهاية — يُضاف المقطع تلقائيًا. تعديل الأوقات من القائمة الجانبية.',lightTheme:'الوضع الفاتح',darkTheme:'الوضع الداكن'});
Object.assign(I18N.en,{captionPreviewHelp:'Choose an SRT file or generate captions to see them during playback and in exports.',trimHint:'Mark start, then end — the clip is added automatically. Edit times in the sidebar.',lightTheme:'Light mode',darkTheme:'Dark mode'});
const themeButton=document.createElement('button');themeButton.id='themeToggle';themeButton.className='lang-btn';
document.querySelector('.topbar-right').prepend(themeButton);
let theme=localStorage.getItem('splitora-theme')||'dark';
function applyTheme(){
 document.documentElement.dataset.theme=theme;
 themeButton.dataset.i18n=theme==='dark'?'lightTheme':'darkTheme';
 themeButton.textContent=t(themeButton.dataset.i18n);
 themeButton.setAttribute('aria-pressed',String(theme==='light'));
 localStorage.setItem('splitora-theme',theme);
}
themeButton.onclick=()=>{theme=theme==='dark'?'light':'dark';applyTheme();};
applyTheme();
let captionTrack=null;
async function loadCaptionPreview(file){
 clearCaptionPreview();
 try{
  const cues=await window.splitora.readCaptions(file);
  if(captionsPath!==file)return;
  if(!captionTrack)captionTrack=prevVideo.addTextTrack('subtitles','Splitora');
  for(const item of cues){
   if(!Number.isFinite(item.start)||!Number.isFinite(item.end)||item.end<=item.start)continue;
   const cue=new VTTCue(item.start,item.end,item.text.replace(/<[^>]*>/g,''));
   cue.align='center';cue.size=84;captionTrack.addCue(cue);
  }
  captionTrack.mode='showing';updateCaptionPreviewStyle();
  captionStatus.removeAttribute('data-i18n');
  captionStatus.textContent=lang==='ar'?`الترجمة جاهزة للمعاينة والتصدير (${captionTrack.cues.length} سطر)`:`Captions ready for preview and export (${captionTrack.cues.length} cues)`;
 }catch(e){captionStatus.textContent=String(e.message||e);showErr(String(e.message||e));}
}
function clearCaptionPreview(){
 if(captionTrack){captionTrack.mode='hidden';for(const cue of Array.from(captionTrack.cues||[]))captionTrack.removeCue(cue);captionTrack.mode='disabled';}
 if(typeof captionStatus!=='undefined'){captionStatus.dataset.i18n='captionPreviewHelp';captionStatus.textContent=t('captionPreviewHelp');}
}
function updateCaptionPreviewStyle(){
 prevVideo.dataset.captionStyle=captionsStyle;
 const r=prevVideo.getBoundingClientRect();
 const scale=Math.min(r.width/(videoW||1),r.height/(videoH||1));
 const size=Math.max(10,Math.min(videoW||1280,videoH||720)*11/288*scale);
 prevVideo.style.setProperty('--caption-size',size+'px');
}
new ResizeObserver(updateCaptionPreviewStyle).observe(prevVideo);
prevVideo.addEventListener('loadedmetadata',updateCaptionPreviewStyle);
// One task at a time: keep clips, captions and output settings in separate panels.
Object.assign(I18N.ar,{inspectorClips:'المقاطع',inspectorCaptions:'الترجمة',inspectorOutput:'التصدير',clipsHelp:'حددي البداية والنهاية أسفل المعاينة. اضغطي على أي مقطع لتعديل توقيته.',outputHelp:'اختاري الجودة ومكان حفظ المقاطع قبل التصدير.'});
Object.assign(I18N.en,{inspectorClips:'Clips',inspectorCaptions:'Captions',inspectorOutput:'Export',clipsHelp:'Mark start and end below the preview. Select a clip to edit its timing.',outputHelp:'Choose quality and where to save your clips before exporting.'});
const inspectorNav=document.createElement('div');
inspectorNav.className='inspector-nav';inspectorNav.setAttribute('role','tablist');
inspectorNav.setAttribute('aria-label','Editor settings');
const panes=[];
for(const [key,nodes] of [
 ['Clips',[modeTabs,$('panelAuto'),$('estimate'),$('panelRanges')]],
 ['Captions',[captionPanel]],
 ['Output',[document.querySelector('.inspector-section'),document.querySelector('.advanced')]]
]){
 const pane=document.createElement('section');pane.id='inspector'+key;pane.className='inspector-pane';pane.setAttribute('role','tabpanel');pane.setAttribute('aria-labelledby','tab'+key);
 const button=document.createElement('button');button.id='tab'+key;button.type='button';button.dataset.i18n='inspector'+key;button.setAttribute('role','tab');button.setAttribute('aria-controls',pane.id);
 inspectorNav.append(button);pane.append(...nodes);inspectorScroll.append(pane);panes.push({pane,button});
 button.onclick=()=>{for(const item of panes){const active=item.pane===pane;item.pane.hidden=!active;item.button.setAttribute('aria-selected',String(active));item.button.tabIndex=active?0:-1;}inspectorScroll.scrollTop=0;};
 button.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=panes.findIndex(p=>p.button===button);const next=e.key==='Home'?0:e.key==='End'?panes.length-1:(i+(e.key==='ArrowRight'?1:-1)+panes.length)%panes.length;panes[next].button.click();panes[next].button.focus();};
}
settings.remove();inspector.prepend(inspectorNav);panes[0].button.click();
const clipHelp=document.createElement('p');clipHelp.className='inspector-help';clipHelp.dataset.i18n='clipsHelp';$('panelRanges').prepend(clipHelp);
const outputHelp=document.createElement('p');outputHelp.className='inspector-help';outputHelp.dataset.i18n='outputHelp';$('inspectorOutput').prepend(outputHelp);
// Keep one compact add control for explicit time entry; avoid duplicate actions and long instructions.
$('addRange').hidden=true;document.querySelector('.range-hint').hidden=true;
applyLang();
setMode('ranges');
renderTrim();
