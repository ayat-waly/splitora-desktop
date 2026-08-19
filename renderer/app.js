const I18N={
 ar:{tagline:'قسّم فيديوهاتك باحترافية — بأقصى سرعة، بدون إنترنت',tagFast:'معالجة محلية بدون إنترنت',
 railImport:'استيراد',railEdit:'تحرير وتقسيم',railExport:'تصدير',
 s1:'اختر الفيديو',dropT:'اسحب الفيديو هنا أو اضغط للاختيار',dropS:'MP4 · MOV · WebM · MKV · AVI — أي حجم، بدون حدود',
 fName:'اسم الملف',fDur:'المدة',fSize:'الحجم',fRes:'الأبعاد',
 s2:'حدد مدة كل مقطع',sec:'ثانية',custom:'أو مدة مخصصة:',
 s3:'الجودة ومكان الحفظ',qLabel:'جودة الإخراج',outLabel:'مجلد الحفظ',
 qOrig:'الجودة الأصلية',qOrigS:'بدون إعادة ترميز — لحظي تقريباً',
 q1080S:'إعادة ترميز بقص دقيق للثانية',q720S:'إعادة ترميز — حجم أصغر',
 reels:'عمودي 9:16',reelsS:'مثالي لـ Reels و TikTok و Shorts',
 outBtn:'تغيير',go:'ابدأ التقسيم',resetBtn:'مسح الكل',processing:'جاري التقسيم…',
 splitting:'جاري تقسيم الفيديو…',cancel:'إلغاء',
 openFolder:'افتح المجلد',again:'تقسيم فيديو آخر',
 foot:'كل المعالجة تتم على جهازك، ملفاتك لا تغادر الجهاز أبداً',
 modeAuto:'تقسيم تلقائي متساوٍ',modeRanges:'مقاطع مخصصة (من → إلى)',
 addRange:'＋ إضافة مقطع جديد',
 rangeHint:'اكتبي الوقت بالثواني (75)، أو دقيقة:ثانية (1:15)، أو ساعة:دقيقة:ثانية (00:01:25)، أو مع رقم الفريم (00:01:25:13) — كل سطر هيطلع مقطع مستقل بالترتيب.',
 trimFrom:'من',trimTo:'إلى',trimAdd:'إضافة كمقطع',
 markStart:'حددي البداية هنا',markEnd:'حددي النهاية هنا',
 filmstripLoading:'جاري تجهيز المعاينة…',
 trimHint:'شغّلي الفيديو ووقّفي عند اللحظة اللي عايزاها، وادوسي "حددي هنا". تقدري كمان تكتبي الوقت يدوياً في الخانات لو حابة.',
 fromPh:'من (مثال 1:02)',toPh:'إلى (مثال 1:15)',
 sX:'إضافات اختيارية',xText:'نص فوق الفيديو',xTextPh:'اكتبي النص هنا (اختياري)…',
 st1:'أبيض بظل',st2:'أصفر بحدود',st3:'شريط داكن',st4:'كبسولة ملونة',
 pTop:'أعلى',pMid:'وسط',pBot:'أسفل',
 xFps:'الفريم ريت (معدل الإطارات)',fpsOrig:'الأصلي',
 xThumb:'ثامنيل المقاطع (صورة الغلاف)',thumbBtn:'اختيار صورة',thumbClear:'إزالة',
 xCaptions:'الترجمة (كابشن)',captionBtn:'اختيار ملف SRT',captionNone:'لم يتم اختيار ملف',
 capBold:'بولد كلاسيك',capBar:'شريط داكن',capPill:'كبسولة ملونة',
 whisperToggleBtn:'توليد تلقائي (Whisper)',
 whisperLangLbl:'لغة الفيديو',whisperAuto:'تلقائي (اكتشاف اللغة)',whisperAr:'العربية',whisperEn:'الإنجليزية',
 whisperModelLbl:'دقة النموذج',whisperTiny:'سريع (75MB)',whisperBase:'متوسط — موصى به (142MB)',whisperSmall:'دقيق أكتر (466MB)',
 whisperGoBtn:'توليد الترجمة',
 whisperModelReady:'النموذج محمّل وجاهز على جهازك.',
 whisperModelWillDownload:mb=>`هيتم تحميل نموذج التفريغ أول مرة (${mb}MB تقريباً) — مرة واحدة بس، بعدها هيشتغل بدون إنترنت.`,
 whisperNoBinary:'مكوّن التفريغ الصوتي غير موجود في هذه النسخة.',
 whisperStageModel:'جاري تحميل نموذج التفريغ (أول مرة بس)…',
 whisperStageAudio:'جاري استخراج الصوت من الفيديو…',
 whisperStageTranscribe:'جاري تفريغ الكلام إلى نص…',
 whisperDone:'اتولدت الترجمة تلقائياً — اختاري الستايل اللي يعجبك',
 whisperNeedVideo:'اختاري فيديو الأول قبل توليد الترجمة.',
 E_NO_WHISPER:'مكوّن التفريغ الصوتي غير موجود في هذه النسخة.',
 E_NO_MODEL:'نموذج التفريغ غير محمّل — جربي تاني.',
 E_DOWNLOAD_FAILED:'فشل تحميل نموذج التفريغ — تأكدي من الاتصال بالإنترنت وجربي تاني.',
 E_NO_OUTPUT:'التفريغ الصوتي لم يُنتج نصاً — جربي فيديو فيه كلام أوضح.',
 thumbNote:'الصورة بتتدمج داخل كل مقطع كصورة غلاف (تظهر في مستكشف الملفات ومشغلات الفيديو). منصات مثل يوتيوب وتيك توك تسمح برفع الثامنيل يدوياً عند النشر.',
 estRanges:n=>`سيتم إنشاء <b>${n} مقطع</b> حسب الأوقات المحددة.`,
 errRange:'راجعي الأوقات: لازم "من" أقل من "إلى" وداخل مدة الفيديو.',
 errNoRanges:'ضيفي مقطع واحد على الأقل بأوقات صحيحة.',
 tabLocal:'من جهازك',tabUrl:'من رابط (يوتيوب وغيره)',
 urlPh:'الصق رابط يوتيوب أو تيك توك أو أي موقع فيديو…',urlBtn:'جلب الفيديو',
 dlLbl:'جاري تحميل الفيديو…',uFetching:'جاري قراءة معلومات الفيديو…',uDone:'اكتمل التحميل — الفيديو جاهز للتقسيم تحت',
 E_PRIVATE:'هذا الفيديو خاص ولا يمكن تحميله.',
 E_AGE:'هذا الفيديو مقيد بالعمر ولا يمكن تحميله بدون تسجيل دخول.',
 E_UNSUPPORTED:'الرابط غير مدعوم — تأكدي إنه رابط فيديو صحيح.',
 E_BOTCHECK:'يوتيوب طلب تحققاً إضافياً من شبكتك. جربي تاني بعد دقائق أو من شبكة مختلفة.',
 E_UNAVAILABLE:'الفيديو غير متاح أو تم حذفه.',
 E_NETWORK:'مشكلة في الاتصال بالإنترنت — تأكدي من الشبكة وجربي تاني.',
 E_NO_YTDLP:'مكوّن تحميل الروابط غير موجود في هذه النسخة.',
 E_UNKNOWN:'حدث خطأ غير متوقع أثناء التحميل.',
 estimate:(n,d,last)=>`سيتم تقسيم الفيديو إلى <b>${n} مقطع</b> — ${n-(last?1:0)} مقطع مدة كل منها <b>${d} ثانية</b>${last?`+ مقطع أخير مدته <b>${last} ثانية</b>`:''}.`,
 done:n=>`تم التقسيم بنجاح! ${n} مقطع محفوظ`,errDur:'من فضلك أدخل مدة صحيحة بالثواني.',
 errProc:'حدث خطأ أثناء المعالجة:',cancelled:'تم الإلغاء.',
 licTrial:d=>`نسخة تجريبية — باقي ${d} ${d===1?'يوم':'أيام'}. المقاطع المُصدَّرة عليها علامة Splitora المائية.`,
 licLocked:'⏰ انتهت الفترة التجريبية. فعّلي مفتاح الاشتراك عشان تكملي التصدير.',
 licBadge:'نسخة مفعّلة',
 licActivate:'تفعيل الاشتراك',licActivateBtn:'تفعيل',licLater:'لاحقاً',
 licLockTitle:'فترة التجربة انتهت',licLockDesc:'أدخلي مفتاح التفعيل عشان تكملي استخدام Splitora بدون علامة مائية.',
 licLockTitleTrial:'فعّلي اشتراكك',licLockDescTrial:'أدخلي مفتاح التفعيل عشان تشيلي العلامة المائية من الفيديوهات. تقدري كمان تكملي التجربة المجانية لو ضغطتي لاحقاً.',
 licErrFormat:'المفتاح غير صحيح — تأكدي إنك نسختيه كامل.',
 licErrSig:'المفتاح غير صالح.',licErrExpired:'المفتاح منتهي الصلاحية.',
 licSuccess:'تم التفعيل بنجاح!',
 licLockedExport:'⏰ انتهت الفترة التجريبية. فعّلي مفتاح الاشتراك عشان تقدري تصدّري الفيديو.'},
 en:{tagline:'Split your videos professionally — full speed, no internet needed',tagFast:'Local processing, no internet',
 railImport:'Import',railEdit:'Edit & Split',railExport:'Export',
 s1:'Choose your video',dropT:'Drag a video here or click to browse',dropS:'MP4 · MOV · WebM · MKV · AVI — any size, no limits',
 fName:'File name',fDur:'Duration',fSize:'Size',fRes:'Dimensions',
 s2:'Choose clip duration',sec:'seconds',custom:'Or custom duration:',
 s3:'Quality & save location',qLabel:'Output quality',outLabel:'Save folder',
 qOrig:'Original quality',qOrigS:'No re-encoding — near instant',
 q1080S:'Re-encode, second-accurate cuts',q720S:'Re-encode — smaller files',
 reels:'Vertical 9:16',reelsS:'Perfect for Reels, TikTok & Shorts',
 outBtn:'Change',go:'Start splitting',resetBtn:'Reset all',processing:'Splitting…',
 splitting:'Splitting your video…',cancel:'Cancel',
 openFolder:'Open folder',again:'Split another video',
 foot:'All processing happens on your device — your files never leave it',
 modeAuto:'Equal auto-split',modeRanges:'Custom clips (from → to)',
 addRange:'＋ Add another clip',
 rangeHint:'Enter times as seconds (75), minutes:seconds (1:15), hours:minutes:seconds (00:01:25), or with a frame number (00:01:25:13) — each row becomes one clip, in order.',
 trimFrom:'From',trimTo:'To',trimAdd:'Add as clip',
 markStart:'Mark start here',markEnd:'Mark end here',
 filmstripLoading:'Preparing preview…',
 trimHint:'Play the video and pause at the moment you want, then click "Mark here". You can also type the time directly in the boxes.',
 fromPh:'From (e.g. 1:02)',toPh:'To (e.g. 1:15)',
 sX:'Optional extras',xText:'Text over video',xTextPh:'Type your text here (optional)…',
 st1:'White + shadow',st2:'Yellow outline',st3:'Dark bar',st4:'Color pill',
 pTop:'Top',pMid:'Middle',pBot:'Bottom',
 xFps:'Frame rate',fpsOrig:'Original',
 xThumb:'Clips thumbnail (cover image)',thumbBtn:'Choose image',thumbClear:'Remove',
 xCaptions:'Captions (subtitles)',captionBtn:'Choose SRT file',captionNone:'No file chosen',
 capBold:'Bold classic',capBar:'Dark bar',capPill:'Colored pill',
 whisperToggleBtn:'Auto-generate (Whisper)',
 whisperLangLbl:'Video language',whisperAuto:'Auto-detect',whisperAr:'Arabic',whisperEn:'English',
 whisperModelLbl:'Model accuracy',whisperTiny:'Fast (75MB)',whisperBase:'Balanced — recommended (142MB)',whisperSmall:'More accurate (466MB)',
 whisperGoBtn:'Generate captions',
 whisperModelReady:'Model already downloaded and ready.',
 whisperModelWillDownload:mb=>`The transcription model will download once (~${mb}MB) — after that it works fully offline.`,
 whisperNoBinary:'The transcription engine is missing in this build.',
 whisperStageModel:'Downloading transcription model (one-time)…',
 whisperStageAudio:'Extracting audio from video…',
 whisperStageTranscribe:'Transcribing speech to text…',
 whisperDone:'Captions generated automatically — pick a style below',
 whisperNeedVideo:'Choose a video first before generating captions.',
 E_NO_WHISPER:'The transcription engine is missing in this build.',
 E_NO_MODEL:'Transcription model is not downloaded — try again.',
 E_DOWNLOAD_FAILED:'Failed to download the transcription model — check your connection and try again.',
 E_NO_OUTPUT:'Transcription produced no text — try a video with clearer speech.',
 thumbNote:'The image is embedded in every clip as cover art (shows in file explorers and players). Platforms like YouTube and TikTok let you upload a thumbnail manually when posting.',
 estRanges:n=>`<b>${n} clips</b> will be created from your selected times.`,
 errRange:'Check your times: "from" must be less than "to" and within the video duration.',
 errNoRanges:'Add at least one clip with valid times.',
 tabLocal:'From device',tabUrl:'From URL (YouTube & more)',
 urlPh:'Paste a YouTube, TikTok or any video site link…',urlBtn:'Fetch video',
 dlLbl:'Downloading video…',uFetching:'Reading video info…',uDone:'Download complete — ready to split below',
 E_PRIVATE:'This video is private and cannot be downloaded.',
 E_AGE:'This video is age-restricted and needs a signed-in account.',
 E_UNSUPPORTED:'Unsupported link — make sure it is a valid video URL.',
 E_BOTCHECK:'YouTube asked for extra verification from your network. Try again in a few minutes or from another network.',
 E_UNAVAILABLE:'This video is unavailable or was removed.',
 E_NETWORK:'Connection problem — check your internet and try again.',
 E_NO_YTDLP:'The URL download component is missing from this build.',
 E_UNKNOWN:'An unexpected error occurred while downloading.',
 estimate:(n,d,last)=>`Your video will be split into <b>${n} parts</b> — ${n-(last?1:0)} parts of <b>${d}s</b> each${last?`+ a final part of <b>${last}s</b>`:''}.`,
 done:n=>`Done! ${n} parts saved`,errDur:'Please enter a valid duration in seconds.',
 errProc:'Processing failed:',cancelled:'Cancelled.',
 licTrial:d=>`Free trial — ${d} day${d===1?'':'s'} left. Exported clips carry the Splitora watermark.`,
 licLocked:'⏰ Trial period ended. Activate your subscription to keep exporting.',
 licBadge:'Licensed',
 licActivate:'Activate',licActivateBtn:'Activate',licLater:'Later',
 licLockTitle:'Trial period ended',licLockDesc:'Enter your activation key to keep using Splitora without a watermark.',
 licLockTitleTrial:'Activate your subscription',licLockDescTrial:'Enter your activation key to remove the watermark from exported videos. You can also continue your free trial by clicking Later.',
 licErrFormat:'Invalid key — make sure you copied it in full.',
 licErrSig:'This key is not valid.',licErrExpired:'This key has expired.',
 licSuccess:'Activated successfully!',
 licLockedExport:'⏰ Trial period ended. Activate your subscription to export the video.'}
};
let lang='ar';
const t=k=>I18N[lang][k];
function applyLang(){
 document.documentElement.lang=lang;
 document.documentElement.dir=lang==='ar'?'rtl':'ltr';
 document.getElementById('langBtn').textContent=lang==='ar'?'English':'العربية';
 document.querySelectorAll('[data-i18n]').forEach(el=>{const v=I18N[lang][el.dataset.i18n];if(typeof v==='string')el.textContent=v;});
 document.querySelectorAll('[data-i18n-ph]').forEach(el=>{const v=I18N[lang][el.dataset.i18nPh];if(typeof v==='string')el.placeholder=v;});
 updateEstimate();
}
function toggleLang(){lang=lang==='ar'?'en':'ar';applyLang();}
document.getElementById('langBtn').addEventListener('click',toggleLang);

