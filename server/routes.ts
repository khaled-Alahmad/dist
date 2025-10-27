import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { 
  insertStudentSchema, insertTeacherSchema, insertSubjectSchema, 
  insertEducationLevelSchema, insertClassSchema, insertClassSubjectSchema, insertGradeSchema,
  insertAttendanceSchema, insertPaymentSchema, insertNotificationSchema,
  insertSchoolSettingsSchema, insertStudentAccountSchema, insertPaymentTransactionSchema,
  insertTeacherSalarySchema, insertTeacherAdvanceSchema, insertSchoolExpenseSchema,
  insertTeacherAttendanceSchema, insertUserSchema, insertSectionSubjectTeacherSchema,
  type InsertUser, type Grade
} from "@shared/schema";

// Middleware للتأكد من تسجيل الدخول
function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
  }
  next();
}

// Middleware للتأكد من صلاحيات الإدارة
function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "غير مصرح بهذا الإجراء" });
  }
  next();
}

// Middleware للتأكد من صلاحيات الإدارة أو المعلم
function requireAdminOrTeacher(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    console.log("[requireAdminOrTeacher] Not authenticated");
    return res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
  }
  console.log("[requireAdminOrTeacher] User:", { id: req.user?.id, username: req.user?.username, role: req.user?.role });
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    console.log("[requireAdminOrTeacher] DENIED - Invalid role:", req.user.role);
    return res.status(403).json({ error: "غير مصرح بهذا الإجراء" });
  }
  console.log("[requireAdminOrTeacher] ALLOWED");
  next();
}

