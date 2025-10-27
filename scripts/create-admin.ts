import { db } from '../server/db';
import { users, schoolSettings } from '../shared/schema';
import { randomBytes } from 'crypto';
import { hashPassword } from '../server/auth';

async function createAdmin() {
  console.log('🔐 إنشاء حساب المدير الجديد...\n');

  // توليد كلمة مرور عشوائية قوية
  const password = randomBytes(8).toString('hex'); // كلمة مرور عشوائية 16 حرف
  const username = 'admin';

  // تشفير كلمة المرور
  const hashedPassword = await hashPassword(password);

  // إنشاء المستخدم
  const [admin] = await db.insert(users).values({
    username,
    password: hashedPassword,
    role: 'admin',
    fullName: 'مدير النظام',
    email: 'admin@school.com',
  }).returning();

  // إنشاء إعدادات المدرسة الافتراضية
  await db.insert(schoolSettings).values({
    schoolName: 'Al-Noor Private School',
    schoolNameArabic: 'مدرسة النور الأهلية',
    currentAcademicYear: '2024-2025',
    currency: 'SAR',
    dateType: 'gregorian',
    phone: '+966123456789',
    email: 'info@alnoor.edu.sa',
    address: 'المملكة العربية السعودية',
  });

  console.log('✅ تم إنشاء قاعدة البيانات بنجاح!\n');
  console.log('═══════════════════════════════════════');
  console.log('📋 معلومات تسجيل الدخول - احفظها جيداً!');
  console.log('═══════════════════════════════════════\n');
  console.log('👤 اسم المستخدم: ' + username);
  console.log('🔑 كلمة المرور: ' + password);
  console.log('\n⚠️  احفظ هذه المعلومات في مكان آمن!');
  console.log('═══════════════════════════════════════\n');

  return { username, password };
}

createAdmin()
  .then(() => {
    console.log('✨ اكتمل الإعداد بنجاح!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ خطأ:', error);
    process.exit(1);
  });
