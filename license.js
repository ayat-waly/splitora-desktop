/* Splitora Desktop — License & Trial module
   يتحقق من مفاتيح الترخيص الموقّعة رقمياً، وبيدير الفترة التجريبية (7 أيام).
   ملاحظة أمان: التحقق كله محلي (offline) بدون سيرفر. ده بيمنع تصنيع مفاتيح
   مزوّرة (محتاج المفتاح الخاص اللي مش موجود جوه البرنامج)، لكن الفترة
   التجريبية نفسها ممكن تتلاعب فيها بتغيير ساعة الجهاز أو مسح ملف البيانات —
   حماية كاملة 100% محتاجة سيرفر تحقق دوري لاحقاً. */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const TRIAL_DAYS = 7;

// المفتاح العام بس — التوقيع الفعلي بيتم بالمفتاح الخاص اللي مش موجود هنا أبداً
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAKOnKh/2rPCpJBulhGdP8REPr7+3riRaepP2jTr0p1mA=
-----END PUBLIC KEY-----`;

const PUBLIC_KEY = crypto.createPublicKey(PUBLIC_KEY_PEM);

function b64u(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64u(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

/** يتحقق من صحة توقيع مفتاح الترخيص ويرجع بياناته لو صح */
function verifyKey(keyStr) {
  try {
    const parts = String(keyStr || '').trim().split('.');
    if (parts.length !== 2) return { valid: false, reason: 'format' };
    const [payloadB64, sigB64] = parts;
    const payloadBuf = unb64u(payloadB64);
    const sig = unb64u(sigB64);
    const ok = crypto.verify(null, payloadBuf, PUBLIC_KEY, sig);
    if (!ok) return { valid: false, reason: 'signature' };
    const payload = JSON.parse(payloadBuf.toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return { valid: false, reason: 'expired', payload };
    return { valid: true, payload };
  } catch (_e) {
    return { valid: false, reason: 'malformed' };
  }
}

function userDataDir() {
  // main.js بيمرر app.getPath('userData') عند التشغيل الأول (تفادي require('electron') هنا)
  return module.exports._userDataDir;
}

function licenseFile() { return path.join(userDataDir(), 'splitora.lic'); }
// اسم مموّه لملف بداية الفترة التجريبية (مش اسم واضح زي trial.json)
function trialFile() { return path.join(userDataDir(), '.sp_state'); }

function loadStoredLicense() {
  try {
    const raw = fs.readFileSync(licenseFile(), 'utf8');
    const res = verifyKey(raw);
    return res.valid ? res.payload : null;
  } catch (_e) { return null; }
}

function readTrialStart() {
  try {
    const raw = fs.readFileSync(trialFile(), 'utf8');
    const n = parseInt(Buffer.from(raw, 'base64').toString('utf8'), 10);
    if (Number.isFinite(n) && n > 0) return n;
  } catch (_e) { /* not found yet */ }
  return null;
}

function writeTrialStart(ts) {
  try {
    fs.mkdirSync(userDataDir(), { recursive: true });
    fs.writeFileSync(trialFile(), Buffer.from(String(ts)).toString('base64'));
  } catch (_e) { /* ignore */ }
}

/** يرجع حالة الترخيص الحالية: licensed / trial / locked */
function getStatus() {
  const lic = loadStoredLicense();
  if (lic) {
    return { mode: 'licensed', plan: lic.plan, watermark: false, daysLeft: null, expiresAt: lic.exp };
  }

  let start = readTrialStart();
  if (!start) { start = Date.now(); writeTrialStart(start); }

  const daysUsed = (Date.now() - start) / 86400000;
  if (daysUsed < 0) {
    // الساعة اترجعت للخلف — تعامل معاها كأول يوم بدل ما تدي تجربة أطول
    return { mode: 'trial', watermark: true, daysLeft: TRIAL_DAYS, plan: null };
  }
  if (daysUsed <= TRIAL_DAYS) {
    return { mode: 'trial', watermark: true, daysLeft: Math.max(0, Math.ceil(TRIAL_DAYS - daysUsed)), plan: null };
  }
  return { mode: 'locked', watermark: true, daysLeft: 0, plan: null };
}

/** يفعّل مفتاح جديد بعد التحقق من صحته */
function activate(keyStr) {
  const res = verifyKey(keyStr);
  if (!res.valid) return { ok: false, reason: res.reason };
  try {
    fs.mkdirSync(userDataDir(), { recursive: true });
    fs.writeFileSync(licenseFile(), String(keyStr).trim());
  } catch (e) {
    return { ok: false, reason: 'write_failed' };
  }
  return { ok: true, plan: res.payload.plan, expiresAt: res.payload.exp };
}

function init(userDataPath) {
  module.exports._userDataDir = userDataPath;
}

module.exports = { init, getStatus, activate, verifyKey, TRIAL_DAYS };
