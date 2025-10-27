import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Student, Class, SchoolSettings, StudentAccount, EducationLevel } from '@shared/schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSchoolSettings } from '@/contexts/SchoolSettingsContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SiWhatsapp } from 'react-icons/si';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const convertArabicToEnglishNumbers = (str: string): string => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  return str.split('').map(char => {
    const index = arabicNumbers.indexOf(char);
    return index !== -1 ? englishNumbers[index] : char;
  }).join('');
};

const countryCodes = [
  { code: '+93', country: 'أفغانستان', name: 'Afghanistan' },
  { code: '+355', country: 'ألبانيا', name: 'Albania' },
  { code: '+213', country: 'الجزائر', name: 'Algeria' },
  { code: '+1-684', country: 'ساموا الأمريكية', name: 'American Samoa' },
  { code: '+376', country: 'أندورا', name: 'Andorra' },
  { code: '+244', country: 'أنغولا', name: 'Angola' },
  { code: '+54', country: 'الأرجنتين', name: 'Argentina' },
  { code: '+374', country: 'أرمينيا', name: 'Armenia' },
  { code: '+61', country: 'أستراليا', name: 'Australia' },
  { code: '+43', country: 'النمسا', name: 'Austria' },
  { code: '+994', country: 'أذربيجان', name: 'Azerbaijan' },
  { code: '+973', country: 'البحرين', name: 'Bahrain' },
  { code: '+880', country: 'بنغلاديش', name: 'Bangladesh' },
  { code: '+375', country: 'بيلاروسيا', name: 'Belarus' },
  { code: '+32', country: 'بلجيكا', name: 'Belgium' },
  { code: '+501', country: 'بليز', name: 'Belize' },
  { code: '+229', country: 'بنين', name: 'Benin' },
  { code: '+975', country: 'بوتان', name: 'Bhutan' },
  { code: '+591', country: 'بوليفيا', name: 'Bolivia' },
  { code: '+387', country: 'البوسنة والهرسك', name: 'Bosnia' },
  { code: '+55', country: 'البرازيل', name: 'Brazil' },
  { code: '+673', country: 'بروناي', name: 'Brunei' },
  { code: '+359', country: 'بلغاريا', name: 'Bulgaria' },
  { code: '+855', country: 'كمبوديا', name: 'Cambodia' },
  { code: '+237', country: 'الكاميرون', name: 'Cameroon' },
  { code: '+1', country: 'كندا', name: 'Canada' },
  { code: '+56', country: 'تشيلي', name: 'Chile' },
  { code: '+86', country: 'الصين', name: 'China' },
  { code: '+57', country: 'كولومبيا', name: 'Colombia' },
  { code: '+506', country: 'كوستاريكا', name: 'Costa Rica' },
  { code: '+385', country: 'كرواتيا', name: 'Croatia' },
  { code: '+53', country: 'كوبا', name: 'Cuba' },
  { code: '+357', country: 'قبرص', name: 'Cyprus' },
  { code: '+420', country: 'التشيك', name: 'Czech Republic' },
  { code: '+45', country: 'الدنمارك', name: 'Denmark' },
  { code: '+593', country: 'الإكوادور', name: 'Ecuador' },
  { code: '+20', country: 'مصر', name: 'Egypt' },
  { code: '+503', country: 'السلفادور', name: 'El Salvador' },
  { code: '+372', country: 'إستونيا', name: 'Estonia' },
  { code: '+251', country: 'إثيوبيا', name: 'Ethiopia' },
  { code: '+358', country: 'فنلندا', name: 'Finland' },
  { code: '+33', country: 'فرنسا', name: 'France' },
  { code: '+995', country: 'جورجيا', name: 'Georgia' },
  { code: '+49', country: 'ألمانيا', name: 'Germany' },
  { code: '+233', country: 'غانا', name: 'Ghana' },
  { code: '+30', country: 'اليونان', name: 'Greece' },
  { code: '+502', country: 'غواتيمالا', name: 'Guatemala' },
  { code: '+509', country: 'هايتي', name: 'Haiti' },
  { code: '+504', country: 'هندوراس', name: 'Honduras' },
  { code: '+852', country: 'هونغ كونغ', name: 'Hong Kong' },
  { code: '+36', country: 'المجر', name: 'Hungary' },
  { code: '+354', country: 'آيسلندا', name: 'Iceland' },
  { code: '+91', country: 'الهند', name: 'India' },
  { code: '+62', country: 'إندونيسيا', name: 'Indonesia' },
  { code: '+98', country: 'إيران', name: 'Iran' },
  { code: '+964', country: 'العراق', name: 'Iraq' },
  { code: '+353', country: 'أيرلندا', name: 'Ireland' },
  { code: '+972', country: 'إسرائيل', name: 'Israel' },
  { code: '+39', country: 'إيطاليا', name: 'Italy' },
  { code: '+81', country: 'اليابان', name: 'Japan' },
  { code: '+962', country: 'الأردن', name: 'Jordan' },
  { code: '+7', country: 'كازاخستان', name: 'Kazakhstan' },
  { code: '+254', country: 'كينيا', name: 'Kenya' },
  { code: '+965', country: 'الكويت', name: 'Kuwait' },
  { code: '+996', country: 'قرغيزستان', name: 'Kyrgyzstan' },
  { code: '+856', country: 'لاوس', name: 'Laos' },
  { code: '+371', country: 'لاتفيا', name: 'Latvia' },
  { code: '+961', country: 'لبنان', name: 'Lebanon' },
  { code: '+218', country: 'ليبيا', name: 'Libya' },
  { code: '+370', country: 'ليتوانيا', name: 'Lithuania' },
  { code: '+352', country: 'لوكسمبورغ', name: 'Luxembourg' },
  { code: '+60', country: 'ماليزيا', name: 'Malaysia' },
  { code: '+960', country: 'المالديف', name: 'Maldives' },
  { code: '+356', country: 'مالطا', name: 'Malta' },
  { code: '+52', country: 'المكسيك', name: 'Mexico' },
  { code: '+373', country: 'مولدوفا', name: 'Moldova' },
  { code: '+377', country: 'موناكو', name: 'Monaco' },
  { code: '+976', country: 'منغوليا', name: 'Mongolia' },
  { code: '+382', country: 'الجبل الأسود', name: 'Montenegro' },
  { code: '+212', country: 'المغرب', name: 'Morocco' },
  { code: '+95', country: 'ميانمار', name: 'Myanmar' },
  { code: '+977', country: 'نيبال', name: 'Nepal' },
  { code: '+31', country: 'هولندا', name: 'Netherlands' },
  { code: '+64', country: 'نيوزيلندا', name: 'New Zealand' },
  { code: '+505', country: 'نيكاراغوا', name: 'Nicaragua' },
  { code: '+234', country: 'نيجيريا', name: 'Nigeria' },
  { code: '+850', country: 'كوريا الشمالية', name: 'North Korea' },
  { code: '+47', country: 'النرويج', name: 'Norway' },
  { code: '+968', country: 'عمان', name: 'Oman' },
  { code: '+92', country: 'باكستان', name: 'Pakistan' },
  { code: '+970', country: 'فلسطين', name: 'Palestine' },
  { code: '+507', country: 'بنما', name: 'Panama' },
  { code: '+595', country: 'باراغواي', name: 'Paraguay' },
  { code: '+51', country: 'بيرو', name: 'Peru' },
  { code: '+63', country: 'الفلبين', name: 'Philippines' },
  { code: '+48', country: 'بولندا', name: 'Poland' },
  { code: '+351', country: 'البرتغال', name: 'Portugal' },
  { code: '+974', country: 'قطر', name: 'Qatar' },
  { code: '+40', country: 'رومانيا', name: 'Romania' },
  { code: '+7', country: 'روسيا', name: 'Russia' },
  { code: '+966', country: 'السعودية', name: 'Saudi Arabia' },
  { code: '+381', country: 'صربيا', name: 'Serbia' },
  { code: '+65', country: 'سنغافورة', name: 'Singapore' },
  { code: '+421', country: 'سلوفاكيا', name: 'Slovakia' },
  { code: '+386', country: 'سلوفينيا', name: 'Slovenia' },
  { code: '+27', country: 'جنوب أفريقيا', name: 'South Africa' },
  { code: '+82', country: 'كوريا الجنوبية', name: 'South Korea' },
  { code: '+34', country: 'إسبانيا', name: 'Spain' },
  { code: '+94', country: 'سريلانكا', name: 'Sri Lanka' },
  { code: '+249', country: 'السودان', name: 'Sudan' },
  { code: '+46', country: 'السويد', name: 'Sweden' },
  { code: '+41', country: 'سويسرا', name: 'Switzerland' },
  { code: '+963', country: 'سوريا', name: 'Syria' },
  { code: '+886', country: 'تايوان', name: 'Taiwan' },
  { code: '+992', country: 'طاجيكستان', name: 'Tajikistan' },
  { code: '+255', country: 'تنزانيا', name: 'Tanzania' },
  { code: '+66', country: 'تايلاند', name: 'Thailand' },
  { code: '+216', country: 'تونس', name: 'Tunisia' },
  { code: '+90', country: 'تركيا', name: 'Turkey' },
  { code: '+993', country: 'تركمانستان', name: 'Turkmenistan' },
  { code: '+256', country: 'أوغندا', name: 'Uganda' },
  { code: '+380', country: 'أوكرانيا', name: 'Ukraine' },
  { code: '+971', country: 'الإمارات', name: 'UAE' },
  { code: '+44', country: 'بريطانيا', name: 'United Kingdom' },
  { code: '+1', country: 'أمريكا', name: 'United States' },
  { code: '+598', country: 'أوروغواي', name: 'Uruguay' },
  { code: '+998', country: 'أوزبكستان', name: 'Uzbekistan' },
  { code: '+58', country: 'فنزويلا', name: 'Venezuela' },
  { code: '+84', country: 'فيتنام', name: 'Vietnam' },
  { code: '+967', country: 'اليمن', name: 'Yemen' },
  { code: '+260', country: 'زامبيا', name: 'Zambia' },
  { code: '+263', country: 'زيمبابوي', name: 'Zimbabwe' },
];

