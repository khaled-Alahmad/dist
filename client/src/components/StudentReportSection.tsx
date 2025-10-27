import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Student, Subject, Grade, StudentAccount, PaymentTransaction } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Download, MessageCircle, User, BookOpen, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import html2pdf from 'html2pdf.js';
import { useSchoolSettings } from '@/contexts/SchoolSettingsContext';
import { useAuth } from '@/hooks/use-auth';

interface ChildReport {
  student: Student;
  grades: Grade[];
  attendance: any[];
  account?: StudentAccount;
  transactions?: PaymentTransaction[];
  relationship?: string;
}

export default function StudentReportSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const { settings, formatDate, currencySymbol } = useSchoolSettings();
  const { user } = useAuth();

  // For parents - fetch their children's reports
  const { data: childrenReports = [] } = useQuery<ChildReport[]>({
    queryKey: ['/api/my-children-reports'],
    enabled: user?.role === 'parent',
  });

  // For admin/teacher - fetch all students
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['/api/students'],
    enabled: user?.role !== 'parent',
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });

  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ['/api/grades'],
    enabled: user?.role !== 'parent',
  });

  // Determine which students list to use
  const availableStudents = user?.role === 'parent' 
    ? childrenReports.map(r => r.student)
    : students;

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return availableStudents;
    const query = searchQuery.toLowerCase();
    return availableStudents.filter(student => 
      student.arabicName.toLowerCase().includes(query) ||
      (student.nationalId && student.nationalId.toLowerCase().includes(query))
    );
  }, [availableStudents, searchQuery]);

  const selectedStudentData = availableStudents.find(s => s.id === selectedStudent);
  
  // Get grades for selected student
  const studentGrades = user?.role === 'parent'
    ? (childrenReports.find(r => r.student.id === selectedStudent)?.grades || [])
    : grades.filter(g => g.studentId === selectedStudent);

  // Get financial data for selected student (parents only)
  const studentAccount = childrenReports.find(r => r.student.id === selectedStudent)?.account;
  const studentTransactions = childrenReports.find(r => r.student.id === selectedStudent)?.transactions || [];

  // Group grades by subject and semester
  const gradesBySubjectAndSemester = useMemo(() => {
    const grouped: Record<string, Record<string, Grade[]>> = {};
    
    studentGrades.forEach(grade => {
      if (!grouped[grade.subjectId]) {
        grouped[grade.subjectId] = {};
      }
      if (!grouped[grade.subjectId][grade.semester]) {
        grouped[grade.subjectId][grade.semester] = [];
      }
      grouped[grade.subjectId][grade.semester].push(grade);
    });
    
    return grouped;
  }, [studentGrades]);

  // Calculate average per subject
  const calculateSubjectAverage = (subjectId: string) => {
    const subjectGrades = studentGrades.filter(g => g.subjectId === subjectId);
    if (subjectGrades.length === 0) return 0;
    
    const total = subjectGrades.reduce((sum, grade) => {
      const percentage = (parseFloat(grade.score) / parseFloat(grade.maxScore)) * 100;
      return sum + percentage;
    }, 0);
    
    return (total / subjectGrades.length).toFixed(1);
  };

  // Calculate total average
  const calculateTotalAverage = () => {
    if (studentGrades.length === 0) return 0;
    
    const total = studentGrades.reduce((sum, grade) => {
      const percentage = (parseFloat(grade.score) / parseFloat(grade.maxScore)) * 100;
      return sum + percentage;
    }, 0);
    
    return (total / studentGrades.length).toFixed(1);
  };

  const handleDownloadPDF = () => {
    if (!selectedStudentData || !settings) return;
    
    const totalAverage = parseFloat(calculateTotalAverage() || '0');
    
    // تحديد رسالة تحفيزية بناءً على المعدل
    let motivationalMessage = '';
    if (totalAverage >= 90) {
      motivationalMessage = 'أداء ممتاز ومتميز! نفخر بك ونتمنى لك مزيداً من التفوق والنجاح.';
    } else if (totalAverage >= 80) {
      motivationalMessage = 'أداء جيد جداً! استمر في الاجتهاد ونحن واثقون من قدرتك على تحقيق المزيد.';
    } else if (totalAverage >= 70) {
      motivationalMessage = 'أداء جيد. مع المزيد من الجهد والتركيز، يمكنك تحقيق نتائج أفضل بإذن الله.';
    } else if (totalAverage >= 60) {
      motivationalMessage = 'نشجعك على بذل المزيد من الجهد. نحن هنا لدعمك ومساعدتك في تحسين أدائك الدراسي.';
    } else {
      motivationalMessage = 'نحن نؤمن بقدراتك ونشجعك على الاستمرار. لا تيأس، فالنجاح يحتاج إلى مثابرة وجهد.';
    }
    
    // إنشاء جداول منفصلة لكل مادة
    let subjectTablesHTML = '';
    
    Object.entries(gradesBySubjectAndSemester).forEach(([subjectId, semesters]) => {
      const subject = subjects.find(s => s.id === subjectId);
      const subjectAvg = parseFloat(calculateSubjectAverage(subjectId) || '0');
      const subjectAvgColor = subjectAvg >= 60 ? '#16a34a' : '#dc2626';
      
      let subjectRowsHTML = '';
      
      Object.entries(semesters).forEach(([semester, semesterGrades]) => {
        semesterGrades.forEach((grade) => {
          const percentage = (parseFloat(grade.score) / parseFloat(grade.maxScore)) * 100;
          const percentageColor = percentage >= 60 ? '#16a34a' : '#dc2626';
          subjectRowsHTML += `
            <tr>
              <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${semester}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">${grade.assessmentType}</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${grade.score} / ${grade.maxScore}</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb; color: ${percentageColor}; font-weight: bold;">${percentage.toFixed(1)}%</td>
            </tr>
          `;
        });
      });
      
      // جدول منفصل لكل مادة
      subjectTablesHTML += `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
          <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px; font-weight: bold;">
            ${subject?.arabicName || 'مادة'}
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 10px;">
            <thead>
              <tr style="background-color: #3b82f6; color: white;">
                <th style="padding: 10px; text-align: right; border: 1px solid #3b82f6; width: 25%;">الفصل</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #3b82f6; width: 30%;">نوع التقييم</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #3b82f6; width: 25%;">العلامة</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #3b82f6; width: 20%;">النسبة</th>
              </tr>
            </thead>
            <tbody>
              ${subjectRowsHTML}
              <tr style="background-color: #f3f4f6; font-weight: bold;">
                <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">معدل المادة</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb; color: ${subjectAvgColor};">${subjectAvg}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    });
    
    const totalAvgColor = totalAverage >= 60 ? '#16a34a' : '#dc2626';
    
    // إنشاء HTML للتقرير
    const htmlContent = `
      <div dir="rtl" style="font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; padding: 40px; background: white;">
        <!-- Logo --> 
        <div style="text-align: center; margin-bottom: 20px;">
          ${settings.logoUrl 
            ? `<img src="${settings.logoUrl}" alt="شعار المدرسة" style="width: 80px; height: 80px; object-fit: contain;" />`
            : `<div style="width: 80px; height: 80px; background: #3b82f6; border-radius: 50%; margin: 0 auto;"></div>`
          }
        </div>
        
        <!-- Header -->
        <h1 style="text-align: center; color: #1e40af; margin: 10px 0; font-size: 24px; font-weight: bold;">
          ${settings.schoolNameArabic || settings.schoolName || 'مدرسة النور الأهلية'}
        </h1>
        <h2 style="text-align: center; color: #374151; margin: 0 0 20px 0; font-size: 18px; font-weight: bold;">
          تقرير العلامات الأكاديمي
        </h2>
        
        <hr style="border: none; border-top: 2px solid #3b82f6; margin: 20px 0;" />
        
        <!-- Student Info -->
        <div style="margin: 25px 0; display: flex; justify-content: space-between; gap: 20px;">
          <div style="flex: 1;">
            <div style="color: #6b7280; font-size: 12px; font-weight: bold; margin-bottom: 5px;">اسم الطالب:</div>
            <div style="color: #111827; font-size: 16px; font-weight: bold;">
              ${selectedStudentData.arabicName}
            </div>
          </div>
          <div style="flex: 1; text-align: left;">
            <div style="color: #6b7280; font-size: 12px; font-weight: bold; margin-bottom: 5px;">الرقم الوطني:</div>
            <div style="color: #111827; font-size: 16px; font-weight: bold;">
              ${selectedStudentData.nationalId || '-'}
            </div>
          </div>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        
        <!-- Subject Tables -->
        <div style="margin: 25px 0;">
          ${subjectTablesHTML}
        </div>
        
        <!-- Total Average -->
        <div style="margin: 30px 0; text-align: center;">
          <div style="display: inline-block; border: 2px solid #3b82f6; padding: 15px 40px; background: #f0f9ff; border-radius: 8px;">
            <span style="font-size: 16px; font-weight: bold; margin-left: 15px;">المعدل العام:</span>
            <span style="font-size: 22px; font-weight: bold; color: ${totalAvgColor};">${totalAverage.toFixed(1)}%</span>
          </div>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        
        <!-- Motivational Message -->
        <div style="margin: 25px 0; background: #f9fafb; padding: 20px; border-radius: 8px;">
          <h3 style="text-align: center; color: #1e40af; font-size: 16px; margin: 0 0 15px 0; font-weight: bold;">رسالة تحفيزية</h3>
          <p style="text-align: justify; color: #374151; line-height: 1.8; font-style: italic; margin: 0;">
            ${motivationalMessage}
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 40px;">
          تاريخ التقرير: ${formatDate(new Date().toISOString())}
        </div>
      </div>
    `;
    
    // إنشاء عنصر مؤقت
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    document.body.appendChild(element);
    
    // تحويل إلى PDF
    const opt = {
      margin: 10,
      filename: `تقرير_${selectedStudentData.arabicName}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
      document.body.removeChild(element);
    });
  };

  const handleSendWhatsApp = () => {
    if (!selectedStudentData) return;
    
    let message = `السلام عليكم\nتقرير علامات الطالب/ة: ${selectedStudentData.arabicName}\n\n`;
    
    Object.entries(gradesBySubjectAndSemester).forEach(([subjectId, semesters]) => {
      const subject = subjects.find(s => s.id === subjectId);
      message += `📚 ${subject?.arabicName || 'مادة'}:\n`;
      
      Object.entries(semesters).forEach(([semester, grades]) => {
        message += `   ${semester}:\n`;
        grades.forEach(grade => {
          message += `   • ${grade.assessmentType}: ${grade.score}/${grade.maxScore}\n`;
        });
      });
      message += `   المعدل: ${calculateSubjectAverage(subjectId)}%\n\n`;
    });
    
    message += `📊 المعدل العام: ${calculateTotalAverage()}%`;
    
    const phoneNumber = selectedStudentData.parentPhone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {user?.role === 'parent' ? 'تقارير الأبناء' : 'البحث عن طالب'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder={user?.role === 'parent' ? 'ابحث عن ابنك...' : 'ابحث باسم الطالب أو الرقم الوطني...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-student"
                className="w-full"
              />
            </div>
            <div className="w-96">
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger data-testid="select-student-report">
                  <SelectValue placeholder={user?.role === 'parent' ? 'اختر الطالب' : 'أو اختر من القائمة'} />
                </SelectTrigger>
                <SelectContent>
                  {filteredStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.arabicName} {student.nationalId && `- ${student.nationalId}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Info & Actions */}
      {selectedStudentData && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <User className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-2xl">{selectedStudentData.arabicName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      الرقم الوطني: {selectedStudentData.nationalId || '-'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDownloadPDF}
                    disabled={studentGrades.length === 0}
                    data-testid="button-download-report"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 ml-2" />
                    تحميل التقرير
                  </Button>
                  {user?.role !== 'parent' && (
                    <Button
                      onClick={handleSendWhatsApp}
                      disabled={studentGrades.length === 0}
                      data-testid="button-send-whatsapp"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <MessageCircle className="h-4 w-4 ml-2" />
                      إرسال لولي الأمر
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {studentGrades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد علامات مسجلة لهذا الطالب
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Overall Average */}
                  <div className="flex items-center justify-center gap-4 p-4 bg-primary/10 rounded-lg">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">المعدل العام</p>
                      <p className="text-3xl font-bold text-primary">{calculateTotalAverage()}%</p>
                    </div>
                  </div>

                  {/* Grades by Subject */}
                  {Object.entries(gradesBySubjectAndSemester).map(([subjectId, semesters]) => {
                    const subject = subjects.find(s => s.id === subjectId);
                    
                    return (
                      <div key={subjectId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            {subject?.arabicName || 'مادة'}
                          </h3>
                          <Badge variant="secondary" className="text-lg">
                            المعدل: {calculateSubjectAverage(subjectId)}%
                          </Badge>
                        </div>

                        {Object.entries(semesters).map(([semester, semesterGrades]) => (
                          <div key={semester} className="mb-4 last:mb-0">
                            <p className="font-semibold mb-2 text-muted-foreground">{semester}</p>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-right">نوع التقييم</TableHead>
                                  <TableHead className="text-center">العلامة</TableHead>
                                  <TableHead className="text-center">النسبة المئوية</TableHead>
                                  <TableHead className="text-right">التاريخ</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {semesterGrades.map((grade) => {
                                  const percentage = (parseFloat(grade.score) / parseFloat(grade.maxScore)) * 100;
                                  return (
                                    <TableRow key={grade.id}>
                                      <TableCell className="font-medium">{grade.assessmentType}</TableCell>
                                      <TableCell className="text-center">
                                        {grade.score} / {grade.maxScore}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge variant={percentage >= 60 ? 'default' : 'destructive'}>
                                          {percentage.toFixed(1)}%
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        {formatDate(grade.date)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Report - For Parents Only */}
          {user?.role === 'parent' && studentAccount && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  التقرير المالي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Total Amount Due */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="h-8 w-8 text-blue-600" />
                      <div className="text-blue-600 text-sm font-semibold">إجمالي المستحقات</div>
                    </div>
                    <p className="text-3xl font-bold text-blue-900">
                      {parseFloat(studentAccount.totalAmountDue || '0').toLocaleString()} {currencySymbol}
                    </p>
                  </div>

                  {/* Total Paid */}
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                      <div className="text-green-600 text-sm font-semibold">إجمالي المدفوع</div>
                    </div>
                    <p className="text-3xl font-bold text-green-900">
                      {parseFloat(studentAccount.totalPaid || '0').toLocaleString()} {currencySymbol}
                    </p>
                  </div>

                  {/* Current Balance */}
                  <div className={`${parseFloat(studentAccount.currentBalance || '0') > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} border-2 rounded-xl p-6`}>
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingDown className={`h-8 w-8 ${parseFloat(studentAccount.currentBalance || '0') > 0 ? 'text-red-600' : 'text-gray-600'}`} />
                      <div className={`text-sm font-semibold ${parseFloat(studentAccount.currentBalance || '0') > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        الرصيد المتبقي
                      </div>
                    </div>
                    <p className={`text-3xl font-bold ${parseFloat(studentAccount.currentBalance || '0') > 0 ? 'text-red-900 dark:text-red-300' : 'text-gray-900 dark:text-white'}`}>
                      {parseFloat(studentAccount.currentBalance || '0').toLocaleString()} {currencySymbol}
                    </p>
                  </div>
                </div>

                {/* Payment History */}
                {studentTransactions.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      سجل الدفعات
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">التاريخ</TableHead>
                          <TableHead className="text-center">المبلغ</TableHead>
                          <TableHead className="text-right">طريقة الدفع</TableHead>
                          <TableHead className="text-right">رقم الإيصال</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{formatDate(transaction.paymentDate)}</TableCell>
                            <TableCell className="text-center font-bold text-green-700">
                              {parseFloat(transaction.amount).toLocaleString()} {currencySymbol}
                            </TableCell>
                            <TableCell>{transaction.paymentMethod || '-'}</TableCell>
                            <TableCell>{transaction.receiptNumber || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {studentTransactions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا يوجد سجل دفعات حالياً
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
