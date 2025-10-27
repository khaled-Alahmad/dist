import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";

// التحقق من وجود DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('\n❌ خطأ فادح: DATABASE_URL غير موجود!\n');
  console.error('📋 الخطوات المطلوبة:');
  console.error('1️⃣  أنشئ ملف .env في جذر المشروع');
  console.error('2️⃣  أضف السطر التالي:');
  console.error('    DATABASE_URL=postgresql://username:password@localhost:5432/school_management\n');
  console.error('💡 للمزيد من المعلومات، راجع ملف: AI_SETUP_ARABIC.txt\n');
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// تحديد نوع قاعدة البيانات بناءً على DATABASE_URL
const isNeonDatabase = process.env.DATABASE_URL.includes('neon.tech') || 
                       process.env.DATABASE_URL.includes('neon.fl0.io') ||
                       process.env.DATABASE_URL.includes('pooler.supabase.com');

let pool: any;
let db: any;

if (isNeonDatabase) {
  // استخدام Neon Serverless (للـ Replit أو Neon Cloud)
  console.log('📊 استخدام Neon Serverless Database');
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else {
  // استخدام PostgreSQL العادي (للـ VPS أو Local)
  console.log('📊 استخدام PostgreSQL العادي (Standard)');
  
  try {
    pool = new PgPool({ 
      connectionString: process.env.DATABASE_URL,
      // إعدادات الاتصال للـ PostgreSQL العادي
      max: 20, // أقصى عدد اتصالات في الـ pool
      idleTimeoutMillis: 30000, // وقت انتظار الاتصالات الخاملة (30 ثانية)
      connectionTimeoutMillis: 10000, // وقت انتظار الاتصال (10 ثواني)
    });

    // التحقق من الاتصال
    pool.on('error', (err: Error) => {
      console.error('\n❌ خطأ في الاتصال بـ PostgreSQL:');
      console.error('   ' + err.message);
      console.error('\n💡 الحلول المحتملة:');
      console.error('   • تأكد من تشغيل PostgreSQL: sudo systemctl start postgresql');
      console.error('   • تحقق من DATABASE_URL في ملف .env');
      console.error('   • تأكد من إنشاء قاعدة البيانات والمستخدم');
      console.error('   • راجع ملف AI_SETUP_ARABIC.txt للمساعدة\n');
    });

    db = drizzlePg(pool, { schema });
    
    // فحص الاتصال فوراً للـ PostgreSQL العادي
    pool.connect()
      .then((client: any) => {
        console.log('✅ الاتصال بـ PostgreSQL ناجح!');
        client.release();
      })
      .catch((error: any) => {
        console.error('\n❌ فشل الاتصال بـ PostgreSQL!');
        console.error('   الخطأ:', error.message);
        console.error('\n🔍 الأخطاء الشائعة:');
        if (error.code === 'ECONNREFUSED') {
          console.error('   • ECONNREFUSED → PostgreSQL لا يعمل');
          console.error('     الحل: sudo systemctl start postgresql\n');
        } else if (error.code === '28P01') {
          console.error('   • password authentication failed → كلمة المرور خطأ');
          console.error('     الحل: راجع DATABASE_URL في .env\n');
        } else if (error.code === '3D000') {
          console.error('   • database does not exist → قاعدة البيانات غير موجودة');
          console.error('     الحل: راجع AI_SETUP_ARABIC.txt لإنشاء القاعدة\n');
        } else if (error.code === '42501') {
          console.error('   • permission denied → صلاحيات غير كافية');
          console.error('     الحل: راجع DATABASE_CONNECTION_GUIDE.md\n');
        } else {
          console.error('   الكود:', error.code);
          console.error('   راجع ملف TROUBLESHOOTING_AR.md للمساعدة\n');
        }
      });
  } catch (error: any) {
    console.error('\n❌ فشل إنشاء اتصال PostgreSQL:');
    console.error('   ' + error.message);
    console.error('\n📋 تأكد من:');
    console.error('   1. تثبيت PostgreSQL: sudo apt install postgresql');
    console.error('   2. تشغيل PostgreSQL: sudo systemctl start postgresql');
    console.error('   3. إنشاء قاعدة البيانات: راجع AI_SETUP_ARABIC.txt');
    console.error('   4. DATABASE_URL صحيح في ملف .env\n');
    throw error;
  }
}

export { pool, db };