const $=id=>document.getElementById(id);

/* step rail (Import / Edit & Split / Export) — purely presentational */
function setStage(stage){
 const order=['import','edit','export'];
 const idx=order.indexOf(stage);
 order.forEach((s,i)=>{
 const el=$('rail-'+s);
 if(!el)return;
 el.classList.remove('current','done');
 if(i<idx)el.classList.add('done');
 else if(i===idx)el.classList.add('current');
 });
}
const fmtTime=s=>{s=Math.round(s);const m=Math.floor(s/60),ss=s%60,h=Math.floor(m/60);return (h?h+':':'')+String(h?m%60:m).padStart(h?2:1,'0')+':'+String(ss).padStart(2,'0');};
const fmtSize=b=>b>1e9?(b/1e9).toFixed(2)+'GB':b>1e6?(b/1e6).toFixed(1)+'MB':(b/1e3).toFixed(0)+'KB';

let filePath=null,videoDur=0,videoFps=30,videoW=0,videoH=0,clipSec=60,quality='copy',reels=false,outDir='',resultDir='';

/* file selection */
const drop=$('drop');
drop.onclick=async()=>{const f=await window.splitora.pickVideo();if(f)await setFile(f);};
['dragover','dragenter'].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.add('over');}));
['dragleave','drop'].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.remove('over');}));
drop.addEventListener('drop',async ev=>{
 const f=ev.dataTransfer.files[0];
 if(!f)return;
 const p=window.splitora.pathOf(f);
 if(p)await setFile(p);
});
async function setFile(p){
 try{
 const info=await window.splitora.probe(p);
 filePath=p;videoDur=info.duration;videoFps=info.fps||30;videoW=info.width||0;videoH=info.height||0;
 $('fiName').textContent=info.name;
 $('fiDur').textContent=fmtTime(info.duration);
 $('fiSize').textContent=fmtSize(info.size);
 $('fiRes').textContent=info.width+'×'+info.height;
 $('fileInfo').classList.add('show');
 document.body.classList.add('has-file');
 setStage('edit');
 $('goBtn').disabled=false;
 updateEstimate();
 initTrimmer(p, info.duration);
 }catch(e){showErr(String(e.message||e));}
}

