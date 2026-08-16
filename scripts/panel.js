#!/usr/bin/env node
/*
  Splitora — لوحة تحكم توليد المفاتيح (بصرية، محلية بالكامل)
  =================================================================
  تشغيل: node scripts/panel.js
  هيفتحلك المتصفح تلقائياً على http://localhost:4570

  ملاحظات أمان:
  - السيرفر ده شغال على جهازك بس (localhost) — مش متاح لأي حد تاني على
    الإنترنت أو حتى على نفس الشبكة.
  - محتاج ملف scripts/private-key.pem موجود بجانبه (نفس المفتاح الخاص
    اللي بتستخدميه مع keygen.js).
  - كل المفاتيح والعملاء بيتسجلوا في scripts/data/customers.json على
    جهازك بس — الملف ده متضمنش في البرنامج النهائي ولا بيترفع لحد.
*/

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 4570;
const PRIVATE_KEY_PATH = path.join(__dirname, 'private-key.pem');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'customers.json');

const PLAN_DAYS = { weekly: 7, monthly: 30, five_months: 150, yearly: 365, lifetime: 365 * 100 };
const PLAN_LABELS = { weekly: 'أسبوعي', monthly: 'شهري', five_months: '5 شهور', yearly: 'سنوي', lifetime: 'مدى الحياة' };

function b64u(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function loadCustomers() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (_e) { return []; }
}
function saveCustomers(list) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

function generateKey(plan, customerName) {
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    throw new Error('مش لاقي ملف scripts/private-key.pem — حطيه في نفس مجلد scripts أولاً.');
  }
  const privateKey = crypto.createPrivateKey(fs.readFileSync(PRIVATE_KEY_PATH));
  const now = Date.now();
  const days = PLAN_DAYS[plan];
  if (!days) throw new Error('نوع باقة غير معروف');
  const payload = {
    id: crypto.randomBytes(4).toString('hex'),
    plan,
    cust: customerName || '',
    iat: now,
    exp: now + days * 86400000,
  };
  const payloadBuf = Buffer.from(JSON.stringify(payload));
  const sig = crypto.sign(null, payloadBuf, privateKey);
  const key = b64u(payloadBuf) + '.' + b64u(sig);
  return { key, payload };
}

