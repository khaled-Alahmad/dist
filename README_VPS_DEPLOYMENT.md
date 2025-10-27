# 🎓 نظام إدارة المدرسة - School Management System

نظام إدارة مدرسي شامل عربي من الألف إلى الياء، مُصمم خصيصاً للمدارس العربية.

---

## 📋 نظرة عامة

نظام full-stack متكامل لإدارة المدارس يشمل:
- ✅ إدارة الطلاب والمعلمين
- ✅ نظام حضور وغياب كامل
- ✅ إدارة العلامات والتقارير
- ✅ النظام المالي (رسوم، رواتب، مصروفات)
- ✅ 3 أنواع مستخدمين: إدارة، معلمين، أهالي
- ✅ واجهة عربية RTL بالكامل
- ✅ تصميم glass-morphism حديث
- ✅ Dark mode كامل

---

## 🛠️ التقنيات المستخدمة

### Frontend:
- React 18 + TypeScript
- Vite (Build tool)
- TailwindCSS + Shadcn/ui
- TanStack Query (State management)
- Wouter (Routing)

### Backend:
- Express.js + TypeScript
- PostgreSQL (Database)
- Drizzle ORM
- Passport.js (Authentication)
- Express Session

---

## 📦 البنية الأساسية

```
school-management/
├── client/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/  # UI Components
│   │   ├── pages/       # Pages
│   │   └── lib/         # Utilities
│   └── index.html
├── server/              # Backend (Express)
│   ├── index.ts         # Main server file
│   ├── routes.ts        # API routes
│   ├── auth.ts          # Authentication
│   └── storage.ts       # Database operations
├── shared/              # Shared types
│   └── schema.ts        # Database schema
├── dist/                # Built files (بعد npm run build)
│   ├── index.js         # Backend المُبني
│   └── public/          # Frontend المُبني
└── attached_assets/     # Media files
```

---

## 🚀 التثبيت والتشغيل المحلي

### 1. تثبيت المتطلبات:
```bash
# Node.js 20+
node --version  # يجب أن تكون v20.x.x

# PostgreSQL
psql --version
```

### 2. تثبيت الحزم:
```bash
npm install
```

### 3. إعداد قاعدة البيانات:
```bash
# إنشاء قاعدة البيانات في PostgreSQL
createdb school_management

# أو:
sudo -u postgres psql
CREATE DATABASE school_management;
\q
```

### 4. تهيئة البيئة:
```bash
# انسخ .env.example إلى .env
cp .env.example .env

# عدّل .env وأضف:
# - DATABASE_URL
# - SESSION_SECRET
```

### 5. تشغيل Migrations:
```bash
npm run db:push
```

### 6. تشغيل التطبيق:
```bash
# Development mode
npm run dev

# Production mode (بعد البناء)
npm run build
npm start
```

افتح المتصفح: `http://localhost:5000`

---

## 📚 دليل النشر على VPS

### الملفات المهمة للنشر:

1. **VPS_DEPLOYMENT_GUIDE_AR.md** - دليل شامل بالعربية (خطوة بخطوة)
2. **VPS_DEPLOYMENT_CHECKLIST.md** - قائمة تحقق كاملة
3. **ecosystem.config.cjs** - تهيئة PM2 جاهزة
4. **nginx.conf.example** - تهيئة Nginx جاهزة
5. **update.sh** - سكريبت التحديث التلقائي
6. **backup-db.sh** - سكريبت النسخ الاحتياطي

### خطوات سريعة للنشر:

```bash
# 1. على VPS: تثبيت المتطلبات
apt update && apt upgrade -y
# Node.js, PostgreSQL, PM2, Nginx

# 2. رفع الكود
git clone <your-repo> /home/admin/school-app
cd /home/admin/school-app

# 3. التهيئة
cp .env.example .env
nano .env  # عدّل القيم

# 4. البناء
npm install --production=false
npm run build

# 5. قاعدة البيانات
npm run db:push

# 6. التشغيل
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup

# 7. Nginx
# انسخ nginx.conf.example وعدّل الدومين
# اتبع الدليل الكامل في VPS_DEPLOYMENT_GUIDE_AR.md
```

