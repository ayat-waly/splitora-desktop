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
applyLang();
setMode('ranges');
renderTrim();