/* source tabs */
$('tabLocal').onclick=()=>setTab(true);
$('tabUrl').onclick=()=>setTab(false);
function setTab(local){
 $('tabLocal').classList.toggle('active',local);
 $('tabUrl').classList.toggle('active',!local);
 $('drop').style.display=local?'block':'none';
 $('panelUrl').style.display=local?'none':'block';
}

/* from URL (yt-dlp) */
window.splitora.onUrlProgress(r=>{
 const pc=Math.round(r*100);
 $('urlBar').style.width=pc+'%';$('urlPct').textContent=pc+'%';
});
function urlErrMsg(e){
 const code=String(e&&e.message||e).trim();
 return I18N[lang][code]||I18N[lang].E_UNKNOWN+'('+code.slice(0,200)+')';
}
$('urlBtn').onclick=async()=>{
 const url=$('urlInput').value.trim();
 const err=$('urlErr');err.classList.remove('show');
 if(!/^https?:\/\//i.test(url)){err.textContent=t('E_UNSUPPORTED');err.classList.add('show');return;}
 const btn=$('urlBtn');btn.disabled=true;
 $('urlInfoCard').classList.remove('show');
 try{
 // 1) info preview
 btn.textContent=t('uFetching');
 const info=await window.splitora.urlInfo(url);
 $('uiTitle').textContent=info.title;
 $('uiMeta').textContent=(info.uploader?info.uploader+'·':'')+fmtTime(info.duration||0);
 if(info.thumbnail)$('uiThumb').src=info.thumbnail;
 $('urlInfoCard').classList.add('show');
 // 2) download with progress
 $('urlBar').style.width='0%';$('urlPct').textContent='0%';
 $('urlDl').classList.add('show');
 const filePathDl=await window.splitora.urlDownload(url);
 $('urlDl').classList.remove('show');
 // 3) hand off to the normal split flow
 await setFile(filePathDl);
 err.textContent=t('uDone');err.classList.add('show','ok');
 setTimeout(()=>{err.classList.remove('show','ok');},7000);
 }catch(e){
 $('urlDl').classList.remove('show');
 if(!/cancelled/.test(String(e&&e.message||e))){err.textContent=urlErrMsg(e);err.classList.add('show');}
 }finally{
 btn.disabled=false;btn.textContent=t('urlBtn');
 }
};
$('urlCancel').onclick=()=>window.splitora.cancelDownload();

/* duration */
document.querySelectorAll('.preset').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('.preset').forEach(x=>x.classList.remove('active'));
 b.classList.add('active');clipSec=+b.dataset.sec;$('customSec').value='';updateEstimate();
});
$('customSec').oninput=e=>{const v=+e.target.value;if(v>0){clipSec=v;document.querySelectorAll('.preset').forEach(x=>x.classList.remove('active'));}updateEstimate();};
function updateEstimate(){
 const est=$('estimate');
 if(splitMode==='ranges'){
 const r=readRanges();
 if(!r.error&&r.ranges&&r.ranges.length){est.innerHTML=I18N[lang].estRanges(r.ranges.length);est.classList.add('show');}
 else est.classList.remove('show');
 return;
 }
 if(!videoDur||!clipSec||clipSec<=0){est.classList.remove('show');return;}
 const n=Math.ceil(videoDur/clipSec);
 const rem=videoDur-Math.floor(videoDur/clipSec)*clipSec;
 const last=(videoDur%clipSec>0.5&&n>1)?Math.round(rem):0;
 est.innerHTML=I18N[lang].estimate(n,clipSec,last);
 est.classList.add('show');
}