// Middleware للتأكد من صلاحيات الإدارة أو ولي الأمر
function requireAdminOrParent(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
  }
  if (req.user.role !== 'admin' && req.user.role !== 'parent') {
    return res.status(403).json({ error: "غير مصرح بهذا الإجراء" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Setup authentication
  setupAuth(app);
  
  // ==================== USERS ROUTES (ADMIN ONLY) ====================
  
  // Get current logged-in user
  app.get("/api/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      // Validate input with schema
      const validationResult = insertUserSchema.safeParse({
        username: req.body.username,
        password: req.body.password,
        fullName: req.body.fullName,
        email: req.body.email,
        role: req.body.role,
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "بيانات غير صحيحة",
          details: validationResult.error.errors 
        });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validationResult.data.username);
      if (existingUser) {
        return res.status(400).send("اسم المستخدم موجود مسبقاً");
      }

      // Hash password and create user
      const userData = {
        ...validationResult.data,
        password: await hashPassword(validationResult.data.password),
      };

      const user = await storage.createUser(userData);

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      // Prevent admin from deleting themselves
      if (req.params.id === req.user!.id) {
        return res.status(400).json({ error: "لا يمكنك حذف حسابك الخاص" });
      }
      
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Update user (admin only)
  app.patch("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { username, fullName, email, role } = req.body;
      const updateData: Partial<InsertUser> = {};
      
      // Check if username is being changed and if it already exists
      if (username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== req.params.id) {
          return res.status(400).json({ error: "اسم المستخدم موجود مسبقاً" });
        }
        updateData.username = username;
      }
      if (fullName) updateData.fullName = fullName;
      if (email) updateData.email = email;
      if (role) updateData.role = role;

      const user = await storage.updateUser(req.params.id, updateData);
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Reset user password (admin only)
  app.post("/api/users/:id/reset-password", requireAdmin, async (req, res) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(req.params.id, { password: hashedPassword });
      res.json({ message: "تم إعادة تعيين كلمة المرور بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Link teacher to user (admin only)
  app.post("/api/teacher-users", requireAdmin, async (req, res) => {
    try {
      const { userId, teacherId } = req.body;
      
      // Delete existing link for this user (if changing teacher)
      await storage.deleteTeacherUserByUserId(userId);
      
      // Delete existing link for this teacher (if reassigning to different user)
      await storage.deleteTeacherUserByTeacherId(teacherId);
      
      // Create new link
      const teacherUser = await storage.createTeacherUser({ userId, teacherId });
      res.status(201).json(teacherUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to link teacher to user" });
    }
  });

  // Get teacher linked to user
  app.get("/api/teacher-users/:userId", requireAdmin, async (req, res) => {
    try {
      const teacherUser = await storage.getTeacherUserByUserId(req.params.userId);
      res.json(teacherUser || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teacher user" });
    }
  });

  // Link parent to students (admin only)
  app.post("/api/parent-students", requireAdmin, async (req, res) => {
    try {
      const { userId, studentIds, relationship } = req.body;
      
      // Delete existing links
      await storage.deleteParentStudentsByUserId(userId);
      
      // Create new links for all students
      const links = [];
      for (const studentId of studentIds) {
        const link = await storage.createParentStudent({
          userId,
          studentId,
          relationship: relationship || 'parent'
        });
        links.push(link);
      }
      
      res.status(201).json(links);
    } catch (error) {
      res.status(500).json({ error: "Failed to link parent to students" });
    }
  });

  // Get students linked to parent
  app.get("/api/parent-students/:userId", requireAdmin, async (req, res) => {
    try {
      const parentStudents = await storage.getParentStudentsByUserId(req.params.userId);
      res.json(parentStudents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch parent students" });
    }
  });
  
  // ==================== STUDENTS ROUTES (ADMIN ONLY) ====================
  app.get("/api/students", requireAdmin, async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", requireAdmin, async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student" });
    }
  });

  app.get("/api/students/class/:classId", requireAdminOrTeacher, async (req, res) => {
    try {
      if (req.user!.role === 'teacher') {
        const teacherUser = await storage.getTeacherUserByUserId(req.user!.id);
        if (!teacherUser) {
          return res.status(403).json({ error: "لم يتم ربط حسابك بمعلم" });
        }
        
        const canAccess = await storage.canTeacherAccessClass(
          teacherUser.teacherId,
          req.params.classId
        );
        
        if (!canAccess) {
          return res.status(403).json({ error: "غير مصرح لك بالوصول لطلاب هذا الصف" });
        }
      }
      
      const students = await storage.getStudentsByClass(req.params.classId);
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students by class" });
    }
  });

  app.post("/api/students", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      res.status(400).json({ error: "Invalid student data" });
    }
  });

  app.patch("/api/students/:id", requireAdmin, async (req, res) => {
    try {
      const { id, createdAt, updatedAt, ...updateData } = req.body;
      const updateSchema = insertStudentSchema.partial();
      const validatedData = updateSchema.parse(updateData);
      const student = await storage.updateStudent(req.params.id, validatedData);
      res.json(student);
    } catch (error) {
      res.status(400).json({ error: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteStudent(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  app.get("/api/students/search/:query", requireAdmin, async (req, res) => {
    try {
      const students = await storage.searchStudents(req.params.query);
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Failed to search students" });
    }
  });

  // ==================== TEACHERS ROUTES ====================
  app.get("/api/teachers", async (req, res) => {
    try {
      const teachers = await storage.getAllTeachers();
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teachers" });
    }
  });

  // Get teacher's assigned classes (MUST be before /api/teachers/:id)
  app.get("/api/teachers/my-classes", requireAdminOrTeacher, async (req, res) => {
    try {
      // If admin, return all classes
      if (req.user!.role === 'admin') {
        const classes = await storage.getAllClasses();
        return res.json(classes);
      }

      // Get teacher user link
      const teacherUser = await storage.getTeacherUserByUserId(req.user!.id);
      if (!teacherUser) {
        return res.status(404).json({ error: "المعلم غير موجود" });
      }

      const classes = await storage.getTeacherClasses(teacherUser.teacherId);
      res.json(classes);
    } catch (error) {
      console.error("Error fetching teacher classes:", error);
      res.status(500).json({ error: "فشل جلب الشعب المعينة للمعلم" });
    }
  });

  // Get teacher's subjects in a specific class
  app.get("/api/teachers/my-subjects/:classId", requireAdminOrTeacher, async (req, res) => {
    try {
      const { classId } = req.params;

      // If admin, return all subjects for that class's grade
      if (req.user!.role === 'admin') {
        const classData = await storage.getClass(classId);
        if (!classData || !classData.grade || !classData.educationLevelId) {
          return res.status(404).json({ error: "الشعبة غير موجودة" });
        }
        const classSubjects = await storage.getGradeSubjects(classData.educationLevelId, classData.grade);
        
        // Get full subject details
        const subjectIds = classSubjects.map(cs => cs.subjectId);
        const subjects = [];
        for (const subjectId of subjectIds) {
          const subject = await storage.getSubject(subjectId);
          if (subject) {
            subjects.push(subject);
          }
        }
        
        res.json(subjects);
        return;
      }

      // Get teacher user link
      const teacherUser = await storage.getTeacherUserByUserId(req.user!.id);
      if (!teacherUser) {
        return res.status(404).json({ error: "المعلم غير موجود" });
      }

      const subjects = await storage.getTeacherSubjectsInClass(teacherUser.teacherId, classId);
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching teacher subjects:", error);
      res.status(500).json({ error: "فشل جلب المواد المعينة للمعلم" });
    }
  });

  // Get students in a class (for teachers - only if assigned to that class)
  app.get("/api/teachers/my-students/:classId", requireAdminOrTeacher, async (req, res) => {
    try {
      const { classId } = req.params;

      // If admin, return all students in class
      if (req.user!.role === 'admin') {
        const students = await storage.getStudentsByClass(classId);
        return res.json(students);
      }

      // Get teacher user link
      const teacherUser = await storage.getTeacherUserByUserId(req.user!.id);
      if (!teacherUser) {
        return res.status(404).json({ error: "المعلم غير موجود" });
      }

      // Check if teacher has access to this class
      const canAccess = await storage.canTeacherAccessClass(teacherUser.teacherId, classId);
      if (!canAccess) {
        return res.status(403).json({ error: "غير مصرح لك بالوصول لهذه الشعبة" });
      }

      const students = await storage.getStudentsByClass(classId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ error: "فشل جلب الطلاب" });
    }
  });

  // Get grades for teacher's students only
  app.get("/api/teachers/my-grades", requireAdminOrTeacher, async (req, res) => {
    try {
      // If admin, return all grades
      if (req.user!.role === 'admin') {
        const grades = await storage.getAllGrades();
        return res.json(grades);
      }

      // Get teacher user link
      const teacherUser = await storage.getTeacherUserByUserId(req.user!.id);
      if (!teacherUser) {
        return res.status(404).json({ error: "المعلم غير موجود" });
      }

      // Get all classes assigned to this teacher
      const classes = await storage.getTeacherClasses(teacherUser.teacherId);
      
      // Get all grades for students in these classes
      const allGrades: Grade[] = [];
      for (const cls of classes) {
        const students = await storage.getStudentsByClass(cls.id);
        for (const student of students) {
          const studentGrades = await storage.getStudentGrades(student.id);
          allGrades.push(...studentGrades);
        }
      }

      res.json(allGrades);
    } catch (error) {
      console.error("Error fetching teacher grades:", error);
      res.status(500).json({ error: "فشل جلب العلامات" });
    }
  });

  // Admin-only CRUD routes for teachers (MUST be after /api/teachers/my-* routes)
  app.get("/api/teachers/:id", requireAdmin, async (req, res) => {
    try {
      const teacher = await storage.getTeacher(req.params.id);
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }
      res.json(teacher);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teacher" });
    }
  });

  app.post("/api/teachers", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertTeacherSchema.parse(req.body);
      const teacher = await storage.createTeacher(validatedData);
      res.status(201).json(teacher);
    } catch (error: any) {
      console.error("Teacher creation error:", error);
      
      if (error.code === '23505' && error.constraint === 'teachers_email_unique') {
        return res.status(400).json({ error: "البريد الإلكتروني موجود بالفعل. الرجاء استخدام بريد آخر." });
      }
      
      res.status(400).json({ error: "خطأ في البيانات المدخلة" });
    }
  });

  app.patch("/api/teachers/:id", requireAdmin, async (req, res) => {
    try {
      const { id, createdAt, updatedAt, ...updateData } = req.body;
      const updateSchema = insertTeacherSchema.partial();
      const validatedData = updateSchema.parse(updateData);
      const teacher = await storage.updateTeacher(req.params.id, validatedData);
      res.json(teacher);
    } catch (error: any) {
      console.error("Teacher update error:", error);
      
      if (error.code === '23505' && error.constraint === 'teachers_email_unique') {
        return res.status(400).json({ error: "البريد الإلكتروني موجود بالفعل. الرجاء استخدام بريد آخر." });
      }
      
      res.status(400).json({ error: "فشل تحديث بيانات المعلم" });
    }
  });

  app.delete("/api/teachers/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteTeacher(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete teacher" });
    }
  });

  // ==================== SECTION SUBJECT TEACHERS (TEACHER ASSIGNMENTS) ====================
  
  // Create teacher assignment (Admin only)
  app.post("/api/section-subject-teachers", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertSectionSubjectTeacherSchema.parse(req.body);
      const assignment = await storage.createSectionSubjectTeacher(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating teacher assignment:", error);
      res.status(400).json({ error: "فشل تعيين المعلم للمادة" });
    }
  });

  // Get all teacher assignments (Admin only)
  app.get("/api/section-subject-teachers", requireAdmin, async (req, res) => {
    try {
      const assignments = await storage.getAllSectionSubjectTeachers();
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ error: "فشل جلب التعيينات" });
    }
  });

  // Get assignments for a specific teacher (Admin only)
  app.get("/api/section-subject-teachers/teacher/:teacherId", requireAdmin, async (req, res) => {
    try {
      const assignments = await storage.getTeacherAssignments(req.params.teacherId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching teacher assignments:", error);
      res.status(500).json({ error: "فشل جلب تعيينات المعلم" });
    }
  });

  // Delete teacher assignment (Admin only)
  app.delete("/api/section-subject-teachers/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteSectionSubjectTeacher(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting teacher assignment:", error);
      res.status(500).json({ error: "فشل حذف التعيين" });
    }
  });

  // ==================== SUBJECTS ROUTES ====================
  app.get("/api/subjects", requireAdmin, async (req, res) => {
    try {
      const subjects = await storage.getAllSubjects();
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subjects" });
    }
  });

  app.post("/api/subjects", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(validatedData);
      res.status(201).json(subject);
    } catch (error) {
      res.status(400).json({ error: "Invalid subject data" });
    }
  });

  app.patch("/api/subjects/:id", requireAdmin, async (req, res) => {
    try {
      const { id, createdAt, ...updateData } = req.body;
      const updateSchema = insertSubjectSchema.partial();
      const validatedData = updateSchema.parse(updateData);
      const subject = await storage.updateSubject(req.params.id, validatedData);
      res.json(subject);
    } catch (error) {
      res.status(400).json({ error: "Failed to update subject" });
    }
  });

  app.delete("/api/subjects/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteSubject(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete subject" });
    }
  });

  // ==================== EDUCATION LEVELS ROUTES ====================
  app.get("/api/education-levels", requireAdminOrTeacher, async (req, res) => {
    try {
      const levels = await storage.getAllEducationLevels();
      res.json(levels);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch education levels" });
    }
  });

  app.get("/api/education-levels/:id", requireAdmin, async (req, res) => {
    try {
      const level = await storage.getEducationLevel(req.params.id);
      if (!level) {
        return res.status(404).json({ error: "Education level not found" });
      }
      res.json(level);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch education level" });
    }
  });

  app.post("/api/education-levels", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertEducationLevelSchema.parse(req.body);
      const level = await storage.createEducationLevel(validatedData);
      res.status(201).json(level);
    } catch (error) {
      res.status(400).json({ error: "Invalid education level data" });
    }
  });

  app.patch("/api/education-levels/:id", requireAdmin, async (req, res) => {
    try {
      const { id, ...updateData } = req.body;
      const updateSchema = insertEducationLevelSchema.partial();
      const validatedData = updateSchema.parse(updateData);
      const level = await storage.updateEducationLevel(req.params.id, validatedData);
      res.json(level);
    } catch (error) {
      res.status(400).json({ error: "Failed to update education level" });
    }
  });

  app.delete("/api/education-levels/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteEducationLevel(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete education level" });
    }
  });

  // ==================== CLASSES ROUTES ====================
  app.get("/api/classes", requireAdmin, async (req, res) => {
    try {
      const classes = await storage.getAllClasses();
      res.json(classes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch classes" });
    }
  });

  app.get("/api/classes/:id", requireAdminOrTeacher, async (req, res) => {
    try {
      const classData = await storage.getClass(req.params.id);
      if (!classData) {
        return res.status(404).json({ error: "Class not found" });
      }
      res.json(classData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch class" });
    }
  });

  app.get("/api/classes/level/:levelId", requireAdminOrTeacher, async (req, res) => {
    try {
      const classes = await storage.getClassesByEducationLevel(req.params.levelId);
      res.json(classes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch classes by education level" });
    }
  });

  app.post("/api/classes", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertClassSchema.parse(req.body);
      const classData = await storage.createClass(validatedData);
      res.status(201).json(classData);
    } catch (error) {
      res.status(400).json({ error: "Invalid class data" });
    }
  });

  app.patch("/api/classes/:id", requireAdmin, async (req, res) => {
    try {
      const { id, createdAt, ...updateData } = req.body;
      const updateSchema = insertClassSchema.partial();
      const validatedData = updateSchema.parse(updateData);
      const classData = await storage.updateClass(req.params.id, validatedData);
      res.json(classData);
    } catch (error) {
      res.status(400).json({ error: "Failed to update class" });
    }
  });

  app.delete("/api/classes/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteClass(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete class" });
    }
  });

  // ==================== CLASS SUBJECTS ROUTES ====================
  app.get("/api/class-subjects", requireAdmin, async (req, res) => {
    try {
      const classSubjects = await storage.getAllClassSubjects();
      res.json(classSubjects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch class subjects" });
    }
  });

  app.get("/api/grade-subjects/:educationLevelId/:grade", requireAdmin, async (req, res) => {
    try {
      const classSubjects = await storage.getGradeSubjects(req.params.educationLevelId, req.params.grade);
      res.json(classSubjects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch grade subjects" });
    }
  });

  app.post("/api/class-subjects", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertClassSubjectSchema.parse(req.body);
      const classSubject = await storage.createClassSubject(validatedData);
      res.status(201).json(classSubject);
    } catch (error) {
      res.status(400).json({ error: "Invalid class subject data" });
    }
  });

  app.delete("/api/class-subjects/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteClassSubject(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete class subject" });
    }
  });

  // ==================== GRADES ROUTES ====================
  app.get("/api/grades", requireAdminOrTeacher, async (req, res) => {
    try {
      const grades = await storage.getAllGrades();
      res.json(grades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all grades" });
    }
  });

  app.get("/api/grades/class/all", requireAdminOrTeacher, async (req, res) => {
    try {
      const grades = await storage.getAllGrades();
      res.json(grades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all grades" });
    }
  });

  app.get("/api/grades/student/:studentId", requireAdminOrTeacher, async (req, res) => {
    try {
      if (req.user!.role === 'teacher') {
        const teacherUser = await storage.getTeacherUserByUserId(req.user!.id);
        if (!teacherUser) {
          return res.status(403).json({ error: "لم يتم ربط حسابك بمعلم" });
        }
        
        const canAccess = await storage.canTeacherAccessStudent(
          teacherUser.teacherId,
          req.params.studentId
        );
        
        if (!canAccess) {
          return res.status(403).json({ error: "غير مصرح لك بالوصول لعلامات هذا الطالب" });
        }
      }
      
      const grades = await storage.getStudentGrades(req.params.studentId);
      res.json(grades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student grades" });
    }
  });

  app.get("/api/grades/class/:classId", requireAdminOrTeacher, async (req, res) => {
    try {
      if (req.user!.role === 'teacher') {
        const teacherUser = await storage.getTeacherUserByUserId(req.user!.id);
        if (!teacherUser) {
          return res.status(403).json({ error: "لم يتم ربط حسابك بمعلم" });
        }
        
        const canAccess = await storage.canTeacherAccessClass(
          teacherUser.teacherId,
          req.params.classId
        );
        
        if (!canAccess) {
          return res.status(403).json({ error: "غير مصرح لك بالوصول لعلامات هذا الصف" });
        }
      }
      
      const grades = await storage.getClassGrades(req.params.classId);
      res.json(grades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch class grades" });
    }
  });

  app.post("/api/grades", requireAdminOrTeacher, async (req, res) => {
    try {
      const validatedData = insertGradeSchema.parse(req.body);
      
      if (req.user!.role === 'teacher') {
        const teacherUser = await storage.getTeacherUserByUserId(req.user!.id);
        if (!teacherUser) {
          return res.status(403).json({ error: "لم يتم ربط حسابك بمعلم" });
        }
        
        const canAccess = await storage.canTeacherAccessStudent(
          teacherUser.teacherId,
          validatedData.studentId,
          validatedData.subjectId
        );
        
        if (!canAccess) {
          return res.status(403).json({ error: "غير مصرح لك بإضافة علامات لهذا الطالب" });
        }
      }
      
      const scoreNum = parseFloat(validatedData.score as string);
      const maxScoreNum = parseFloat(validatedData.maxScore as string);
      
      if (scoreNum > maxScoreNum) {
        return res.status(400).json({ 
          error: `العلامة التي حصل عليها الطالب (${validatedData.score}) لا يمكن أن تزيد عن العلامة النهائية (${validatedData.maxScore})` 
        });
      }
      
      const grade = await storage.createGrade(validatedData);
      res.status(201).json(grade);
    } catch (error) {
      res.status(400).json({ error: "Invalid grade data" });
    }
  });

  app.patch("/api/grades/:id", requireAdminOrTeacher, async (req, res) => {
    try {
      const { id, createdAt, ...updateData } = req.body;
      const updateSchema = insertGradeSchema.partial();
      const validatedData = updateSchema.parse(updateData);
      
      if (req.user!.role === 'teacher') {
        const teacherUser = await storage.getTeacherUserByUserId(req.user!.id);
        if (!teacherUser) {
          return res.status(403).json({ error: "لم يتم ربط حسابك بمعلم" });
        }
        
        if (validatedData.studentId) {
          const canAccess = await storage.canTeacherAccessStudent(
            teacherUser.teacherId,
            validatedData.studentId,
            validatedData.subjectId
          );
          
          if (!canAccess) {
            return res.status(403).json({ error: "غير مصرح لك بتعديل علامات هذا الطالب" });
          }
        }
      }
      
      if (validatedData.score && validatedData.maxScore) {
        const scoreNum = parseFloat(validatedData.score);
        const maxScoreNum = parseFloat(validatedData.maxScore);
        
        if (scoreNum > maxScoreNum) {
          return res.status(400).json({ 
            error: `العلامة التي حصل عليها الطالب (${validatedData.score}) لا يمكن أن تزيد عن العلامة النهائية (${validatedData.maxScore})` 
          });
        }
      }
      
      const grade = await storage.updateGrade(req.params.id, validatedData);
      res.json(grade);
    } catch (error) {
      res.status(400).json({ error: "Failed to update grade" });
    }
  });

  app.delete("/api/grades/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteGrade(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete grade" });
    }
  });

  // ==================== ATTENDANCE ROUTES ====================
  app.get("/api/attendance/student/:studentId", requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const attendance = await storage.getStudentAttendance(
        req.params.studentId, 
        startDate as string, 
        endDate as string
      );
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student attendance" });
    }
  });

  app.get("/api/attendance/class/:classId/:date", requireAdmin, async (req, res) => {
    try {
      const attendance = await storage.getClassAttendance(req.params.classId, req.params.date);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch class attendance" });
    }
  });

  app.post("/api/attendance", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(validatedData);
      res.status(201).json(attendance);
    } catch (error) {
      res.status(400).json({ error: "Invalid attendance data" });
    }
  });

  app.patch("/api/attendance/:id", requireAdmin, async (req, res) => {
    try {
      const { id, createdAt, ...updateData } = req.body;
      const updateSchema = insertAttendanceSchema.partial();
      const validatedData = updateSchema.parse(updateData);
      const attendance = await storage.updateAttendance(req.params.id, validatedData);
      res.json(attendance);
    } catch (error) {
      res.status(400).json({ error: "Failed to update attendance" });
    }
  });

  // ==================== PAYMENTS ROUTES ====================
  app.get("/api/payments", requireAdmin, async (req, res) => {
    try {
      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/student/:studentId", requireAdmin, async (req, res) => {
    try {
      const payments = await storage.getStudentPayments(req.params.studentId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student payments" });
    }
  });

  app.get("/api/payments/pending", requireAdmin, async (req, res) => {
    try {
      const payments = await storage.getPendingPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending payments" });
    }
  });

  app.post("/api/payments", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ error: "Invalid payment data" });
    }
  });

  app.patch("/api/payments/:id", requireAdmin, async (req, res) => {
    try {
      const { id, createdAt, updatedAt, ...updateData } = req.body;
      const updateSchema = insertPaymentSchema.partial();
      const validatedData = updateSchema.parse(updateData);
      const payment = await storage.updatePayment(req.params.id, validatedData);
      res.json(payment);
    } catch (error) {
      res.status(400).json({ error: "Failed to update payment" });
    }
  });

  // ==================== ACCOUNTING ROUTES ====================
  app.get("/api/accounting/accounts", async (req, res) => {
    try {
      const accounts = await storage.getAllStudentAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student accounts" });
    }
  });

  app.get("/api/accounting/accounts/:studentId", async (req, res) => {
    try {
      const account = await storage.getStudentAccount(req.params.studentId);
      if (!account) {
        return res.status(404).json({ error: "Student account not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student account" });
    }
  });

  app.post("/api/accounting/accounts", async (req, res) => {
    try {
      const validatedData = insertStudentAccountSchema.parse(req.body);
      const account = await storage.createStudentAccount(validatedData);
      res.status(201).json(account);
    } catch (error) {
      res.status(400).json({ error: "Invalid account data" });
    }
  });

  app.patch("/api/accounting/accounts/:id", async (req, res) => {
    try {
      const { id, createdAt, updatedAt, ...updateData } = req.body;
      const updateSchema = insertStudentAccountSchema.partial();
      const validatedData = updateSchema.parse(updateData);
      const account = await storage.updateStudentAccount(req.params.id, validatedData);
      res.json(account);
    } catch (error) {
      res.status(400).json({ error: "Failed to update account" });
    }
  });

  app.post("/api/accounting/payments", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertPaymentTransactionSchema.parse(req.body);
      const transaction = await storage.createPaymentTransaction(validatedData);
      
      const account = await storage.getStudentAccount(validatedData.studentId);
      if (account) {
        const newTotalPaid = Number(account.totalPaid) + Number(validatedData.amount);
        const newBalance = Number(account.totalAmountDue) - newTotalPaid;
        
        await storage.updateStudentAccount(account.id, {
          totalPaid: newTotalPaid.toString(),
          currentBalance: newBalance.toString(),
        });
      }
      
      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ error: "Invalid payment transaction data" });
    }
  });

  app.get("/api/accounting/transactions/:studentId", async (req, res) => {
    try {
      const transactions = await storage.getStudentTransactions(req.params.studentId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student transactions" });
    }
  });

  app.get("/api/accounting/transactions", async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all transactions" });
    }
  });

  app.delete("/api/accounting/transactions/:id", async (req, res) => {
    try {
      await storage.deletePaymentTransaction(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete payment transaction" });
    }
  });

  // ==================== NOTIFICATIONS ROUTES ====================
  app.get("/api/notifications", requireAdmin, async (req, res) => {
    try {
      const notifications = await storage.getAllNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      res.status(400).json({ error: "Invalid notification data" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAdmin, async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // ==================== SCHOOL SETTINGS ROUTES ====================
  // GET متاح للجميع (حتى بدون تسجيل دخول) - لعرض اسم المدرسة في صفحة تسجيل الدخول
  app.get("/api/school-settings", async (req, res) => {
    try {
      const settings = await storage.getSchoolSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch school settings" });
    }
  });

  app.patch("/api/school-settings", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertSchoolSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateSchoolSettings(validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Failed to update school settings:", error);
      res.status(400).json({ error: "Failed to update school settings" });
    }
  });

  // ==================== TEACHER SALARIES ROUTES ====================
  app.get("/api/teacher-salaries/:teacherId", async (req, res) => {
    try {
      const salaries = await storage.getTeacherSalaries(req.params.teacherId);
      res.json(salaries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teacher salaries" });
    }
  });

  app.get("/api/teacher-salaries", async (req, res) => {
    try {
      const { month } = req.query;
      const salaries = await storage.getAllTeacherSalaries(month as string);
      res.json(salaries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all teacher salaries" });
    }
  });

  app.post("/api/teacher-salaries", async (req, res) => {
    try {
      const validatedData = insertTeacherSalarySchema.parse(req.body);
      
      const pendingAdvances = (await storage.getTeacherAdvances(validatedData.teacherId))
        .filter(advance => advance.status === 'pending');
      
      const totalAdvances = pendingAdvances.reduce((sum, advance) => 
        sum + Number(advance.amount), 0);
      
      // حساب عدد أيام الغياب بدون راتب في الشهر
      const unpaidLeaveDays = await storage.getTeacherUnpaidLeaveDays(
        validatedData.teacherId, 
        validatedData.month
      );
      
      // حساب قيمة الخصم من الغياب (الراتب الشهري / 30 × عدد أيام الغياب)
      const baseAmount = Number(validatedData.baseSalary);
      const unpaidLeaveDeduction = unpaidLeaveDays > 0 
        ? (baseAmount / 30) * unpaidLeaveDays 
        : 0;
      
      const bonusAmount = Number(validatedData.bonuses || 0);
      const deductionAmount = Number(validatedData.deductions || 0);
      
      // إضافة خصم الغياب إلى الخصومات
      const totalDeductions = deductionAmount + unpaidLeaveDeduction;
      
      const grossSalary = baseAmount + bonusAmount - totalDeductions;
      const netSalary = Math.max(0, grossSalary - totalAdvances);
      
      const salaryData = {
        ...validatedData,
        deductions: totalDeductions.toFixed(2),
        advancesDeducted: totalAdvances.toFixed(2),
        netSalary: netSalary.toFixed(2),
      };
      
      const salary = await storage.createTeacherSalary(salaryData);
      
      for (const advance of pendingAdvances) {
        await storage.updateTeacherAdvance(advance.id, { status: 'deducted' });
      }
      
      res.status(201).json(salary);
    } catch (error) {
      console.error('Teacher salary creation error:', error);
      res.status(400).json({ error: "Invalid teacher salary data" });
    }
  });

  app.patch("/api/teacher-salaries/:id", async (req, res) => {
    try {
      const { id, createdAt, updatedAt, ...updateData } = req.body;
      const updateSchema = insertTeacherSalarySchema.partial();
      const validatedData = updateSchema.parse(updateData);
      const salary = await storage.updateTeacherSalary(req.params.id, validatedData);
      res.json(salary);
    } catch (error) {
      res.status(400).json({ error: "Failed to update teacher salary" });
    }
  });

  app.delete("/api/teacher-salaries/:id", async (req, res) => {
    try {
      await storage.deleteTeacherSalary(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete teacher salary" });
    }
  });

  // ==================== TEACHER ADVANCES ROUTES ====================
  app.get("/api/teacher-advances/:teacherId", async (req, res) => {
    try {
      const advances = await storage.getTeacherAdvances(req.params.teacherId);
      res.json(advances);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teacher advances" });
    }
  });

  app.get("/api/teacher-advances", async (req, res) => {
    try {
      const { status } = req.query;
      const advances = await storage.getAllTeacherAdvances(status as string);
      res.json(advances);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all teacher advances" });
    }
  });

  app.post("/api/teacher-advances", async (req, res) => {
    try {
      console.log('[POST /api/teacher-advances] Request body:', req.body);
      const validatedData = insertTeacherAdvanceSchema.parse(req.body);
      
      const teacher = await storage.getTeacher(validatedData.teacherId);
      console.log('[POST /api/teacher-advances] Teacher found:', teacher ? `${teacher.arabicName} (${teacher.monthlySalary})` : 'not found');
      
      if (!teacher) {
        return res.status(404).json({ error: "المعلم غير موجود" });
      }
      
      const pendingAdvances = (await storage.getTeacherAdvances(validatedData.teacherId))
        .filter(advance => advance.status === 'pending');
      
      console.log('[POST /api/teacher-advances] Pending advances:', pendingAdvances.length);
      
      const totalPendingAdvances = pendingAdvances.reduce((sum, advance) => 
        sum + Number(advance.amount), 0);
      
      const newAdvanceAmount = Number(validatedData.amount);
      const totalWithNewAdvance = totalPendingAdvances + newAdvanceAmount;
      const monthlySalary = Number(teacher.monthlySalary);
      
      console.log('[POST /api/teacher-advances] Check:', {
        totalPendingAdvances,
        newAdvanceAmount,
        totalWithNewAdvance,
        monthlySalary,
        exceeds: totalWithNewAdvance > monthlySalary
      });
      
      if (totalWithNewAdvance > monthlySalary) {
        console.log('[POST /api/teacher-advances] REJECTED: Exceeds monthly salary');
        return res.status(400).json({ 
          error: `لا يمكن إضافة هذه السلفة. مجموع السلف المعلقة (${totalPendingAdvances.toFixed(2)}) + السلفة الجديدة (${newAdvanceAmount.toFixed(2)}) = ${totalWithNewAdvance.toFixed(2)} يتجاوز الراتب الشهري (${monthlySalary.toFixed(2)})`
        });
      }
      
      console.log('[POST /api/teacher-advances] ACCEPTED: Creating advance');
      const advance = await storage.createTeacherAdvance(validatedData);
      res.status(201).json(advance);
    } catch (error) {
      console.error('[POST /api/teacher-advances] Error:', error);
      if (error instanceof Error && 'error' in error) {
        return res.status(400).json(error);
      }
      res.status(400).json({ error: "بيانات السلفة غير صحيحة" });
    }
  });

  app.patch("/api/teacher-advances/:id", async (req, res) => {
    try {
      const { id, createdAt, ...updateData } = req.body;
      const updateSchema = insertTeacherAdvanceSchema.partial();
      const validatedData = updateSchema.parse(updateData);
      const advance = await storage.updateTeacherAdvance(req.params.id, validatedData);
      res.json(advance);
    } catch (error) {
      res.status(400).json({ error: "Failed to update teacher advance" });
    }
  });

  app.delete("/api/teacher-advances/:id", async (req, res) => {
    try {
      await storage.deleteTeacherAdvance(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete teacher advance" });
    }
  });

  // ==================== SCHOOL EXPENSES ROUTES ====================
  app.get("/api/school-expenses", requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const expenses = await storage.getAllSchoolExpenses(startDate as string, endDate as string);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch school expenses" });
    }
  });

  app.get("/api/school-expenses/category/:category", requireAdmin, async (req, res) => {
    try {
      const expenses = await storage.getSchoolExpensesByCategory(req.params.category);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses by category" });
    }
  });

  app.post("/api/school-expenses", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertSchoolExpenseSchema.parse(req.body);
      const expense = await storage.createSchoolExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      res.status(400).json({ error: "Invalid school expense data" });
    }
  });

  app.patch("/api/school-expenses/:id", requireAdmin, async (req, res) => {
    try {
      const { id, createdAt, ...updateData } = req.body;
      const updateSchema = insertSchoolExpenseSchema.partial();
      const validatedData = updateSchema.parse(updateData);
      const expense = await storage.updateSchoolExpense(req.params.id, validatedData);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ error: "Failed to update school expense" });
    }
  });

  app.delete("/api/school-expenses/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteSchoolExpense(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete school expense" });
    }
  });

  // ==================== TEACHER ATTENDANCE ROUTES ====================
  app.get("/api/teacher-attendance", requireAdmin, async (req, res) => {
    try {
      const { date } = req.query;
      const attendance = await storage.getAllTeacherAttendance(date as string);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teacher attendance" });
    }
  });

  app.get("/api/teacher-attendance/teacher/:teacherId", requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const attendance = await storage.getTeacherAttendance(
        req.params.teacherId, 
        startDate as string, 
        endDate as string
      );
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch teacher attendance" });
    }
  });

  app.get("/api/teacher-attendance/unpaid-days/:teacherId/:month", requireAdmin, async (req, res) => {
    try {
      const unpaidDays = await storage.getTeacherUnpaidLeaveDays(
        req.params.teacherId, 
        req.params.month
      );
      res.json({ unpaidDays });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate unpaid leave days" });
    }
  });

  app.post("/api/teacher-attendance", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertTeacherAttendanceSchema.parse(req.body);
      const attendance = await storage.createTeacherAttendance(validatedData);
      res.status(201).json(attendance);
    } catch (error) {
      res.status(400).json({ error: "بيانات الحضور غير صحيحة" });
    }
  });

  app.patch("/api/teacher-attendance/:id", requireAdmin, async (req, res) => {
    try {
      const { id, createdAt, ...updateData } = req.body;
      const updateSchema = insertTeacherAttendanceSchema.partial();
      const validatedData = updateSchema.parse(updateData);
      const attendance = await storage.updateTeacherAttendance(req.params.id, validatedData);
      res.json(attendance);
    } catch (error) {
      res.status(400).json({ error: "Failed to update teacher attendance" });
    }
  });

  app.delete("/api/teacher-attendance/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteTeacherAttendance(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete teacher attendance" });
    }
  });

  // ==================== DASHBOARD STATISTICS ROUTES ====================
  app.get("/api/dashboard/stats", requireAdmin, async (req, res) => {
    try {
      const { year, months } = req.query;
      
      const allStudents = await storage.getAllStudents();
      const allTeachers = await storage.getAllTeachers();
      const allClasses = await storage.getAllClasses();
      const accounts = await storage.getAllStudentAccounts();
      let transactions = await storage.getAllTransactions();
      let salaries = await storage.getAllTeacherSalaries();
      let advances = await storage.getAllTeacherAdvances();
      
      // Filter by year and months if provided
      if (year && months) {
        const selectedYear = parseInt(year as string);
        const selectedMonths = (months as string).split(',').map((m: string) => parseInt(m));
        
        // Filter transactions
        transactions = transactions.filter((t: any) => {
          if (!t.paymentDate) return false;
          const paymentDate = new Date(t.paymentDate);
          const paymentYear = paymentDate.getFullYear();
          const paymentMonth = paymentDate.getMonth() + 1;
          return paymentYear === selectedYear && selectedMonths.includes(paymentMonth);
        });
        
        // Filter salaries
        salaries = salaries.filter((s: any) => {
          const [yearStr, monthStr] = s.month.split('-');
          const year = parseInt(yearStr);
          const month = parseInt(monthStr);
          return year === selectedYear && selectedMonths.includes(month);
        });
        
        // Filter advances
        advances = advances.filter((a: any) => {
          if (!a.advanceDate) return false;
          const advanceDate = new Date(a.advanceDate);
          const advanceYear = advanceDate.getFullYear();
          const advanceMonth = advanceDate.getMonth() + 1;
          return advanceYear === selectedYear && selectedMonths.includes(advanceMonth);
        });
        
        // Get unique student IDs from transactions
        const studentIdsWithTransactions = new Set(transactions.map((t: any) => t.studentId));
        const studentsWithActivity = allStudents.filter(s => studentIdsWithTransactions.has(s.id));
        
        // Get unique teacher IDs from salaries and advances
        const teacherIdsWithActivity = new Set([
          ...salaries.map((s: any) => s.teacherId),
          ...advances.map((a: any) => a.teacherId)
        ]);
        const teachersWithActivity = allTeachers.filter(t => teacherIdsWithActivity.has(t.id));
        
        // Get classes that have students with transactions
        const classIdsWithActivity = new Set(
          studentsWithActivity.map(s => s.classId).filter(Boolean)
        );
        
        // Calculate stats (filtered)
        const totalStudents = studentsWithActivity.length;
        const activeStudents = studentsWithActivity.filter(s => s.status === 'active').length;
        const activeTeachers = teachersWithActivity.filter(t => t.status === 'active').length;
        const totalRevenue = transactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
        const pendingPayments = accounts.filter(acc => Number(acc.currentBalance) > 0).length;

        res.json({
          totalStudents,
          activeStudents,
          activeTeachers,
          totalRevenue,
          pendingPayments,
          totalClasses: classIdsWithActivity.size,
        });
      } else {
        // No filter - return all data
        const totalStudents = allStudents.length;
        const activeStudents = allStudents.filter(s => s.status === 'active').length;
        const activeTeachers = allTeachers.filter(t => t.status === 'active').length;
        
        // Get all school expenses
        const allExpenses = await storage.getAllSchoolExpenses();
        
        // Calculate totals for all time
        const revenue = transactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
        const expenses = allExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
        const salariesTotal = salaries.reduce((sum: number, s: any) => sum + Number(s.netSalary), 0);
        const totalRevenue = revenue - expenses - salariesTotal; // Net profit
        const pendingPayments = accounts.filter(acc => Number(acc.currentBalance) > 0).length;

        res.json({
          totalStudents,
          activeStudents,
          activeTeachers,
          totalRevenue,
          pendingPayments,
          totalClasses: allClasses.length,
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // ==================== DATABASE BACKUP ROUTE ====================
  app.get("/api/database/backup", async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      const teachers = await storage.getAllTeachers();
      const subjects = await storage.getAllSubjects();
      const educationLevels = await storage.getAllEducationLevels();
      const classes = await storage.getAllClasses();
      const classSubjects = await storage.getAllClassSubjects();
      const grades = await storage.getAllGrades();
      const attendance = await storage.getAllAttendance();
      const payments = await storage.getAllPayments();
      const accounts = await storage.getAllStudentAccounts();
      const transactions = await storage.getAllTransactions();
      const notifications = await storage.getAllNotifications();
      const settings = await storage.getSchoolSettings();
      const salaries = await storage.getAllTeacherSalaries();
      const advances = await storage.getAllTeacherAdvances();
      const expenses = await storage.getAllSchoolExpenses();

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `school_backup_${timestamp}.sql`;

      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // SQL Header (MySQL/phpMyAdmin compatible)
      let sql = `-- School Management System Database Backup\n`;
      sql += `-- Generated: ${new Date().toISOString()}\n`;
      sql += `-- Database: MySQL/MariaDB Compatible\n\n`;
      sql += `SET NAMES utf8mb4;\n`;
      sql += `SET CHARACTER SET utf8mb4;\n\n`;

      // Helper function to escape SQL strings for MySQL
      const escapeSql = (val: any): string => {
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'boolean') return val ? '1' : '0';
        if (typeof val === 'number') return val.toString();
        if (typeof val === 'string') return `'${val.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
        if (val instanceof Date) return `'${val.toISOString().replace('T', ' ').replace('Z', '').substring(0, 19)}'`;
        return `'${String(val).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
      };

      // Education Levels
      if (educationLevels.length > 0) {
        sql += `-- Education Levels\n`;
        sql += `INSERT INTO \`education_levels\` (\`id\`, \`name\`, \`order\`, \`description\`, \`created_at\`) VALUES\n`;
        sql += educationLevels.map((level: any) => 
          `(${escapeSql(level.id)}, ${escapeSql(level.name)}, ${escapeSql(level.order)}, ${escapeSql(level.description)}, ${escapeSql(level.createdAt)})`
        ).join(',\n') + ';\n\n';
      }

      // Classes
      if (classes.length > 0) {
        sql += `-- Classes\n`;
        sql += `INSERT INTO \`classes\` (\`id\`, \`education_level_id\`, \`name\`, \`grade\`, \`section\`, \`academic_year\`, \`capacity\`, \`room_number\`, \`teacher_id\`, \`created_at\`) VALUES\n`;
        sql += classes.map((cls: any) => 
          `(${escapeSql(cls.id)}, ${escapeSql(cls.educationLevelId)}, ${escapeSql(cls.name)}, ${escapeSql(cls.grade)}, ${escapeSql(cls.section)}, ${escapeSql(cls.academicYear)}, ${escapeSql(cls.capacity)}, ${escapeSql(cls.roomNumber)}, ${escapeSql(cls.teacherId)}, ${escapeSql(cls.createdAt)})`
        ).join(',\n') + ';\n\n';
      }

      // Students
      if (students.length > 0) {
        sql += `-- Students\n`;
        sql += `INSERT INTO \`students\` (\`id\`, \`arabic_name\`, \`date_of_birth\`, \`gender\`, \`national_id\`, \`enrollment_date\`, \`class_id\`, \`parent_name\`, \`parent_phone\`, \`parent_email\`, \`address\`, \`medical_notes\`, \`status\`, \`photo_url\`, \`created_at\`, \`updated_at\`) VALUES\n`;
        sql += students.map((student: any) => 
          `(${escapeSql(student.id)}, ${escapeSql(student.arabicName)}, ${escapeSql(student.dateOfBirth)}, ${escapeSql(student.gender)}, ${escapeSql(student.nationalId)}, ${escapeSql(student.enrollmentDate)}, ${escapeSql(student.classId)}, ${escapeSql(student.parentName)}, ${escapeSql(student.parentPhone)}, ${escapeSql(student.parentEmail)}, ${escapeSql(student.address)}, ${escapeSql(student.medicalNotes)}, ${escapeSql(student.status)}, ${escapeSql(student.photoUrl)}, ${escapeSql(student.createdAt)}, ${escapeSql(student.updatedAt)})`
        ).join(',\n') + ';\n\n';
      }

      // Teachers
      if (teachers.length > 0) {
        sql += `-- Teachers\n`;
        sql += `INSERT INTO \`teachers\` (\`id\`, \`arabic_name\`, \`email\`, \`phone\`, \`gender\`, \`date_of_birth\`, \`hire_date\`, \`qualification\`, \`specialization\`, \`monthly_salary\`, \`status\`, \`photo_url\`, \`created_at\`, \`updated_at\`) VALUES\n`;
        sql += teachers.map((teacher: any) => 
          `(${escapeSql(teacher.id)}, ${escapeSql(teacher.arabicName)}, ${escapeSql(teacher.email)}, ${escapeSql(teacher.phone)}, ${escapeSql(teacher.gender)}, ${escapeSql(teacher.dateOfBirth)}, ${escapeSql(teacher.hireDate)}, ${escapeSql(teacher.qualification)}, ${escapeSql(teacher.specialization)}, ${escapeSql(teacher.monthlySalary)}, ${escapeSql(teacher.status)}, ${escapeSql(teacher.photoUrl)}, ${escapeSql(teacher.createdAt)}, ${escapeSql(teacher.updatedAt)})`
        ).join(',\n') + ';\n\n';
      }

      // Subjects
      if (subjects.length > 0) {
        sql += `-- Subjects\n`;
        sql += `INSERT INTO \`subjects\` (\`id\`, \`name\`, \`arabic_name\`, \`code\`, \`description\`, \`created_at\`) VALUES\n`;
        sql += subjects.map((subject: any) => 
          `(${escapeSql(subject.id)}, ${escapeSql(subject.name)}, ${escapeSql(subject.arabicName)}, ${escapeSql(subject.code)}, ${escapeSql(subject.description)}, ${escapeSql(subject.createdAt)})`
        ).join(',\n') + ';\n\n';
      }

      // Class Subjects
      if (classSubjects.length > 0) {
        sql += `-- Class Subjects\n`;
        sql += `INSERT INTO \`class_subjects\` (\`id\`, \`class_id\`, \`subject_id\`, \`teacher_id\`, \`weekly_hours\`, \`created_at\`) VALUES\n`;
        sql += classSubjects.map((cs: any) => 
          `(${escapeSql(cs.id)}, ${escapeSql(cs.classId)}, ${escapeSql(cs.subjectId)}, ${escapeSql(cs.teacherId)}, ${escapeSql(cs.weeklyHours)}, ${escapeSql(cs.createdAt)})`
        ).join(',\n') + ';\n\n';
      }

      // Grades
      if (grades.length > 0) {
        sql += `-- Grades\n`;
        sql += `INSERT INTO \`grades\` (\`id\`, \`student_id\`, \`subject_id\`, \`class_id\`, \`semester\`, \`assessment_type\`, \`assessment_name\`, \`score\`, \`max_score\`, \`percentage\`, \`date\`, \`teacher_id\`, \`notes\`, \`created_at\`) VALUES\n`;
        sql += grades.map((grade: any) => 
          `(${escapeSql(grade.id)}, ${escapeSql(grade.studentId)}, ${escapeSql(grade.subjectId)}, ${escapeSql(grade.classId)}, ${escapeSql(grade.semester)}, ${escapeSql(grade.assessmentType)}, ${escapeSql(grade.assessmentName)}, ${escapeSql(grade.score)}, ${escapeSql(grade.maxScore)}, ${escapeSql(grade.percentage)}, ${escapeSql(grade.date)}, ${escapeSql(grade.teacherId)}, ${escapeSql(grade.notes)}, ${escapeSql(grade.createdAt)})`
        ).join(',\n') + ';\n\n';
      }

      // Attendance
      if (attendance.length > 0) {
        sql += `-- Attendance\n`;
        sql += `INSERT INTO \`attendance\` (\`id\`, \`student_id\`, \`class_id\`, \`date\`, \`status\`, \`notes\`, \`recorded_by\`, \`created_at\`) VALUES\n`;
        sql += attendance.map((att: any) => 
          `(${escapeSql(att.id)}, ${escapeSql(att.studentId)}, ${escapeSql(att.classId)}, ${escapeSql(att.date)}, ${escapeSql(att.status)}, ${escapeSql(att.notes)}, ${escapeSql(att.recordedBy)}, ${escapeSql(att.createdAt)})`
        ).join(',\n') + ';\n\n';
      }

      // Student Accounts
      if (accounts.length > 0) {
        sql += `-- Student Accounts\n`;
        sql += `INSERT INTO \`student_accounts\` (\`id\`, \`student_id\`, \`total_amount_due\`, \`total_paid\`, \`current_balance\`, \`academic_year\`, \`notes\`, \`created_at\`, \`updated_at\`) VALUES\n`;
        sql += accounts.map((acc: any) => 
          `(${escapeSql(acc.id)}, ${escapeSql(acc.studentId)}, ${escapeSql(acc.totalAmountDue)}, ${escapeSql(acc.totalPaid)}, ${escapeSql(acc.currentBalance)}, ${escapeSql(acc.academicYear)}, ${escapeSql(acc.notes)}, ${escapeSql(acc.createdAt)}, ${escapeSql(acc.updatedAt)})`
        ).join(',\n') + ';\n\n';
      }

      // Payment Transactions
      if (transactions.length > 0) {
        sql += `-- Payment Transactions\n`;
        sql += `INSERT INTO \`payment_transactions\` (\`id\`, \`student_account_id\`, \`student_id\`, \`amount\`, \`payment_date\`, \`payment_method\`, \`receipt_number\`, \`notes\`, \`recorded_by\`, \`created_at\`) VALUES\n`;
        sql += transactions.map((trans: any) => 
          `(${escapeSql(trans.id)}, ${escapeSql(trans.studentAccountId)}, ${escapeSql(trans.studentId)}, ${escapeSql(trans.amount)}, ${escapeSql(trans.paymentDate)}, ${escapeSql(trans.paymentMethod)}, ${escapeSql(trans.receiptNumber)}, ${escapeSql(trans.notes)}, ${escapeSql(trans.recordedBy)}, ${escapeSql(trans.createdAt)})`
        ).join(',\n') + ';\n\n';
      }

      // Teacher Salaries
      if (salaries.length > 0) {
        sql += `-- Teacher Salaries\n`;
        sql += `INSERT INTO \`teacher_salaries\` (\`id\`, \`teacher_id\`, \`month\`, \`base_salary\`, \`bonuses\`, \`deductions\`, \`advances_deducted\`, \`net_salary\`, \`payment_date\`, \`status\`, \`notes\`, \`recorded_by\`, \`created_at\`, \`updated_at\`) VALUES\n`;
        sql += salaries.map((sal: any) => 
          `(${escapeSql(sal.id)}, ${escapeSql(sal.teacherId)}, ${escapeSql(sal.month)}, ${escapeSql(sal.baseSalary)}, ${escapeSql(sal.bonuses)}, ${escapeSql(sal.deductions)}, ${escapeSql(sal.advancesDeducted)}, ${escapeSql(sal.netSalary)}, ${escapeSql(sal.paymentDate)}, ${escapeSql(sal.status)}, ${escapeSql(sal.notes)}, ${escapeSql(sal.recordedBy)}, ${escapeSql(sal.createdAt)}, ${escapeSql(sal.updatedAt)})`
        ).join(',\n') + ';\n\n';
      }

      // Teacher Advances
      if (advances.length > 0) {
        sql += `-- Teacher Advances\n`;
        sql += `INSERT INTO \`teacher_advances\` (\`id\`, \`teacher_id\`, \`amount\`, \`advance_date\`, \`deduction_month\`, \`status\`, \`notes\`, \`recorded_by\`, \`created_at\`) VALUES\n`;
        sql += advances.map((adv: any) => 
          `(${escapeSql(adv.id)}, ${escapeSql(adv.teacherId)}, ${escapeSql(adv.amount)}, ${escapeSql(adv.advanceDate)}, ${escapeSql(adv.deductionMonth)}, ${escapeSql(adv.status)}, ${escapeSql(adv.notes)}, ${escapeSql(adv.recordedBy)}, ${escapeSql(adv.createdAt)})`
        ).join(',\n') + ';\n\n';
      }

      // School Expenses
      if (expenses.length > 0) {
        sql += `-- School Expenses\n`;
        sql += `INSERT INTO \`school_expenses\` (\`id\`, \`category\`, \`description\`, \`amount\`, \`expense_date\`, \`payment_method\`, \`receipt_number\`, \`vendor_name\`, \`notes\`, \`recorded_by\`, \`created_at\`) VALUES\n`;
        sql += expenses.map((exp: any) => 
          `(${escapeSql(exp.id)}, ${escapeSql(exp.category)}, ${escapeSql(exp.description)}, ${escapeSql(exp.amount)}, ${escapeSql(exp.expenseDate)}, ${escapeSql(exp.paymentMethod)}, ${escapeSql(exp.receiptNumber)}, ${escapeSql(exp.vendorName)}, ${escapeSql(exp.notes)}, ${escapeSql(exp.recordedBy)}, ${escapeSql(exp.createdAt)})`
        ).join(',\n') + ';\n\n';
      }

      // School Settings
      if (settings) {
        sql += `-- School Settings\n`;
        sql += `INSERT INTO \`school_settings\` (\`id\`, \`school_name\`, \`school_name_arabic\`, \`current_academic_year\`, \`currency\`, \`phone\`, \`email\`, \`address\`, \`logo_url\`, \`updated_at\`) VALUES\n`;
        sql += `(${escapeSql(settings.id)}, ${escapeSql(settings.schoolName)}, ${escapeSql(settings.schoolNameArabic)}, ${escapeSql(settings.currentAcademicYear)}, ${escapeSql(settings.currency)}, ${escapeSql(settings.phone)}, ${escapeSql(settings.email)}, ${escapeSql(settings.address)}, ${escapeSql(settings.logoUrl)}, ${escapeSql(settings.updatedAt)});\n\n`;
      }

      sql += `-- End of backup\n`;

      res.send(sql);
    } catch (error) {
      console.error("Database backup error:", error);
      res.status(500).json({ error: "Failed to create database backup" });
    }
  });

  // ==================== EXPORT TO EXCEL ====================
  app.get("/api/export/excel", async (req, res) => {
    try {
      const XLSX = await import('xlsx');
      
      // جلب جميع البيانات
      const students = await storage.getAllStudents();
      const teachers = await storage.getAllTeachers();
      const classes = await storage.getAllClasses();
      const subjects = await storage.getAllSubjects();
      const grades = await storage.getAllGrades();
      const attendance = await storage.getAllAttendance();
      const accounts = await storage.getAllStudentAccounts();
      const transactions = await storage.getAllTransactions();
      const salaries = await storage.getAllTeacherSalaries();
      const advances = await storage.getAllTeacherAdvances();
      const expenses = await storage.getAllSchoolExpenses();
      const settings = await storage.getSchoolSettings();
      const educationLevels = await storage.getAllEducationLevels();

      // إنشاء workbook
      const workbook = XLSX.utils.book_new();

      // ورقة الطلاب
      if (students.length > 0) {
        const studentsData = students.map(s => ({
          'الرقم التعريفي': s.id,
          'الاسم بالعربي': s.arabicName,
          'الجنس': s.gender === 'male' ? 'ذكر' : 'أنثى',
          'تاريخ الميلاد': s.dateOfBirth,
          'ولي الأمر': s.parentName,
          'رقم ولي الأمر': s.parentPhone,
          'العنوان': s.address || '',
          'الحالة': s.status === 'active' ? 'نشط' : 'غير نشط',
          'تاريخ التسجيل': s.enrollmentDate,
        }));
        const studentsSheet = XLSX.utils.json_to_sheet(studentsData);
        XLSX.utils.book_append_sheet(workbook, studentsSheet, 'الطلاب');
      }

      // ورقة المعلمين
      if (teachers.length > 0) {
        const teachersData = teachers.map(t => ({
          'الرقم التعريفي': t.id,
          'الاسم بالعربي': t.arabicName,
          'الجنس': t.gender === 'male' ? 'ذكر' : 'أنثى',
          'رقم الهاتف': t.phone,
          'البريد الإلكتروني': t.email || '',
          'المؤهل': t.qualification || '',
          'التخصص': t.specialization || '',
          'الراتب الشهري': t.monthlySalary,
          'الحالة': t.status === 'active' ? 'نشط' : 'غير نشط',
          'تاريخ التعيين': t.hireDate,
        }));
        const teachersSheet = XLSX.utils.json_to_sheet(teachersData);
        XLSX.utils.book_append_sheet(workbook, teachersSheet, 'المعلمين');
      }

      // ورقة الصفوف
      if (classes.length > 0) {
        const classesData = classes.map(c => ({
          'الرقم التعريفي': c.id,
          'اسم الصف': c.name,
          'الصف': c.grade,
          'الشعبة': c.section,
          'السعة': c.capacity,
          'غرفة الدراسة': c.roomNumber || '',
        }));
        const classesSheet = XLSX.utils.json_to_sheet(classesData);
        XLSX.utils.book_append_sheet(workbook, classesSheet, 'الصفوف');
      }

      // ورقة الحسابات المالية للطلاب
      if (accounts.length > 0) {
        const accountsData = accounts.map(a => ({
          'الرقم التعريفي': a.id,
          'رقم الطالب': a.studentId,
          'إجمالي المستحقات': a.totalAmountDue,
          'المبلغ المدفوع': a.totalPaid,
          'الرصيد الحالي': a.currentBalance,
          'العام الدراسي': a.academicYear,
        }));
        const accountsSheet = XLSX.utils.json_to_sheet(accountsData);
        XLSX.utils.book_append_sheet(workbook, accountsSheet, 'حسابات الطلاب');
      }

      // ورقة المعاملات المالية
      if (transactions.length > 0) {
        const transactionsData = transactions.map((t: any) => ({
          'الرقم التعريفي': t.id,
          'رقم الطالب': t.studentId,
          'المبلغ': t.amount,
          'تاريخ الدفع': t.paymentDate,
          'طريقة الدفع': t.paymentMethod,
          'رقم الإيصال': t.receiptNumber || '',
          'ملاحظات': t.notes || '',
        }));
        const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData);
        XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'المعاملات المالية');
      }

      // ورقة رواتب المعلمين
      if (salaries.length > 0) {
        const salariesData = salaries.map(s => ({
          'الرقم التعريفي': s.id,
          'رقم المعلم': s.teacherId,
          'الشهر': s.month,
          'الراتب الأساسي': s.baseSalary,
          'المكافآت': s.bonuses || 0,
          'الخصومات': s.deductions || 0,
          'السلف المخصومة': s.advancesDeducted || 0,
          'صافي الراتب': s.netSalary,
          'تاريخ الدفع': s.paymentDate || '',
          'الحالة': s.status,
        }));
        const salariesSheet = XLSX.utils.json_to_sheet(salariesData);
        XLSX.utils.book_append_sheet(workbook, salariesSheet, 'رواتب المعلمين');
      }

      // ورقة المصروفات
      if (expenses.length > 0) {
        const expensesData = expenses.map(e => ({
          'الرقم التعريفي': e.id,
          'الفئة': e.category,
          'الوصف': e.description,
          'المبلغ': e.amount,
          'تاريخ المصروف': e.expenseDate,
          'طريقة الدفع': e.paymentMethod,
          'رقم الإيصال': e.receiptNumber || '',
          'اسم المورد': e.vendorName || '',
        }));
        const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
        XLSX.utils.book_append_sheet(workbook, expensesSheet, 'المصروفات');
      }

      // ورقة الحضور
      if (attendance.length > 0) {
        const attendanceData = attendance.map(a => ({
          'الرقم التعريفي': a.id,
          'رقم الطالب': a.studentId,
          'رقم الصف': a.classId,
          'التاريخ': a.date,
          'الحالة': a.status === 'present' ? 'حاضر' : a.status === 'absent' ? 'غائب' : a.status === 'late' ? 'متأخر' : 'معذور',
          'ملاحظات': a.notes || '',
        }));
        const attendanceSheet = XLSX.utils.json_to_sheet(attendanceData);
        XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'الحضور');
      }

      // ورقة الدرجات
      if (grades.length > 0) {
        const gradesData = grades.map(g => ({
          'الرقم التعريفي': g.id,
          'رقم الطالب': g.studentId,
          'رقم المادة': g.subjectId,
          'الدرجة': g.score,
          'الدرجة الكلية': g.maxScore,
          'النوع': g.assessmentType,
          'التاريخ': g.date,
        }));
        const gradesSheet = XLSX.utils.json_to_sheet(gradesData);
        XLSX.utils.book_append_sheet(workbook, gradesSheet, 'الدرجات');
      }

      // إنشاء الملف
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // تحديد اسم الملف بالتاريخ الحالي
      const today = new Date().toISOString().split('T')[0];
      const filename = `school_data_export_${today}.xlsx`;

      // إرسال الملف
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      console.error("Excel export error:", error);
      res.status(500).json({ error: "Failed to export data to Excel" });
    }
  });

  // ==================== PARENT ROUTES - تقارير أبناء ولي الأمر ====================
  // Get children's reports for logged in parent
  app.get("/api/my-children-reports", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      // إذا كان المستخدم admin، يمكنه رؤية كل شيء
      if (userRole === 'admin') {
        const students = await storage.getAllStudents();
        const reports = [];
        
        for (const student of students) {
          const grades = await storage.getStudentGrades(student.id);
          const attendance = await storage.getStudentAttendance(student.id);
          reports.push({
            student,
            grades,
            attendance
          });
        }
        
        return res.json(reports);
      }
      
      // إذا كان المستخدم parent، جلب أبنائه فقط
      if (userRole === 'parent') {
        const parentStudents = await storage.getParentStudentsByUserId(userId);
        const reports = [];
        
        for (const ps of parentStudents) {
          const student = await storage.getStudent(ps.studentId);
          if (student) {
            const grades = await storage.getStudentGrades(student.id);
            const attendance = await storage.getStudentAttendance(student.id);
            const account = await storage.getStudentAccount(student.id);
            const transactions = await storage.getStudentTransactions(student.id);
            reports.push({
              student,
              grades,
              attendance,
              account,
              transactions,
              relationship: ps.relationship
            });
          }
        }
        
        return res.json(reports);
      }
      
      // إذا كان معلم، لا يمكنه الوصول
      return res.status(403).json({ error: "غير مصرح لك برؤية هذه التقارير" });
    } catch (error) {
      console.error("Error fetching children reports:", error);
      res.status(500).json({ error: "Failed to fetch children reports" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
