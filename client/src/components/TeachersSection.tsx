import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Teacher } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSchoolSettings } from '@/contexts/SchoolSettingsContext';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SiWhatsapp } from 'react-icons/si';

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

export default function TeachersSection() {
  const { toast } = useToast();
  const { currencySymbol } = useSchoolSettings();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [newTeacher, setNewTeacher] = useState({
    arabicName: '',
    email: '',
    phone: '',
    gender: 'male' as 'male' | 'female',
    hireDate: new Date().toISOString().split('T')[0],
    qualification: '',
    specialization: '',
    monthlySalary: '0',
    status: 'active' as const,
  });

  const [phoneCountryCode, setPhoneCountryCode] = useState('+961');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [editPhoneCountryCode, setEditPhoneCountryCode] = useState('+961');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [openCountryCode, setOpenCountryCode] = useState(false);
  const [openEditCountryCode, setOpenEditCountryCode] = useState(false);

  const { data: teachers = [], isLoading } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newTeacher) => {
      return await apiRequest('POST', '/api/teachers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      setIsAddDialogOpen(false);
      setNewTeacher({
        arabicName: '',
        email: '',
        phone: '',
        gender: 'male',
        hireDate: new Date().toISOString().split('T')[0],
        qualification: '',
        specialization: '',
        monthlySalary: '0',
        status: 'active',
      });
      setPhoneCountryCode('+961');
      setPhoneNumber('');
      toast({
        title: "تم بنجاح",
        description: "تمت إضافة المعلم بنجاح",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.error || "حدث خطأ أثناء إضافة المعلم";
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Teacher> }) => {
      return await apiRequest('PATCH', `/api/teachers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      setIsEditDialogOpen(false);
      setEditingTeacher(null);
      toast({
        title: "تم بنجاح",
        description: "تم تحديث بيانات المعلم بنجاح",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.error || "حدث خطأ أثناء تحديث بيانات المعلم";
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/teachers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      setDeleteConfirmOpen(false);
      setTeacherToDelete(null);
      toast({
        title: 'تم الحذف بنجاح',
        description: 'تم حذف المعلم من النظام',
      });
    },
    onError: () => {
      setDeleteConfirmOpen(false);
      setTeacherToDelete(null);
      toast({
        title: 'فشل الحذف',
        description: 'حدث خطأ أثناء حذف المعلم. يرجى المحاولة مرة أخرى',
        variant: 'destructive',
      });
    },
  });
  
  const handleDeleteClick = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setDeleteConfirmOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (teacherToDelete) {
      deleteMutation.mutate(teacherToDelete.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhone = phoneCountryCode + phoneNumber;
    createMutation.mutate({ ...newTeacher, phone: fullPhone });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacher) {
      const fullPhone = editPhoneCountryCode + editPhoneNumber;
      updateMutation.mutate({ id: editingTeacher.id, data: { ...editingTeacher, phone: fullPhone } });
    }
  };

  const openEditDialog = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    
    const phone = teacher.phone || '';
    const countryCodeMatch = phone.match(/^\+\d{1,4}/);
    if (countryCodeMatch) {
      setEditPhoneCountryCode(countryCodeMatch[0]);
      setEditPhoneNumber(phone.substring(countryCodeMatch[0].length));
    } else {
      setEditPhoneCountryCode('+961');
      setEditPhoneNumber(phone);
    }
    
    setIsEditDialogOpen(true);
  };

  return (
    <div className="fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">إدارة المعلمين</h1>
        <p className="text-gray-600 dark:text-gray-400">إدارة كادر المعلمين في المدرسة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-bold mb-2">إجمالي المعلمين</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{teachers.length}</p>
            </div>
            <div className="text-4xl">👨‍🏫</div>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-bold mb-2">معلمين نشطين</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{teachers.filter(t => t.status === 'active').length}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-bold mb-2">في إجازة</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{teachers.filter(t => t.status === 'on_leave').length}</p>
            </div>
            <div className="text-4xl">🏖️</div>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-bold mb-2">تخصصات مختلفة</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{new Set(teachers.map(t => t.specialization)).size}</p>
            </div>
            <div className="text-4xl">📚</div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">قائمة المعلمين</h3>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-teacher">➕ إضافة معلم جديد</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl glass-card backdrop-blur-xl bg-white/80 dark:bg-gray-900/90">
              <DialogHeader>
                <DialogTitle>إضافة معلم جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>الاسم بالعربية</Label>
                    <Input
                      value={newTeacher.arabicName}
                      onChange={(e) => setNewTeacher({ ...newTeacher, arabicName: e.target.value })}
                      required
                      data-testid="input-teacher-arabicname"
                    />
                  </div>
                  <div>
                    <Label>البريد الإلكتروني</Label>
                    <Input
                      type="email"
                      value={newTeacher.email}
                      onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                      data-testid="input-teacher-email"
                    />
                  </div>
                  <div>
                    <Label>الهاتف</Label>
                    <div className="flex gap-2">
                      <Popover open={openCountryCode} onOpenChange={setOpenCountryCode}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCountryCode}
                            className="w-[140px] justify-between"
                            data-testid="select-teacher-country-code"
                          >
                            {phoneCountryCode || "اختر..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
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
                        data-testid="input-teacher-phone"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>الجنس</Label>
                    <Select
                      value={newTeacher.gender}
                      onValueChange={(value: 'male' | 'female') => setNewTeacher({ ...newTeacher, gender: value })}
                    >
                      <SelectTrigger data-testid="select-teacher-gender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>تاريخ التوظيف</Label>
                    <Input
                      type="date"
                      value={newTeacher.hireDate}
                      onChange={(e) => setNewTeacher({ ...newTeacher, hireDate: e.target.value })}
                      required
                      data-testid="input-teacher-hiredate"
                    />
                  </div>
                  <div>
                    <Label>المؤهل العلمي</Label>
                    <Input
                      value={newTeacher.qualification}
                      onChange={(e) => setNewTeacher({ ...newTeacher, qualification: e.target.value })}
                      data-testid="input-teacher-qualification"
                    />
                  </div>
                  <div>
                    <Label>التخصص</Label>
                    <Input
                      value={newTeacher.specialization}
                      onChange={(e) => setNewTeacher({ ...newTeacher, specialization: e.target.value })}
                      data-testid="input-teacher-specialization"
                    />
                  </div>
                  <div>
                    <Label>الراتب الشهري</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newTeacher.monthlySalary}
                      onChange={(e) => setNewTeacher({ ...newTeacher, monthlySalary: e.target.value })}
                      required
                      data-testid="input-teacher-salary"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-teacher">
                  {createMutation.isPending ? 'جاري الإضافة...' : 'إضافة المعلم'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">جاري التحميل...</div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">لا يوجد معلمين</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">المعلم</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">التخصص</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">البريد</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الهاتف</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الحالة</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {teacher.arabicName?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{teacher.arabicName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">راتب: {Number(teacher.monthlySalary).toFixed(2)} {currencySymbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{teacher.specialization || '-'}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{teacher.email}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{teacher.phone}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        teacher.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                        teacher.status === 'on_leave' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {teacher.status === 'active' ? 'نشط' : 
                         teacher.status === 'on_leave' ? 'في إجازة' : teacher.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => {
                            const phoneNumber = teacher.phone.replace(/[^0-9]/g, '');
                            window.open(`https://wa.me/${phoneNumber}`, '_blank');
                          }}
                          data-testid={`button-whatsapp-teacher-${teacher.id}`}
                        >
                          <SiWhatsapp className="h-5 w-5" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openEditDialog(teacher)}
                          data-testid={`button-edit-teacher-${teacher.id}`}
                        >
                          تعديل
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteClick(teacher)}
                          data-testid={`button-delete-teacher-${teacher.id}`}
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
        <DialogContent className="max-w-2xl glass-card backdrop-blur-xl bg-white/80 dark:bg-gray-900/90">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المعلم</DialogTitle>
          </DialogHeader>
          {editingTeacher && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>الاسم بالعربية</Label>
                  <Input
                    value={editingTeacher.arabicName || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, arabicName: e.target.value })}
                    required
                    data-testid="input-edit-teacher-arabicname"
                  />
                </div>
                <div>
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={editingTeacher.email || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                    data-testid="input-edit-teacher-email"
                  />
                </div>
                <div>
                  <Label>الهاتف</Label>
                  <div className="flex gap-2">
                    <Popover open={openEditCountryCode} onOpenChange={setOpenEditCountryCode}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openEditCountryCode}
                          className="w-[140px] justify-between"
                          data-testid="select-edit-teacher-country-code"
                        >
                          {editPhoneCountryCode || "اختر..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
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
                      data-testid="input-edit-teacher-phone"
                    />
                  </div>
                </div>
                <div>
                  <Label>المؤهل العلمي</Label>
                  <Input
                    value={editingTeacher.qualification || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, qualification: e.target.value })}
                    data-testid="input-edit-teacher-qualification"
                  />
                </div>
                <div>
                  <Label>التخصص</Label>
                  <Input
                    value={editingTeacher.specialization || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, specialization: e.target.value })}
                    data-testid="input-edit-teacher-specialization"
                  />
                </div>
                <div>
                  <Label>الراتب الشهري</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingTeacher.monthlySalary || '0'}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, monthlySalary: e.target.value })}
                    required
                    data-testid="input-edit-teacher-salary"
                  />
                </div>
                <div>
                  <Label>الحالة</Label>
                  <Select
                    value={editingTeacher.status || 'active'}
                    onValueChange={(value) => setEditingTeacher({ ...editingTeacher, status: value as any })}
                  >
                    <SelectTrigger data-testid="select-edit-teacher-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="on_leave">في إجازة</SelectItem>
                      <SelectItem value="resigned">مستقيل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={updateMutation.isPending} data-testid="button-submit-edit-teacher">
                {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="glass-card backdrop-blur-xl bg-white/80 dark:bg-gray-900/90">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إتمام عملية حذف المعلم{' '}
              <span className="font-bold text-gray-900 dark:text-white">{teacherToDelete?.arabicName}</span>؟
              <br />
              <span className="text-red-600 font-semibold">
                سيتم حذف جميع البيانات المرتبطة بالمعلم بما في ذلك:
              </span>
              <br />
              <span className="text-sm">
                • الصفوف المعينة للمعلم
                <br />
                • المواد التي يدرسها
                <br />
                • سجلات الرواتب والسلف
              </span>
              <br />
              <span className="font-semibold">لن تتمكن من التراجع عن هذا الإجراء.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-teacher">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
              data-testid="button-confirm-delete-teacher"
            >
              {deleteMutation.isPending ? 'جاري الحذف...' : 'نعم، احذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