export default function StudentsSection() {
  const { currencySymbol } = useSchoolSettings();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState({
    arabicName: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female',
    enrollmentDate: new Date().toISOString().split('T')[0],
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    address: '',
    status: 'active' as const,
  });

  const [initialAmountDue, setInitialAmountDue] = useState('');
  const [editAmountDue, setEditAmountDue] = useState('');
  const [studentAccount, setStudentAccount] = useState<StudentAccount | null>(null);
  const [phoneCountryCode, setPhoneCountryCode] = useState('+961');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [editPhoneCountryCode, setEditPhoneCountryCode] = useState('+961');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [openCountryCode, setOpenCountryCode] = useState(false);
  const [openEditCountryCode, setOpenEditCountryCode] = useState(false);
  
  const [selectedEducationLevelId, setSelectedEducationLevelId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [editSelectedEducationLevelId, setEditSelectedEducationLevelId] = useState('');
  const [editSelectedClassId, setEditSelectedClassId] = useState('');
  
  const [filterEducationLevelId, setFilterEducationLevelId] = useState('');
  const [filterClassId, setFilterClassId] = useState('');
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
  });
  
  const { data: educationLevels = [] } = useQuery<EducationLevel[]>({
    queryKey: ['/api/education-levels'],
  });

  const { data: schoolSettings } = useQuery<SchoolSettings>({
    queryKey: ['/api/school-settings'],
  });

  const { data: studentAccounts = [] } = useQuery<StudentAccount[]>({
    queryKey: ['/api/accounting/accounts'],
  });
  
  const availableClasses = selectedEducationLevelId 
    ? classes.filter(c => c.educationLevelId === selectedEducationLevelId)
    : [];
    
  const editAvailableClasses = editSelectedEducationLevelId 
    ? classes.filter(c => c.educationLevelId === editSelectedEducationLevelId)
    : [];
    
  const filterAvailableClasses = filterEducationLevelId 
    ? classes.filter(c => c.educationLevelId === filterEducationLevelId)
    : [];

  const createMutation = useMutation({
    mutationFn: async (data: typeof newStudent & { classId?: string }) => {
      const response = await apiRequest('POST', '/api/students', data);
      const student = await response.json();
      
      // إنشاء حساب مالي لكل طالب جديد (حتى لو المبلغ = 0)
      if (schoolSettings) {
        const amountValue = initialAmountDue.trim();
        const numericAmount = amountValue ? parseFloat(amountValue) : 0;
        
        if (!isNaN(numericAmount) && numericAmount >= 0) {
          const amountDue = numericAmount.toFixed(2);
          
          await apiRequest('POST', '/api/accounting/accounts', {
            studentId: student.id,
            totalAmountDue: amountDue,
            totalPaid: '0.00',
            currentBalance: amountDue,
            academicYear: schoolSettings.currentAcademicYear,
          });
        }
      }
      
      return student;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/accounts'] });
      setIsAddDialogOpen(false);
      setNewStudent({
        arabicName: '',
        dateOfBirth: '',
        gender: 'male',
        enrollmentDate: new Date().toISOString().split('T')[0],
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        address: '',
        status: 'active',
      });
      setInitialAmountDue('');
      setPhoneCountryCode('+961');
      setPhoneNumber('');
      setSelectedEducationLevelId('');
      setSelectedClassId('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Student> }) => {
      await apiRequest('PATCH', `/api/students/${id}`, data);
      
      // تحديث المبلغ المالي إذا تم تغييره
      if (editAmountDue !== '' && editAmountDue !== null && editAmountDue !== undefined && studentAccount && schoolSettings) {
        const numericAmount = parseFloat(editAmountDue);
        if (!isNaN(numericAmount) && numericAmount >= 0) {
          const newTotalDue = numericAmount.toFixed(2);
          const currentPaid = Number(studentAccount.totalPaid);
          const newBalance = (numericAmount - currentPaid).toFixed(2);
          
          await apiRequest('PATCH', `/api/accounting/accounts/${studentAccount.id}`, {
            totalAmountDue: newTotalDue,
            currentBalance: newBalance,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/accounts'] });
      setIsEditDialogOpen(false);
      setEditingStudent(null);
      setEditAmountDue('');
      setStudentAccount(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/students/${id}`);
    },
    onSuccess: () => {
      // تحديث جميع البيانات المرتبطة بالطالب المحذوف
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/grades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setDeleteConfirmOpen(false);
      setStudentToDelete(null);
      toast({
        title: 'تم الحذف بنجاح',
        description: 'تم حذف الطالب من النظام',
      });
    },
    onError: () => {
      setDeleteConfirmOpen(false);
      setStudentToDelete(null);
      toast({
        title: 'فشل الحذف',
        description: 'حدث خطأ أثناء حذف الطالب. يرجى المحاولة مرة أخرى',
        variant: 'destructive',
      });
    },
  });
  
  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
    setDeleteConfirmOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (studentToDelete) {
      deleteMutation.mutate(studentToDelete.id);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesName = student.arabicName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClassId ? student.classId === filterClassId : true;
    const matchesLevel = filterEducationLevelId && !filterClassId 
      ? classes.find(c => c.id === student.classId)?.educationLevelId === filterEducationLevelId
      : true;
    
    return matchesName && matchesClass && matchesLevel;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhone = phoneCountryCode + phoneNumber;
    createMutation.mutate({ 
      ...newStudent, 
      parentPhone: fullPhone,
      classId: selectedClassId || undefined
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      const fullPhone = editPhoneCountryCode + editPhoneNumber;
      updateMutation.mutate({ 
        id: editingStudent.id, 
        data: { 
          ...editingStudent, 
          parentPhone: fullPhone,
          classId: editSelectedClassId || undefined
        } 
      });
    }
  };

  const createPaymentReminderMessage = (studentName: string, balance: number) => {
    const formattedBalance = Number(balance).toLocaleString();
    
    const message = `السلام عليكم ورحمة الله وبركاته

كيف الحال؟ نأمل أن تكونوا بخير

نود تذكيركم بالقسط المتبقي على الطالب/ة ${studentName}

المبلغ المتبقي: ${formattedBalance} ${currencySymbol}

نرجو منكم التكرم بتسديد الدفعة الشهرية في أقرب وقت ممكن، حيث أن ذلك يساعدنا على الاستمرار في تقديم أفضل خدمة تعليمية لأبنائكم

نشكر لكم تعاونكم الدائم ونقدر ثقتكم بنا`;

    return encodeURIComponent(message);
  };

  const openEditDialog = async (student: Student) => {
    setEditingStudent(student);
    setIsEditDialogOpen(true);
    
    // تقسيم رقم الهاتف إلى رمز الدولة والرقم
    const phone = student.parentPhone || '';
    const countryCodeMatch = phone.match(/^\+\d{1,4}/);
    if (countryCodeMatch) {
      setEditPhoneCountryCode(countryCodeMatch[0]);
      setEditPhoneNumber(phone.substring(countryCodeMatch[0].length));
    } else {
      setEditPhoneCountryCode('+961');
      setEditPhoneNumber(phone);
    }
    
    // تعيين المرحلة والصف الحالي
    if (student.classId) {
      const studentClass = classes.find(c => c.id === student.classId);
      if (studentClass) {
        setEditSelectedEducationLevelId(studentClass.educationLevelId || '');
        setEditSelectedClassId(student.classId);
      }
    } else {
      setEditSelectedEducationLevelId('');
      setEditSelectedClassId('');
    }
    
    // جلب الحساب المالي للطالب
    try {
      const response = await fetch(`/api/accounting/accounts/${student.id}`);
      if (response.ok) {
        const account = await response.json();
        setStudentAccount(account);
        setEditAmountDue(account.totalAmountDue);
      } else {
        setStudentAccount(null);
        setEditAmountDue('');
      }
    } catch (error) {
      setStudentAccount(null);
      setEditAmountDue('');
    }
  };

  return (
    <div className="fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">إدارة الطلاب</h1>
        <p className="text-gray-600 dark:text-gray-400">إدارة شاملة لجميع الطلاب المسجلين في المدرسة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-bold mb-2">إجمالي الطلاب</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{students.length}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-bold mb-2">طلاب نشطين</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{students.filter(s => s.status === 'active').length}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-bold mb-2">طلاب معلقين</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{students.filter(s => s.status === 'suspended').length}</p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-bold mb-2">صفوف دراسية</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{classes.length}</p>
            </div>
            <div className="text-4xl">🏛️</div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <Input
            placeholder="ابحث عن طالب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md text-white placeholder:text-white/60"
            data-testid="input-student-search"
          />
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-student">➕ إضافة طالب جديد</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card backdrop-blur-xl bg-white/80">
              <DialogHeader>
                <DialogTitle>إضافة طالب جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="font-bold">الاسم بالعربية</Label>
                    <Input
                      value={newStudent.arabicName}
                      onChange={(e) => setNewStudent({ ...newStudent, arabicName: e.target.value })}
                      required
                      data-testid="input-arabicname"
                    />
                  </div>
                  <div>
                    <Label className="font-bold">تاريخ الميلاد</Label>
                    <Input
                      type="date"
                      value={newStudent.dateOfBirth}
                      onChange={(e) => setNewStudent({ ...newStudent, dateOfBirth: e.target.value })}
                      min={new Date(new Date().setFullYear(new Date().getFullYear() - 60)).toISOString().split('T')[0]}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 3)).toISOString().split('T')[0]}
                      required
                      data-testid="input-dob"
                    />
                  </div>
                  <div>
                    <Label className="font-bold">الجنس</Label>
                    <Select
                      value={newStudent.gender}
                      onValueChange={(value: 'male' | 'female') => setNewStudent({ ...newStudent, gender: value })}
                    >
                      <SelectTrigger data-testid="select-gender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-bold">المرحلة الدراسية</Label>
                    <Select
                      value={selectedEducationLevelId}
                      onValueChange={(value) => {
                        setSelectedEducationLevelId(value);
                        setSelectedClassId('');
                      }}
                    >
                      <SelectTrigger data-testid="select-education-level">
                        <SelectValue placeholder="اختر المرحلة" />
                      </SelectTrigger>
                      <SelectContent>
                        {educationLevels.map((level) => (
                          <SelectItem key={level.id} value={level.id}>
                            {level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="font-bold">الصف والشعبة</Label>
                    <Select
                      value={selectedClassId}
                      onValueChange={setSelectedClassId}
                      disabled={!selectedEducationLevelId}
                    >
                      <SelectTrigger data-testid="select-class">
                        <SelectValue placeholder={selectedEducationLevelId ? "اختر الصف والشعبة" : "اختر المرحلة أولاً"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableClasses.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.grade} - شعبة {cls.section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-bold">اسم ولي الأمر</Label>
                    <Input
                      value={newStudent.parentName}
                      onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })}
                      required
                      data-testid="input-parent-name"
                    />
                  </div>
                  <div>
                    <Label className="font-bold">هاتف ولي الأمر</Label>
                    <div className="flex gap-2">
                      <Popover open={openCountryCode} onOpenChange={setOpenCountryCode}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCountryCode}
                            className="w-[140px] justify-between"
                            data-testid="select-country-code"
                          >
                            {phoneCountryCode || "اختر..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandInput placeholder="ابحث عن دولة..." />
                            <CommandList>
                              <CommandEmpty>لا توجد نتائج</CommandEmpty>
                              <CommandGroup>
                                {countryCodes.map((country) => (
                                  <CommandItem
                                    key={country.code + country.country}
                                    value={`${country.code} ${country.country} ${country.name}`}
                                    onSelect={() => {
                                      setPhoneCountryCode(country.code);
                                      setOpenCountryCode(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        phoneCountryCode === country.code ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {country.code} {country.country}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="12345678"
                        required
                        className="flex-1"
                        data-testid="input-parent-phone"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="font-bold">البريد الإلكتروني</Label>
                    <Input
                      type="email"
                      value={newStudent.parentEmail}
                      onChange={(e) => setNewStudent({ ...newStudent, parentEmail: e.target.value })}
                      data-testid="input-parent-email"
                    />
                  </div>
                  <div>
                    <Label className="font-bold">تاريخ التسجيل</Label>
                    <Input
                      type="date"
                      value={newStudent.enrollmentDate}
                      onChange={(e) => setNewStudent({ ...newStudent, enrollmentDate: e.target.value })}
                      required
                      data-testid="input-enrollment-date"
                    />
                  </div>
                </div>
                <div>
                  <Label className="font-bold">العنوان</Label>
                  <Input
                    value={newStudent.address}
                    onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })}
                    data-testid="input-address"
                  />
                </div>
                <div>
                  <Label className="font-bold">المبلغ المستحق ({currencySymbol})</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={initialAmountDue}
                    onChange={(e) => setInitialAmountDue(convertArabicToEnglishNumbers(e.target.value))}
                    placeholder="5000"
                    data-testid="input-initial-amount"
                  />
                  <p className="text-xs text-gray-500 mt-1">المبلغ الإجمالي المستحق على الطالب للسنة الدراسية (مثال: 5000)</p>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-student">
                  {createMutation.isPending ? 'جاري الإضافة...' : 'إضافة الطالب'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Label className="text-gray-700 dark:text-white mb-2 block">المرحلة الدراسية</Label>
            <Select
              value={filterEducationLevelId || 'all'}
              onValueChange={(value) => {
                setFilterEducationLevelId(value === 'all' ? '' : value);
                setFilterClassId('');
              }}
            >
              <SelectTrigger data-testid="filter-education-level" className="bg-white">
                <SelectValue placeholder="جميع المراحل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المراحل</SelectItem>
                {educationLevels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-gray-700 dark:text-white mb-2 block">الصف والشعبة</Label>
            <Select
              value={filterClassId || 'all'}
              onValueChange={(value) => setFilterClassId(value === 'all' ? '' : value)}
              disabled={!filterEducationLevelId}
            >
              <SelectTrigger data-testid="filter-class" className="bg-white">
                <SelectValue placeholder={filterEducationLevelId ? "جميع الصفوف" : "اختر المرحلة أولاً"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الصفوف</SelectItem>
                {filterAvailableClasses.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.grade} - شعبة {cls.section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setFilterEducationLevelId('');
                setFilterClassId('');
              }}
              className="w-full"
              data-testid="button-clear-filters"
            >
              مسح الفلاتر
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-600">جاري التحميل...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-gray-600">لا يوجد طلاب</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الطالب</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ولي الأمر</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الهاتف</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {student.arabicName?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{student.arabicName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{student.parentName}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{student.parentPhone}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        student.status === 'active' ? 'bg-green-100 text-green-800' :
                        student.status === 'suspended' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {student.status === 'active' ? 'نشط' : 
                         student.status === 'suspended' ? 'معلق' : student.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => {
                            const phoneNumber = student.parentPhone.replace(/[^0-9]/g, '');
                            window.open(`https://wa.me/${phoneNumber}`, '_blank');
                          }}
                          data-testid={`button-whatsapp-${student.id}`}
                        >
                          <SiWhatsapp className="h-5 w-5" />
                        </Button>
                        {(() => {
                          const account = studentAccounts.find(acc => acc.studentId === student.id);
                          const hasBalance = account && Number(account.currentBalance) > 0;
                          
                          return hasBalance ? (
                            <Button 
                              size="icon" 
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                const phoneNumber = student.parentPhone.replace(/[^0-9]/g, '');
                                const message = createPaymentReminderMessage(
                                  student.arabicName || '',
                                  Number(account.currentBalance)
                                );
                                window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
                              }}
                              data-testid={`button-whatsapp-reminder-${student.id}`}
                              title="تذكير بالقسط المتبقي"
                            >
                              <SiWhatsapp className="h-5 w-5" />
                            </Button>
                          ) : null;
                        })()}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openEditDialog(student)}
                          data-testid={`button-edit-${student.id}`}
                        >
                          تعديل
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteClick(student)}
                          data-testid={`button-delete-${student.id}`}
                        >
                          حذف
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card backdrop-blur-xl bg-white/80">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الطالب</DialogTitle>
          </DialogHeader>
          {editingStudent && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="font-bold">الاسم بالعربية</Label>
                  <Input
                    value={editingStudent.arabicName || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, arabicName: e.target.value })}
                    required
                    data-testid="input-edit-arabicname"
                  />
                </div>
                <div>
                  <Label className="font-bold">المرحلة الدراسية</Label>
                  <Select
                    value={editSelectedEducationLevelId}
                    onValueChange={(value) => {
                      setEditSelectedEducationLevelId(value);
                      setEditSelectedClassId('');
                    }}
                  >
                    <SelectTrigger data-testid="select-edit-education-level">
                      <SelectValue placeholder="اختر المرحلة" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationLevels.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bold">الصف والشعبة</Label>
                  <Select
                    value={editSelectedClassId}
                    onValueChange={setEditSelectedClassId}
                    disabled={!editSelectedEducationLevelId}
                  >
                    <SelectTrigger data-testid="select-edit-class">
                      <SelectValue placeholder={editSelectedEducationLevelId ? "اختر الصف والشعبة" : "اختر المرحلة أولاً"} />
                    </SelectTrigger>
                    <SelectContent>
                      {editAvailableClasses.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.grade} - شعبة {cls.section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bold">اسم ولي الأمر</Label>
                  <Input
                    value={editingStudent.parentName || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, parentName: e.target.value })}
                    required
                    data-testid="input-edit-parent-name"
                  />
                </div>
                <div>
                  <Label className="font-bold">هاتف ولي الأمر</Label>
                  <div className="flex gap-2">
                    <Popover open={openEditCountryCode} onOpenChange={setOpenEditCountryCode}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openEditCountryCode}
                          className="w-[140px] justify-between"
                          data-testid="select-edit-country-code"
                        >
                          {editPhoneCountryCode || "اختر..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="ابحث عن دولة..." />
                          <CommandList>
                            <CommandEmpty>لا توجد نتائج</CommandEmpty>
                            <CommandGroup>
                              {countryCodes.map((country) => (
                                <CommandItem
                                  key={country.code + country.country}
                                  value={`${country.code} ${country.country} ${country.name}`}
                                  onSelect={() => {
                                    setEditPhoneCountryCode(country.code);
                                    setOpenEditCountryCode(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      editPhoneCountryCode === country.code ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {country.code} {country.country}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Input
                      value={editPhoneNumber}
                      onChange={(e) => setEditPhoneNumber(e.target.value)}
                      placeholder="12345678"
                      required
                      className="flex-1"
                      data-testid="input-edit-parent-phone"
                    />
                  </div>
                </div>
                <div>
                  <Label className="font-bold">البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={editingStudent.parentEmail || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, parentEmail: e.target.value })}
                    data-testid="input-edit-parent-email"
                  />
                </div>
                <div>
                  <Label className="font-bold">الحالة</Label>
                  <Select
                    value={editingStudent.status || 'active'}
                    onValueChange={(value) => setEditingStudent({ ...editingStudent, status: value as any })}
                  >
                    <SelectTrigger data-testid="select-edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="suspended">معلق</SelectItem>
                      <SelectItem value="graduated">متخرج</SelectItem>
                      <SelectItem value="transferred">منقول</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="font-bold">العنوان</Label>
                <Input
                  value={editingStudent.address || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })}
                  data-testid="input-edit-address"
                />
              </div>
              <div>
                <Label className="font-bold">المبلغ المستحق ({currencySymbol})</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={editAmountDue}
                  onChange={(e) => setEditAmountDue(convertArabicToEnglishNumbers(e.target.value))}
                  placeholder="5000"
                  data-testid="input-edit-amount-due"
                />
                {studentAccount && (
                  <p className="text-xs text-gray-500 mt-1">
                    المدفوع حالياً: {Number(studentAccount.totalPaid).toLocaleString()} {currencySymbol} | 
                    الرصيد المتبقي: {Number(studentAccount.currentBalance).toLocaleString()} {currencySymbol}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={updateMutation.isPending} data-testid="button-submit-edit">
                {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="glass-card backdrop-blur-xl bg-white/80">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إتمام عملية حذف الطالب{' '}
              <span className="font-bold text-gray-900 dark:text-white">{studentToDelete?.arabicName}</span>؟
              <br />
              <span className="text-red-600 font-semibold">
                سيتم حذف جميع البيانات المرتبطة بالطالب بما في ذلك:
              </span>
              <br />
              <span className="text-sm">
                • السجلات المالية والدفعات
                <br />
                • سجلات الحضور والغياب
                <br />
                • الدرجات والتقييمات
              </span>
              <br />
              <span className="font-semibold">لن تتمكن من التراجع عن هذا الإجراء.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? 'جاري الحذف...' : 'نعم، احذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