/* split mode + custom ranges */
let splitMode='auto';
$('modeAuto').onclick=()=>setMode('auto');
$('modeRanges').onclick=()=>setMode('ranges');
function setMode(m){
 splitMode=m;
 $('modeAuto').classList.toggle('active',m==='auto');
 $('modeRanges').classList.toggle('active',m==='ranges');
 $('panelAuto').style.display=m==='auto'?'block':'none';
 $('panelRanges').style.display=m==='ranges'?'block':'none';
 updateEstimate();
}
function parseTime(s){
 s=String(s||'').trim().replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)); // arabic digits
 if(!s)return NaN;
 const parts=s.split(':').map(x=>x.trim());
 if(parts.some(x=>x===''||isNaN(+x)))return NaN;
 let frames=0;
 if(parts.length>=4){
 frames=+parts.pop(); // آخر جزء = رقم الفريم (مثال 00:01:25:13)
 if(frames<0)return NaN;
 }
 let sec=0;for(const p of parts)sec=sec*60+(+p);
 if(frames)sec+=frames/(videoFps>0?videoFps:30);
 return sec;
}
function addRangeRow(from='',to=''){
 const rows=$('rangeRows');
 const row=document.createElement('div');
 row.className='range-row';
 row.innerHTML=`<span class="idx"></span>
 <input type="text" class="r-from" placeholder="${t('fromPh')}" value="${from}">
 <span class="arrow">→</span>
 <input type="text" class="r-to" placeholder="${t('toPh')}" value="${to}">
 <button class="del" title="حذف"><svg class="icon" viewBox="0 0 24 24" style="width:13px;height:13px"><path d="M6 6l12 12M18 6 6 18"/></svg></button>`;
 row.querySelector('.del').onclick=()=>{row.remove();renumberRanges();updateEstimate();};
 row.querySelectorAll('input').forEach(i=>i.oninput=updateEstimate);
 rows.appendChild(row);
 renumberRanges();
}
function renumberRanges(){
 document.querySelectorAll('#rangeRows .range-row').forEach((r,i)=>r.querySelector('.idx').textContent=String(i+1).padStart(2,'0'));
}
function readRanges(){
 const out=[];
 for(const r of document.querySelectorAll('#rangeRows .range-row')){
 const a=parseTime(r.querySelector('.r-from').value);
 const b=parseTime(r.querySelector('.r-to').value);
 if(isNaN(a)&&isNaN(b))continue; // empty row: skip
 if(isNaN(a)||isNaN(b)||a>=b||(videoDur&&b>videoDur+0.5))return {error:true};
 out.push({start:a,end:b});
 }
 return {ranges:out};
}
$('addRange').onclick=()=>addRangeRow();
addRangeRow(); // start with one row

/* ===== trimmer preview: video + mark start/end buttons ===== */
function toFileUrl(p){
 let s=String(p).replace(/\\/g,'/');
 if(!s.startsWith('/'))s='/'+s; // windows drive letters: C:/... -> /C:/...
 return'file://'+encodeURI(s);
}
const fmtTrim=s=>{
 s=Math.max(0,s);
 const m=Math.floor(s/60),ss=(s%60);
 return String(m).padStart(2,'0')+':'+ss.toFixed(1).padStart(4,'0');
};
const prevVideo=$('prevVideo'),markStartBtn=$('markStartBtn'),markEndBtn=$('markEndBtn'),
 trimStartLbl=$('trimStartLbl'),trimEndLbl=$('trimEndLbl'),trimAddBtn=$('trimAddBtn');
