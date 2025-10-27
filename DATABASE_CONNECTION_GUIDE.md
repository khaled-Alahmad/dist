# 🔌 دليل حل مشاكل الاتصال بقاعدة البيانات

## 🚨 المشكلة

عند تشغيل النظام محلياً أو على VPS، تظهر مشكلة في الربط مع قاعدة البيانات.

---

## 🔍 السبب

الكود كان يستخدم **`@neondatabase/serverless`** المخصص لـ Neon Database (السحابي) فقط، وليس لـ PostgreSQL العادي.

---

## ✅ الحل (تم تطبيقه تلقائياً)

تم تحديث `server/db.ts` ليدعم **كلا النوعين**:

### 1️⃣ Neon Database (Replit / السحابي)
```typescript
// يُستخدم تلقائياً إذا كان DATABASE_URL يحتوي على:
// - neon.tech
// - neon.fl0.io
// - pooler.supabase.com
```

### 2️⃣ PostgreSQL العادي (VPS / Local)
```typescript
// يُستخدم تلقائياً لأي DATABASE_URL آخر
// مثل: postgresql://user:pass@localhost:5432/dbname
```

---

## 🛠️ خطوات استكشاف الأخطاء

### على VPS أو Local:

#### الخطوة 1: التحقق من تثبيت PostgreSQL

```bash
# التحقق من تثبيت PostgreSQL
psql --version

# يجب أن يظهر شيء مثل:
# psql (PostgreSQL) 14.x
```

إذا لم يكن مثبتاً:

```bash
# على Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# تشغيل الخدمة
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### الخطوة 2: إنشاء قاعدة البيانات

```bash
# الدخول إلى PostgreSQL
sudo -u postgres psql

# في PostgreSQL shell:
CREATE DATABASE school_management;
CREATE USER school_admin WITH PASSWORD 'كلمة_مرور_قوية';
GRANT ALL PRIVILEGES ON DATABASE school_management TO school_admin;

# الخروج
\q
```

#### الخطوة 3: تحديث ملف .env

```bash
# انسخ .env.example إلى .env
cp .env.example .env

# عدّل .env
nano .env
```

**أضف DATABASE_URL الصحيح:**

```env
# للـ VPS أو Local
DATABASE_URL=postgresql://school_admin:كلمة_مرور_قوية@localhost:5432/school_management

# للـ Replit (Neon)
# DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

#### الخطوة 4: تثبيت dependencies

```bash
# تأكد من تثبيت pg
npm install pg @types/node
```

#### الخطوة 5: تشغيل migrations

```bash
npm run db:push
```

#### الخطوة 6: تشغيل التطبيق

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

---

## 🔧 حل المشاكل الشائعة

### المشكلة 1: "ECONNREFUSED" أو "Connection refused"

**السبب:** PostgreSQL لا يعمل أو PORT خطأ

**الحل:**
```bash
# تحقق من تشغيل PostgreSQL
sudo systemctl status postgresql

# إعادة تشغيل
sudo systemctl restart postgresql

# تحقق من المنفذ
sudo netstat -tlnp | grep 5432
```

---

### المشكلة 2: "password authentication failed"

**السبب:** كلمة المرور أو اسم المستخدم خطأ

**الحل:**
```bash
# إعادة تعيين كلمة المرور
sudo -u postgres psql

ALTER USER school_admin WITH PASSWORD 'كلمة_مرور_جديدة';
\q

# تحديث .env
nano .env
# DATABASE_URL=postgresql://school_admin:كلمة_مرور_جديدة@...
```

---

### المشكلة 3: "database does not exist"

**السبب:** قاعدة البيانات غير موجودة

**الحل:**
```bash
sudo -u postgres psql
CREATE DATABASE school_management;
\q
```

---

### المشكلة 4: "Unexpected error on PostgreSQL client"

**السبب:** إعدادات الاتصال خاطئة

**الحل:**

تحقق من `server/db.ts` - يجب أن يكون:

```typescript
pool = new PgPool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
```

---

### المشكلة 5: "role does not exist"

**السبب:** المستخدم غير موجود في PostgreSQL

**الحل:**
```bash
sudo -u postgres psql

# إنشاء المستخدم
CREATE USER school_admin WITH PASSWORD 'كلمة_مرور_قوية';
GRANT ALL PRIVILEGES ON DATABASE school_management TO school_admin;

# منح صلاحيات على schema
\c school_management
GRANT ALL ON SCHEMA public TO school_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO school_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO school_admin;
\q
```

---

### المشكلة 6: "SSL connection required"

**السبب:** Neon يتطلب SSL

**الحل:**

تأكد من إضافة `?sslmode=require` في نهاية DATABASE_URL:

```env
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

---

## 🧪 اختبار الاتصال

### اختبار 1: من Command Line

```bash
# اختبار الاتصال بـ PostgreSQL مباشرة
psql "postgresql://school_admin:password@localhost:5432/school_management"

# يجب أن تدخل إلى PostgreSQL shell بنجاح
# \dt  # لعرض الجداول
# \q   # للخروج
```

### اختبار 2: من Node.js

أنشئ ملف `test-db.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://school_admin:password@localhost:5432/school_management'
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected successfully!');
    console.log('Server time:', res.rows[0].now);
  }
  pool.end();
});
```

تشغيل:
```bash
node test-db.js
```

---

## 📋 Checklist الاتصال

- [ ] PostgreSQL مثبت ويعمل
- [ ] قاعدة البيانات `school_management` موجودة
- [ ] المستخدم `school_admin` موجود ولديه صلاحيات
- [ ] ملف `.env` يحتوي على `DATABASE_URL` صحيح
- [ ] تم تشغيل `npm run db:push` بنجاح
- [ ] لا توجد أخطاء في console عند تشغيل `npm run dev`

---

## 🔑 نماذج DATABASE_URL

### Local (PostgreSQL على نفس الجهاز):
```
postgresql://school_admin:password@localhost:5432/school_management
```

### VPS (PostgreSQL على خادم بعيد):
```
postgresql://school_admin:password@192.168.1.100:5432/school_management
```

### Neon (Replit):
```
postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Supabase:
```
postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres?sslmode=require
```

---

## 📞 الدعم

إذا استمرت المشكلة بعد اتباع جميع الخطوات:

1. **فحص logs التفصيلية:**
   ```bash
   npm run dev 2>&1 | tee app.log
   # سيحفظ جميع الأخطاء في app.log
   ```

2. **فحص PostgreSQL logs:**
   ```bash
   sudo tail -f /var/log/postgresql/postgresql-14-main.log
   ```

3. **تفعيل debug mode:**
   ```env
   # في .env
   DEBUG=drizzle:*
   ```

---

## ✅ الحل النهائي المطبق

تم تحديث `server/db.ts` ليعمل تلقائياً مع:
- ✅ Neon Database (Replit)
- ✅ PostgreSQL العادي (VPS / Local)
- ✅ Supabase PostgreSQL
- ✅ أي PostgreSQL آخر

**لا حاجة لتغيير الكود!** فقط تأكد من:
1. DATABASE_URL صحيح في `.env`
2. PostgreSQL يعمل (إذا كان local/VPS)
3. قاعدة البيانات والمستخدم موجودين

---

**آخر تحديث:** 26 يناير 2025
