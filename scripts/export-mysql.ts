import { db } from '../server/db';
import * as schema from '../shared/schema';
import * as fs from 'fs';
import * as path from 'path';

function escapeString(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'NULL';
  const d = typeof date === 'string' ? date : date.toISOString().slice(0, 10);
  return `'${d}'`;
}

function formatTimestamp(date: Date | null | undefined): string {
  if (!date) return 'NULL';
  return `'${date.toISOString().slice(0, 19).replace('T', ' ')}'`;
}

async function exportToMySQL() {
  console.log('بدء تصدير البيانات إلى MySQL...');
  
  let sqlDump = `-- MySQL Database Dump
-- School Management System - مدرسة النور الأهلية
-- Generated: ${new Date().toISOString()}

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

--
-- Database: \`school_management\`
--

`;

  try {
    // Export Users
    const users = await db.select().from(schema.users);
    console.log(`جاري تصدير ${users.length} مستخدم...`);
    
    if (users.length > 0) {
      sqlDump += `\n-- Table: users\nDROP TABLE IF EXISTS \`users\`;\n`;
      sqlDump += `CREATE TABLE \`users\` (
  \`id\` varchar(255) NOT NULL,
  \`username\` varchar(255) NOT NULL,
  \`password\` text NOT NULL,
  \`role\` enum('admin','teacher','parent') NOT NULL DEFAULT 'admin',
  \`full_name\` varchar(255) DEFAULT NULL,
  \`email\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`username\` (\`username\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
      
      sqlDump += `INSERT INTO \`users\` VALUES\n`;
      users.forEach((u, i) => {
        sqlDump += `(${escapeString(u.id)}, ${escapeString(u.username)}, ${escapeString(u.password)}, '${u.role}', ${escapeString(u.fullName)}, ${escapeString(u.email)}, ${formatTimestamp(u.createdAt)})`;
        sqlDump += i < users.length - 1 ? ',\n' : ';\n\n';
      });
    }

    // Export Teachers
    const teachers = await db.select().from(schema.teachers);
    console.log(`جاري تصدير ${teachers.length} معلم...`);
    
    if (teachers.length > 0) {
      sqlDump += `\n-- Table: teachers\nDROP TABLE IF EXISTS \`teachers\`;\n`;
      sqlDump += `CREATE TABLE \`teachers\` (
  \`id\` varchar(255) NOT NULL,
  \`arabic_name\` varchar(255) NOT NULL,
  \`email\` varchar(255) NOT NULL,
  \`phone\` varchar(50) NOT NULL,
  \`gender\` enum('male','female') NOT NULL,
  \`date_of_birth\` date DEFAULT NULL,
  \`hire_date\` date NOT NULL,
  \`qualification\` varchar(255) DEFAULT NULL,
  \`specialization\` varchar(255) DEFAULT NULL,
  \`monthly_salary\` decimal(10,2) NOT NULL DEFAULT '0.00',
  \`status\` enum('active','on_leave','resigned') NOT NULL DEFAULT 'active',
  \`photo_url\` varchar(500) DEFAULT NULL,
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
      
      sqlDump += `INSERT INTO \`teachers\` VALUES\n`;
      teachers.forEach((t, i) => {
        sqlDump += `(${escapeString(t.id)}, ${escapeString(t.arabicName)}, ${escapeString(t.email)}, ${escapeString(t.phone)}, '${t.gender}', ${formatDate(t.dateOfBirth)}, ${formatDate(t.hireDate)}, ${escapeString(t.qualification)}, ${escapeString(t.specialization)}, ${t.monthlySalary || '0.00'}, '${t.status}', ${escapeString(t.photoUrl)}, ${formatTimestamp(t.createdAt)}, ${formatTimestamp(t.updatedAt)})`;
        sqlDump += i < teachers.length - 1 ? ',\n' : ';\n\n';
      });
    }

    // Export Teacher Users
    const teacherUsers = await db.select().from(schema.teacherUsers);
    console.log(`جاري تصدير ${teacherUsers.length} ربط مستخدم-معلم...`);
    
    if (teacherUsers.length > 0) {
      sqlDump += `\n-- Table: teacher_users\nDROP TABLE IF EXISTS \`teacher_users\`;\n`;
      sqlDump += `CREATE TABLE \`teacher_users\` (
  \`id\` varchar(255) NOT NULL,
  \`user_id\` varchar(255) NOT NULL,
  \`teacher_id\` varchar(255) NOT NULL,
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`user_id\` (\`user_id\`),
  UNIQUE KEY \`teacher_id\` (\`teacher_id\`),
  CONSTRAINT \`fk_teacher_users_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_teacher_users_teacher\` FOREIGN KEY (\`teacher_id\`) REFERENCES \`teachers\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
      
      sqlDump += `INSERT INTO \`teacher_users\` VALUES\n`;
      teacherUsers.forEach((tu, i) => {
        sqlDump += `(${escapeString(tu.id)}, ${escapeString(tu.userId)}, ${escapeString(tu.teacherId)}, ${formatTimestamp(tu.createdAt)})`;
        sqlDump += i < teacherUsers.length - 1 ? ',\n' : ';\n\n';
      });
    }

    // Export Education Levels
    const educationLevels = await db.select().from(schema.educationLevels);
    console.log(`جاري تصدير ${educationLevels.length} مرحلة دراسية...`);
    
    if (educationLevels.length > 0) {
      sqlDump += `\n-- Table: education_levels\nDROP TABLE IF EXISTS \`education_levels\`;\n`;
      sqlDump += `CREATE TABLE \`education_levels\` (
  \`id\` varchar(255) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`order\` int NOT NULL,
  \`description\` text,
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
      
      sqlDump += `INSERT INTO \`education_levels\` VALUES\n`;
      educationLevels.forEach((el, i) => {
        sqlDump += `(${escapeString(el.id)}, ${escapeString(el.name)}, ${el.order}, ${escapeString(el.description)}, ${formatTimestamp(el.createdAt)})`;
        sqlDump += i < educationLevels.length - 1 ? ',\n' : ';\n\n';
      });
    }

    // Export Classes
    const classes = await db.select().from(schema.classes);
    console.log(`جاري تصدير ${classes.length} شعبة...`);
    
    if (classes.length > 0) {
      sqlDump += `\n-- Table: classes\nDROP TABLE IF EXISTS \`classes\`;\n`;
      sqlDump += `CREATE TABLE \`classes\` (
  \`id\` varchar(255) NOT NULL,
  \`education_level_id\` varchar(255) DEFAULT NULL,
  \`name\` varchar(255) NOT NULL,
  \`grade\` varchar(100) NOT NULL,
  \`section\` varchar(50) NOT NULL,
  \`academic_year\` varchar(20) NOT NULL,
  \`capacity\` int NOT NULL DEFAULT '30',
  \`room_number\` varchar(50) DEFAULT NULL,
  \`teacher_id\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`education_level_id\` (\`education_level_id\`),
  KEY \`teacher_id\` (\`teacher_id\`),
  CONSTRAINT \`fk_classes_education_level\` FOREIGN KEY (\`education_level_id\`) REFERENCES \`education_levels\` (\`id\`),
  CONSTRAINT \`fk_classes_teacher\` FOREIGN KEY (\`teacher_id\`) REFERENCES \`teachers\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
      
      sqlDump += `INSERT INTO \`classes\` VALUES\n`;
      classes.forEach((c, i) => {
        sqlDump += `(${escapeString(c.id)}, ${escapeString(c.educationLevelId)}, ${escapeString(c.name)}, ${escapeString(c.grade)}, ${escapeString(c.section)}, ${escapeString(c.academicYear)}, ${c.capacity}, ${escapeString(c.roomNumber)}, ${escapeString(c.teacherId)}, ${formatTimestamp(c.createdAt)})`;
        sqlDump += i < classes.length - 1 ? ',\n' : ';\n\n';
      });
    }

    // Export Students
    const students = await db.select().from(schema.students);
    console.log(`جاري تصدير ${students.length} طالب...`);
    
    if (students.length > 0) {
      sqlDump += `\n-- Table: students\nDROP TABLE IF EXISTS \`students\`;\n`;
      sqlDump += `CREATE TABLE \`students\` (
  \`id\` varchar(255) NOT NULL,
  \`arabic_name\` varchar(255) NOT NULL,
  \`date_of_birth\` date NOT NULL,
  \`gender\` enum('male','female') NOT NULL,
  \`national_id\` varchar(50) DEFAULT NULL,
  \`enrollment_date\` date NOT NULL,
  \`class_id\` varchar(255) DEFAULT NULL,
  \`parent_name\` varchar(255) NOT NULL,
  \`parent_phone\` varchar(50) NOT NULL,
  \`parent_email\` varchar(255) DEFAULT NULL,
  \`address\` text,
  \`medical_notes\` text,
  \`status\` enum('active','suspended','graduated','transferred') NOT NULL DEFAULT 'active',
  \`photo_url\` varchar(500) DEFAULT NULL,
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`national_id\` (\`national_id\`),
  KEY \`class_id\` (\`class_id\`),
  CONSTRAINT \`fk_students_class\` FOREIGN KEY (\`class_id\`) REFERENCES \`classes\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
      
      sqlDump += `INSERT INTO \`students\` VALUES\n`;
      students.forEach((s, i) => {
        sqlDump += `(${escapeString(s.id)}, ${escapeString(s.arabicName)}, ${formatDate(s.dateOfBirth)}, '${s.gender}', ${escapeString(s.nationalId)}, ${formatDate(s.enrollmentDate)}, ${escapeString(s.classId)}, ${escapeString(s.parentName)}, ${escapeString(s.parentPhone)}, ${escapeString(s.parentEmail)}, ${escapeString(s.address)}, ${escapeString(s.medicalNotes)}, '${s.status}', ${escapeString(s.photoUrl)}, ${formatTimestamp(s.createdAt)}, ${formatTimestamp(s.updatedAt)})`;
        sqlDump += i < students.length - 1 ? ',\n' : ';\n\n';
      });
    }

    // Export Subjects
    const subjects = await db.select().from(schema.subjects);
    console.log(`جاري تصدير ${subjects.length} مادة...`);
    
    if (subjects.length > 0) {
      sqlDump += `\n-- Table: subjects\nDROP TABLE IF EXISTS \`subjects\`;\n`;
      sqlDump += `CREATE TABLE \`subjects\` (
  \`id\` varchar(255) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`arabic_name\` varchar(255) NOT NULL,
  \`code\` varchar(50) NOT NULL,
  \`description\` text,
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`code\` (\`code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
      
      sqlDump += `INSERT INTO \`subjects\` VALUES\n`;
      subjects.forEach((subj, i) => {
        sqlDump += `(${escapeString(subj.id)}, ${escapeString(subj.name)}, ${escapeString(subj.arabicName)}, ${escapeString(subj.code)}, ${escapeString(subj.description)}, ${formatTimestamp(subj.createdAt)})`;
        sqlDump += i < subjects.length - 1 ? ',\n' : ';\n\n';
      });
    }

    // Export Grades
    const grades = await db.select().from(schema.grades);
    console.log(`جاري تصدير ${grades.length} علامة...`);
    
    if (grades.length > 0) {
      sqlDump += `\n-- Table: grades\nDROP TABLE IF EXISTS \`grades\`;\n`;
      sqlDump += `CREATE TABLE \`grades\` (
  \`id\` varchar(255) NOT NULL,
  \`student_id\` varchar(255) NOT NULL,
  \`subject_id\` varchar(255) NOT NULL,
  \`class_id\` varchar(255) NOT NULL,
  \`semester\` varchar(50) NOT NULL,
  \`assessment_type\` varchar(50) NOT NULL,
  \`score\` decimal(5,2) NOT NULL,
  \`max_score\` decimal(5,2) NOT NULL DEFAULT '100.00',
  \`date\` date NOT NULL,
  \`teacher_id\` varchar(255) DEFAULT NULL,
  \`notes\` text,
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`student_id\` (\`student_id\`),
  KEY \`subject_id\` (\`subject_id\`),
  KEY \`class_id\` (\`class_id\`),
  KEY \`teacher_id\` (\`teacher_id\`),
  CONSTRAINT \`fk_grades_student\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_grades_subject\` FOREIGN KEY (\`subject_id\`) REFERENCES \`subjects\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_grades_class\` FOREIGN KEY (\`class_id\`) REFERENCES \`classes\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_grades_teacher\` FOREIGN KEY (\`teacher_id\`) REFERENCES \`teachers\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
      
      sqlDump += `INSERT INTO \`grades\` VALUES\n`;
      grades.forEach((g, i) => {
        sqlDump += `(${escapeString(g.id)}, ${escapeString(g.studentId)}, ${escapeString(g.subjectId)}, ${escapeString(g.classId)}, ${escapeString(g.semester)}, '${g.assessmentType}', ${g.score}, ${g.maxScore}, ${formatDate(g.date)}, ${escapeString(g.teacherId)}, ${escapeString(g.notes)}, ${formatTimestamp(g.createdAt)})`;
        sqlDump += i < grades.length - 1 ? ',\n' : ';\n\n';
      });
    }

    // Export School Settings
    const schoolSettings = await db.select().from(schema.schoolSettings);
    console.log(`جاري تصدير ${schoolSettings.length} إعداد...`);
    
    if (schoolSettings.length > 0) {
      sqlDump += `\n-- Table: school_settings\nDROP TABLE IF EXISTS \`school_settings\`;\n`;
      sqlDump += `CREATE TABLE \`school_settings\` (
  \`id\` varchar(255) NOT NULL,
  \`school_name\` varchar(255) NOT NULL,
  \`school_name_arabic\` varchar(255) NOT NULL,
  \`current_academic_year\` varchar(20) NOT NULL,
  \`currency\` varchar(10) NOT NULL DEFAULT 'SAR',
  \`date_type\` enum('gregorian','hijri') NOT NULL DEFAULT 'gregorian',
  \`phone\` varchar(50) DEFAULT NULL,
  \`email\` varchar(255) DEFAULT NULL,
  \`address\` text,
  \`logo_url\` varchar(500) DEFAULT NULL,
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
      
      sqlDump += `INSERT INTO \`school_settings\` VALUES\n`;
      schoolSettings.forEach((ss, i) => {
        sqlDump += `(${escapeString(ss.id)}, ${escapeString(ss.schoolName)}, ${escapeString(ss.schoolNameArabic)}, ${escapeString(ss.currentAcademicYear)}, '${ss.currency}', '${ss.dateType}', ${escapeString(ss.phone)}, ${escapeString(ss.email)}, ${escapeString(ss.address)}, ${escapeString(ss.logoUrl)}, ${formatTimestamp(ss.createdAt)}, ${formatTimestamp(ss.updatedAt)})`;
        sqlDump += i < schoolSettings.length - 1 ? ',\n' : ';\n\n';
      });
    }

    // Footer
    sqlDump += `\nCOMMIT;\n-- End of MySQL dump\n`;

    // Save to file
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `school_mysql_${timestamp}.sql`;
    const filepath = path.join(exportDir, filename);
    
    fs.writeFileSync(filepath, sqlDump, 'utf8');
    
    console.log(`\n✅ تم تصدير البيانات بنجاح!`);
    console.log(`📁 اسم الملف: ${filename}`);
    console.log(`📍 المسار: exports/${filename}`);
    console.log(`\n📊 إحصائيات التصدير:`);
    console.log(`   - المستخدمون: ${users.length}`);
    console.log(`   - المعلمون: ${teachers.length}`);
    console.log(`   - الطلاب: ${students.length}`);
    console.log(`   - المواد: ${subjects.length}`);
    console.log(`   - الشعب: ${classes.length}`);
    console.log(`   - العلامات: ${grades.length}`);
    
    return filename;
  } catch (error) {
    console.error('❌ خطأ في تصدير البيانات:', error);
    throw error;
  }
}

// Run the export
exportToMySQL()
  .then((filename) => {
    console.log(`\n✨ اكتمل التصدير: ${filename}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('فشل التصدير:', error);
    process.exit(1);
  });