let trimStart=null,trimEnd=null,trimDur=0,zoomLevel=1,lastPeaks=[];

function initTrimmer(path,duration){
 try{ prevVideo.src=toFileUrl(path); }catch(_e){}
 trimDur=duration||0;
 trimStart=null;
 trimEnd=null;
 renderTrim();
 setZoom(1);
 $('filmstripScroll').scrollLeft=0;
 loadFilmstrip(path,duration);
 loadWaveform(path);
}
let filmstripLoadId=0;
async function loadFilmstrip(path,duration){
 const myId=++filmstripLoadId;
 const track=$('filmstripTrack'),loading=$('filmstripLoading'),playhead=$('filmstripPlayhead');
 track.innerHTML='';
 playhead.style.display='none';
 loading.style.display='flex';
 clearWaveform();
 try{
 const frames=await window.splitora.genThumbstrip(path,duration,14);
 if(myId!==filmstripLoadId)return; // المستخدم رفعت فيديو تاني قبل ما نخلص
 if(frames&&frames.length){
 frames.forEach(src=>{
 const img=document.createElement('img');
 img.src=src;
 track.appendChild(img);
 });
 playhead.style.display='block';
 }
 }catch(_e){ /* تجاهل الفشل — الفيديو والتحكم اليدوي هيفضلوا شغالين عادي */ }
 finally{ if(myId===filmstripLoadId) loading.style.display='none'; }
}
async function loadWaveform(path){
 const myId=filmstripLoadId; // نفس الجيل اللي حدده loadFilmstrip
 try{
 const peaks=await window.splitora.genWaveform(path,120);
 if(myId!==filmstripLoadId)return;
 lastPeaks=peaks;
 drawWaveform(peaks);
 }catch(_e){ /* لو فشل، الفيلم سترip يفضل شغال لوحده */ }
}
function clearWaveform(){
 const c=$('filmstripWave');
 const ctx=c.getContext('2d');
 ctx.clearRect(0,0,c.width,c.height);
}
function drawWaveform(peaks){
 if(!peaks||!peaks.length)return;
 const box=$('filmstrip'),canvas=$('filmstripWave');
 const w=box.clientWidth,h=box.clientHeight;
 if(!w||!h)return;
 const dpr=window.devicePixelRatio||1;
 canvas.width=w*dpr;canvas.height=h*dpr;
 canvas.style.width=w+'px';canvas.style.height=h+'px';
 const ctx=canvas.getContext('2d');
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.clearRect(0,0,w,h);
 const barW=w/peaks.length,mid=h/2;
 ctx.fillStyle='rgba(255,255,255,.6)';
 peaks.forEach((p,i)=>{
 const bh=Math.max(1.5,p*h*0.82);
 ctx.fillRect(i*barW, mid-bh/2, Math.max(1,barW*0.7), bh);
 });
}
$('filmstrip').addEventListener('click',(ev)=>{
 if(!trimDur||prevVideo.readyState<1)return;
 const r=$('filmstrip').getBoundingClientRect();
 const p=Math.min(1,Math.max(0,(ev.clientX-r.left)/r.width));
 prevVideo.currentTime=p*trimDur;
});
function renderTrim(){
 trimStartLbl.value=trimStart==null?'—':fmtTrim(trimStart);
 trimEndLbl.value=trimEnd==null?'—':fmtTrim(trimEnd);
}
markStartBtn.onclick=()=>{
 if(prevVideo.readyState<1)return;
 trimStart=prevVideo.currentTime;
 if(trimEnd!=null && trimEnd<=trimStart)trimEnd=null;
 renderTrim();
};
markEndBtn.onclick=()=>{
 if(prevVideo.readyState<1)return;
 const t=prevVideo.currentTime;
 if(trimStart!=null && t<=trimStart)return; // نهاية لازم تكون بعد البداية
 trimEnd=t;
 renderTrim();
};
prevVideo.addEventListener('timeupdate',()=>{
 drawTextPreview();
 if(trimDur>0){
 const track=$('filmstrip'),ph=$('filmstripPlayhead');
 const percent=Math.min(1,Math.max(0,prevVideo.currentTime/trimDur));
 ph.style.left=(percent*100)+'%';
 if(zoomLevel>1){
 const scroller=$('filmstripScroll');
 const playheadPx=percent*track.clientWidth;
 const viewLeft=scroller.scrollLeft,viewRight=viewLeft+scroller.clientWidth;
 if(playheadPx<viewLeft+24||playheadPx>viewRight-24){
 scroller.scrollLeft=playheadPx-scroller.clientWidth/2;
 }
 }
 }
});
prevVideo.addEventListener('loadeddata',()=>drawTextPreview());
function setZoom(z){
 zoomLevel=Math.min(8,Math.max(1,z));
 $('filmstrip').style.width=(zoomLevel*100)+'%';
 drawWaveform(lastPeaks); // إعادة الرسم على العرض الجديد
 if(trimDur>0){
 const track=$('filmstrip'),scroller=$('filmstripScroll');
 const percent=Math.min(1,Math.max(0,prevVideo.currentTime/trimDur));
 const playheadPx=percent*track.clientWidth; // clientWidth بيتحدث فوراً بعد تغيير العرض فوق
 scroller.scrollLeft=playheadPx-scroller.clientWidth/2; // نخلي المؤشر في نص الشاشة بعد الزوم
 }
}
$('filmstripScroll').addEventListener('wheel',(ev)=>{
 if(!trimDur)return;
 ev.preventDefault();
 const raw=-ev.deltaY*0.01;
 const delta=Math.max(-0.5,Math.min(0.5,raw)); // خطوات صغيرة = زوم سلس مهما كان نوع الماوس
 setZoom(zoomLevel+delta);
},{passive:false});
trimAddBtn.onclick=()=>{
 if(trimStart==null||trimEnd==null||trimEnd<=trimStart)return;
 addRangeRow(trimStart.toFixed(2),trimEnd.toFixed(2));
 updateEstimate();
};
function commitTrimInput(which){
 const el=which==='start'?trimStartLbl:trimEndLbl;
 const val=parseTime(el.value);
 if(isNaN(val)){ renderTrim(); return; }
 if(which==='start'){ trimStart=Math.max(0,val); if(trimEnd!=null&&trimEnd<=trimStart)trimEnd=null; }
 else{ trimEnd=Math.min(trimDur||val,val); if(trimStart!=null&&trimEnd<=trimStart)trimEnd=null; }
 renderTrim();
}
trimStartLbl.addEventListener('change',()=>commitTrimInput('start'));
trimStartLbl.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();trimStartLbl.blur();}});
trimEndLbl.addEventListener('change',()=>commitTrimInput('end'));
trimEndLbl.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();trimEndLbl.blur();}});