const PAGE_HTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>لوحة تحكم Splitora — توليد المفاتيح</title>
<style>
  :root{--navy:#152344;--blue:#2f6bff;--purple:#8a4fff;--border:#e4e9f2;--muted:#7a869a;--bg:#f5f7fb}
  *{box-sizing:border-box}
  body{margin:0;font-family:'Segoe UI',Tahoma,Arial,sans-serif;background:var(--bg);color:var(--navy);padding:32px 20px}
  .wrap{max-width:920px;margin:0 auto}
  h1{font-size:1.5rem;margin-bottom:4px}
  .sub{color:var(--muted);font-size:.9rem;margin-bottom:28px}
  .card{background:#fff;border:1px solid var(--border);border-radius:16px;padding:24px;margin-bottom:24px;box-shadow:0 2px 10px rgba(20,36,63,.04)}
  .row{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px}
  .field{flex:1;min-width:180px}
  label{display:block;font-size:.82rem;color:var(--muted);margin-bottom:6px;font-weight:600}
  input,select{width:100%;padding:11px 13px;border:1.5px solid var(--border);border-radius:10px;font-family:inherit;font-size:.9rem;outline:none}
  input:focus,select:focus{border-color:var(--blue)}
  button.gen{background:linear-gradient(135deg,var(--blue),var(--purple));color:#fff;border:none;border-radius:10px;padding:13px 28px;font-family:inherit;font-size:.92rem;font-weight:700;cursor:pointer}
  button.gen:disabled{opacity:.6;cursor:default}
  .result{display:none;margin-top:18px;background:#eafaf6;border:1.5px solid #b9ecdd;border-radius:12px;padding:16px}
  .result.show{display:block}
  .result .key{font-family:Consolas,monospace;font-size:.78rem;word-break:break-all;background:#fff;border:1px solid var(--border);border-radius:8px;padding:10px;margin:8px 0;direction:ltr;text-align:left}
  .copybtn{background:var(--navy);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-family:inherit;font-size:.82rem;cursor:pointer}
  .wabtn{background:#25D366;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-family:inherit;font-size:.82rem;cursor:pointer;margin-inline-start:8px}
  .err{display:none;margin-top:14px;background:#fff0ee;border:1.5px solid #f3a89c;color:#7a2418;border-radius:10px;padding:12px 14px;font-size:.85rem}
  .err.show{display:block}
  table{width:100%;border-collapse:collapse;font-size:.85rem}
  th,td{text-align:right;padding:10px 8px;border-bottom:1px solid var(--border)}
  th{color:var(--muted);font-weight:600;font-size:.78rem}
  .badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:.72rem;font-weight:700}
  .badge.active{background:#eafaf6;color:#0d7a5f}
  .badge.expired{background:#fff0ee;color:#c0392b}
  .empty{color:var(--muted);text-align:center;padding:30px;font-size:.88rem}
  .mini{background:none;border:1px solid var(--border);border-radius:7px;padding:5px 10px;font-size:.76rem;cursor:pointer;font-family:inherit}
</style>
</head>
<body>
<div class="wrap">
  <h1>🔑 لوحة تحكم Splitora</h1>
  <div class="sub">توليد مفاتيح تفعيل للعملاء — محلي بالكامل على جهازك، مفيش أي حاجة بتترفع لأي سيرفر خارجي.</div>

  <div class="card">
    <div class="row">
      <div class="field">
        <label>اسم العميل (اختياري)</label>
        <input id="custName" placeholder="مثال: سارة أحمد">
      </div>
      <div class="field">
        <label>نوع الباقة</label>
        <select id="plan">
          <option value="weekly">أسبوعي (7 أيام)</option>
          <option value="monthly">شهري (30 يوم)</option>
          <option value="five_months">5 شهور (150 يوم)</option>
          <option value="yearly">سنوي (365 يوم)</option>
          <option value="lifetime">مدى الحياة</option>
        </select>
      </div>
    </div>
    <button class="gen" id="genBtn">✨ توليد المفتاح</button>
    <div class="err" id="errBox"></div>
    <div class="result" id="resultBox">
      <div id="resultInfo"></div>
      <div class="key" id="keyText"></div>
      <button class="copybtn" id="copyBtn">📋 نسخ المفتاح</button>
      <button class="wabtn" id="waBtn">📱 إرسال عبر واتساب</button>
    </div>
  </div>

  <div class="card">
    <div class="row" style="align-items:center;justify-content:space-between">
      <div style="font-weight:700">📋 سجل المفاتيح (${'${'}count${'}'} مفتاح)</div>
      <input id="searchBox" placeholder="بحث بالاسم..." style="max-width:200px">
    </div>
    <div id="tableWrap"></div>
  </div>
</div>

<script>
const genBtn=document.getElementById('genBtn');
const custName=document.getElementById('custName');
const planSel=document.getElementById('plan');
const errBox=document.getElementById('errBox');
const resultBox=document.getElementById('resultBox');
const resultInfo=document.getElementById('resultInfo');
const keyText=document.getElementById('keyText');
const copyBtn=document.getElementById('copyBtn');
const waBtn=document.getElementById('waBtn');
const WA_NUMBER='201021830223'; // +20 10 21830223
let lastPayload=null,lastKey='';
const tableWrap=document.getElementById('tableWrap');
const searchBox=document.getElementById('searchBox');
const planLabels={weekly:'أسبوعي',monthly:'شهري',five_months:'5 شهور',yearly:'سنوي',lifetime:'مدى الحياة'};

let allCustomers=[];

async function loadTable(){
  const res=await fetch('/customers');
  allCustomers=await res.json();
  renderTable();
}
function renderTable(){
  const q=searchBox.value.trim().toLowerCase();
  const list=allCustomers.filter(c=>!q||(c.cust||'').toLowerCase().includes(q));
  document.querySelector('.card:last-child .row div').textContent = '📋 سجل المفاتيح (' + allCustomers.length + ' مفتاح)';
  if(!list.length){ tableWrap.innerHTML='<div class="empty">لسه مفيش مفاتيح متولدة</div>'; return; }
  const now=Date.now();
  let html='<table><thead><tr><th>العميل</th><th>النوع</th><th>تاريخ الإصدار</th><th>ينتهي في</th><th>الحالة</th><th></th></tr></thead><tbody>';
  list.slice().reverse().forEach(c=>{
    const expired = c.exp < now;
    const expDate = c.plan==='lifetime' ? 'مدى الحياة' : new Date(c.exp).toLocaleDateString('ar-EG');
    html += '<tr><td>'+(c.cust||'—')+'</td><td>'+planLabels[c.plan]+'</td><td>'+new Date(c.iat).toLocaleDateString('ar-EG')+'</td><td>'+expDate+'</td>'
      +'<td><span class="badge '+(expired?'expired':'active')+'">'+(expired?'منتهي':'نشط')+'</span></td>'
      +'<td><button class="mini" onclick="copyKey(\\''+c.key+'\\')">نسخ المفتاح</button></td></tr>';
  });
  html+='</tbody></table>';
  tableWrap.innerHTML=html;
}
function copyKey(k){ navigator.clipboard.writeText(k); alert('✅ اتنسخ المفتاح'); }
searchBox.oninput=renderTable;

genBtn.onclick=async()=>{
  errBox.classList.remove('show');
  resultBox.classList.remove('show');
  genBtn.disabled=true;genBtn.textContent='جاري التوليد...';
  try{
    const res=await fetch('/generate',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({plan:planSel.value,cust:custName.value.trim()})});
    const data=await res.json();
    if(!data.ok){ errBox.textContent=data.error||'حدث خطأ'; errBox.classList.add('show'); return; }
    resultInfo.innerHTML = '<b>النوع:</b> '+planLabels[data.payload.plan]+(data.payload.cust?' — <b>العميل:</b> '+data.payload.cust:'')
      +(data.payload.plan!=='lifetime' ? ' — <b>ينتهي في:</b> '+new Date(data.payload.exp).toLocaleDateString('ar-EG') : '');
    keyText.textContent=data.key;
    lastPayload=data.payload; lastKey=data.key;
    resultBox.classList.add('show');
    custName.value='';
    loadTable();
  }catch(e){ errBox.textContent='حدث خطأ في الاتصال بالسيرفر المحلي'; errBox.classList.add('show'); }
  finally{ genBtn.disabled=false; genBtn.textContent='✨ توليد المفتاح'; }
};
copyBtn.onclick=()=>{ navigator.clipboard.writeText(keyText.textContent); copyBtn.textContent='✅ اتنسخ!'; setTimeout(()=>copyBtn.textContent='📋 نسخ المفتاح',1500); };
waBtn.onclick=()=>{
  if(!lastKey)return;
  const planName=planLabels[lastPayload.plan]||lastPayload.plan;
  const expLine = lastPayload.plan!=='lifetime'
    ? ('ينتهي في: '+new Date(lastPayload.exp).toLocaleDateString('en-GB')+'\\n')
    : '';
  const greeting = lastPayload.cust ? ('مرحباً '+lastPayload.cust+'! 🎬') : 'مرحباً بيك! 🎬';
  const msg = greeting+'\\n'
    + 'تفعيل اشتراكك في Splitora ('+planName+') جاهز.\\n\\n'
    + expLine
    + 'مفتاح التفعيل:\\n'+lastKey+'\\n\\n'
    + 'الصقيه في شاشة "تفعيل الاشتراك" داخل البرنامج.';
  window.open('https://wa.me/'+WA_NUMBER+'?text='+encodeURIComponent(msg), '_blank');
};

loadTable();
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(PAGE_HTML);
    return;
  }
  if (req.method === 'GET' && req.url === '/customers') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(loadCustomers()));
    return;
  }
  if (req.method === 'POST' && req.url === '/generate') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { plan, cust } = JSON.parse(body || '{}');
        const { key, payload } = generateKey(plan, cust);
        const list = loadCustomers();
        list.push({ ...payload, key });
        saveCustomers(list);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, key, payload }));
      } catch (e) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }
  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n✅ لوحة التحكم شغالة على: ${url}`);
  console.log('هتفتح المتصفح تلقائياً... لو مفتحش، افتحي الرابط ده يدوياً.\n');
  const opener = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  exec(`${opener} ${url}`);
});
