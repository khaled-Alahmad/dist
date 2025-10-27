# 🔧 دليل حل مشاكل الاتصال بقاعدة البيانات

## 🚨 المشكلة الأكثر شيوعاً

> **"التطبيق لا يعمل عند محاولة تشغيله محلياً أو على VPS"**

---

## ✅ الحل السريع (5 دقائق)

### الخطوة 1️⃣: تثبيت PostgreSQL

```bash
# على Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# تشغيل الخدمة
sudo systemctl start postgresql
sudo systemctl enable postgresql

# التحقق من التشغيل
sudo systemctl status postgresql
```

**✅ يجب أن ترى:** `Active: active (running)`

---

### الخطوة 2️⃣: إنشاء قاعدة البيانات والمستخدم

```bash
# الدخول إلى PostgreSQL
sudo -u postgres psql

# نفّذ هذه الأوامر واحدة تلو الأخرى:
```

في PostgreSQL shell:

```sql
-- إنشاء قاعدة البيانات
CREATE DATABASE school_management;

-- إنشاء المستخدم
CREATE USER school_admin WITH PASSWORD 'كلمة_مرور_قوية_123';

-- منح الصلاحيات الأساسية
GRANT ALL PRIVILEGES ON DATABASE school_management TO school_admin;

-- الاتصال بقاعدة البيانات
\c school_management

-- منح صلاحيات schema (مهم جداً!)
GRANT ALL ON SCHEMA public TO school_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO school_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO school_admin;

-- صلاحيات الجداول المستقبلية
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO school_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO school_admin;

-- الخروج
\q
```

---

### الخطوة 3️⃣: إنشاء ملف .env

```bash
# في جذر المشروع
cp .env.example .env

# فتح الملف للتعديل
nano .env
```

**أضف هذا المحتوى:**

```env
# قاعدة البيانات (عدّل كلمة المرور!)
DATABASE_URL=postgresql://school_admin:كلمة_مرور_قوية_123@localhost:5432/school_management

# Session Secret (ولّد واحد جديد!)
SESSION_SECRET=نص_عشوائي_طويل_64_حرف_على_الأقل_هنا

# اختياري
NODE_ENV=production
PORT=5000
TZ=Asia/Riyadh
```

**لتوليد SESSION_SECRET عشوائي:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

احفظ الملف (`Ctrl+O`, `Enter`, `Ctrl+X`)

---

### الخطوة 4️⃣: تثبيت Dependencies وإنشاء الجداول

```bash
# تثبيت المكتبات
npm install

# إنشاء جداول قاعدة البيانات
npm run db:push
```

**إذا ظهر تحذير data-loss:**

```bash
npm run db:push --force
```

---

### الخطوة 5️⃣: تشغيل التطبيق

```bash
# للتطوير
npm run dev

# للإنتاج
npm run build
npm start
```

**✅ يجب أن ترى:**

```
📊 استخدام PostgreSQL العادي (Standard)
✅ الاتصال بـ PostgreSQL ناجح!
serving on port 5000
```

**افتح المتصفح:** http://localhost:5000

---

## 🔍 حل الأخطاء الشائعة

### ❌ خطأ: "ECONNREFUSED" أو "connect ECONNREFUSED 127.0.0.1:5432"

**المعنى:** PostgreSQL لا يعمل أو غير مثبت

**الحل:**

```bash
# التحقق من الحالة
sudo systemctl status postgresql

# إذا كان متوقف
sudo systemctl start postgresql

# إذا لم يكن مثبت
sudo apt install postgresql postgresql-contrib -y
```

---

### ❌ خطأ: "password authentication failed for user"

**المعنى:** كلمة المرور أو اسم المستخدم خطأ في DATABASE_URL

**الحل:**

```bash
# إعادة تعيين كلمة المرور
sudo -u postgres psql

# في PostgreSQL:
ALTER USER school_admin WITH PASSWORD 'كلمة_مرور_جديدة';
\q

# تحديث .env
nano .env
# عدّل DATABASE_URL بكلمة المرور الجديدة
```

---

### ❌ خطأ: "database does not exist"

**المعنى:** قاعدة البيانات غير موجودة

**الحل:**

```bash
sudo -u postgres psql

# إنشاء قاعدة البيانات
CREATE DATABASE school_management;
\q
```

---

### ❌ خطأ: "role does not exist" أو "role school_admin does not exist"

**المعنى:** المستخدم غير موجود في PostgreSQL

**الحل:**

```bash
sudo -u postgres psql

CREATE USER school_admin WITH PASSWORD 'كلمة_مرور_قوية';
GRANT ALL PRIVILEGES ON DATABASE school_management TO school_admin;
\q
```

---

### ❌ خطأ: "permission denied for schema public"

**المعنى:** المستخدم ليس لديه صلاحيات على schema

**الحل:**

```bash
sudo -u postgres psql -d school_management

GRANT ALL ON SCHEMA public TO school_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO school_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO school_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO school_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO school_admin;
\q
```

---

### ❌ خطأ: "DATABASE_URL must be set"

**المعنى:** ملف .env غير موجود أو DATABASE_URL مفقود

**الحل:**

```bash
# التأكد من وجود .env في جذر المشروع
ls -la .env

# إذا لم يكن موجود
cp .env.example .env
nano .env
# أضف DATABASE_URL
```

---

### ❌ خطأ: "relation does not exist" أو "table does not exist"