/* text overlay */
let ovStyle='shadow',ovPos='bottom';
document.querySelectorAll('#styleRow .style-opt').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('#styleRow .style-opt').forEach(x=>x.classList.remove('active'));
 b.classList.add('active');ovStyle=b.dataset.style;drawTextPreview();
});
document.querySelectorAll('#posRow .pos-opt').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('#posRow .pos-opt').forEach(x=>x.classList.remove('active'));
 b.classList.add('active');ovPos=b.dataset.pos;drawTextPreview();
});
$('ovText').oninput=drawTextPreview;
function outDims(){
 if(reels)return quality==='720'?[720,1280]:[1080,1920];
 let w=videoW||1280,h=videoH||720;
 const cap=quality==='1080'?1080:quality==='720'?720:0;
 if(cap&&h>cap){w=Math.max(2,Math.round(w*cap/h/2)*2);h=cap;}
 return [w,h];
}
function drawTextCanvas(W,H){
 const c=document.createElement('canvas');c.width=W;c.height=H;
 const ctx=c.getContext('2d');
 const text=$('ovText').value.trim();
 if(!text)return null;
 const fsz=Math.round(Math.min(W,H*0.56)*0.07);
 ctx.font=`bold ${fsz}px "IBM Plex Sans Arabic","Segoe UI",Arial,sans-serif`;
 ctx.textAlign='center';ctx.textBaseline='middle';
 const lines=text.split(/\n/).slice(0,3);
 const lh=fsz*1.35;
 const cy=ovPos==='top'?H*0.10:ovPos==='mid'?H*0.5:H*0.88;
 const y0=cy-(lines.length-1)*lh/2;
 lines.forEach((line,i)=>{
 const y=y0+i*lh, x=W/2;
 const tw=ctx.measureText(line).width;
 if(ovStyle==='bar'){
 ctx.save();ctx.fillStyle='rgba(10,16,28,.62)';
 roundRect(ctx,x-tw/2-fsz*.7,y-lh/2,tw+fsz*1.4,lh,fsz*.3);ctx.fill();ctx.restore();
 ctx.fillStyle='#ffffff';ctx.fillText(line,x,y);
 }else if(ovStyle==='pill'){
 ctx.save();
 const g=ctx.createLinearGradient(x-tw/2,0,x+tw/2,0);
 g.addColorStop(0,'#2f7cf6');g.addColorStop(1,'#8b5cf6');
 ctx.fillStyle=g;
 roundRect(ctx,x-tw/2-fsz*.8,y-lh/2,tw+fsz*1.6,lh,lh/2);ctx.fill();ctx.restore();
 ctx.fillStyle='#ffffff';ctx.fillText(line,x,y);
 }else if(ovStyle==='stroke'){
 ctx.lineWidth=Math.max(2,fsz*.14);ctx.strokeStyle='#000';ctx.lineJoin='round';
 ctx.strokeText(line,x,y);
 ctx.fillStyle='#ffd60a';ctx.fillText(line,x,y);
 }else{ // shadow
 ctx.save();ctx.shadowColor='rgba(0,0,0,.9)';ctx.shadowBlur=fsz*.35;ctx.shadowOffsetY=fsz*.06;
 ctx.fillStyle='#ffffff';ctx.fillText(line,x,y);ctx.restore();
 }
 });
 return c;
}
function roundRect(ctx,x,y,w,hh,r){
 ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+hh,r);ctx.arcTo(x+w,y+hh,x,y+hh,r);
 ctx.arcTo(x,y+hh,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}
function drawTextPreview(){
 const pv=$('textPreview');
 const text=$('ovText').value.trim();
 if(!text){pv.style.display='none';return;}
 const [W,H]=outDims();
 const c=drawTextCanvas(W,H);
 if(!c){pv.style.display='none';return;}
 pv.width=W;pv.height=H;
 const ctx=pv.getContext('2d');
 // خلفية: فريم حقيقي من الفيديو المرفوع (لو جاهز) بدل الشطرنج الفاضي
 const vid=$('prevVideo');
 if(vid && vid.readyState>=2 && vid.videoWidth){
 const vr=vid.videoWidth/vid.videoHeight, tr=W/H;
 let sw=vid.videoWidth, sh=vid.videoHeight, sx=0, sy=0;
 if(vr>tr){ sw=vid.videoHeight*tr; sx=(vid.videoWidth-sw)/2; }
 else{ sh=vid.videoWidth/tr; sy=(vid.videoHeight-sh)/2; }
 ctx.drawImage(vid,sx,sy,sw,sh,0,0,W,H);
 }else{
 const g=ctx.createLinearGradient(0,0,0,H);
 g.addColorStop(0,'#1c2b4a');g.addColorStop(1,'#0d1626');
 ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 }
 ctx.drawImage(c,0,0);
 pv.style.display='block';pv.style.aspectRatio=W+'/'+H;
}

/* fps */
let fpsVal=0;
document.querySelectorAll('#fpsRow .fps-opt').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('#fpsRow .fps-opt').forEach(x=>x.classList.remove('active'));
 b.classList.add('active');fpsVal=+b.dataset.fps;
});

/* thumbnail */
let thumbPath=null;
$('thumbBtn').onclick=async()=>{
 const p=await window.splitora.pickImage();
 if(p){thumbPath=p;$('thumbPrev').src='file:///'+p.replace(/\\/g,'/');$('thumbPrev').classList.add('show');$('thumbClear').classList.add('show');}
};
$('thumbClear').onclick=()=>{thumbPath=null;$('thumbPrev').classList.remove('show');$('thumbClear').classList.remove('show');};

