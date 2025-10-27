# 🚀 البدء السريع - نظام إدارة المدرسة

> **للمستخدمين الذين يريدون تشغيل التطبيق بسرعة على VPS أو جهاز محلي**

---

## ⚡ التنصيب في 5 دقائق

### المتطلبات:
- Ubuntu/Debian Linux
- Node.js 18+ و npm
- صلاحيات sudo

---

### 🎯 الخطوات (نفّذها بالترتيب):

```bash
# ────────────────────────────────────────────────────────
# 1️⃣ تثبيت PostgreSQL
# ────────────────────────────────────────────────────────
sudo apt update && sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql && sudo systemctl enable postgresql

# ────────────────────────────────────────────────────────
# 2️⃣ إنشاء قاعدة البيانات (نفّذ كل الأوامر مرة واحدة)
# ────────────────────────────────────────────────────────
sudo -u postgres psql << 'EOFDB'
CREATE DATABASE school_management;
CREATE USER school_admin WITH PASSWORD 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON DATABASE school_management TO school_admin;
\c school_management
GRANT ALL ON SCHEMA public TO school_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO school_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO school_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO school_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO school_admin;
EOFDB

# ────────────────────────────────────────────────────────
# 3️⃣ إنشاء ملف .env
# ────────────────────────────────────────────────────────
cp .env.example .env

# توليد SESSION_SECRET تلقائياً وكتابة .env
cat > .env << EOFENV
DATABASE_URL=postgresql://school_admin:YourStrongPassword123!@localhost:5432/school_management
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
NODE_ENV=production
PORT=5000
TZ=Asia/Riyadh
EOFENV

# ────────────────────────────────────────────────────────
# 4️⃣ تثبيت وتشغيل
# ────────────────────────────────────────────────────────
npm install
npm run db:push --force
npm run build
npm start
```

**✅ افتح المتصفح على:** http://localhost:5000

**🔑 بيانات الدخول:**
- Username: `admin`
- Password: شوف ملف `ADMIN_CREDENTIALS.txt`

---

## 🔍 التحقق من النجاح

عند التشغيل، يجب أن ترى:

```
📊 استخدام PostgreSQL العادي (Standard)
✅ الاتصال بـ PostgreSQL ناجح!
serving on port 5000
```

---

## ❌ شيء لم يعمل؟

### الخطأ الشائع #1: "ECONNREFUSED"
```bash
sudo systemctl start postgresql
```

### الخطأ الشائع #2: "password authentication failed"
```bash
# تأكد من تطابق كلمة المرور في:
# 1. أمر CREATE USER (الخطوة 2)
# 2. DATABASE_URL في .env (الخطوة 3)
```

### الخطأ الشائع #3: "permission denied"
```bash
sudo -u postgres psql -d school_management << 'EOF'
GRANT ALL ON SCHEMA public TO school_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO school_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO school_admin;
EOF
```

### للمزيد من المساعدة:
- **TROUBLESHOOTING_AR.md** - دليل حل المشاكل الشامل
- **AI_SETUP_ARABIC.txt** - توجيه كامل للذكاء الاصطناعي

---

## 🌐 للنشر على VPS بشكل احترافي:

1. **استخدم PM2 لإدارة العملية:**
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```

2. **استخدم Nginx كـ Reverse Proxy:**
   - راجع `nginx.conf.example`
   - راجع `VPS_DEPLOYMENT_GUIDE_AR.md`

3. **فعّل SSL (HTTPS):**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

---

## 💡 نصائح مهمة

⚠️ **الأمان:**
- استخدم كلمة مرور قوية (16+ حرف)
- لا تفتح منفذ PostgreSQL (5432) للإنترنت
- غيّر كلمات المرور الافتراضية

⚠️ **الأداء:**
- على VPS: غيّر `PORT` إلى 3001 واستخدم Nginx
- استخدم PM2 للإنتاج (ليس `npm start` مباشرة)

⚠️ **النسخ الاحتياطي:**
- استخدم `bash backup-db.sh` للنسخ الاحتياطي التلقائي
- احفظ النسخ في مكان آمن

---

**آخر تحديث:** 27 يناير 2025
