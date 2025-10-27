import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, date, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const studentStatusEnum = pgEnum('student_status', ['active', 'suspended', 'graduated', 'transferred']);
export const teacherStatusEnum = pgEnum('teacher_status', ['active', 'on_leave', 'resigned']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'late', 'excused']);
export const paymentStatusEnum = pgEnum('payment_status', ['paid', 'pending', 'overdue', 'partial']);
export const genderEnum = pgEnum('gender', ['male', 'female']);
export const assessmentTypeEnum = pgEnum('assessment_type', ['مذاكرة', 'امتحان نهائي', 'واجب', 'مشاركة', 'اختبار قصير', 'مشروع', 'نشاط']);
export const dateTypeEnum = pgEnum('date_type', ['gregorian', 'hijri']);
export const teacherAttendanceStatusEnum = pgEnum('teacher_attendance_status', ['present', 'absent', 'paid_leave', 'unpaid_leave', 'sick_leave']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'teacher', 'parent']);

// Users table (for authentication)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('admin'),
  fullName: text("full_name"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Linking table for teacher users
export const teacherUsers = pgTable("teacher_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  teacherId: varchar("teacher_id").notNull().references(() => teachers.id).unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Linking table for parent users with their children
export const parentStudents = pgTable("parent_students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // Parent user
  studentId: varchar("student_id").notNull().references(() => students.id), // Child student
  relationship: text("relationship").notNull().default('parent'), // parent, guardian, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Students table
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  arabicName: text("arabic_name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  gender: genderEnum("gender").notNull(),
  nationalId: text("national_id").unique(),
  enrollmentDate: date("enrollment_date").notNull(),
  classId: varchar("class_id").references(() => classes.id),
  parentName: text("parent_name").notNull(),
  parentPhone: text("parent_phone").notNull(),
  parentEmail: text("parent_email"),
  address: text("address"),
  medicalNotes: text("medical_notes"),
  status: studentStatusEnum("status").notNull().default('active'),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teachers table
export const teachers = pgTable("teachers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  arabicName: text("arabic_name").notNull(),
  email: text("email").unique().notNull(),
  phone: text("phone").notNull(),
  gender: genderEnum("gender").notNull(),
  dateOfBirth: date("date_of_birth"),
  hireDate: date("hire_date").notNull(),
  qualification: text("qualification"),
  specialization: text("specialization"),
  monthlySalary: decimal("monthly_salary", { precision: 10, scale: 2 }).notNull().default('0'),
  status: teacherStatusEnum("status").notNull().default('active'),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subjects table
export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  arabicName: text("arabic_name").notNull(),
  code: text("code").unique().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Education Levels table (المراحل الدراسية)
export const educationLevels = pgTable("education_levels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "الابتدائية", "المتوسطة", "الثانوية"
  order: integer("order").notNull(), // للترتيب
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Classes/Sections table
export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  educationLevelId: varchar("education_level_id").references(() => educationLevels.id), // المرحلة الدراسية
  name: text("name").notNull(), // e.g., "الصف الأول"
  grade: text("grade").notNull(), // e.g., "الأول", "الثاني"
  section: text("section").notNull(), // أ، ب، ج
  academicYear: text("academic_year").notNull(), // e.g., "2024-2025"
  capacity: integer("capacity").notNull().default(30),
  roomNumber: text("room_number"),
  teacherId: varchar("teacher_id").references(() => teachers.id), // Class teacher
  createdAt: timestamp("created_at").defaultNow(),
});

// Grade-Subject Assignment (which subjects are taught in which grade)
export const classSubjects = pgTable("class_subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  educationLevelId: varchar("education_level_id").notNull().references(() => educationLevels.id),
  grade: text("grade").notNull(),
  subjectId: varchar("subject_id").notNull().references(() => subjects.id),
  teacherId: varchar("teacher_id").references(() => teachers.id),
  weeklyHours: integer("weekly_hours").notNull().default(2),
  createdAt: timestamp("created_at").defaultNow(),
});

// Section-Subject-Teacher Assignment (assigns teachers to specific subjects in specific sections)
export const sectionSubjectTeachers = pgTable("section_subject_teachers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull().references(() => classes.id), // الشعبة المحددة
  subjectId: varchar("subject_id").notNull().references(() => subjects.id), // المادة
  teacherId: varchar("teacher_id").notNull().references(() => teachers.id), // المدرس
  isLead: boolean("is_lead").notNull().default(false), // هل هو المدرس الأساسي
  createdAt: timestamp("created_at").defaultNow(),
});

// Grades/Assessments table
export const grades = pgTable("grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  subjectId: varchar("subject_id").notNull().references(() => subjects.id),
  classId: varchar("class_id").notNull().references(() => classes.id),
  semester: text("semester").notNull(), // e.g., "الفصل الأول", "الفصل الثاني", "الفصل الثالث"
  assessmentType: assessmentTypeEnum("assessment_type").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(),
  maxScore: decimal("max_score", { precision: 5, scale: 2 }).notNull().default('100'),
  date: date("date").notNull(),
  teacherId: varchar("teacher_id").references(() => teachers.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Attendance table
export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  classId: varchar("class_id").notNull().references(() => classes.id),
  date: date("date").notNull(),
  status: attendanceStatusEnum("status").notNull(),
  notes: text("notes"),
  recordedBy: varchar("recorded_by").references(() => teachers.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Fees/Payments table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  paymentDate: date("payment_date"),
  status: paymentStatusEnum("status").notNull().default('pending'),
  paymentType: text("payment_type").notNull(), // tuition, registration, transport, etc.
  academicYear: text("academic_year").notNull(),
  month: text("month"), // for monthly fees
  notes: text("notes"),
  receiptNumber: text("receipt_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Student Accounts table (for tracking financial obligations and balance)
export const studentAccounts = pgTable("student_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().unique().references(() => students.id),
  totalAmountDue: decimal("total_amount_due", { precision: 10, scale: 2 }).notNull().default('0'),
  totalPaid: decimal("total_paid", { precision: 10, scale: 2 }).notNull().default('0'),
  currentBalance: decimal("current_balance", { precision: 10, scale: 2 }).notNull().default('0'),
  academicYear: text("academic_year").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment Transactions table (for recording individual payments)
export const paymentTransactions = pgTable("payment_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentAccountId: varchar("student_account_id").notNull().references(() => studentAccounts.id),
  studentId: varchar("student_id").notNull().references(() => students.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: text("payment_method"), // cash, bank_transfer, card, etc.
  receiptNumber: text("receipt_number"),
  notes: text("notes"),
  recordedBy: varchar("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications/Communications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // announcement, alert, reminder, event
  targetAudience: text("target_audience").notNull(), // all, students, parents, teachers, specific_class
  targetClassId: varchar("target_class_id").references(() => classes.id),
  priority: text("priority").notNull().default('normal'), // low, normal, high, urgent
  isRead: boolean("is_read").notNull().default(false),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// School Settings table
export const schoolSettings = pgTable("school_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolName: text("school_name").notNull(),
  schoolNameArabic: text("school_name_arabic").notNull(),
  currentAcademicYear: text("current_academic_year").notNull(),
  currency: text("currency").notNull().default('SAR'),
  dateType: dateTypeEnum("date_type").notNull().default('gregorian'),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default('#3b82f6'),
  accentColor: text("accent_color").default('#10b981'),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teacher Salaries table (monthly salary payments)
export const teacherSalaries = pgTable("teacher_salaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => teachers.id),
  month: text("month").notNull(), // e.g., "2025-01"
  baseSalary: decimal("base_salary", { precision: 10, scale: 2 }).notNull(),
  bonuses: decimal("bonuses", { precision: 10, scale: 2 }).notNull().default('0'),
  deductions: decimal("deductions", { precision: 10, scale: 2 }).notNull().default('0'),
  advancesDeducted: decimal("advances_deducted", { precision: 10, scale: 2 }).notNull().default('0'),
  netSalary: decimal("net_salary", { precision: 10, scale: 2 }).notNull(),
  paymentDate: date("payment_date"),
  status: text("status").notNull().default('pending'), // pending, paid
  notes: text("notes"),
  recordedBy: varchar("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teacher Advances table (salary advances)
export const teacherAdvances = pgTable("teacher_advances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => teachers.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  advanceDate: date("advance_date").notNull(),
  deductionMonth: text("deduction_month"), // e.g., "2025-02" - when it will be deducted
  status: text("status").notNull().default('pending'), // pending, deducted
  notes: text("notes"),
  recordedBy: varchar("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// School Expenses table (daily expenses)
export const schoolExpenses = pgTable("school_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(), // utilities, maintenance, supplies, transportation, etc.
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  expenseDate: date("expense_date").notNull(),
  paymentMethod: text("payment_method"), // cash, bank_transfer, card
  receiptNumber: text("receipt_number"),
  vendorName: text("vendor_name"),
  notes: text("notes"),
  recordedBy: varchar("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teacher Attendance table (حضور وغياب المعلمين)
export const teacherAttendance = pgTable("teacher_attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => teachers.id),
  date: date("date").notNull(),
  status: teacherAttendanceStatusEnum("status").notNull(),
  deductFromSalary: boolean("deduct_from_salary").notNull().default(false), // true for unpaid_leave
  notes: text("notes"),
  recordedBy: varchar("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const studentsRelations = relations(students, ({ one, many }) => ({
  class: one(classes, {
    fields: [students.classId],
    references: [classes.id],
  }),
  grades: many(grades),
  attendance: many(attendance),
  payments: many(payments),
  account: one(studentAccounts),
  paymentTransactions: many(paymentTransactions),
}));

export const teachersRelations = relations(teachers, ({ many }) => ({
  classes: many(classes),
  classSubjects: many(classSubjects),
  grades: many(grades),
  attendanceRecords: many(attendance),
  salaries: many(teacherSalaries),
  advances: many(teacherAdvances),
  teacherAttendance: many(teacherAttendance),
}));

export const educationLevelsRelations = relations(educationLevels, ({ many }) => ({
  classes: many(classes),
  classSubjects: many(classSubjects),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  educationLevel: one(educationLevels, {
    fields: [classes.educationLevelId],
    references: [educationLevels.id],
  }),
  teacher: one(teachers, {
    fields: [classes.teacherId],
    references: [teachers.id],
  }),
  students: many(students),
  grades: many(grades),
  attendance: many(attendance),
  notifications: many(notifications),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  classSubjects: many(classSubjects),
  grades: many(grades),
}));

export const classSubjectsRelations = relations(classSubjects, ({ one }) => ({
  educationLevel: one(educationLevels, {
    fields: [classSubjects.educationLevelId],
    references: [educationLevels.id],
  }),
  subject: one(subjects, {
    fields: [classSubjects.subjectId],
    references: [subjects.id],
  }),
  teacher: one(teachers, {
    fields: [classSubjects.teacherId],
    references: [teachers.id],
  }),
}));

export const gradesRelations = relations(grades, ({ one }) => ({
  student: one(students, {
    fields: [grades.studentId],
    references: [students.id],
  }),
  subject: one(subjects, {
    fields: [grades.subjectId],
    references: [subjects.id],
  }),
  class: one(classes, {
    fields: [grades.classId],
    references: [classes.id],
  }),
  teacher: one(teachers, {
    fields: [grades.teacherId],
    references: [teachers.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(students, {
    fields: [attendance.studentId],
    references: [students.id],
  }),
  class: one(classes, {
    fields: [attendance.classId],
    references: [classes.id],
  }),
  recordedByTeacher: one(teachers, {
    fields: [attendance.recordedBy],
    references: [teachers.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  student: one(students, {
    fields: [payments.studentId],
    references: [students.id],
  }),
}));

export const studentAccountsRelations = relations(studentAccounts, ({ one, many }) => ({
  student: one(students, {
    fields: [studentAccounts.studentId],
    references: [students.id],
  }),
  transactions: many(paymentTransactions),
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
  studentAccount: one(studentAccounts, {
    fields: [paymentTransactions.studentAccountId],
    references: [studentAccounts.id],
  }),
  student: one(students, {
    fields: [paymentTransactions.studentId],
    references: [students.id],
  }),
  recordedByUser: one(users, {
    fields: [paymentTransactions.recordedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  targetClass: one(classes, {
    fields: [notifications.targetClassId],
    references: [classes.id],
  }),
  creator: one(users, {
    fields: [notifications.createdBy],
    references: [users.id],
  }),
}));

export const teacherSalariesRelations = relations(teacherSalaries, ({ one }) => ({
  teacher: one(teachers, {
    fields: [teacherSalaries.teacherId],
    references: [teachers.id],
  }),
  recordedByUser: one(users, {
    fields: [teacherSalaries.recordedBy],
    references: [users.id],
  }),
}));

export const teacherAdvancesRelations = relations(teacherAdvances, ({ one }) => ({
  teacher: one(teachers, {
    fields: [teacherAdvances.teacherId],
    references: [teachers.id],
  }),
  recordedByUser: one(users, {
    fields: [teacherAdvances.recordedBy],
    references: [users.id],
  }),
}));

export const schoolExpensesRelations = relations(schoolExpenses, ({ one }) => ({
  recordedByUser: one(users, {
    fields: [schoolExpenses.recordedBy],
    references: [users.id],
  }),
}));

export const teacherAttendanceRelations = relations(teacherAttendance, ({ one }) => ({
  teacher: one(teachers, {
    fields: [teacherAttendance.teacherId],
    references: [teachers.id],
  }),
  recordedByUser: one(users, {
    fields: [teacherAttendance.recordedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTeacherUserSchema = createInsertSchema(teacherUsers).omit({
  id: true,
  createdAt: true,
});

export const insertParentStudentSchema = createInsertSchema(parentStudents).omit({
  id: true,
  createdAt: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
});

export const insertEducationLevelSchema = createInsertSchema(educationLevels).omit({
  id: true,
  createdAt: true,
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
});

export const insertClassSubjectSchema = createInsertSchema(classSubjects).omit({
  id: true,
  createdAt: true,
});

export const insertSectionSubjectTeacherSchema = createInsertSchema(sectionSubjectTeachers).omit({
  id: true,
  createdAt: true,
});

export const insertGradeSchema = createInsertSchema(grades).omit({
  id: true,
  createdAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertSchoolSettingsSchema = createInsertSchema(schoolSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertStudentAccountSchema = createInsertSchema(studentAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertTeacherSalarySchema = createInsertSchema(teacherSalaries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeacherAdvanceSchema = createInsertSchema(teacherAdvances).omit({
  id: true,
  createdAt: true,
});

export const insertSchoolExpenseSchema = createInsertSchema(schoolExpenses).omit({
  id: true,
  createdAt: true,
});

export const insertTeacherAttendanceSchema = createInsertSchema(teacherAttendance).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Teacher = typeof teachers.$inferSelect;

export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;

export type InsertEducationLevel = z.infer<typeof insertEducationLevelSchema>;
export type EducationLevel = typeof educationLevels.$inferSelect;

export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;

export type InsertClassSubject = z.infer<typeof insertClassSubjectSchema>;
export type ClassSubject = typeof classSubjects.$inferSelect;

export type InsertSectionSubjectTeacher = z.infer<typeof insertSectionSubjectTeacherSchema>;
export type SectionSubjectTeacher = typeof sectionSubjectTeachers.$inferSelect;

export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Grade = typeof grades.$inferSelect;

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertSchoolSettings = z.infer<typeof insertSchoolSettingsSchema>;
export type SchoolSettings = typeof schoolSettings.$inferSelect;

export type InsertStudentAccount = z.infer<typeof insertStudentAccountSchema>;
export type StudentAccount = typeof studentAccounts.$inferSelect;

export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;

export type InsertTeacherSalary = z.infer<typeof insertTeacherSalarySchema>;
export type TeacherSalary = typeof teacherSalaries.$inferSelect;

export type InsertTeacherAdvance = z.infer<typeof insertTeacherAdvanceSchema>;
export type TeacherAdvance = typeof teacherAdvances.$inferSelect;

export type InsertSchoolExpense = z.infer<typeof insertSchoolExpenseSchema>;
export type SchoolExpense = typeof schoolExpenses.$inferSelect;

export type InsertTeacherAttendance = z.infer<typeof insertTeacherAttendanceSchema>;
export type TeacherAttendance = typeof teacherAttendance.$inferSelect;

export type InsertTeacherUser = z.infer<typeof insertTeacherUserSchema>;
export type TeacherUser = typeof teacherUsers.$inferSelect;

export type InsertParentStudent = z.infer<typeof insertParentStudentSchema>;
export type ParentStudent = typeof parentStudents.$inferSelect;
