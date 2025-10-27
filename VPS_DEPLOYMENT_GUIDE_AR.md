# 🚀 دليل رفع نظام إدارة المدرسة على VPS مع HestiaCP

## 📋 نظرة عامة

هذا الدليل يشرح كيفية رفع نظام إدارة المدرسة الشامل على VPS خاص بك باستخدام:
- **Frontend**: React + Vite (يُبنى لملفات ثابتة)
- **Backend**: Express.js + TypeScript (يعمل على منفذ محدد)
- **Database**: PostgreSQL
- **Process Manager**: PM2
- **Web Server**: Nginx (كـ reverse proxy)

---

## ✅ المتطلبات الأساسية

### على VPS:
- ✅ Ubuntu 20.04+ أو Debian 11+
- ✅ HestiaCP مثبت ويعمل
- ✅ Node.js 20+ (سيتم التثبيت)
- ✅ PostgreSQL 14+ (سيتم التثبيت)
- ✅ وصول SSH كـ root
- ✅ دومين مُضاف في HestiaCP

### على جهازك:
- ✅ Git (لرفع الكود)
- ✅ SSH client للوصول للـ VPS

---

## 📦 الخطوة 1: الاتصال بالـ VPS وتثبيت المتطلبات

### 1.1 الاتصال بالـ VPS

```bash
ssh root@your-vps-ip
```

### 1.2 تحديث النظام

```bash
apt update && apt upgrade -y
```

### 1.3 تثبيت Node.js 20

```bash
# إضافة مستودع NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# تثبيت Node.js
apt install -y nodejs

# التحقق من النسخة
node --version  # يجب أن تظهر v20.x.x
npm --version
```

### 1.4 تثبيت PM2 (مدير العمليات)

```bash
npm install -g pm2
```

### 1.5 تثبيت PostgreSQL

```bash
# تثبيت PostgreSQL
apt install -y postgresql postgresql-contrib

# بدء الخدمة وتفعيلها
systemctl enable postgresql
systemctl start postgresql

# التحقق من حالة الخدمة
systemctl status postgresql
```

---

## 🗄️ الخطوة 2: إنشاء قاعدة البيانات

### 2.1 إنشاء قاعدة بيانات ومستخدم

```bash
# الدخول لـ PostgreSQL
sudo -u postgres psql

# في PostgreSQL shell، نفذ الأوامر التالية:
```

```sql
-- إنشاء قاعدة بيانات
CREATE DATABASE school_management;

-- إنشاء مستخدم بكلمة مرور قوية
CREATE USER school_user WITH PASSWORD 'كلمة_مرور_قوية_جداً_هنا';

-- منح كل الصلاحيات
GRANT ALL PRIVILEGES ON DATABASE school_management TO school_user;

-- منح صلاحيات على schema (مهم!)
\c school_management
GRANT ALL ON SCHEMA public TO school_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO school_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO school_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO school_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO school_user;

-- الخروج
\q
```

### 2.2 احفظ معلومات الاتصال

```
DATABASE_URL=postgresql://school_user:كلمة_مرور_قوية_جداً_هنا@localhost:5432/school_management
```

---

## 📁 الخطوة 3: رفع الكود إلى VPS

### 3.1 إنشاء مجلد المشروع

```bash
# استخدم اسم مستخدم HestiaCP الخاص بك (مثلاً: admin)
mkdir -p /home/admin/school-app
cd /home/admin/school-app
```

### 3.2 رفع الكود

**الطريقة الأولى: استخدام Git (موصى بها)**

```bash
# إذا كان مشروعك على GitHub
git clone https://github.com/your-username/school-management.git .

# أو انسخ الكود من Replit
# افتح Replit → اذهب لـ Shell → نفذ:
# git remote add origin https://github.com/your-username/school-management.git
# git add .
# git commit -m "Initial commit"
# git push -u origin main
```

**الطريقة الثانية: استخدام SCP/SFTP**

```bash
# من جهازك المحلي (بعد تحميل الكود من Replit)
scp -r /path/to/local/folder/* root@your-vps-ip:/home/admin/school-app/
```

**الطريقة الثالثة: استخدام Rsync (الأفضل)**

