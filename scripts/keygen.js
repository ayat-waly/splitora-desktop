#!/usr/bin/env node
/*
  Splitora — مولّد مفاتيح الترخيص
  =================================
  ده سكريبت تشغّليه إنتي بنفسك على جهازك (مش جوه البرنامج، ومش بيترفع
  للعميل أبداً). بيستخدم المفتاح الخاص (private-key.pem) اللي عندك بس
  لتوقيع مفاتيح تراخيص صحيحة.

  الاستخدام:
    node scripts/keygen.js <weekly|monthly|five_months|yearly|lifetime> ["اسم العميل (اختياري)"]

  أمثلة:
    node scripts/keygen.js monthly
    node scripts/keygen.js yearly "Ahmed Studio"
    node scripts/keygen.js lifetime

  ⚠️ مهم جداً: ملف private-key.pem محتاج يكون في نفس المجلد اللي بتشغّلي
  منه السكريبت (أو غيّري المسار PRIVATE_KEY_PATH تحت). ده الملف اللي بيقدر
  يصنع مفاتيح صحيحة — لو اتسرب لحد، هيقدر يعمل تراخيص وهمية لبرنامجك.
  متحطيهوش في أي مستودع GitHub عام أو خاص، واحتفظي بنسخة احتياطية منه في
  مكان آمن (تشفير/باسورد مدير كلمات السر).
*/

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PRIVATE_KEY_PATH = path.join(__dirname, 'private-key.pem');

const PLAN_DAYS = {
  weekly: 7,
  monthly: 30,
  five_months: 150,
  yearly: 365,
  lifetime: 365 * 100, // 100 سنة تقريباً = مدى الحياة عملياً
};

function b64u(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function main() {
  const plan = process.argv[2];
  const customer = process.argv[3] || '';

  if (!PLAN_DAYS[plan]) {
    console.error('❌ استخدمي: node scripts/keygen.js <weekly|monthly|five_months|yearly|lifetime> ["اسم العميل"]');
    process.exit(1);
  }

  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    console.error('❌ مش لاقي ملف private-key.pem في مجلد scripts/');
    console.error('   حطيه في نفس المجلد ده أول ما تستخدمي السكريبت.');
    process.exit(1);
  }

  const privateKey = crypto.createPrivateKey(fs.readFileSync(PRIVATE_KEY_PATH));

  const now = Date.now();
  const days = PLAN_DAYS[plan];
  const payload = {
    id: crypto.randomBytes(4).toString('hex'),
    plan,
    cust: customer,
    iat: now,
    exp: now + days * 86400000,
  };

  const payloadBuf = Buffer.from(JSON.stringify(payload));
  const sig = crypto.sign(null, payloadBuf, privateKey);
  const key = b64u(payloadBuf) + '.' + b64u(sig);

  console.log('\n✅ تم توليد المفتاح بنجاح\n');
  console.log('النوع:      ', plan);
  if (customer) console.log('العميل:     ', customer);
  console.log('ينتهي في:   ', new Date(payload.exp).toLocaleDateString('ar-EG'));
  console.log('\n' + '─'.repeat(60));
  console.log(key);
  console.log('─'.repeat(60) + '\n');
  console.log('انسخي المفتاح ده وابعتيه للعميل — يلزقه في شاشة "تفعيل الاشتراك" في البرنامج.\n');
}

main();
