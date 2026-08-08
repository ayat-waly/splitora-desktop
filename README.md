<div dir="rtl">

# 🎬 Splitora Desktop

نسخة الديسك توب من **Splitora** — أداة تقسيم الفيديوهات الاحترافية.

- ⚡ محرك FFmpeg **الأصلي** مدمج داخل البرنامج — أسرع 5-10 مرات من نسخة المتصفح
- 📦 **بدون أي تحميل إضافي** — كل حاجة جوه البرنامج
- 🌐 يشتغل **بدون إنترنت** تماماً
- 🎬 أي حجم فيديو — حتى عشرات الجيجا
- 🔒 ملفاتك لا تغادر جهازك أبداً
- 📱 دعم تحويل الريلز (9:16) وخيارات الجودة (أصلية / 1080p / 720p)
- 🇪🇬 عربي RTL + English

---

## 🚀 خطوات الرفع والبناء (مرة واحدة، ~10 دقائق)

### الخطوة 1: إنشاء مستودع على GitHub

1. افتحي [github.com/new](https://github.com/new)
2. اكتبي اسم المستودع: `splitora-desktop`
3. اختاري **Private** (خاص) أو Public — الاتنين شغالين
4. اضغطي **Create repository**

### الخطوة 2: رفع الملفات

**الطريقة السهلة (من المتصفح، بدون أي أدوات):**

1. في صفحة المستودع الجديد اضغطي **uploading an existing file**
2. اسحبي **كل محتويات** مجلد `splitora-desktop` (مش المجلد نفسه — اللي جواه)
3. ⚠️ **مهم:** مجلد `.github` بيكون مخفي — تأكدي إنه اترفع. لو الرفع من المتصفح ما بيظهروش، استخدمي طريقة Git تحت
4. اضغطي **Commit changes**

**أو بطريقة Git (لو مثبت عندك):**

```bash
cd splitora-desktop
git init
git add .
git commit -m "Splitora Desktop v1.0"
git branch -M main
git remote add origin https://github.com/USERNAME/splitora-desktop.git
git push -u origin main
```

(استبدلي `USERNAME` باسم حسابك)

### الخطوة 3: بناء ملف الـ exe (تلقائي ومجاني)

1. افتحي المستودع على GitHub واضغطي تبويب **Actions**
2. لو ظهرت رسالة تفعيل، اضغطي **I understand my workflows, enable them**
3. من القائمة الجانبية اختاري **Build Splitora Desktop**
4. اضغطي زر **Run workflow** ← ثم **Run workflow** الأخضر
5. استني ~10 دقائق ☕
6. لما يخلص (علامة ✅ خضراء)، افتحي الـ run واسحبي لتحت لقسم **Artifacts**:
   - `Splitora-Windows` ← فيه **Splitora-Setup-1.0.0.exe** 🪟
   - `Splitora-macOS` ← فيه ملف **.dmg** 🍎
   - `Splitora-Linux` ← فيه ملف **.AppImage** 🐧

### الخطوة 4 (اختيارية): إصدار رسمي للتوزيع

عشان تعملي صفحة تحميل رسمية بروابط مباشرة:

```bash
git tag v1.0.0
git push origin v1.0.0
```

هيتبني تلقائياً ويظهر في تبويب **Releases** — تقدري تشاركي رابط التحميل مع أي حد.

---

## 🧪 تشغيل نسخة التطوير محلياً (اختياري)

لو عايزة تجربي قبل البناء (محتاج Node.js 18+):

```bash
cd splitora-desktop
npm install
npm start
```

---

## 🛠️ ملاحظات تقنية

| البند | التفاصيل |
|---|---|
| الواجهة | Electron + نفس واجهة Splitora الويب (عربي RTL) |
| المعالجة | FFmpeg أصلي عبر `ffmpeg-static` + `ffprobe-static` |
| التقسيم | أمر segment واحد للفيديو كله — أقصى سرعة |
| تحذير Windows | أول تشغيل هيظهر تحذير SmartScreen لأن البرنامج غير موقّع رقمياً (التوقيع بفلوس) — اضغطي **More info ← Run anyway**. ده طبيعي لكل البرامج المجانية غير الموقعة |
| حجم البرنامج | ~90-110 ميجا (Electron + FFmpeg مدمجين) |

</div>
