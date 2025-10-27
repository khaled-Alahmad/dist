// PM2 Ecosystem Configuration for School Management System
// هذا الملف يحدد كيفية تشغيل التطبيق في الإنتاج

module.exports = {
  apps: [{
    // اسم التطبيق في PM2
    name: 'school-management',
    
    // ملف التطبيق المُبني
    script: './dist/index.js',
    
    // عدد النسخ (1 = نسخة واحدة، 'max' = استخدام كل النوى)
    instances: 1,
    exec_mode: 'fork',
    
    // لا تراقب التغييرات في الإنتاج
    watch: false,
    
    // متغيرات البيئة للإنتاج
    env_production: {
      NODE_ENV: 'production',
      PORT: 3055,
      DATABASE_URL: 'postgresql://school_admin:HnrrTXXWyEc58kxR@localhost:5433/school_management',
      SESSION_SECRET: 'HnrrTXXWyEc58kxR-random-secret-key-12345',
      TZ: 'Asia/Riyadh'
    },
    
    // متغيرات البيئة للتطوير (اختياري)
    env_development: {
      NODE_ENV: 'development',
      PORT: 3055
    },
    
    // إعادة التشغيل التلقائي عند استهلاك 500MB من الذاكرة
    max_memory_restart: '500M',
    
    // الحد الأدنى للوقت قبل اعتبار التطبيق مستقر (10 ثواني)
    min_uptime: '10s',
    
    // أقصى عدد لإعادة المحاولات في دقيقة واحدة
    max_restarts: 10,
    
    // إعادة التشغيل التلقائي عند الأعطال
    autorestart: true,
    
    // ملفات السجلات
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    
    // الوقت المسموح لإيقاف التطبيق بشكل طبيعي (5 ثواني)
    kill_timeout: 5000,
    
    // الوقت المسموح للاستماع على المنفذ (3 ثواني)
    listen_timeout: 3000,
    
    // إرسال رسالة عند الإيقاف
    shutdown_with_message: true
  }],
  
  // إعدادات النشر التلقائي (اختياري - للاستخدام المتقدم)
  deploy: {
    production: {
      // معلومات الخادم
      user: 'root',
      host: ['your-vps-ip'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/school-management.git',
      path: '/home/admin/school-app',
      
      // الأوامر التي يتم تنفيذها بعد النشر
      'post-deploy': 'npm install --production=false && npm run build && pm2 reload ecosystem.config.cjs --env production && pm2 save',
      
      // الأوامر التي يتم تنفيذها قبل الإعداد الأول
      'pre-setup': 'mkdir -p logs'
    }
  }
};
