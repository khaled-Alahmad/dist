# ✅ قائمة التحقق من النشر على VPS

استخدم هذه القائمة للتأكد من إكمال جميع خطوات النشر بنجاح.

---

## 🔧 إعداد الخادم (Server Setup)

- [ ] الاتصال بالـ VPS عبر SSH
- [ ] تحديث النظام: `apt update && apt upgrade -y`
- [ ] تثبيت Node.js 20+
- [ ] تثبيت PM2: `npm install -g pm2`
- [ ] تثبيت PostgreSQL
- [ ] تثبيت Git (إذا لم يكن مثبتاً)

**التحقق:**
```bash
node --version    # يجب أن تظهر v20.x.x
npm --version
pm2 --version
psql --version
```

---

## 🗄️ إعداد قاعدة البيانات (Database Setup)

- [ ] الدخول إلى PostgreSQL: `sudo -u postgres psql`
- [ ] إنشاء قاعدة البيانات: `CREATE DATABASE school_management;`
- [ ] إنشاء مستخدم جديد بكلمة مرور قوية
- [ ] منح الصلاحيات للمستخدم الجديد
- [ ] تسجيل معلومات الاتصال (DATABASE_URL)

**التحقق:**
```bash
sudo -u postgres psql -d school_management -c "SELECT 1;"
# يجب أن يظهر: ?column? 1
```

---

## 📁 رفع الكود (Code Upload)

- [ ] إنشاء مجلد المشروع: `/home/admin/school-app`
- [ ] رفع الكود (Git/SCP/SFTP)
- [ ] التأكد من وجود جميع الملفات المطلوبة

**التحقق:**
```bash
cd /home/admin/school-app
ls -la
# يجب أن ترى: package.json, server/, client/, shared/, etc.
```

---

## ⚙️ تهيئة المشروع (Project Configuration)

- [ ] إنشاء ملف `.env` من `.env.example`
- [ ] تحديث `NODE_ENV=production`
- [ ] تحديث `PORT=3001`
- [ ] تحديث `DATABASE_URL` بمعلومات قاعدة البيانات
- [ ] توليد `SESSION_SECRET` عشوائي قوي
- [ ] حفظ ملف `.env`

**توليد SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**التحقق:**
```bash
cat .env
# تأكد من عدم وجود قيم افتراضية مثل "your_password_here"
```

---

## 📦 بناء المشروع (Build Process)

- [ ] تثبيت الحزم: `npm install --production=false`
- [ ] بناء المشروع: `npm run build`
- [ ] التحقق من مجلد `dist/`

**التحقق:**
```bash
ls -la dist/
# يجب أن ترى: index.js و public/
ls -la dist/public/
# يجب أن ترى: index.html, assets/, etc.
```

---

## 🗄️ إعداد قاعدة البيانات (Database Migration)

- [ ] تشغيل migrations: `npm run db:push`
- [ ] إنشاء حساب Admin الأول
- [ ] التحقق من إنشاء الجداول

**التحقق:**
```bash
sudo -u postgres psql -d school_management
\dt    # عرض جميع الجداول
\q     # الخروج
```

---

## 🚀 تشغيل التطبيق (Application Startup)

- [ ] التأكد من وجود `ecosystem.config.cjs`
- [ ] إنشاء مجلد logs: `mkdir -p logs`
- [ ] تشغيل PM2: `pm2 start ecosystem.config.cjs --env production`
- [ ] التحقق من التشغيل: `pm2 list`
- [ ] فحص logs: `pm2 logs school-management`

**التحقق:**
```bash
pm2 status
# يجب أن ترى التطبيق في حالة "online"

curl http://localhost:3001/api/health
# يجب أن يعود برد صحيح
```

---

## 🔄 التشغيل التلقائي (Auto-Start)

- [ ] توليد startup script: `pm2 startup`
- [ ] تنفيذ الأمر الذي يظهر
- [ ] حفظ قائمة PM2: `pm2 save`

**التحقق:**
```bash
pm2 list
sudo reboot  # إعادة تشغيل الخادم للاختبار
# بعد إعادة التشغيل:
pm2 list
# يجب أن ترى التطبيق يعمل تلقائياً
```

---

## 🌐 إعداد Nginx (Nginx Configuration)

### الطريقة الأولى: NodeJS Plugin

- [ ] تثبيت HestiaCP NodeJS Plugin
- [ ] إضافة التطبيق من HestiaCP UI
- [ ] تحديد Port 3001

### الطريقة الثانية: التهيئة اليدوية