**للتفاصيل الكاملة:** راجع **VPS_DEPLOYMENT_GUIDE_AR.md**

---

## 👥 أنواع المستخدمين

### 1. الإدارة (Admin):
- وصول كامل لجميع الميزات
- إدارة المستخدمين والمراحل الدراسية
- عرض جميع التقارير والإحصائيات

### 2. المعلمين (Teachers):
- إضافة العلامات للطلاب في موادهم فقط
- عرض الصفوف المخصصة لهم
- عرض حضور الطلاب

### 3. الأهالي (Parents):
- عرض تقارير أبنائهم فقط
- عرض العلامات والحضور
- عرض المعلومات المالية

---

## 🔐 الأمان

- ✅ تشفير كلمات المرور (scrypt)
- ✅ Session-based authentication
- ✅ Role-based access control (RBAC)
- ✅ SQL injection protection (Drizzle ORM)
- ✅ XSS protection
- ✅ CSRF protection (Express session)
- ✅ HTTPS ready

---

## 📊 الميزات الرئيسية

### إدارة الطلاب:
- تسجيل طالب جديد مع جميع البيانات
- ربط بالصف والمرحلة الدراسية
- تتبع الحالة (نشط، منسحب، منقول)
- حذف cascade لجميع البيانات المرتبطة

### نظام الحضور:
- تبويبين: حضور الطلاب + حضور المعلمين
- 4 حالات للطلاب: حاضر، غائب، متأخر، غياب بعذر
- 5 حالات للمعلمين: حاضر، غائب، إجازة مدفوعة، إجازة غير مدفوعة، إجازة مرضية
- إحصائيات لحظية
- تسجيل يومي لأي تاريخ

### النظام المالي:
- دعم 3 عملات: SAR, EGP, AED
- تتبع رسوم الطلاب والدفعات
- رواتب المعلمين مع خصومات تلقائية
- سلف المعلمين
- مصروفات المدرسة
- تقارير مالية شاملة

### العلامات والتقارير:
- تسجيل العلامات حسب المواد
- توليد PDF للشهادات
- عرض متوسط الطالب

---

## 🛠️ أوامر مهمة

```bash
# Development
npm run dev           # تشغيل في وضع التطوير

# Build
npm run build         # بناء للإنتاج
npm run check         # فحص TypeScript

# Database
npm run db:push       # تشغيل migrations

# Production
npm start             # تشغيل في الإنتاج (بعد build)
```

---

## 📄 Scripts للـ VPS

### تحديث التطبيق:
```bash
./update.sh
```

### نسخ احتياطي للقاعدة:
```bash
./backup-db.sh
```

### إدارة PM2:
```bash
pm2 list              # عرض جميع التطبيقات
pm2 logs              # عرض السجلات
pm2 restart           # إعادة التشغيل
pm2 monit             # مراقبة الأداء
```

---

## 🐛 حل المشاكل

### المشكلة: التطبيق لا يعمل
```bash
pm2 logs school-management --err
pm2 restart school-management
```

### المشكلة: خطأ في قاعدة البيانات
```bash
# التحقق من PostgreSQL
systemctl status postgresql

# فحص الاتصال
psql -d school_management -c "SELECT 1;"
```

### المشكلة: 502 Bad Gateway
```bash
# التحقق من PM2
pm2 status

# فحص Nginx
nginx -t
systemctl restart nginx
```

---

## 📞 الدعم

للمزيد من المعلومات، راجع:
- **VPS_DEPLOYMENT_GUIDE_AR.md** - دليل النشر الشامل
- **VPS_DEPLOYMENT_CHECKLIST.md** - قائمة التحقق
- **DEPLOYMENT_GUIDE.md** - دليل Replit (إن وُجد)

---

## 📝 الرخصة

MIT License

---

## 🎯 الحالة

✅ **جاهز للإنتاج!**

التطبيق مُختبر بالكامل ويعمل بنجاح على:
- ✅ Replit (Development & Testing)
- ✅ VPS (Production-ready)

---

**آخر تحديث:** 26 يناير 2025