/* captions (SRT) */
let captionsPath=null,captionsStyle='bold';
$('captionBtn').onclick=async()=>{
 const p=await window.splitora.pickSrt();
 if(p){
 captionsPath=p;
 $('captionFileName').textContent=p.split(/[\\/]/).pop();
 $('captionClear').style.display='inline';
 $('captionStyles').style.display='grid';
 }
};
$('captionClear').onclick=()=>{
 captionsPath=null;
 $('captionFileName').textContent=I18N[lang].captionNone;
 $('captionClear').style.display='none';
 $('captionStyles').style.display='none';
};
document.querySelectorAll('.cap-style').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('.cap-style').forEach(x=>x.classList.remove('active'));
 b.classList.add('active');captionsStyle=b.dataset.capStyle;
});

/* توليد ترجمة تلقائي (Whisper محلي) */
let whisperStatusCache=null,whisperBusy=false;
async function refreshWhisperStatus(){
 try{ whisperStatusCache=await window.splitora.whisperStatus(); }
 catch(_){ whisperStatusCache={available:false,models:{}}; }
 updateWhisperModelNote();
 return whisperStatusCache;
}
function updateWhisperModelNote(){
 const size=$('whisperModel').value, st=whisperStatusCache, note=$('whisperModelNote');
 if(!st){note.textContent='';return;}
 if(!st.available){note.textContent=I18N[lang].whisperNoBinary;return;}
 const m=st.models[size];
 note.textContent = (m&&m.downloaded) ? I18N[lang].whisperModelReady : I18N[lang].whisperModelWillDownload(m?m.sizeMB:'~');
}
$('whisperModel').onchange=updateWhisperModelNote;
$('whisperToggleBtn').onclick=async()=>{
 const willShow=!$('whisperPanel').classList.contains('show');
 $('whisperPanel').classList.toggle('show',willShow);
 if(willShow) await refreshWhisperStatus();
};
$('whisperCancelBtn').onclick=async()=>{
 await window.splitora.cancelWhisperModelDownload();
 await window.splitora.cancelWhisper();
};
window.splitora.onWhisperModelProgress(r=>{
 $('whisperBar').style.width=Math.round(r*100)+'%';
 $('whisperPct').textContent=Math.round(r*100)+'%';
});
$('whisperGoBtn').onclick=async()=>{
 if(whisperBusy)return;
 if(!filePath){ $('whisperErr').textContent=I18N[lang].whisperNeedVideo; $('whisperErr').classList.add('show'); return; }
 whisperBusy=true;
 $('whisperErr').classList.remove('show');
 $('whisperGoBtn').disabled=true;
 $('whisperCancelBtn').style.display='block';
 $('whisperDl').classList.add('show');
 $('whisperBar').style.width='0%';$('whisperPct').textContent='0%';
 const model=$('whisperModel').value, language=$('whisperLang').value;
 try{
 const st=whisperStatusCache||await refreshWhisperStatus();
 if(!st.available) throw new Error('E_NO_WHISPER');
 const m=st.models[model];
 if(!m||!m.downloaded){
 $('whisperStage').textContent=I18N[lang].whisperStageModel;
 await window.splitora.whisperDownloadModel(model);
 }
 $('whisperBar').style.width='100%';$('whisperPct').textContent='100%';
 $('whisperStage').textContent=I18N[lang].whisperStageTranscribe;
 const srtPath=await window.splitora.whisperTranscribe(filePath,model,language);
 captionsPath=srtPath;
 $('captionFileName').textContent=I18N[lang].whisperDone;
 $('captionClear').style.display='inline';
 $('captionStyles').style.display='grid';
 $('whisperPanel').classList.remove('show');
 }catch(e){
 const code=String(e.message||e).replace(/^Error:\s*/,'');
 $('whisperErr').textContent = I18N[lang][code] || I18N[lang].errProc + code;
 $('whisperErr').classList.add('show');
 }finally{
 whisperBusy=false;
 $('whisperGoBtn').disabled=false;
 $('whisperCancelBtn').style.display='none';
 $('whisperDl').classList.remove('show');
 }
};

/* quality + reels + outdir */
document.querySelectorAll('#qualityOpts .opt').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('#qualityOpts .opt').forEach(x=>x.classList.remove('active'));
 b.classList.add('active');quality=b.dataset.q;drawTextPreview();
});
$('reelsSwitch').onclick=()=>{
 reels=!reels;
 $('reelsSwitch').setAttribute('aria-checked',String(reels));
 drawTextPreview();
};
$('outBtn').onclick=async()=>{const d=await window.splitora.pickOutDir();if(d){outDir=d;$('outPath').textContent=d;}};
window.splitora.defaultOutDir().then(d=>{outDir=d;$('outPath').textContent=d;});

function showErr(m){const e=$('errBox');e.textContent=m;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),12000);}