- [ ] إنشاء ملف تهيئة: `/etc/nginx/sites-available/school-management`
- [ ] تحديث `server_name` بالدومين الخاص بك
- [ ] إنشاء symbolic link: `ln -s /etc/nginx/sites-available/school-management /etc/nginx/sites-enabled/`
- [ ] اختبار التهيئة: `nginx -t`
- [ ] إعادة تحميل Nginx: `systemctl reload nginx`

**التحقق:**
```bash
nginx -t
# يجب أن يظهر: syntax is ok
curl http://yourdomain.com
# يجب أن يظهر محتوى الموقع
```

---

## 🔒 تثبيت SSL (SSL Certificate)

- [ ] تثبيت Certbot: `apt install -y certbot python3-certbot-nginx`
- [ ] الحصول على شهادة: `certbot --nginx -d yourdomain.com -d www.yourdomain.com`
- [ ] التحقق من التحديث التلقائي: `certbot renew --dry-run`
- [ ] إضافة cron job للتحديث

**التحقق:**
```bash
curl https://yourdomain.com
# يجب أن يعمل عبر HTTPS
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
# تحقق من صلاحية الشهادة
```

---

## 🛡️ الأمان (Security)

- [ ] تهيئة Firewall (UFW)
- [ ] السماح بـ HTTP (80), HTTPS (443), SSH (22) فقط
- [ ] التأكد من عدم فتح Port 3001 للعامة
- [ ] تقييد PostgreSQL على localhost فقط
- [ ] تغيير جميع كلمات المرور الافتراضية

**التحقق:**
```bash
ufw status
# يجب أن ترى فقط: 22/tcp, 80/tcp, 443/tcp ALLOW
netstat -tlnp | grep 3001
# يجب أن يستمع على 127.0.0.1:3001 فقط
```

---

## 💾 النسخ الاحتياطي (Backup)

- [ ] إنشاء `backup-db.sh` script
- [ ] جعله قابل للتنفيذ: `chmod +x backup-db.sh`
- [ ] اختبار النسخ الاحتياطي: `./backup-db.sh`
- [ ] إضافة cron job للنسخ اليومي

**التحقق:**
```bash
./backup-db.sh
ls -la /root/backups/
# يجب أن ترى ملف .sql.gz
```

---

## 🧪 الاختبار النهائي (Final Testing)

- [ ] فتح الموقع في المتصفح: `https://yourdomain.com`
- [ ] تسجيل الدخول كـ Admin
- [ ] إضافة مرحلة دراسية تجريبية
- [ ] إضافة صف تجريبي
- [ ] إضافة طالب تجريبي
- [ ] تسجيل حضور تجريبي
- [ ] فحص logs: `pm2 logs school-management`
- [ ] فحص Nginx logs: `tail -f /var/log/nginx/school-app-access.log`

---

## 📋 ملفات مهمة (Important Files)

تأكد من وجود هذه الملفات:

```
/home/admin/school-app/
├── .env                     ✅ (معلومات حساسة - لا تشاركها)
├── ecosystem.config.cjs     ✅ (تهيئة PM2)
├── package.json             ✅
├── dist/                    ✅ (المشروع المُبني)
│   ├── index.js            ✅
│   └── public/             ✅
├── logs/                    ✅ (سجلات PM2)
├── update.sh               ✅ (سكريبت التحديث)
└── backup-db.sh            ✅ (سكريبت النسخ الاحتياطي)
```

---

## 🎯 ملاحظات نهائية

### بعد الانتهاء من جميع الخطوات:

1. **تسجيل المعلومات المهمة:**
   - كلمة مرور قاعدة البيانات
   - SESSION_SECRET
   - بيانات Admin الأول

2. **حفظ معلومات الوصول:**
   - رابط الموقع: `https://yourdomain.com`
   - بيانات الدخول للوحة التحكم

3. **إعداد الصيانة الدورية:**
   - مراجعة logs أسبوعياً: `pm2 logs`
   - فحص النسخ الاحتياطية شهرياً
   - تحديث النظام شهرياً: `apt update && apt upgrade`

4. **الأوامر السريعة:**
   ```bash
   # إعادة تشغيل التطبيق
   pm2 restart school-management
   
   # تحديث التطبيق
   cd /home/admin/school-app && ./update.sh
   
   # نسخ احتياطي
   /root/backup-db.sh
   
   # مشاهدة logs
   pm2 logs school-management
   ```

---

## ✅ اكتمال النشر

عند اكتمال جميع النقاط أعلاه، يكون موقعك جاهزاً للاستخدام! 🎉

**تهانينا!** نظام إدارة المدرسة يعمل الآن على VPS الخاص بك.

---

**آخر تحديث:** 26 يناير 2025
