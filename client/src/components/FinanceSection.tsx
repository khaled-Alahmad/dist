import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { StudentAccount, PaymentTransaction, Student, SchoolSettings, TeacherSalary, TeacherAdvance, Teacher, SchoolExpense } from '@shared/schema';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useSchoolSettings } from '@/contexts/SchoolSettingsContext';
import { Trash2 } from 'lucide-react';
import MonthFilter from './MonthFilter';
import { useToast } from '@/hooks/use-toast';

const convertArabicToEnglishNumbers = (str: string): string => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  return str.split('').map(char => {
    const index = arabicNumbers.indexOf(char);
    return index !== -1 ? englishNumbers[index] : char;
  }).join('');
};

export default function FinanceSection() {
  const { currencySymbol, formatDate } = useSchoolSettings();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([currentMonth]);
  
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);

  const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false);
  const [isAdvanceDialogOpen, setIsAdvanceDialogOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [baseSalary, setBaseSalary] = useState('');
  const [bonuses, setBonuses] = useState('');
  const [deductions, setDeductions] = useState('');
  const [salaryPaymentDate, setSalaryPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [salaryNotes, setSalaryNotes] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [advanceNotes, setAdvanceNotes] = useState('');

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('supplies');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expensePaymentMethod, setExpensePaymentMethod] = useState('cash');
  const [expenseReceiptNumber, setExpenseReceiptNumber] = useState('');
  const [expenseVendorName, setExpenseVendorName] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');

  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const [accountStatusFilter, setAccountStatusFilter] = useState('all');

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<StudentAccount[]>({
    queryKey: ['/api/accounting/accounts'],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: studentTransactions = [] } = useQuery<PaymentTransaction[]>({
    queryKey: ['/api/accounting/transactions', viewingStudentId],
    enabled: !!viewingStudentId,
  });

  const { data: allTransactions = [] } = useQuery<PaymentTransaction[]>({
    queryKey: ['/api/accounting/transactions'],
  });

  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers'],
  });

  const { data: teacherSalaries = [] } = useQuery<TeacherSalary[]>({
    queryKey: ['/api/teacher-salaries'],
  });

  const { data: teacherAdvances = [] } = useQuery<TeacherAdvance[]>({
    queryKey: ['/api/teacher-advances'],
  });

  const { data: schoolExpenses = [] } = useQuery<SchoolExpense[]>({
    queryKey: ['/api/school-expenses'],
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: {
      studentAccountId: string;
      studentId: string;
      amount: string;
      paymentDate: string;
      paymentMethod: string;
      receiptNumber?: string;
      notes?: string;
    }) => {
      return await apiRequest('POST', '/api/accounting/payments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/transactions'] });
      setIsPaymentDialogOpen(false);
      setSelectedStudentId('');
      setStudentSearchTerm('');
      setPaymentAmount('');
      setReceiptNumber('');
      setPaymentNotes('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
    },
  });

  const addSalaryMutation = useMutation({
    mutationFn: async (data: {
      teacherId: string;
      month: string;
      baseSalary: string;
      bonuses: string;
      deductions: string;
      advancesDeducted: string;
      netSalary: string;
      paymentDate?: string;
      status: string;
      notes?: string;
    }) => {
      return await apiRequest('POST', '/api/teacher-salaries', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher-salaries'] });
      setIsSalaryDialogOpen(false);
      setSelectedTeacherId('');
      setSalaryMonth(new Date().toISOString().slice(0, 7));
      setBaseSalary('');
      setBonuses('');
      setDeductions('');
      setSalaryPaymentDate(new Date().toISOString().split('T')[0]);
      setSalaryNotes('');
    },
  });

  const addAdvanceMutation = useMutation({
    mutationFn: async (data: {
      teacherId: string;
      amount: string;
      advanceDate: string;
      notes?: string;
      status: string;
    }) => {
      return await apiRequest('POST', '/api/teacher-advances', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher-advances'] });
      setIsAdvanceDialogOpen(false);
      setSelectedTeacherId('');
      setAdvanceAmount('');
      setAdvanceDate(new Date().toISOString().split('T')[0]);
      setAdvanceNotes('');
      toast({
        title: "تم إضافة السلفة بنجاح",
        variant: "default",
      });
    },
    onError: (error: any) => {
      let errorMessage = "حدث خطأ أثناء إضافة السلفة";
      
      if (error?.error) {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "خطأ في إضافة السلفة",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (data: {
      category: string;
      description: string;
      amount: string;
      expenseDate: string;
      paymentMethod?: string;
      receiptNumber?: string;
      vendorName?: string;
      notes?: string;
    }) => {
      return await apiRequest('POST', '/api/school-expenses', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/school-expenses'] });
      setIsExpenseDialogOpen(false);
      setExpenseCategory('supplies');
      setExpenseDescription('');
      setExpenseAmount('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setExpensePaymentMethod('cash');
      setExpenseReceiptNumber('');
      setExpenseVendorName('');
      setExpenseNotes('');
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/accounting/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/accounts'] });
    },
  });

  const deleteSalaryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/teacher-salaries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher-salaries'] });
    },
  });

  const deleteAdvanceMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/teacher-advances/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher-advances'] });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/school-expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/school-expenses'] });
    },
  });

  const quickPaySalaryMutation = useMutation({
    mutationFn: async (salaryId: string) => {
      return await apiRequest('PATCH', `/api/teacher-salaries/${salaryId}`, {
        status: 'paid',
        paymentDate: new Date().toISOString().split('T')[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher-salaries'] });
    },
  });

  const quickCreateAndPaySalaryMutation = useMutation({
    mutationFn: async ({ teacherId, monthlySalary, month }: { 
      teacherId: string; 
      monthlySalary: string;
      month: string;
    }) => {
      return await apiRequest('POST', '/api/teacher-salaries', {
        teacherId,
        month,
        baseSalary: monthlySalary,
        bonuses: '0',
        deductions: '0',
        advancesDeducted: '0',
        netSalary: monthlySalary,
        paymentDate: new Date().toISOString().split('T')[0],
        status: 'paid',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher-salaries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher-advances'] });
    },
  });

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let account = accounts.find(a => a.studentId === selectedStudentId);
    
    if (!account) {
      const settings = await queryClient.fetchQuery<SchoolSettings>({
        queryKey: ['/api/school-settings'],
      });
      
      if (!settings) return;
      
      const amountPaid = Number(paymentAmount).toFixed(2);
      
      const response = await apiRequest('POST', '/api/accounting/accounts', {
        studentId: selectedStudentId,
        totalAmountDue: amountPaid,
        totalPaid: '0.00',
        currentBalance: amountPaid,
        academicYear: settings.currentAcademicYear,
      });
      
      const newAccount = await response.json();
      account = newAccount;
      
      await queryClient.invalidateQueries({ queryKey: ['/api/accounting/accounts'] });
    }
    
    if (account) {
      recordPaymentMutation.mutate({
        studentAccountId: account.id,
        studentId: selectedStudentId,
        amount: Number(paymentAmount).toFixed(2),
        paymentDate,
        paymentMethod,
        receiptNumber: receiptNumber || undefined,
        notes: paymentNotes || undefined,
      });
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.arabicName || 'غير معروف';
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.arabicName || 'غير معروف';
  };

  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeacherId) {
      return;
    }
    
    const base = Number(baseSalary);
    const bonus = Number(bonuses || 0);
    const deduct = Number(deductions || 0);
    
    if (isNaN(base) || base <= 0) {
      return;
    }
    
    if (isNaN(bonus) || bonus < 0) {
      return;
    }
    
    if (isNaN(deduct) || deduct < 0) {
      return;
    }

    addSalaryMutation.mutate({
      teacherId: selectedTeacherId,
      month: salaryMonth,
      baseSalary: base.toFixed(2),
      bonuses: bonus.toFixed(2),
      deductions: deduct.toFixed(2),
      advancesDeducted: '0.00',
      netSalary: '0.00',
      paymentDate: salaryPaymentDate,
      status: 'pending',
      notes: salaryNotes || undefined,
    });
  };

  const handleAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeacherId) {
      return;
    }
    
    const amount = Number(advanceAmount);
    
    if (isNaN(amount) || amount <= 0) {
      return;
    }
    
    addAdvanceMutation.mutate({
      teacherId: selectedTeacherId,
      amount: amount.toFixed(2),
      advanceDate,
      status: 'pending',
      notes: advanceNotes || undefined,
    });
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = Number(expenseAmount);
    
    if (isNaN(amount) || amount <= 0) {
      return;
    }
    
    addExpenseMutation.mutate({
      category: expenseCategory,
      description: expenseDescription,
      amount: amount.toFixed(2),
      expenseDate,
      paymentMethod: expensePaymentMethod || undefined,
      receiptNumber: expenseReceiptNumber || undefined,
      vendorName: expenseVendorName || undefined,
      notes: expenseNotes || undefined,
    });
  };

  const filteredStudents = students.filter(student => {
    if (!studentSearchTerm) return true;
    const studentName = (student.arabicName || '').toLowerCase();
    return studentName.includes(studentSearchTerm.toLowerCase());
  });

  const filteredTransactions = allTransactions.filter(transaction => {
    if (!transaction.paymentDate) return false;
    const date = new Date(transaction.paymentDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return selectedYears.includes(year) && selectedMonths.includes(month);
  });

  const filteredAccounts = accounts
    .filter(account => {
      const studentName = getStudentName(account.studentId).toLowerCase();
      const matchesSearch = !accountSearchTerm || studentName.includes(accountSearchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      const balance = Number(account.currentBalance);
      const totalPaid = Number(account.totalPaid);
      
      switch (accountStatusFilter) {
        case 'unpaid':
          return balance > 0 && totalPaid === 0;
        case 'partial':
          return balance > 0 && totalPaid > 0;
        case 'paid':
          return balance <= 0 && totalPaid > 0;
        case 'all':
        default:
          return true;
      }
    });

  const filteredSalaries = teacherSalaries.filter(salary => {
    const [yearStr, monthStr] = salary.month.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    return selectedYears.includes(year) && selectedMonths.includes(month);
  });

  const filteredAdvances = teacherAdvances.filter(advance => {
    if (!advance.advanceDate) return false;
    const date = new Date(advance.advanceDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return selectedYears.includes(year) && selectedMonths.includes(month);
  });

  const filteredExpenses = schoolExpenses.filter(expense => {
    if (!expense.expenseDate) return false;
    const date = new Date(expense.expenseDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return selectedYears.includes(year) && selectedMonths.includes(month);
  });

  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalOutstanding = filteredAccounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0);
  const studentsWithBalanceCount = filteredAccounts.filter(acc => Number(acc.currentBalance) > 0).length;
  const studentsFullyPaid = filteredAccounts.filter(acc => Number(acc.currentBalance) <= 0 && Number(acc.totalPaid) > 0).length;
  
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const totalSalaries = filteredSalaries.reduce((sum, salary) => sum + Number(salary.netSalary), 0);
  const netProfit = totalRevenue - (totalExpenses + totalSalaries);
  const totalTeacherAdvances = filteredAdvances.reduce((sum, advance) => sum + Number(advance.amount), 0);
  const pendingSalaries = filteredSalaries.filter(s => s.status === 'pending').length;
  const paidSalaries = filteredSalaries.filter(s => s.status === 'paid').length;

  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">المحاسبة والرسوم</h1>
        <p className="text-gray-600 dark:text-gray-400">نظام محاسبة شامل لإدارة المدفوعات والرسوم المدرسية</p>
      </div>

      <MonthFilter
        selectedYears={selectedYears}
        selectedMonths={selectedMonths}
        onYearsChange={setSelectedYears}
        onMonthsChange={setSelectedMonths}
      />

      <Tabs defaultValue="accounts" className="space-y-6">
        <div className="flex justify-center">
          <TabsList className="glass-card">
            <TabsTrigger value="accounts" data-testid="tab-accounts">حسابات الطلاب</TabsTrigger>
            <TabsTrigger value="teachers" data-testid="tab-teachers">حسابات المعلمين</TabsTrigger>
            <TabsTrigger value="expenses" data-testid="tab-expenses">المصروفات العامة</TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">التقارير المالية</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="accounts">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="text-3xl font-bold text-green-600">
                {totalRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي المحصل ({currencySymbol})</div>
            </div>
            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="text-3xl font-bold text-red-600">
                {totalOutstanding.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي المستحقات ({currencySymbol})</div>
            </div>
            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="text-3xl font-bold text-purple-600">{studentsFullyPaid}</div>
              <div className="text-sm text-gray-600 dark:text-white">طلاب مسددين بالكامل</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">حسابات الطلاب</h3>
              <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-record-payment">💰 تسجيل دفعة</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div>
                      <Label>بحث عن الطالب</Label>
                      <Input
                        type="text"
                        placeholder="ابحث بالاسم..."
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        data-testid="input-search-student"
                      />
                    </div>
                    <div>
                      <Label>اختر الطالب</Label>
                      <Select value={selectedStudentId} onValueChange={setSelectedStudentId} required>
                        <SelectTrigger data-testid="select-student">
                          <SelectValue placeholder="اختر طالب" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredStudents.length === 0 ? (
                            <div className="p-2 text-center text-gray-500">
                              {studentSearchTerm ? 'لا توجد نتائج' : 'لا يوجد طلاب في النظام'}
                            </div>
                          ) : (
                            filteredStudents.map((student) => {
                              const account = accounts.find(acc => acc.studentId === student.id);
                              const balance = account ? Number(account.currentBalance) : 0;
                              return (
                                <SelectItem key={student.id} value={student.id}>
                                  {student.arabicName} - رصيد: {balance.toLocaleString()} {currencySymbol}
                                </SelectItem>
                              );
                            })
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>المبلغ المدفوع ({currencySymbol})</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(convertArabicToEnglishNumbers(e.target.value))}
                        required
                        data-testid="input-payment-amount"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>تاريخ الدفع</Label>
                      <Input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        required
                        data-testid="input-payment-date"
                      />
                    </div>
                    <div>
                      <Label>طريقة الدفع</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">نقدي</SelectItem>
                          <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                          <SelectItem value="card">بطاقة</SelectItem>
                          <SelectItem value="check">شيك</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>رقم الإيصال (اختياري)</Label>
                      <Input
                        value={receiptNumber}
                        onChange={(e) => setReceiptNumber(e.target.value)}
                        data-testid="input-receipt-number"
                      />
                    </div>
                    <div>
                      <Label>ملاحظات (اختياري)</Label>
                      <Input
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        data-testid="input-payment-notes"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={recordPaymentMutation.isPending}
                      data-testid="button-submit-payment"
                    >
                      {recordPaymentMutation.isPending ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>بحث بالاسم</Label>
                <Input
                  type="text"
                  placeholder="ابحث عن طالب..."
                  value={accountSearchTerm}
                  onChange={(e) => setAccountSearchTerm(e.target.value)}
                  data-testid="input-search-account"
                />
              </div>
              <div>
                <Label>فلتر بحالة السداد</Label>
                <Select value={accountStatusFilter} onValueChange={setAccountStatusFilter}>
                  <SelectTrigger data-testid="select-account-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="unpaid">لم يدفع بعد</SelectItem>
                    <SelectItem value="partial">دفع جزئي</SelectItem>
                    <SelectItem value="paid">أتم الدفع بالكامل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {accountsLoading ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">جاري التحميل...</div>
            ) : filteredAccounts.length === 0 ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                {accountSearchTerm || accountStatusFilter !== 'all' 
                  ? 'لا توجد نتائج تطابق البحث' 
                  : 'لا توجد حسابات مالية للفترة المحددة'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الطالب</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">المبلغ الإجمالي</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">المدفوع</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الرصيد المتبقي</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الحالة</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAccounts.map((account) => {
                      const balance = Number(account.currentBalance);
                      const totalDue = Number(account.totalAmountDue);
                      const percentagePaid = totalDue > 0 ? (Number(account.totalPaid) / totalDue) * 100 : 0;
                      
                      return (
                        <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-800" data-testid={`row-account-${account.studentId}`}>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {getStudentName(account.studentId)}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                            {Number(account.totalAmountDue).toLocaleString()} {currencySymbol}
                          </td>
                          <td className="px-4 py-4 text-sm text-green-600 font-medium">
                            {Number(account.totalPaid).toLocaleString()} {currencySymbol}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium">
                            <span className={balance > 0 ? 'text-red-600' : 'text-green-600'}>
                              {balance.toLocaleString()} {currencySymbol}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${Math.min(percentagePaid, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600 dark:text-gray-400">{Math.round(percentagePaid)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingStudentId(account.studentId)}
                              data-testid={`button-view-${account.studentId}`}
                            >
                              عرض التفاصيل
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="teachers">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="text-3xl font-bold text-red-600">
                {totalSalaries.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي الرواتب ({currencySymbol})</div>
            </div>
            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="text-3xl font-bold text-orange-600">
                {totalTeacherAdvances.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي السلف ({currencySymbol})</div>
            </div>
            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="text-3xl font-bold text-green-600">{paidSalaries}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">رواتب مدفوعة</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">حسابات المعلمين - دفع سريع</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">قائمة المعلمين النشطين ورواتبهم للفترة المحددة</p>
            
            {teachers.filter(t => t.status === 'active').length === 0 ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">لا يوجد معلمين نشطين</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">المعلم</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الراتب الشهري</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">السلف المعلقة</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الصافي المتوقع</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">حالة الراتب</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {teachers
                      .filter(t => {
                        if (t.status !== 'active') return false;
                        
                        const hasAnySalary = teacherSalaries.some(s => s.teacherId === t.id);
                        if (!hasAnySalary) return true;
                        
                        const hasFilteredSalary = filteredSalaries.some(s => s.teacherId === t.id);
                        return hasFilteredSalary;
                      })
                      .map((teacher) => {
                        const currentMonthSalary = filteredSalaries.find(
                          s => s.teacherId === teacher.id
                        );
                        
                        const teacherPendingAdvances = teacherAdvances.filter(
                          (a: TeacherAdvance) => a.teacherId === teacher.id && a.status === 'pending'
                        );
                        const totalPendingAdvances = teacherPendingAdvances.reduce(
                          (sum: number, adv: TeacherAdvance) => sum + Number(adv.amount), 0
                        );
                        
                        const expectedNet = currentMonthSalary 
                          ? Number(currentMonthSalary.netSalary)
                          : Math.max(0, Number(teacher.monthlySalary) - totalPendingAdvances);
                        
                        return (
                          <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-800" data-testid={`row-teacher-${teacher.id}`}>
                            <td className="px-4 py-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {teacher.arabicName}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {teacher.specialization || 'غير محدد'}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-300 font-medium">
                              {Number(teacher.monthlySalary).toLocaleString()} {currencySymbol}
                            </td>
                            <td className="px-4 py-4">
                              {totalPendingAdvances > 0 ? (
                                <span className="text-sm text-orange-600 font-medium">
                                  {totalPendingAdvances.toLocaleString()} {currencySymbol}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 dark:text-gray-500">لا توجد سلف</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium">
                              <span className={totalPendingAdvances > 0 ? 'text-blue-600' : 'text-gray-900 dark:text-gray-300'}>
                                {expectedNet.toLocaleString()} {currencySymbol}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              {currentMonthSalary ? (
                                <Badge variant={currentMonthSalary.status === 'paid' ? 'default' : 'secondary'}>
                                  {currentMonthSalary.status === 'paid' ? 'مدفوع' : 'معلق'}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">لم يُنشأ بعد</Badge>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {currentMonthSalary && currentMonthSalary.status === 'paid' ? (
                                <span className="text-xs text-green-600 font-medium">
                                  ✓ تم الدفع في {formatDate(currentMonthSalary.paymentDate || '')}
                                </span>
                              ) : currentMonthSalary && currentMonthSalary.status === 'pending' ? (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => quickPaySalaryMutation.mutate(currentMonthSalary.id)}
                                  disabled={quickPaySalaryMutation.isPending}
                                  data-testid={`button-quick-pay-${teacher.id}`}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  ✓ دفع الراتب
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    const currentMonth = selectedMonths.length === 1 && selectedYears.length === 1
                                      ? `${selectedYears[0]}-${String(selectedMonths[0]).padStart(2, '0')}`
                                      : new Date().toISOString().slice(0, 7);
                                    
                                    quickCreateAndPaySalaryMutation.mutate({
                                      teacherId: teacher.id,
                                      monthlySalary: teacher.monthlySalary,
                                      month: currentMonth,
                                    });
                                  }}
                                  disabled={quickCreateAndPaySalaryMutation.isPending}
                                  data-testid={`button-quick-pay-${teacher.id}`}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  ✓ دفع الراتب
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">رواتب المعلمين</h3>
                <Dialog open={isSalaryDialogOpen} onOpenChange={setIsSalaryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-salary">إضافة راتب</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة راتب معلم</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSalarySubmit} className="space-y-4">
                      <div>
                        <Label>المعلم</Label>
                        <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId} required>
                          <SelectTrigger data-testid="select-teacher">
                            <SelectValue placeholder="اختر معلم" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.arabicName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>الشهر</Label>
                        <Input
                          type="month"
                          value={salaryMonth}
                          onChange={(e) => setSalaryMonth(e.target.value)}
                          required
                          data-testid="input-salary-month"
                        />
                      </div>
                      <div>
                        <Label>الراتب الأساسي ({currencySymbol})</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={baseSalary}
                          onChange={(e) => setBaseSalary(convertArabicToEnglishNumbers(e.target.value))}
                          required
                          data-testid="input-base-salary"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>البونص ({currencySymbol})</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={bonuses}
                          onChange={(e) => setBonuses(convertArabicToEnglishNumbers(e.target.value))}
                          data-testid="input-bonuses"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>الاستقطاعات ({currencySymbol})</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={deductions}
                          onChange={(e) => setDeductions(convertArabicToEnglishNumbers(e.target.value))}
                          data-testid="input-deductions"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>تاريخ الدفع</Label>
                        <Input
                          type="date"
                          value={salaryPaymentDate}
                          onChange={(e) => setSalaryPaymentDate(e.target.value)}
                          data-testid="input-salary-payment-date"
                        />
                      </div>
                      <div>
                        <Label>ملاحظات (اختياري)</Label>
                        <Input
                          value={salaryNotes}
                          onChange={(e) => setSalaryNotes(e.target.value)}
                          data-testid="input-salary-notes"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={addSalaryMutation.isPending}
                        data-testid="button-submit-salary"
                      >
                        {addSalaryMutation.isPending ? 'جاري الحفظ...' : 'حفظ الراتب'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {filteredSalaries.length === 0 ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">لا توجد رواتب مسجلة</div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredSalaries.slice(0, 10).map((salary) => (
                    <div
                      key={salary.id}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      data-testid={`salary-${salary.id}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {getTeacherName(salary.teacherId)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {salary.month}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={salary.status === 'paid' ? 'default' : 'secondary'}>
                            {salary.status === 'paid' ? 'مدفوع' : 'معلق'}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteSalaryMutation.mutate(salary.id)}
                            disabled={deleteSalaryMutation.isPending}
                            data-testid={`button-delete-salary-${salary.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-600 dark:text-gray-400">
                          الأساسي: {Number(salary.baseSalary).toLocaleString()} {currencySymbol}
                        </div>
                        <div className="text-green-600">
                          البونص: {Number(salary.bonuses).toLocaleString()} {currencySymbol}
                        </div>
                        <div className="text-red-600">
                          الاستقطاعات: {Number(salary.deductions).toLocaleString()} {currencySymbol}
                        </div>
                        <div className="text-orange-600">
                          السلف: {Number(salary.advancesDeducted).toLocaleString()} {currencySymbol}
                        </div>
                        <div className="text-blue-600 font-medium col-span-2">
                          الصافي: {Number(salary.netSalary).toLocaleString()} {currencySymbol}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">سلف المعلمين</h3>
                <Dialog open={isAdvanceDialogOpen} onOpenChange={setIsAdvanceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-advance">إضافة سلفة</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة سلفة لمعلم</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAdvanceSubmit} className="space-y-4">
                      <div>
                        <Label>المعلم</Label>
                        <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId} required>
                          <SelectTrigger data-testid="select-teacher-advance">
                            <SelectValue placeholder="اختر معلم" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.arabicName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>المبلغ ({currencySymbol})</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={advanceAmount}
                          onChange={(e) => setAdvanceAmount(convertArabicToEnglishNumbers(e.target.value))}
                          required
                          data-testid="input-advance-amount"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>تاريخ السلفة</Label>
                        <Input
                          type="date"
                          value={advanceDate}
                          onChange={(e) => setAdvanceDate(e.target.value)}
                          required
                          data-testid="input-advance-date"
                        />
                      </div>
                      <div>
                        <Label>ملاحظات (اختياري)</Label>
                        <Input
                          value={advanceNotes}
                          onChange={(e) => setAdvanceNotes(e.target.value)}
                          data-testid="input-advance-notes"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={addAdvanceMutation.isPending}
                        data-testid="button-submit-advance"
                      >
                        {addAdvanceMutation.isPending ? 'جاري الحفظ...' : 'حفظ السلفة'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {filteredAdvances.length === 0 ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">لا توجد سلف مسجلة</div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredAdvances.slice(0, 10).map((advance) => (
                    <div
                      key={advance.id}
                      className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                      data-testid={`advance-${advance.id}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {getTeacherName(advance.teacherId)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(advance.advanceDate)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={advance.status === 'deducted' ? 'default' : 'secondary'}>
                            {advance.status === 'deducted' ? 'تم الخصم' : 'معلق'}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteAdvanceMutation.mutate(advance.id)}
                            disabled={deleteAdvanceMutation.isPending}
                            data-testid={`button-delete-advance-${advance.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-orange-600 font-bold text-lg">
                        {Number(advance.amount).toLocaleString()} {currencySymbol}
                      </div>
                      {advance.notes && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{advance.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="expenses">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="text-3xl font-bold text-blue-600">
                {totalExpenses.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي المصروفات ({currencySymbol})</div>
            </div>
            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="text-3xl font-bold text-purple-600">
                {filteredExpenses.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">عدد المصروفات</div>
            </div>
            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="text-3xl font-bold text-orange-600">
                {Object.keys(expensesByCategory).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">عدد الفئات</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">المصروفات العامة</h3>
              <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-expense">إضافة مصروف</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة مصروف جديد</DialogTitle>
                    <DialogDescription>أدخل تفاصيل المصروف العام للمدرسة</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleExpenseSubmit} className="space-y-4">
                    <div>
                      <Label>الفئة</Label>
                      <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                        <SelectTrigger data-testid="select-expense-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="utilities">فواتير (كهرباء، ماء، غاز)</SelectItem>
                          <SelectItem value="maintenance">صيانة</SelectItem>
                          <SelectItem value="supplies">لوازم مكتبية ومنظفات</SelectItem>
                          <SelectItem value="transportation">نقل ومواصلات</SelectItem>
                          <SelectItem value="salaries">رواتب وأجور</SelectItem>
                          <SelectItem value="rent">إيجار</SelectItem>
                          <SelectItem value="equipment">معدات وأجهزة</SelectItem>
                          <SelectItem value="food">طعام وضيافة</SelectItem>
                          <SelectItem value="marketing">دعاية وتسويق</SelectItem>
                          <SelectItem value="other">أخرى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>الوصف</Label>
                      <Input
                        type="text"
                        value={expenseDescription}
                        onChange={(e) => setExpenseDescription(e.target.value)}
                        required
                        data-testid="input-expense-description"
                        placeholder="مثال: فاتورة الكهرباء - شهر يناير"
                      />
                    </div>
                    <div>
                      <Label>المبلغ ({currencySymbol})</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(convertArabicToEnglishNumbers(e.target.value))}
                        required
                        data-testid="input-expense-amount"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>تاريخ المصروف</Label>
                      <Input
                        type="date"
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                        required
                        data-testid="input-expense-date"
                      />
                    </div>
                    <div>
                      <Label>طريقة الدفع</Label>
                      <Select value={expensePaymentMethod} onValueChange={setExpensePaymentMethod}>
                        <SelectTrigger data-testid="select-expense-payment-method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">نقدي</SelectItem>
                          <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                          <SelectItem value="card">بطاقة</SelectItem>
                          <SelectItem value="check">شيك</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>اسم المورد (اختياري)</Label>
                      <Input
                        value={expenseVendorName}
                        onChange={(e) => setExpenseVendorName(e.target.value)}
                        data-testid="input-expense-vendor"
                        placeholder="اسم الشركة أو المورد"
                      />
                    </div>
                    <div>
                      <Label>رقم الإيصال (اختياري)</Label>
                      <Input
                        value={expenseReceiptNumber}
                        onChange={(e) => setExpenseReceiptNumber(e.target.value)}
                        data-testid="input-expense-receipt"
                      />
                    </div>
                    <div>
                      <Label>ملاحظات (اختياري)</Label>
                      <Input
                        value={expenseNotes}
                        onChange={(e) => setExpenseNotes(e.target.value)}
                        data-testid="input-expense-notes"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={addExpenseMutation.isPending}
                      data-testid="button-submit-expense"
                    >
                      {addExpenseMutation.isPending ? 'جاري الحفظ...' : 'حفظ المصروف'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="text-center py-8 text-gray-600">لا توجد مصروفات مسجلة</div>
            ) : (
              <div className="space-y-3">
                {filteredExpenses.slice(0, 20).map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    data-testid={`expense-${expense.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {expense.category === 'utilities' && 'فواتير'}
                          {expense.category === 'maintenance' && 'صيانة'}
                          {expense.category === 'supplies' && 'لوازم ومنظفات'}
                          {expense.category === 'transportation' && 'نقل'}
                          {expense.category === 'salaries' && 'رواتب'}
                          {expense.category === 'rent' && 'إيجار'}
                          {expense.category === 'equipment' && 'معدات'}
                          {expense.category === 'food' && 'طعام'}
                          {expense.category === 'marketing' && 'تسويق'}
                          {expense.category === 'other' && 'أخرى'}
                        </Badge>
                        <span className="font-medium text-gray-900 dark:text-white">{expense.description}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(expense.expenseDate)}
                        {expense.vendorName && ` - ${expense.vendorName}`}
                        {expense.receiptNumber && ` - إيصال: ${expense.receiptNumber}`}
                      </div>
                      {expense.notes && (
                        <div className="text-xs text-gray-400 mt-1">{expense.notes}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-red-600 font-bold text-lg">
                        {Number(expense.amount).toLocaleString()} {currencySymbol}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteExpenseMutation.mutate(expense.id)}
                        disabled={deleteExpenseMutation.isPending}
                        data-testid={`button-delete-expense-${expense.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">الملخص المالي الشامل</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-700">المبلغ المترتب على الطلاب</span>
                    <span className="font-bold text-lg text-blue-600">
                      {filteredAccounts.reduce((sum, acc) => sum + Number(acc.totalAmountDue), 0).toLocaleString()} {currencySymbol}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700">الإيرادات (المحصل من الطلاب)</span>
                    <span className="font-bold text-lg text-green-600">
                      {totalRevenue.toLocaleString()} {currencySymbol}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-yellow-700">الباقي من مدفوعات الطلاب</span>
                    <span className="font-bold text-lg text-yellow-600">
                      {totalOutstanding.toLocaleString()} {currencySymbol}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-red-700">المصروفات العامة</span>
                    <span className="font-bold text-lg text-red-600">
                      {totalExpenses.toLocaleString()} {currencySymbol}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-orange-700">رواتب المعلمين</span>
                    <span className="font-bold text-lg text-orange-600">
                      {totalSalaries.toLocaleString()} {currencySymbol}
                    </span>
                  </div>
                  <div className="border-t-2 border-gray-300 pt-3">
                    <div className={`flex justify-between items-center p-4 rounded-lg ${netProfit >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                      <span className={`font-bold text-lg ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        الصافي النهائي {netProfit >= 0 ? '(ربح)' : '(خسارة)'}
                      </span>
                      <span className={`font-bold text-2xl ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {Math.abs(netProfit).toLocaleString()} {currencySymbol}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-100 rounded">
                    <div>• الصافي = الإيرادات - (المصروفات + الرواتب)</div>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">أحدث المدفوعات</h3>
                <div className="space-y-3">
                  {filteredTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {getStudentName(transaction.studentId)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(transaction.paymentDate)}
                        </div>
                      </div>
                      <div className="font-bold text-green-600">
                        {Number(transaction.amount).toLocaleString()} {currencySymbol}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Student Financial Report Dialog */}
      <Dialog open={!!viewingStudentId} onOpenChange={() => setViewingStudentId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>التقرير المالي - {getStudentName(viewingStudentId || '')}</DialogTitle>
          </DialogHeader>
          {viewingStudentId && (
            <div className="space-y-6">
              {(() => {
                const account = accounts.find(a => a.studentId === viewingStudentId);
                if (!account) return <div>لا توجد بيانات مالية</div>;

                return (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {Number(account.totalAmountDue).toLocaleString()}
                        </div>
                        <div className="text-sm text-blue-700">المبلغ الإجمالي</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {Number(account.totalPaid).toLocaleString()}
                        </div>
                        <div className="text-sm text-green-700">المدفوع</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {Number(account.currentBalance).toLocaleString()}
                        </div>
                        <div className="text-sm text-red-700">المتبقي</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-4">سجل المدفوعات</h4>
                      {studentTransactions.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">لا توجد مدفوعات مسجلة</div>
                      ) : (
                        <div className="space-y-2">
                          {studentTransactions.map((transaction) => (
                            <div
                              key={transaction.id}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                              data-testid={`transaction-${transaction.id}`}
                            >
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {formatDate(transaction.paymentDate)}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {transaction.paymentMethod}
                                  {transaction.receiptNumber && ` - إيصال: ${transaction.receiptNumber}`}
                                </div>
                                {transaction.notes && (
                                  <div className="text-xs text-gray-400 dark:text-gray-500">{transaction.notes}</div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="font-bold text-green-600">
                                  {Number(transaction.amount).toLocaleString()} {currencySymbol}
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => deleteTransactionMutation.mutate(transaction.id)}
                                  disabled={deleteTransactionMutation.isPending}
                                  data-testid={`button-delete-transaction-${transaction.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
