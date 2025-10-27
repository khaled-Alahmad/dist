import { 
  users, students, teachers, subjects, classes, classSubjects, educationLevels,
  grades, attendance, payments, notifications, schoolSettings,
  studentAccounts, paymentTransactions, teacherSalaries, teacherAdvances, schoolExpenses,
  teacherAttendance, teacherUsers, parentStudents, sectionSubjectTeachers,
  type User, type InsertUser,
  type Student, type InsertStudent,
  type Teacher, type InsertTeacher,
  type Subject, type InsertSubject,
  type EducationLevel, type InsertEducationLevel,
  type Class, type InsertClass,
  type ClassSubject, type InsertClassSubject,
  type SectionSubjectTeacher, type InsertSectionSubjectTeacher,
  type Grade, type InsertGrade,
  type Attendance, type InsertAttendance,
  type Payment, type InsertPayment,
  type Notification, type InsertNotification,
  type SchoolSettings, type InsertSchoolSettings,
  type StudentAccount, type InsertStudentAccount,
  type PaymentTransaction, type InsertPaymentTransaction,
  type TeacherSalary, type InsertTeacherSalary,
  type TeacherAdvance, type InsertTeacherAdvance,
  type SchoolExpense, type InsertSchoolExpense,
  type TeacherAttendance, type InsertTeacherAttendance,
  type TeacherUser, type InsertTeacherUser,
  type ParentStudent, type InsertParentStudent,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, like, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Teacher Users (linking)
  createTeacherUser(teacherUser: InsertTeacherUser): Promise<TeacherUser>;
  getTeacherUserByUserId(userId: string): Promise<TeacherUser | undefined>;
  deleteTeacherUserByUserId(userId: string): Promise<void>;
  deleteTeacherUserByTeacherId(teacherId: string): Promise<void>;
  canTeacherAccessStudent(teacherId: string, studentId: string, subjectId?: string): Promise<boolean>;
  canTeacherAccessClass(teacherId: string, classId: string): Promise<boolean>;
  
  // Parent Students (linking)
  createParentStudent(parentStudent: InsertParentStudent): Promise<ParentStudent>;
  getParentStudentsByUserId(userId: string): Promise<ParentStudent[]>;
  deleteParentStudentsByUserId(userId: string): Promise<void>;
  
  // Students
  getAllStudents(): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  getStudentsByClass(classId: string): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: string): Promise<void>;
  searchStudents(query: string): Promise<Student[]>;
  
  // Teachers
  getAllTeachers(): Promise<Teacher[]>;
  getTeacher(id: string): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: string, teacher: Partial<InsertTeacher>): Promise<Teacher>;
  deleteTeacher(id: string): Promise<void>;
  
  // Subjects
  getAllSubjects(): Promise<Subject[]>;
  getSubject(id: string): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: string, subject: Partial<InsertSubject>): Promise<Subject>;
  deleteSubject(id: string): Promise<void>;
  
  // Education Levels (المراحل الدراسية)
  getAllEducationLevels(): Promise<EducationLevel[]>;
  getEducationLevel(id: string): Promise<EducationLevel | undefined>;
  createEducationLevel(level: InsertEducationLevel): Promise<EducationLevel>;
  updateEducationLevel(id: string, level: Partial<InsertEducationLevel>): Promise<EducationLevel>;
  deleteEducationLevel(id: string): Promise<void>;
  
  // Classes
  getAllClasses(): Promise<Class[]>;
  getClass(id: string): Promise<Class | undefined>;
  getClassesByEducationLevel(levelId: string): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: string, classData: Partial<InsertClass>): Promise<Class>;
  deleteClass(id: string): Promise<void>;
  
  // Class Subjects (Grade-level)
  getGradeSubjects(educationLevelId: string, grade: string): Promise<ClassSubject[]>;
  getAllClassSubjects(): Promise<ClassSubject[]>;
  createClassSubject(classSubject: InsertClassSubject): Promise<ClassSubject>;
  deleteClassSubject(id: string): Promise<void>;
  
  // Section Subject Teachers (Teacher Assignments)
  getAllSectionSubjectTeachers(): Promise<SectionSubjectTeacher[]>;
  getTeacherAssignments(teacherId: string): Promise<SectionSubjectTeacher[]>;
  getClassSubjectTeachers(classId: string, subjectId: string): Promise<SectionSubjectTeacher[]>;
  getTeacherClasses(teacherId: string): Promise<Class[]>;
  getTeacherSubjectsInClass(teacherId: string, classId: string): Promise<Subject[]>;
  createSectionSubjectTeacher(assignment: InsertSectionSubjectTeacher): Promise<SectionSubjectTeacher>;
  deleteSectionSubjectTeacher(id: string): Promise<void>;
  canTeacherAccessSubjectInClass(teacherId: string, classId: string, subjectId: string): Promise<boolean>;
  
  // Grades
  getAllGrades(): Promise<Grade[]>;
  getStudentGrades(studentId: string): Promise<Grade[]>;
  getClassGrades(classId: string): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  updateGrade(id: string, grade: Partial<InsertGrade>): Promise<Grade>;
  deleteGrade(id: string): Promise<void>;
  
  // Attendance
  getStudentAttendance(studentId: string, startDate?: string, endDate?: string): Promise<Attendance[]>;
  getClassAttendance(classId: string, date: string): Promise<Attendance[]>;
  getAllAttendance(): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, attendance: Partial<InsertAttendance>): Promise<Attendance>;
  
  // Payments
  getStudentPayments(studentId: string): Promise<Payment[]>;
  getAllPayments(): Promise<Payment[]>;
  getPendingPayments(): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment>;
  
  // Notifications
  getAllNotifications(): Promise<Notification[]>;
  getNotification(id: string): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  
  // School Settings
  getSchoolSettings(): Promise<SchoolSettings | undefined>;
  updateSchoolSettings(settings: Partial<InsertSchoolSettings>): Promise<SchoolSettings>;
  
  // Student Accounts (Accounting)
  getStudentAccount(studentId: string): Promise<StudentAccount | undefined>;
  createStudentAccount(account: InsertStudentAccount): Promise<StudentAccount>;
  updateStudentAccount(id: string, account: Partial<InsertStudentAccount>): Promise<StudentAccount>;
  getAllStudentAccounts(): Promise<StudentAccount[]>;
  
  // Payment Transactions
  getStudentTransactions(studentId: string): Promise<PaymentTransaction[]>;
  createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction>;
  getAllTransactions(): Promise<PaymentTransaction[]>;
  deletePaymentTransaction(id: string): Promise<void>;
  
  // Teacher Salaries
  getTeacherSalaries(teacherId: string): Promise<TeacherSalary[]>;
  getAllTeacherSalaries(month?: string): Promise<TeacherSalary[]>;
  createTeacherSalary(salary: InsertTeacherSalary): Promise<TeacherSalary>;
  updateTeacherSalary(id: string, salary: Partial<InsertTeacherSalary>): Promise<TeacherSalary>;
  deleteTeacherSalary(id: string): Promise<void>;
  
  // Teacher Advances
  getTeacherAdvances(teacherId: string): Promise<TeacherAdvance[]>;
  getAllTeacherAdvances(status?: string): Promise<TeacherAdvance[]>;
  createTeacherAdvance(advance: InsertTeacherAdvance): Promise<TeacherAdvance>;
  updateTeacherAdvance(id: string, advance: Partial<InsertTeacherAdvance>): Promise<TeacherAdvance>;
  deleteTeacherAdvance(id: string): Promise<void>;
  
  // School Expenses
  getAllSchoolExpenses(startDate?: string, endDate?: string): Promise<SchoolExpense[]>;
  getSchoolExpensesByCategory(category: string): Promise<SchoolExpense[]>;
  createSchoolExpense(expense: InsertSchoolExpense): Promise<SchoolExpense>;
  updateSchoolExpense(id: string, expense: Partial<InsertSchoolExpense>): Promise<SchoolExpense>;
  deleteSchoolExpense(id: string): Promise<void>;
  
  // Teacher Attendance
  getTeacherAttendance(teacherId: string, startDate?: string, endDate?: string): Promise<TeacherAttendance[]>;
  getAllTeacherAttendance(date?: string): Promise<TeacherAttendance[]>;
  createTeacherAttendance(attendance: InsertTeacherAttendance): Promise<TeacherAttendance>;
  updateTeacherAttendance(id: string, attendance: Partial<InsertTeacherAttendance>): Promise<TeacherAttendance>;
  deleteTeacherAttendance(id: string): Promise<void>;
  getTeacherUnpaidLeaveDays(teacherId: string, month: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Teacher Users (linking)
  async createTeacherUser(teacherUser: InsertTeacherUser): Promise<TeacherUser> {
    const [created] = await db.insert(teacherUsers).values(teacherUser).returning();
    return created;
  }

  async getTeacherUserByUserId(userId: string): Promise<TeacherUser | undefined> {
    const result = await db.select().from(teacherUsers).where(eq(teacherUsers.userId, userId));
    return result[0];
  }

  async deleteTeacherUserByUserId(userId: string): Promise<void> {
    await db.delete(teacherUsers).where(eq(teacherUsers.userId, userId));
  }

  async deleteTeacherUserByTeacherId(teacherId: string): Promise<void> {
    await db.delete(teacherUsers).where(eq(teacherUsers.teacherId, teacherId));
  }

  async canTeacherAccessStudent(teacherId: string, studentId: string, subjectId?: string): Promise<boolean> {
    const student = await this.getStudent(studentId);
    if (!student || !student.classId) return false;

    const studentClass = await this.getClass(student.classId);
    if (!studentClass) return false;

    if (studentClass.teacherId === teacherId) {
      return true;
    }

    if (subjectId && studentClass.educationLevelId && studentClass.grade) {
      const [classSubject] = await db
        .select()
        .from(classSubjects)
        .where(
          and(
            eq(classSubjects.teacherId, teacherId),
            eq(classSubjects.subjectId, subjectId),
            eq(classSubjects.educationLevelId, studentClass.educationLevelId),
            eq(classSubjects.grade, studentClass.grade)
          )
        );
      
      if (classSubject) return true;
    }

    return false;
  }

  async canTeacherAccessClass(teacherId: string, classId: string): Promise<boolean> {
    const classData = await this.getClass(classId);
    if (!classData) return false;

    if (classData.teacherId === teacherId) {
      return true;
    }

    if (classData.educationLevelId && classData.grade) {
      const [classSubject] = await db
        .select()
        .from(classSubjects)
        .where(
          and(
            eq(classSubjects.teacherId, teacherId),
            eq(classSubjects.educationLevelId, classData.educationLevelId),
            eq(classSubjects.grade, classData.grade)
          )
        );
      
      if (classSubject) return true;
    }

    return false;
  }

  // Parent Students (linking)
  async createParentStudent(parentStudent: InsertParentStudent): Promise<ParentStudent> {
    const [created] = await db.insert(parentStudents).values(parentStudent).returning();
    return created;
  }

  async getParentStudentsByUserId(userId: string): Promise<ParentStudent[]> {
    return await db.select().from(parentStudents).where(eq(parentStudents.userId, userId));
  }

  async deleteParentStudentsByUserId(userId: string): Promise<void> {
    await db.delete(parentStudents).where(eq(parentStudents.userId, userId));
  }

  // Students
  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(students).orderBy(desc(students.createdAt));
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async getStudentsByClass(classId: string): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.classId, classId));
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student> {
    const [updated] = await db.update(students)
      .set({ ...student, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return updated;
  }

  async deleteStudent(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(paymentTransactions).where(eq(paymentTransactions.studentId, id));
      await tx.delete(studentAccounts).where(eq(studentAccounts.studentId, id));
      await tx.delete(payments).where(eq(payments.studentId, id));
      await tx.delete(attendance).where(eq(attendance.studentId, id));
      await tx.delete(grades).where(eq(grades.studentId, id));
      await tx.delete(students).where(eq(students.id, id));
    });
  }

  async searchStudents(query: string): Promise<Student[]> {
    return await db.select().from(students)
      .where(like(students.arabicName, `%${query}%`))
      .orderBy(desc(students.createdAt));
  }

  // Teachers
  async getAllTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers).orderBy(desc(teachers.createdAt));
  }

  async getTeacher(id: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher || undefined;
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const [newTeacher] = await db.insert(teachers).values(teacher).returning();
    return newTeacher;
  }

  async updateTeacher(id: string, teacher: Partial<InsertTeacher>): Promise<Teacher> {
    const [updated] = await db.update(teachers)
      .set({ ...teacher, updatedAt: new Date() })
      .where(eq(teachers.id, id))
      .returning();
    return updated;
  }

  async deleteTeacher(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(teacherAdvances).where(eq(teacherAdvances.teacherId, id));
      await tx.delete(teacherSalaries).where(eq(teacherSalaries.teacherId, id));
      await tx.delete(classSubjects).where(eq(classSubjects.teacherId, id));
      await tx.update(classes).set({ teacherId: null }).where(eq(classes.teacherId, id));
      await tx.update(grades).set({ teacherId: null }).where(eq(grades.teacherId, id));
      await tx.update(attendance).set({ recordedBy: null }).where(eq(attendance.recordedBy, id));
      await tx.delete(teachers).where(eq(teachers.id, id));
    });
  }

  // Subjects
  async getAllSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects).orderBy(subjects.arabicName);
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject || undefined;
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [newSubject] = await db.insert(subjects).values(subject).returning();
    return newSubject;
  }

  async updateSubject(id: string, subject: Partial<InsertSubject>): Promise<Subject> {
    const [updated] = await db.update(subjects)
      .set(subject)
      .where(eq(subjects.id, id))
      .returning();
    return updated;
  }

  async deleteSubject(id: string): Promise<void> {
    await db.delete(subjects).where(eq(subjects.id, id));
  }

  // Education Levels
  async getAllEducationLevels(): Promise<EducationLevel[]> {
    return await db.select().from(educationLevels).orderBy(educationLevels.order);
  }

  async getEducationLevel(id: string): Promise<EducationLevel | undefined> {
    const [level] = await db.select().from(educationLevels).where(eq(educationLevels.id, id));
    return level || undefined;
  }

  async createEducationLevel(level: InsertEducationLevel): Promise<EducationLevel> {
    const [newLevel] = await db.insert(educationLevels).values(level).returning();
    return newLevel;
  }

  async updateEducationLevel(id: string, level: Partial<InsertEducationLevel>): Promise<EducationLevel> {
    const [updated] = await db.update(educationLevels)
      .set(level)
      .where(eq(educationLevels.id, id))
      .returning();
    return updated;
  }

  async deleteEducationLevel(id: string): Promise<void> {
    await db.delete(educationLevels).where(eq(educationLevels.id, id));
  }

  // Classes
  async getAllClasses(): Promise<Class[]> {
    return await db.select().from(classes).orderBy(classes.grade, classes.section);
  }

  async getClass(id: string): Promise<Class | undefined> {
    const [classData] = await db.select().from(classes).where(eq(classes.id, id));
    return classData || undefined;
  }

  async getClassesByEducationLevel(levelId: string): Promise<Class[]> {
    return await db.select().from(classes).where(eq(classes.educationLevelId, levelId)).orderBy(classes.grade, classes.section);
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [newClass] = await db.insert(classes).values(classData).returning();
    return newClass;
  }

  async updateClass(id: string, classData: Partial<InsertClass>): Promise<Class> {
    const [updated] = await db.update(classes)
      .set(classData)
      .where(eq(classes.id, id))
      .returning();
    return updated;
  }

  async deleteClass(id: string): Promise<void> {
    await db.delete(classes).where(eq(classes.id, id));
  }

  // Class Subjects (Grade-level)
  async getGradeSubjects(educationLevelId: string, grade: string): Promise<ClassSubject[]> {
    return await db.select().from(classSubjects)
      .where(and(
        eq(classSubjects.educationLevelId, educationLevelId),
        eq(classSubjects.grade, grade)
      ));
  }

  async getAllClassSubjects(): Promise<ClassSubject[]> {
    return await db.select().from(classSubjects);
  }

  async createClassSubject(classSubject: InsertClassSubject): Promise<ClassSubject> {
    const [newClassSubject] = await db.insert(classSubjects).values(classSubject).returning();
    return newClassSubject;
  }

  async deleteClassSubject(id: string): Promise<void> {
    await db.delete(classSubjects).where(eq(classSubjects.id, id));
  }

  // Section Subject Teachers (Teacher Assignments)
  async getAllSectionSubjectTeachers(): Promise<SectionSubjectTeacher[]> {
    return await db.select().from(sectionSubjectTeachers);
  }

  async getTeacherAssignments(teacherId: string): Promise<SectionSubjectTeacher[]> {
    return await db.select().from(sectionSubjectTeachers).where(eq(sectionSubjectTeachers.teacherId, teacherId));
  }

  async getClassSubjectTeachers(classId: string, subjectId: string): Promise<SectionSubjectTeacher[]> {
    return await db.select().from(sectionSubjectTeachers)
      .where(and(
        eq(sectionSubjectTeachers.classId, classId),
        eq(sectionSubjectTeachers.subjectId, subjectId)
      ));
  }

  async getTeacherClasses(teacherId: string): Promise<Class[]> {
    const assignments = await db.select().from(sectionSubjectTeachers)
      .where(eq(sectionSubjectTeachers.teacherId, teacherId));
    
    const classIds = Array.from(new Set(assignments.map(a => a.classId)));
    if (classIds.length === 0) return [];
    
    return await db.select().from(classes)
      .where(sql`${classes.id} IN ${sql.raw(`(${classIds.map(id => `'${id}'`).join(',')})`)}`);
  }

  async getTeacherSubjectsInClass(teacherId: string, classId: string): Promise<Subject[]> {
    const assignments = await db.select().from(sectionSubjectTeachers)
      .where(and(
        eq(sectionSubjectTeachers.teacherId, teacherId),
        eq(sectionSubjectTeachers.classId, classId)
      ));
    
    const subjectIds = assignments.map(a => a.subjectId);
    if (subjectIds.length === 0) return [];
    
    return await db.select().from(subjects)
      .where(sql`${subjects.id} IN ${sql.raw(`(${subjectIds.map(id => `'${id}'`).join(',')})`)}`);
  }

  async createSectionSubjectTeacher(assignment: InsertSectionSubjectTeacher): Promise<SectionSubjectTeacher> {
    const [newAssignment] = await db.insert(sectionSubjectTeachers).values(assignment).returning();
    return newAssignment;
  }

  async deleteSectionSubjectTeacher(id: string): Promise<void> {
    await db.delete(sectionSubjectTeachers).where(eq(sectionSubjectTeachers.id, id));
  }

  async canTeacherAccessSubjectInClass(teacherId: string, classId: string, subjectId: string): Promise<boolean> {
    const assignment = await db.select().from(sectionSubjectTeachers)
      .where(and(
        eq(sectionSubjectTeachers.teacherId, teacherId),
        eq(sectionSubjectTeachers.classId, classId),
        eq(sectionSubjectTeachers.subjectId, subjectId)
      ))
      .limit(1);
    
    return assignment.length > 0;
  }

  // Grades
  async getAllGrades(): Promise<Grade[]> {
    return await db.select().from(grades)
      .orderBy(desc(grades.date));
  }

  async getStudentGrades(studentId: string): Promise<Grade[]> {
    return await db.select().from(grades)
      .where(eq(grades.studentId, studentId))
      .orderBy(desc(grades.date));
  }

  async getClassGrades(classId: string): Promise<Grade[]> {
    return await db.select().from(grades)
      .where(eq(grades.classId, classId))
      .orderBy(desc(grades.date));
  }

  async createGrade(grade: InsertGrade): Promise<Grade> {
    const [newGrade] = await db.insert(grades)
      .values(grade)
      .returning();
    return newGrade;
  }

  async updateGrade(id: string, grade: Partial<InsertGrade>): Promise<Grade> {
    const [updated] = await db.update(grades)
      .set(grade)
      .where(eq(grades.id, id))
      .returning();
    return updated;
  }

  async deleteGrade(id: string): Promise<void> {
    await db.delete(grades).where(eq(grades.id, id));
  }

  // Attendance
  async getStudentAttendance(studentId: string, startDate?: string, endDate?: string): Promise<Attendance[]> {
    if (startDate && endDate) {
      return await db.select().from(attendance)
        .where(
          and(
            eq(attendance.studentId, studentId),
            gte(attendance.date, startDate),
            lte(attendance.date, endDate)
          )
        )
        .orderBy(desc(attendance.date));
    }
    
    return await db.select().from(attendance)
      .where(eq(attendance.studentId, studentId))
      .orderBy(desc(attendance.date));
  }

  async getClassAttendance(classId: string, date: string): Promise<Attendance[]> {
    return await db.select().from(attendance)
      .where(and(
        eq(attendance.classId, classId),
        eq(attendance.date, date)
      ));
  }

  async getAllAttendance(): Promise<Attendance[]> {
    return await db.select().from(attendance);
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db.insert(attendance).values(attendanceData).returning();
    return newAttendance;
  }

  async updateAttendance(id: string, attendanceData: Partial<InsertAttendance>): Promise<Attendance> {
    const [updated] = await db.update(attendance)
      .set(attendanceData)
      .where(eq(attendance.id, id))
      .returning();
    return updated;
  }

  // Payments
  async getStudentPayments(studentId: string): Promise<Payment[]> {
    return await db.select().from(payments)
      .where(eq(payments.studentId, studentId))
      .orderBy(desc(payments.dueDate));
  }

  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.dueDate));
  }

  async getPendingPayments(): Promise<Payment[]> {
    return await db.select().from(payments)
      .where(eq(payments.status, 'pending'))
      .orderBy(desc(payments.dueDate));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment> {
    const [updated] = await db.update(payments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  // Notifications
  async getAllNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification || undefined;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  // School Settings
  async getSchoolSettings(): Promise<SchoolSettings | undefined> {
    const [settings] = await db.select().from(schoolSettings).limit(1);
    return settings || undefined;
  }

  async updateSchoolSettings(settings: Partial<InsertSchoolSettings>): Promise<SchoolSettings> {
    const existing = await this.getSchoolSettings();
    
    if (existing) {
      const [updated] = await db.update(schoolSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(schoolSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(schoolSettings)
        .values(settings as InsertSchoolSettings)
        .returning();
      return created;
    }
  }

  // Student Accounts
  async getStudentAccount(studentId: string): Promise<StudentAccount | undefined> {
    const [account] = await db.select().from(studentAccounts)
      .where(eq(studentAccounts.studentId, studentId));
    return account || undefined;
  }

  async createStudentAccount(account: InsertStudentAccount): Promise<StudentAccount> {
    const [newAccount] = await db.insert(studentAccounts).values(account).returning();
    return newAccount;
  }

  async updateStudentAccount(id: string, account: Partial<InsertStudentAccount>): Promise<StudentAccount> {
    const [updated] = await db.update(studentAccounts)
      .set({ ...account, updatedAt: new Date() })
      .where(eq(studentAccounts.id, id))
      .returning();
    return updated;
  }

  async getAllStudentAccounts(): Promise<StudentAccount[]> {
    return await db.select().from(studentAccounts).orderBy(desc(studentAccounts.createdAt));
  }

  // Payment Transactions
  async getStudentTransactions(studentId: string): Promise<PaymentTransaction[]> {
    return await db.select().from(paymentTransactions)
      .where(eq(paymentTransactions.studentId, studentId))
      .orderBy(desc(paymentTransactions.paymentDate));
  }

  async createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const [newTransaction] = await db.insert(paymentTransactions).values(transaction).returning();
    return newTransaction;
  }

  async getAllTransactions(): Promise<PaymentTransaction[]> {
    return await db.select().from(paymentTransactions).orderBy(desc(paymentTransactions.paymentDate));
  }

  async deletePaymentTransaction(id: string): Promise<void> {
    const [transaction] = await db.select().from(paymentTransactions).where(eq(paymentTransactions.id, id));
    if (!transaction) return;

    await db.delete(paymentTransactions).where(eq(paymentTransactions.id, id));

    const account = await this.getStudentAccount(transaction.studentId);
    if (account) {
      const newTotalPaid = Number(account.totalPaid) - Number(transaction.amount);
      const newBalance = Number(account.totalAmountDue) - newTotalPaid;
      await this.updateStudentAccount(account.id, {
        totalPaid: newTotalPaid.toFixed(2),
        currentBalance: newBalance.toFixed(2),
      });
    }
  }

  // Teacher Salaries
  async getTeacherSalaries(teacherId: string): Promise<TeacherSalary[]> {
    return await db.select().from(teacherSalaries)
      .where(eq(teacherSalaries.teacherId, teacherId))
      .orderBy(desc(teacherSalaries.month));
  }

  async getAllTeacherSalaries(month?: string): Promise<TeacherSalary[]> {
    if (month) {
      return await db.select().from(teacherSalaries)
        .where(eq(teacherSalaries.month, month))
        .orderBy(desc(teacherSalaries.createdAt));
    }
    return await db.select().from(teacherSalaries).orderBy(desc(teacherSalaries.month));
  }

  async createTeacherSalary(salary: InsertTeacherSalary): Promise<TeacherSalary> {
    const [newSalary] = await db.insert(teacherSalaries).values(salary).returning();
    return newSalary;
  }

  async updateTeacherSalary(id: string, salary: Partial<InsertTeacherSalary>): Promise<TeacherSalary> {
    const [updated] = await db.update(teacherSalaries)
      .set({ ...salary, updatedAt: new Date() })
      .where(eq(teacherSalaries.id, id))
      .returning();
    return updated;
  }

  async deleteTeacherSalary(id: string): Promise<void> {
    await db.delete(teacherSalaries).where(eq(teacherSalaries.id, id));
  }

  // Teacher Advances
  async getTeacherAdvances(teacherId: string): Promise<TeacherAdvance[]> {
    return await db.select().from(teacherAdvances)
      .where(eq(teacherAdvances.teacherId, teacherId))
      .orderBy(desc(teacherAdvances.advanceDate));
  }

  async getAllTeacherAdvances(status?: string): Promise<TeacherAdvance[]> {
    if (status) {
      return await db.select().from(teacherAdvances)
        .where(eq(teacherAdvances.status, status))
        .orderBy(desc(teacherAdvances.advanceDate));
    }
    return await db.select().from(teacherAdvances).orderBy(desc(teacherAdvances.advanceDate));
  }

  async createTeacherAdvance(advance: InsertTeacherAdvance): Promise<TeacherAdvance> {
    const [newAdvance] = await db.insert(teacherAdvances).values(advance).returning();
    return newAdvance;
  }

  async updateTeacherAdvance(id: string, advance: Partial<InsertTeacherAdvance>): Promise<TeacherAdvance> {
    const [updated] = await db.update(teacherAdvances)
      .set(advance)
      .where(eq(teacherAdvances.id, id))
      .returning();
    return updated;
  }

  async deleteTeacherAdvance(id: string): Promise<void> {
    await db.delete(teacherAdvances).where(eq(teacherAdvances.id, id));
  }

  // School Expenses
  async getAllSchoolExpenses(startDate?: string, endDate?: string): Promise<SchoolExpense[]> {
    if (startDate && endDate) {
      return await db.select().from(schoolExpenses)
        .where(and(
          gte(schoolExpenses.expenseDate, startDate),
          lte(schoolExpenses.expenseDate, endDate)
        ))
        .orderBy(desc(schoolExpenses.expenseDate));
    }
    return await db.select().from(schoolExpenses).orderBy(desc(schoolExpenses.expenseDate));
  }

  async getSchoolExpensesByCategory(category: string): Promise<SchoolExpense[]> {
    return await db.select().from(schoolExpenses)
      .where(eq(schoolExpenses.category, category))
      .orderBy(desc(schoolExpenses.expenseDate));
  }

  async createSchoolExpense(expense: InsertSchoolExpense): Promise<SchoolExpense> {
    const [newExpense] = await db.insert(schoolExpenses).values(expense).returning();
    return newExpense;
  }

  async updateSchoolExpense(id: string, expense: Partial<InsertSchoolExpense>): Promise<SchoolExpense> {
    const [updated] = await db.update(schoolExpenses)
      .set(expense)
      .where(eq(schoolExpenses.id, id))
      .returning();
    return updated;
  }

  async deleteSchoolExpense(id: string): Promise<void> {
    await db.delete(schoolExpenses).where(eq(schoolExpenses.id, id));
  }

  // Teacher Attendance
  async getTeacherAttendance(teacherId: string, startDate?: string, endDate?: string): Promise<TeacherAttendance[]> {
    let conditions = [eq(teacherAttendance.teacherId, teacherId)];
    
    if (startDate && endDate) {
      conditions.push(gte(teacherAttendance.date, startDate));
      conditions.push(lte(teacherAttendance.date, endDate));
    }
    
    return await db.select().from(teacherAttendance)
      .where(and(...conditions))
      .orderBy(desc(teacherAttendance.date));
  }

  async getAllTeacherAttendance(date?: string): Promise<TeacherAttendance[]> {
    if (date) {
      return await db.select().from(teacherAttendance)
        .where(eq(teacherAttendance.date, date))
        .orderBy(teacherAttendance.teacherId);
    }
    return await db.select().from(teacherAttendance).orderBy(desc(teacherAttendance.date));
  }

  async createTeacherAttendance(attendance: InsertTeacherAttendance): Promise<TeacherAttendance> {
    const [newAttendance] = await db.insert(teacherAttendance).values(attendance).returning();
    return newAttendance;
  }

  async updateTeacherAttendance(id: string, attendance: Partial<InsertTeacherAttendance>): Promise<TeacherAttendance> {
    const [updated] = await db.update(teacherAttendance)
      .set(attendance)
      .where(eq(teacherAttendance.id, id))
      .returning();
    return updated;
  }

  async deleteTeacherAttendance(id: string): Promise<void> {
    await db.delete(teacherAttendance).where(eq(teacherAttendance.id, id));
  }

  async getTeacherUnpaidLeaveDays(teacherId: string, month: string): Promise<number> {
    // Calculate start and end dates for the month
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0];
    
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(teacherAttendance)
      .where(and(
        eq(teacherAttendance.teacherId, teacherId),
        eq(teacherAttendance.deductFromSalary, true),
        gte(teacherAttendance.date, startDate),
        lte(teacherAttendance.date, endDate)
      ));
    
    return Number(result[0]?.count || 0);
  }
}

export const storage = new DatabaseStorage();
