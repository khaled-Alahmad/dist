import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import type { Student, Teacher, Class, Grade, Payment, TeacherSalary, SchoolExpense, PaymentTransaction } from '@shared/schema';

export default function ReportsSection() {
  const { toast } = useToast();
  const [isGeneratingStudent, setIsGeneratingStudent] = useState(false);
  const [isGeneratingFinancial, setIsGeneratingFinancial] = useState(false);

  const { data: students = [] } = useQuery<Student[]>({ queryKey: ['/api/students'] });
  const { data: teachers = [] } = useQuery<Teacher[]>({ queryKey: ['/api/teachers'] });
  const { data: classes = [] } = useQuery<Class[]>({ queryKey: ['/api/classes'] });
  const { data: grades = [] } = useQuery<Grade[]>({ queryKey: ['/api/grades'] });
  const { data: payments = [] } = useQuery<Payment[]>({ queryKey: ['/api/payments'] });
  const { data: teacherSalaries = [] } = useQuery<TeacherSalary[]>({ queryKey: ['/api/teacher-salaries'] });
  const { data: expenses = [] } = useQuery<SchoolExpense[]>({ queryKey: ['/api/school-expenses'] });
  const { data: paymentTransactions = [] } = useQuery<PaymentTransaction[]>({ queryKey: ['/api/accounting/transactions'] });

  const generateStudentReport = () => {
    setIsGeneratingStudent(true);
    try {
      const workbook = XLSX.utils.book_new();

      const studentsData = students.map(student => {
        const studentClass = classes.find(c => c.id === student.classId);
        const studentGrades = grades.filter(g => g.studentId === student.id);
        const studentPayments = payments.filter(p => p.studentId === student.id);
        
        return {
          'الرقم التعريفي': student.id,
          'الاسم': student.arabicName,
          'الجنس': student.gender === 'male' ? 'ذكر' : 'أنثى',
          'تاريخ الميلاد': student.dateOfBirth,
          'الرقم الوطني': student.nationalId || '',
          'تاريخ التسجيل': student.enrollmentDate,
          'الصف': studentClass ? `${studentClass.grade} - ${studentClass.section}` : 'غير مسجل',
          'ولي الأمر': student.parentName,
          'هاتف ولي الأمر': student.parentPhone,
          'البريد الإلكتروني': student.parentEmail || '',
          'العنوان': student.address || '',
          'الحالة': student.status === 'active' ? 'نشط' : student.status === 'suspended' ? 'موقوف' : student.status === 'graduated' ? 'متخرج' : 'محول',
          'عدد الدرجات': studentGrades.length,
          'عدد المدفوعات': studentPayments.length,
        };
      });

      const studentsSheet = XLSX.utils.json_to_sheet(studentsData);
      XLSX.utils.book_append_sheet(workbook, studentsSheet, 'الطلاب');

      const gradesData = grades.map(grade => {
        const student = students.find(s => s.id === grade.studentId);
        const classInfo = classes.find(c => c.id === grade.classId);
        const teacher = teachers.find(t => t.id === grade.teacherId);
        
        return {
          'الطالب': student?.arabicName || '',
          'الصف': classInfo ? `${classInfo.grade} - ${classInfo.section}` : '',
          'المادة': grade.assessmentName,
          'الفصل الدراسي': grade.semester,
          'نوع التقييم': grade.assessmentType === 'exam' ? 'امتحان' : grade.assessmentType === 'quiz' ? 'اختبار' : grade.assessmentType === 'homework' ? 'واجب' : 'مشروع',
          'اسم التقييم': grade.assessmentName,
          'الدرجة': grade.score,
          'الدرجة الكلية': grade.maxScore,
          'النسبة المئوية': grade.percentage ? `${grade.percentage}%` : '',
          'التاريخ': grade.date,
          'المعلم': teacher?.arabicName || '',
          'ملاحظات': grade.notes || '',
        };
      });

      if (gradesData.length > 0) {
        const gradesSheet = XLSX.utils.json_to_sheet(gradesData);
        XLSX.utils.book_append_sheet(workbook, gradesSheet, 'الدرجات');
      }

      const paymentsData = payments.map(payment => {
        const student = students.find(s => s.id === payment.studentId);
        
        return {
          'الطالب': student?.arabicName || '',
          'المبلغ': payment.amount,
          'تاريخ الاستحقاق': payment.dueDate,
          'تاريخ الدفع': payment.paymentDate || 'لم يتم الدفع',
          'الحالة': payment.status === 'paid' ? 'مدفوع' : payment.status === 'pending' ? 'معلق' : payment.status === 'overdue' ? 'متأخر' : 'جزئي',
          'نوع الدفع': payment.paymentType,
          'العام الدراسي': payment.academicYear,
          'الشهر': payment.month || '',
          'رقم الإيصال': payment.receiptNumber || '',
          'ملاحظات': payment.notes || '',
        };
      });

      if (paymentsData.length > 0) {
        const paymentsSheet = XLSX.utils.json_to_sheet(paymentsData);
        XLSX.utils.book_append_sheet(workbook, paymentsSheet, 'المدفوعات');
      }

      const classesData = classes.map(classItem => {
        const classStudents = students.filter(s => s.classId === classItem.id);
        const classTeacher = teachers.find(t => t.id === classItem.teacherId);
        
        return {
          'الصف': `${classItem.grade} - ${classItem.section}`,
          'العام الدراسي': classItem.academicYear,
          'السعة': classItem.capacity,
          'عدد الطلاب': classStudents.length,
          'رقم القاعة': classItem.roomNumber || '',
          'المعلم': classTeacher?.arabicName || 'غير محدد',
        };
      });

      if (classesData.length > 0) {
        const classesSheet = XLSX.utils.json_to_sheet(classesData);
        XLSX.utils.book_append_sheet(workbook, classesSheet, 'الصفوف');
      }

      const fileName = `تقرير_الطلاب_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: 'تم إنشاء التقرير',
        description: 'تم تصدير تقرير الطلاب بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إنشاء التقرير',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingStudent(false);
    }
  };

  const generateFinancialReport = () => {
    setIsGeneratingFinancial(true);
    try {
      const workbook = XLSX.utils.book_new();

      const totalRevenue = payments
        .filter(p => p.status === 'paid' && p.paymentDate)
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const totalSalaries = teacherSalaries
        .filter(s => s.status === 'paid')
        .reduce((sum, s) => sum + parseFloat(s.netSalary), 0);

      const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

      const summary = [
        { 'البيان': 'إجمالي الإيرادات', 'المبلغ': totalRevenue.toFixed(2) },
        { 'البيان': 'إجمالي رواتب المعلمين', 'المبلغ': totalSalaries.toFixed(2) },
        { 'البيان': 'إجمالي المصروفات', 'المبلغ': totalExpenses.toFixed(2) },
        { 'البيان': 'صافي الربح/الخسارة', 'المبلغ': (totalRevenue - totalSalaries - totalExpenses).toFixed(2) },
      ];

      const summarySheet = XLSX.utils.json_to_sheet(summary);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'ملخص مالي');

      const revenueData = payments
        .filter(p => p.status === 'paid' && p.paymentDate)
        .map(payment => {
          const student = students.find(s => s.id === payment.studentId);
          return {
            'الطالب': student?.arabicName || '',
            'المبلغ': payment.amount,
            'تاريخ الدفع': payment.paymentDate,
            'نوع الدفع': payment.paymentType,
            'العام الدراسي': payment.academicYear,
            'الشهر': payment.month || '',
            'رقم الإيصال': payment.receiptNumber || '',
          };
        });

      if (revenueData.length > 0) {
        const revenueSheet = XLSX.utils.json_to_sheet(revenueData);
        XLSX.utils.book_append_sheet(workbook, revenueSheet, 'الإيرادات');
      }

      const salariesData = teacherSalaries.map(salary => {
        const teacher = teachers.find(t => t.id === salary.teacherId);
        return {
          'المعلم': teacher?.arabicName || '',
          'الشهر': salary.month,
          'الراتب الأساسي': salary.baseSalary,
          'المكافآت': salary.bonuses,
          'الخصومات': salary.deductions,
          'السلف المخصومة': salary.advancesDeducted,
          'صافي الراتب': salary.netSalary,
          'تاريخ الدفع': salary.paymentDate || 'لم يتم الدفع',
          'الحالة': salary.status === 'paid' ? 'مدفوع' : 'معلق',
          'ملاحظات': salary.notes || '',
        };
      });

      if (salariesData.length > 0) {
        const salariesSheet = XLSX.utils.json_to_sheet(salariesData);
        XLSX.utils.book_append_sheet(workbook, salariesSheet, 'الرواتب');
      }

      const expensesData = expenses.map(expense => {
        return {
          'الفئة': expense.category,
          'الوصف': expense.description,
          'المبلغ': expense.amount,
          'التاريخ': expense.expenseDate,
          'طريقة الدفع': expense.paymentMethod || '',
          'رقم الإيصال': expense.receiptNumber || '',
          'اسم المورد': expense.vendorName || '',
          'ملاحظات': expense.notes || '',
        };
      });

      if (expensesData.length > 0) {
        const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
        XLSX.utils.book_append_sheet(workbook, expensesSheet, 'المصروفات');
      }

      const transactionsData = paymentTransactions.map(transaction => {
        const student = students.find(s => s.id === transaction.studentId);
        return {
          'الطالب': student?.arabicName || '',
          'المبلغ': transaction.amount,
          'تاريخ الدفع': transaction.paymentDate,
          'طريقة الدفع': transaction.paymentMethod || '',
          'رقم الإيصال': transaction.receiptNumber || '',
          'ملاحظات': transaction.notes || '',
        };
      });

      if (transactionsData.length > 0) {
        const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData);
        XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'حركات الدفع');
      }

      const fileName = `التقرير_المالي_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: 'تم إنشاء التقرير',
        description: 'تم تصدير التقرير المالي بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إنشاء التقرير',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingFinancial(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">التقارير والإحصائيات</h1>
        <p className="text-gray-600 dark:text-gray-400">تقارير شاملة عن أداء المدرسة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card rounded-2xl p-6 text-center card-hover-effect">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">تقارير الطلاب</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">تقارير شاملة عن أداء الطلاب</p>
          <Button 
            className="w-full" 
            onClick={generateStudentReport}
            disabled={isGeneratingStudent}
            data-testid="button-student-report"
          >
            {isGeneratingStudent ? 'جاري إنشاء التقرير...' : 'إنشاء تقرير'}
          </Button>
        </div>

        <div className="glass-card rounded-2xl p-6 text-center card-hover-effect">
          <div className="text-4xl mb-4">💰</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">التقارير المالية</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">تقارير الإيرادات والمصروفات</p>
          <Button 
            className="w-full bg-green-600 hover:bg-green-700" 
            onClick={generateFinancialReport}
            disabled={isGeneratingFinancial}
            data-testid="button-financial-report"
          >
            {isGeneratingFinancial ? 'جاري إنشاء التقرير...' : 'إنشاء تقرير'}
          </Button>
        </div>
      </div>
    </div>
  );
}