```bash
# من Replit Shell أو جهازك
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
  /path/to/project/ root@your-vps-ip:/home/admin/school-app/
```

---

## ⚙️ الخطوة 4: تهيئة المشروع على VPS

### 4.1 الانتقال لمجلد المشروع

```bash
cd /home/admin/school-app
```

### 4.2 إنشاء ملف البيئة .env

```bash
nano .env
```

أضف المتغيرات التالية:

```env
# Production Environment
NODE_ENV=production

# Server Port (استخدم منفذ غير مستخدم، مثل 3001)
PORT=3001

# Database Connection
DATABASE_URL=postgresql://school_user:كلمة_مرور_قوية_جداً_هنا@localhost:5432/school_management

# Session Secret (قم بتوليد نص عشوائي قوي)
SESSION_SECRET=your-very-long-random-secret-here-minimum-32-characters

# Optional: Domain for production
DOMAIN=yourdomain.com
```

احفظ الملف: `Ctrl+O` ثم `Enter` ثم `Ctrl+X`

### 4.3 تثبيت الحزم وبناء المشروع

```bash
# تثبيت dependencies
npm install --production=false

# بناء المشروع
npm run build

# التحقق من نجاح البناء
ls -la dist/
# يجب أن ترى: index.js و public/ folder
```

---

## 🚀 الخطوة 5: تشغيل التطبيق باستخدام PM2

### 5.1 إنشاء ملف تهيئة PM2

```bash
nano ecosystem.config.cjs
```

الصق هذا المحتوى:

```javascript
module.exports = {
  apps: [{
    name: 'school-management',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    
    // إعادة التشغيل التلقائي
    max_memory_restart: '500M',
    min_uptime: '10s',
    max_restarts: 10,
    autorestart: true,
    
    // Logs
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    
    // Advanced
    kill_timeout: 5000,
    listen_timeout: 3000
  }]
};
```

### 5.2 إنشاء مجلد للـ logs

```bash
mkdir -p logs
```

### 5.3 تشغيل التطبيق

```bash
# تشغيل التطبيق
pm2 start ecosystem.config.cjs --env production

# التحقق من التشغيل
pm2 list

# مشاهدة الـ logs
pm2 logs school-management

# إيقاف مشاهدة الـ logs: Ctrl+C
```

### 5.4 حفظ التطبيق للتشغيل التلقائي عند إعادة التشغيل

```bash
# توليد startup script
pm2 startup

# سيظهر أمر، انسخه ونفذه (مثال):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# حفظ قائمة العمليات الحالية
pm2 save
```

---

## 🌐 الخطوة 6: تهيئة Nginx كـ Reverse Proxy

### 6.1 الطريقة الأولى: استخدام HestiaCP NodeJS Plugin (موصى بها)

```bash
# تثبيت plugin
cd /tmp
git clone https://github.com/cristiancosano/hestiacp-nodejs.git
cd hestiacp-nodejs
chmod +x install.sh
./install.sh
```

**بعد التثبيت:**
1. اذهب إلى لوحة HestiaCP
2. اختر الدومين الخاص بك
3. اذهب لـ "Edit" → "Quick Install App"
4. اختر "NodeJS"
5. أدخل Port: `3001`
6. احفظ

### 6.2 الطريقة الثانية: التهيئة اليدوية لـ Nginx

إذا لم تنجح الطريقة الأولى، استخدم التهيئة اليدوية:

```bash
# إنشاء ملف تهيئة Nginx
nano /etc/nginx/sites-available/school-management
```

الصق هذا المحتوى (استبدل yourdomain.com بدومينك):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS (سيتم تفعيله بعد تثبيت SSL)
    # return 301 https://$server_name$request_uri;

    # Static files (Frontend)
    root /home/admin/school-app/dist/public;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # API requests → Express backend
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Serve static files or fallback to index.html (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Log files
    access_log /var/log/nginx/school-app-access.log;
    error_log /var/log/nginx/school-app-error.log;
}
```

**تفعيل التهيئة:**

```bash
# إنشاء symbolic link
ln -s /etc/nginx/sites-available/school-management /etc/nginx/sites-enabled/

# اختبار التهيئة
nginx -t