**المعنى:** جداول قاعدة البيانات غير موجودة

**الحل:**

```bash
# إنشاء الجداول
npm run db:push

# إذا لم يعمل
npm run db:push --force
```

---

### ❌ خطأ: "SSL connection required" أو "no pg_hba.conf entry"

**المعنى:** إعدادات SSL أو الوصول غير صحيحة

**الحل للـ Local/VPS:**

```bash
# تعديل pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# ابحث عن السطر:
# local   all   all   peer

# غيّره إلى:
local   all   all   md5

# حفظ وإعادة تشغيل
sudo systemctl restart postgresql
```

---

## 🧪 اختبار الاتصال

### اختبار 1: من Command Line

```bash
# اختبار الاتصال المباشر
psql "postgresql://school_admin:كلمة_المرور@localhost:5432/school_management"
```

**إذا نجح الدخول:**
```sql
-- عرض الجداول
\dt

-- عرض معلومات القاعدة
\l

-- الخروج
\q
```

---

### اختبار 2: من Node.js

أنشئ ملف `test-connection.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://school_admin:كلمة_المرور@localhost:5432/school_management'
});

console.log('🔍 محاولة الاتصال...');

pool.query('SELECT NOW() as time, version() as version', (err, res) => {
  if (err) {
    console.error('\n❌ فشل الاتصال:');
    console.error('   الخطأ:', err.message);
    console.error('   الكود:', err.code);
  } else {
    console.log('\n✅ الاتصال ناجح!');
    console.log('   الوقت:', res.rows[0].time);
    console.log('   النسخة:', res.rows[0].version);
  }
  pool.end();
});
```

تشغيل:

```bash
node test-connection.js
```

---

## 📋 Checklist التشخيص الكامل

قبل طلب المساعدة، تأكد من:

- [ ] ✅ PostgreSQL مثبت: `psql --version`
- [ ] ✅ PostgreSQL يعمل: `sudo systemctl status postgresql`
- [ ] ✅ قاعدة البيانات موجودة: `sudo -u postgres psql -l | grep school_management`
- [ ] ✅ المستخدم موجود: `sudo -u postgres psql -c "\du" | grep school_admin`
- [ ] ✅ ملف .env موجود في جذر المشروع
- [ ] ✅ DATABASE_URL صحيح في .env
- [ ] ✅ SESSION_SECRET موجود في .env
- [ ] ✅ تم تشغيل `npm install`
- [ ] ✅ تم تشغيل `npm run db:push`
- [ ] ✅ لا توجد أخطاء عند تشغيل `npm run dev`

---

## 🔧 أدوات تشخيص مفيدة

### فحص حالة PostgreSQL:

```bash
sudo systemctl status postgresql
sudo journalctl -u postgresql -n 50
```

### فحص اللوغات:

```bash
# لوغات PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*-main.log

# لوغات التطبيق
npm run dev 2>&1 | tee app.log
```

### فحص المنفذ:

```bash
# التحقق من أن PostgreSQL يستمع على المنفذ 5432
sudo netstat -tlnp | grep 5432
# أو
sudo ss -tlnp | grep 5432
```

---

## 🌐 على VPS (إعدادات إضافية)

### 1. Firewall (جدار الحماية):

```bash
# السماح بالوصول للتطبيق من الخارج
sudo ufw allow 3001/tcp

# لا تفتح منفذ PostgreSQL (5432) للعامة - خطر أمني!
```

### 2. Nginx (Reverse Proxy):

راجع ملف `nginx.conf.example` للإعداد الكامل

### 3. PM2 (إدارة العملية):

```bash
# تثبيت PM2
npm install -g pm2

# تشغيل التطبيق
pm2 start ecosystem.config.cjs

# مراقبة
pm2 monit

# اللوغات
pm2 logs
```

---

## 💡 نصائح مهمة

### 1. أمان كلمات المرور:

```bash
# استخدم كلمات مرور قوية (16+ حرف)
# لا تستخدم: 123, admin, password
# استخدم: كلمات معقدة بأرقام ورموز
```

### 2. النسخ الاحتياطي:

```bash
# نسخ احتياطي يدوي
sudo -u postgres pg_dump school_management > backup_$(date +%Y%m%d).sql

# استخدم السكريبت الجاهز
bash backup-db.sh
```

### 3. المراقبة:

```bash
# مراقبة استخدام الموارد
htop

# مراقبة PostgreSQL
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

---

## 📞 طلب المساعدة

إذا جربت كل شيء ولم يعمل، قدم هذه المعلومات:

```bash
# معلومات النظام
uname -a
lsb_release -a

# نسخة PostgreSQL
psql --version

# حالة الخدمة
sudo systemctl status postgresql

# آخر 20 سطر من اللوغ
sudo tail -20 /var/log/postgresql/postgresql-*-main.log

# محاولة اتصال
psql "postgresql://school_admin:pass@localhost:5432/school_management" -c "SELECT version();"
```

---

## 📚 ملفات مساعدة أخرى

- **AI_SETUP_ARABIC.txt** - دليل التنصيب السريع
- **DATABASE_CONNECTION_GUIDE.md** - دليل الاتصال الشامل
- **VPS_DEPLOYMENT_GUIDE_AR.md** - دليل النشر على VPS
- **.env.example** - نموذج ملف البيئة

---

**آخر تحديث:** 27 يناير 2025  
**الحالة:** ✅ شامل ومُختبر
