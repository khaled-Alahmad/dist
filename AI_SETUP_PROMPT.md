# 🤖 AI Setup Prompt - نظام إدارة المدرسة

استخدم هذه الرسالة لتوجيه أي AI لتنصيب المشروع محلياً أو على VPS:

---

## 📋 الرسالة الكاملة للـ AI

```
أريدك أن تقوم بتنصيب وتشغيل نظام إدارة المدرسة هذا (School Management System).

## معلومات المشروع:
- النوع: Full-stack JavaScript (React + Express + PostgreSQL)
- Build Tool: Vite
- ORM: Drizzle
- Database: PostgreSQL (يدعم Neon Serverless و PostgreSQL العادي تلقائياً)

## خطوات التنصيب المطلوبة:

### 1. تحديد البيئة والقاعدة:

البرنامج يتعرف تلقائياً على نوع قاعدة البيانات من DATABASE_URL:
- إذا كان DATABASE_URL يحتوي على "neon.tech" أو "pooler.supabase.com" → سيستخدم Neon Serverless
- إذا كان أي شيء آخر → سيستخدم PostgreSQL العادي (VPS/Local)

### 2. إعداد PostgreSQL (للـ VPS أو Local):

إذا كان التنصيب على VPS أو Local، قم بالتالي:

```bash
# تثبيت PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# إنشاء قاعدة البيانات والمستخدم
sudo -u postgres psql << 'SQLEOF'
CREATE DATABASE school_management;
CREATE USER school_admin WITH PASSWORD 'StrongPassword123!@#';
GRANT ALL PRIVILEGES ON DATABASE school_management TO school_admin;
\c school_management
GRANT ALL ON SCHEMA public TO school_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO school_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO school_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO school_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO school_admin;
SQLEOF
```

### 3. تهيئة ملف البيئة (.env):

```bash
# نسخ ملف البيئة النموذجي
cp .env.example .env

# محتوى .env يجب أن يكون:
cat > .env << 'EOF'
# للـ VPS/Local:
DATABASE_URL=postgresql://school_admin:StrongPassword123!@#@localhost:5432/school_management

# للـ Neon/Replit (إذا كان متوفراً):
# DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require

# Session Secret (ولّد واحد جديد):
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# اختياري:
NODE_ENV=production
PORT=5000
TZ=Asia/Riyadh
EOF
```

### 4. تثبيت Dependencies:

```bash
npm install
```

ملاحظة: المشروع يحتوي على:
- `@neondatabase/serverless` - للـ Neon Database
- `pg` - للـ PostgreSQL العادي
- كلاهما موجود ويعمل تلقائياً حسب DATABASE_URL

### 5. إنشاء جداول قاعدة البيانات:

```bash
npm run db:push
```

إذا ظهر تحذير data-loss، استخدم:
```bash
npm run db:push --force
```

### 6. تشغيل التطبيق:

للتطوير:
```bash
npm run dev
```

للإنتاج (بعد البناء):
```bash
npm run build
npm start
```

### 7. التحقق من النجاح:

عند التشغيل، يجب أن ترى في console:
- للـ Neon: "📊 Using Neon Serverless Database"
- للـ PostgreSQL: "📊 Using Standard PostgreSQL Database"
- ثم: "serving on port 5000"

افتح المتصفح على: http://localhost:5000

### 8. بيانات الدخول الافتراضية:

بعد أول تشغيل، استخدم:
- Username: admin
- Password: (موجود في ADMIN_CREDENTIALS.txt)

## استكشاف الأخطاء:

### خطأ "ECONNREFUSED":
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### خطأ "password authentication failed":
```bash
sudo -u postgres psql
ALTER USER school_admin WITH PASSWORD 'StrongPassword123!@#';
\q
```

### خطأ "database does not exist":
```bash
sudo -u postgres psql
CREATE DATABASE school_management;
\q
```

### خطأ "permission denied for schema public":
```bash
sudo -u postgres psql -d school_management
GRANT ALL ON SCHEMA public TO school_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO school_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO school_admin;
\q
```

## ملفات مرجعية (إذا احتجتها):

- VPS_DEPLOYMENT_GUIDE_AR.md - دليل النشر الكامل
- DATABASE_CONNECTION_GUIDE.md - حل مشاكل قاعدة البيانات
- .env.example - نموذج متغيرات البيئة

## ملاحظات مهمة:

1. ✅ لا تحتاج لتغيير أي كود - التطبيق يكتشف نوع القاعدة تلقائياً
2. ✅ SESSION_SECRET يجب أن يكون عشوائي (64 حرف)
3. ✅ على VPS: غيّر PORT إلى 3001 واستخدم Nginx كـ reverse proxy
4. ✅ تأكد من أن PostgreSQL يعمل قبل تشغيل التطبيق
5. ✅ استخدم كلمة مرور قوية لقاعدة البيانات

## النتيجة المتوقعة:

بعد إكمال هذه الخطوات، التطبيق يجب أن يعمل على:
- http://localhost:5000 (Local)
- أو https://yourdomain.com (VPS مع Nginx)

قم بتنفيذ الخطوات بالترتيب وأخبرني بأي أخطاء تواجهها.
```

---

## 📝 كيفية الاستخدام

انسخ النص بين علامات `` ``` `` والصقه مباشرة للـ AI.