# إعادة تحميل Nginx
systemctl reload nginx
```

---

## 🔒 الخطوة 7: تثبيت SSL (HTTPS)

### 7.1 تثبيت Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### 7.2 الحصول على شهادة SSL

```bash
# استبدل yourdomain.com بدومينك
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

اتبع التعليمات على الشاشة:
- أدخل بريدك الإلكتروني
- وافق على الشروط
- اختر إعادة التوجيه من HTTP إلى HTTPS

### 7.3 التحديث التلقائي للشهادة

```bash
# اختبار التحديث التلقائي
certbot renew --dry-run

# إضافة cron job للتحديث التلقائي
crontab -e

# أضف هذا السطر في نهاية الملف:
0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

---

## 📊 الخطوة 8: إنشاء قاعدة البيانات (Migration)

### 8.1 تشغيل migrations

```bash
cd /home/admin/school-app

# تشغيل Drizzle push
npm run db:push
```

### 8.2 إنشاء حساب الأدمن الأول

```bash
# إذا كان لديك script لإنشاء admin
node scripts/create-admin.js

# أو باستخدام SQL مباشرة
sudo -u postgres psql school_management

# في PostgreSQL shell:
# (استخدم الـ hash الصحيح لكلمة المرور - يجب أن يكون من الكود)
```

---

## 🎯 الخطوة 9: الاختبار والتحقق

### 9.1 فحص حالة التطبيق

```bash
# حالة PM2
pm2 status

# logs مباشرة
pm2 logs school-management --lines 50

# حالة Nginx
systemctl status nginx

# حالة PostgreSQL
systemctl status postgresql
```

### 9.2 اختبار الاتصال

```bash
# اختبار Backend مباشرة
curl http://localhost:3001/api/health

# اختبار عبر Nginx
curl http://yourdomain.com/api/health

# اختبار HTTPS
curl https://yourdomain.com
```

### 9.3 فتح الموقع في المتصفح

افتح: `https://yourdomain.com`

يجب أن ترى صفحة تسجيل الدخول!

---

## 🔧 الخطوة 10: إدارة التطبيق

### أوامر PM2 المهمة

```bash
# عرض جميع التطبيقات
pm2 list

# مشاهدة الـ logs
pm2 logs school-management

# إعادة تشغيل التطبيق
pm2 restart school-management

# إيقاف التطبيق
pm2 stop school-management

# حذف التطبيق من PM2
pm2 delete school-management

# مراقبة الأداء
pm2 monit

# معلومات تفصيلية
pm2 show school-management
```

### تحديث التطبيق (بعد تغييرات في الكود)

أنشئ script للتحديث:

```bash
nano /home/admin/school-app/update.sh
```

الصق هذا المحتوى:

```bash
#!/bin/bash

echo "🔄 Starting application update..."
cd /home/admin/school-app

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm install --production=false

echo "🏗️ Building application..."
npm run build

echo "🔄 Restarting PM2..."
pm2 restart school-management

echo "📊 Checking status..."
pm2 status

echo "✅ Update complete!"
echo "📝 View logs with: pm2 logs school-management"
```

اجعله قابل للتنفيذ:

```bash
chmod +x /home/admin/school-app/update.sh
```

للتحديث مستقبلاً:

```bash
cd /home/admin/school-app
./update.sh
```

---

## 🛡️ الخطوة 11: الأمان والحماية

### 11.1 تهيئة Firewall

```bash
# تفعيل UFW
ufw enable

# السماح بالمنافذ الأساسية
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# التحقق من الحالة
ufw status

# ⚠️ مهم: لا تفتح منفذ 3001 للعامة! يجب أن يكون داخلياً فقط
```

### 11.2 تقييد الوصول لـ PostgreSQL

تأكد أن PostgreSQL يستمع فقط على localhost:

```bash
nano /etc/postgresql/*/main/postgresql.conf

# ابحث عن listen_addresses وتأكد أنها:
listen_addresses = 'localhost'

# احفظ وأعد تشغيل PostgreSQL
systemctl restart postgresql
```

### 11.3 النسخ الاحتياطي لقاعدة البيانات

أنشئ script للنسخ الاحتياطي:

```bash
nano /root/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="school_management"

mkdir -p $BACKUP_DIR

# نسخ احتياطي
sudo -u postgres pg_dump $DB_NAME | gzip > $BACKUP_DIR/school_db_$DATE.sql.gz

# حذف النسخ القديمة (أكثر من 7 أيام)
find $BACKUP_DIR -name "school_db_*.sql.gz" -mtime +7 -delete

echo "✅ Backup completed: school_db_$DATE.sql.gz"
```

اجعله قابل للتنفيذ:

```bash
chmod +x /root/backup-db.sh
```

جدولة النسخ الاحتياطي اليومي:

```bash
crontab -e

# أضف هذا السطر (نسخ احتياطي يومي في 2 صباحاً):
0 2 * * * /root/backup-db.sh >> /var/log/db-backup.log 2>&1
```

---

## 📝 استعادة النسخة الاحتياطية

إذا احتجت لاستعادة قاعدة البيانات:

```bash
# إيقاف التطبيق
pm2 stop school-management

# استعادة النسخة الاحتياطية
gunzip -c /root/backups/school_db_20250126_020000.sql.gz | \
  sudo -u postgres psql school_management

# إعادة تشغيل التطبيق
pm2 start school-management
```

---

## 🐛 حل المشاكل الشائعة

### المشكلة 1: التطبيق لا يعمل

```bash
# فحص logs
pm2 logs school-management --err

# فحص المنفذ
netstat -tlnp | grep 3001

# إعادة تشغيل
pm2 restart school-management
```

### المشكلة 2: خطأ في الاتصال بقاعدة البيانات

```bash
# التحقق من PostgreSQL
systemctl status postgresql

# اختبار الاتصال
sudo -u postgres psql -d school_management -c "SELECT 1;"

# فحص DATABASE_URL في .env
cat /home/admin/school-app/.env | grep DATABASE_URL
```

### المشكلة 3: 502 Bad Gateway

```bash
# التحقق من تشغيل التطبيق
pm2 list

# فحص Nginx logs
tail -f /var/log/nginx/school-app-error.log

# إعادة تشغيل Nginx
systemctl restart nginx
```

### المشكلة 4: الملفات الثابتة لا تظهر

```bash
# التحقق من وجود dist/public
ls -la /home/admin/school-app/dist/public/

# إعادة البناء
cd /home/admin/school-app
npm run build

# إعادة تشغيل PM2
pm2 restart school-management
```

---

## ✅ Checklist النشر النهائي

- [ ] تم تثبيت Node.js 20+
- [ ] تم تثبيت PostgreSQL
- [ ] تم إنشاء قاعدة البيانات والمستخدم
- [ ] تم رفع الكود إلى VPS
- [ ] تم إنشاء ملف .env بالبيانات الصحيحة
- [ ] تم تشغيل `npm install`
- [ ] تم تشغيل `npm run build`
- [ ] تم تشغيل `npm run db:push`
- [ ] تم تشغيل التطبيق باستخدام PM2
- [ ] تم حفظ PM2 للتشغيل التلقائي
- [ ] تم تهيئة Nginx كـ reverse proxy
- [ ] تم تثبيت SSL certificate
- [ ] تم تهيئة Firewall
- [ ] تم إنشاء script للنسخ الاحتياطي
- [ ] تم اختبار الموقع عبر HTTPS
- [ ] تم إنشاء حساب Admin الأول

---

## 📞 الدعم والمساعدة

إذا واجهت أي مشاكل:

1. **فحص الـ Logs:**
   ```bash
   pm2 logs school-management
   tail -f /var/log/nginx/school-app-error.log
   ```

2. **إعادة التشغيل الكامل:**
   ```bash
   pm2 restart school-management
   systemctl restart nginx
   systemctl restart postgresql
   ```

3. **التحقق من الاتصال:**
   ```bash
   curl http://localhost:3001/api/health
   curl https://yourdomain.com
   ```

---

## 🎉 تهانينا!

تطبيقك الآن يعمل على VPS خاص بك! 🚀

**الوصول:**
- الموقع: `https://yourdomain.com`
- API: `https://yourdomain.com/api/`

**للتحديثات المستقبلية:**
```bash
cd /home/admin/school-app
./update.sh
```

---

**آخر تحديث:** 26 يناير 2025