/* split */
window.splitora.onProgress(r=>{
 const pc=Math.round(r*100);
 $('pbarFill').style.width=pc+'%';$('pPct').textContent=pc+'%';
});
/* reset everything to defaults */
function resetAll(){
 // الفيديو والملف
 filePath=null;videoDur=0;videoFps=30;videoW=0;videoH=0;
 $('fileInfo').classList.remove('show');
 $('drop').classList.remove('over');
 document.body.classList.remove('has-file');
 setStage('import');
 $('goBtn').disabled=true;

 // وضع التقسيم
 clipSec=60;
 document.querySelectorAll('.preset').forEach(x=>x.classList.remove('active'));
 document.querySelector('.preset[data-sec="60"]').classList.add('active');
 $('customSec').value='';
 setMode('auto');

 // المقاطع المخصصة والسلايدر
 $('rangeRows').innerHTML='';
 addRangeRow();
 trimStart=null;trimEnd=null;trimDur=0;
 filmstripLoadId++; // إلغاء أي تحميل شغال
 lastPeaks=[];
 setZoom(1);
 $('filmstripScroll').scrollLeft=0;
 clearWaveform();
 $('filmstripTrack').innerHTML='';
 $('filmstripPlayhead').style.display='none';
 $('filmstripLoading').style.display='none';
 prevVideo.removeAttribute('src');prevVideo.load();
 renderTrim();

 // الإضافات: نص، fps، ثامنيل
 $('ovText').value='';
 ovStyle='shadow';ovPos='bottom';
 document.querySelectorAll('#styleRow .style-opt').forEach(x=>x.classList.remove('active'));
 document.querySelectorAll('#posRow .pos-opt').forEach(x=>x.classList.remove('active'));
 const defStyle=document.querySelector('[data-style="shadow"]'); if(defStyle)defStyle.classList.add('active');
 const defPos=document.querySelector('[data-pos="bottom"]'); if(defPos)defPos.classList.add('active');
 $('textPreview').style.display='none';

 fpsVal=0;
 document.querySelectorAll('#fpsRow .fps-opt').forEach(x=>x.classList.remove('active'));
 document.querySelector('#fpsRow .fps-opt[data-fps="0"]').classList.add('active');

 thumbPath=null;
 $('thumbPrev').classList.remove('show');
 $('thumbClear').classList.remove('show');

 captionsPath=null;captionsStyle='bold';
 $('captionFileName').textContent=I18N[lang].captionNone;
 $('captionClear').style.display='none';
 $('captionStyles').style.display='none';
 document.querySelectorAll('.cap-style').forEach(x=>x.classList.remove('active'));
 const defCapStyle=document.querySelector('[data-cap-style="bold"]'); if(defCapStyle)defCapStyle.classList.add('active');
 $('whisperPanel').classList.remove('show');
 $('whisperErr').classList.remove('show');
 $('whisperDl').classList.remove('show');

 // الجودة وReels
 quality='copy';
 document.querySelectorAll('.opt').forEach(x=>x.classList.remove('active'));
 document.querySelector('.opt[data-q="copy"]').classList.add('active');
 reels=false;
 $('reelsSwitch').setAttribute('aria-checked','false');

 $('errBox').classList.remove('show');
 updateEstimate();
}
$('resetBtn').onclick=resetAll;

$('goBtn').onclick=async()=>{
 if(!filePath)return;
 let rangesArr=null;
 if(splitMode==='ranges'){
 const r=readRanges();
 if(r.error){showErr(t('errRange'));return;}
 if(!r.ranges.length){showErr(t('errNoRanges'));return;}
 rangesArr=r.ranges;
 }else if(!clipSec||clipSec<=0){showErr(t('errDur'));return;}
 $('goBtn').disabled=true;
 setStage('export');
 $('progressCard').classList.add('show');
 $('resultsCard').classList.remove('show');
 $('pbarFill').style.width='0%';$('pPct').textContent='0%';
 try{
 let overlayPng=null;
 const oc=drawTextCanvas(...outDims());
 if(oc)overlayPng=await window.splitora.saveTempPng(oc.toDataURL('image/png'));
 const res=await window.splitora.split({
 input:filePath,outDir,clipSec,quality,reels,duration:videoDur,
 mode:splitMode,ranges:rangesArr,fps:fpsVal,overlayPng,thumbnail:thumbPath,
 captionsPath,captionsStyle,videoW,videoH
 });
 resultDir=res.dir;
 $('progressCard').classList.remove('show');
 $('doneBanner').textContent=I18N[lang].done(res.files.length);
 $('doneDir').textContent=res.dir;
 const pl=$('plist');pl.innerHTML='';
 res.files.forEach(f=>{
 const d=document.createElement('div');
 d.className='pitem';
 d.innerHTML=`<b>${f.name}</b><span>${fmtSize(f.size)}</span>`;
 d.onclick=()=>window.splitora.openFile(f.path);
 pl.appendChild(d);
 });
 $('resultsCard').classList.add('show');
 }catch(e){
 $('progressCard').classList.remove('show');
 setStage('edit');
 const m=String(e.message||e);
 if(/E_LICENSE_LOCKED/.test(m)){ showLock(false); }
 else showErr(/cancelled/.test(m)?t('cancelled'):t('errProc')+m.slice(-450));
 }finally{
 $('goBtn').disabled=false;
 }
};
$('cancelBtn').onclick=()=>window.splitora.cancel();
$('openBtn').onclick=()=>{if(resultDir)window.splitora.openFolder(resultDir);};
$('againBtn').onclick=()=>{
 $('resultsCard').classList.remove('show');
 setStage('edit');
};

/* license / trial */
let licMode='trial';
function showLock(dismissible){
 $('lockTitle').textContent=dismissible?t('licLockTitleTrial'):t('licLockTitle');
 $('lockDesc').textContent=dismissible?t('licLockDescTrial'):t('licLockDesc');
 $('lockCloseBtn').style.display=dismissible?'inline-block':'none';
 $('licErr').classList.remove('show');
 $('licKeyInput').value='';
 $('lockScreen').classList.add('show');
}
function hideLock(){ $('lockScreen').classList.remove('show'); }
async function refreshLicenseUI(){
 const st=await window.splitora.licenseStatus();
 licMode=st.mode;
 if(st.mode==='licensed'){
 $('trialBar').style.display='none';
 $('licBadge').style.display='inline-flex';
 $('licBadge').textContent=t('licBadge');
 }else if(st.mode==='trial'){
 $('licBadge').style.display='none';
 $('trialBar').style.display='flex';
 $('trialBar').classList.remove('warn');
 $('trialMsg').textContent=t('licTrial')(st.daysLeft);
 }else{ // locked
 $('licBadge').style.display='none';
 $('trialBar').style.display='flex';
 $('trialBar').classList.add('warn');
 $('trialMsg').textContent=t('licLocked');
 showLock(false);
 }
}
$('trialActBtn').onclick=()=>showLock(true);
$('lockCloseBtn').onclick=()=>hideLock();
$('licActivateBtn').onclick=async()=>{
 const key=$('licKeyInput').value.trim();
 $('licErr').classList.remove('show');
 if(!key){ $('licErr').textContent=t('licErrFormat'); $('licErr').classList.add('show'); return; }
 const btn=$('licActivateBtn'); btn.disabled=true;
 try{
 const res=await window.splitora.licenseActivate(key);
 if(res.ok){
 hideLock();
 await refreshLicenseUI();
 showErr(t('licSuccess'));
 }else{
 const map={format:t('licErrFormat'),malformed:t('licErrFormat'),signature:t('licErrSig'),expired:t('licErrExpired')};
 $('licErr').textContent=map[res.reason]||t('licErrFormat');
 $('licErr').classList.add('show');
 }
 }finally{ btn.disabled=false; }
};
refreshLicenseUI();

setStage('import');
applyLang();
