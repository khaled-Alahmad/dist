import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { SchoolSettings } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';

const CURRENCIES = [
  { code: 'SAR', nameAr: 'ريال سعودي', nameEn: 'Saudi Riyal', symbol: 'ر.س' },
  { code: 'AED', nameAr: 'درهم إماراتي', nameEn: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'KWD', nameAr: 'دينار كويتي', nameEn: 'Kuwaiti Dinar', symbol: 'د.ك' },
  { code: 'QAR', nameAr: 'ريال قطري', nameEn: 'Qatari Riyal', symbol: 'ر.ق' },
  { code: 'BHD', nameAr: 'دينار بحريني', nameEn: 'Bahraini Dinar', symbol: 'د.ب' },
  { code: 'OMR', nameAr: 'ريال عماني', nameEn: 'Omani Rial', symbol: 'ر.ع' },
  { code: 'EGP', nameAr: 'جنيه مصري', nameEn: 'Egyptian Pound', symbol: 'ج.م' },
  { code: 'JOD', nameAr: 'دينار أردني', nameEn: 'Jordanian Dinar', symbol: 'د.ا' },
  { code: 'LBP', nameAr: 'ليرة لبنانية', nameEn: 'Lebanese Pound', symbol: 'ل.ل' },
  { code: 'IQD', nameAr: 'دينار عراقي', nameEn: 'Iraqi Dinar', symbol: 'د.ع' },
  { code: 'SYP', nameAr: 'ليرة سورية', nameEn: 'Syrian Pound', symbol: 'ل.س' },
  { code: 'MAD', nameAr: 'درهم مغربي', nameEn: 'Moroccan Dirham', symbol: 'د.م' },
  { code: 'TND', nameAr: 'دينار تونسي', nameEn: 'Tunisian Dinar', symbol: 'د.ت' },
  { code: 'DZD', nameAr: 'دينار جزائري', nameEn: 'Algerian Dinar', symbol: 'د.ج' },
  { code: 'LYD', nameAr: 'دينار ليبي', nameEn: 'Libyan Dinar', symbol: 'د.ل' },
  { code: 'SDG', nameAr: 'جنيه سوداني', nameEn: 'Sudanese Pound', symbol: 'ج.س' },
  { code: 'YER', nameAr: 'ريال يمني', nameEn: 'Yemeni Rial', symbol: 'ر.ي' },
  { code: 'USD', nameAr: 'دولار أمريكي', nameEn: 'US Dollar', symbol: '$' },
  { code: 'EUR', nameAr: 'يورو', nameEn: 'Euro', symbol: '€' },
  { code: 'GBP', nameAr: 'جنيه إسترليني', nameEn: 'British Pound', symbol: '£' },
  { code: 'JPY', nameAr: 'ين ياباني', nameEn: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', nameAr: 'يوان صيني', nameEn: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', nameAr: 'روبية هندية', nameEn: 'Indian Rupee', symbol: '₹' },
  { code: 'PKR', nameAr: 'روبية باكستانية', nameEn: 'Pakistani Rupee', symbol: '₨' },
  { code: 'BDT', nameAr: 'تاكا بنغلاديشية', nameEn: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'TRY', nameAr: 'ليرة تركية', nameEn: 'Turkish Lira', symbol: '₺' },
  { code: 'IRR', nameAr: 'ريال إيراني', nameEn: 'Iranian Rial', symbol: '﷼' },
  { code: 'AFN', nameAr: 'أفغاني', nameEn: 'Afghan Afghani', symbol: '؋' },
  { code: 'RUB', nameAr: 'روبل روسي', nameEn: 'Russian Ruble', symbol: '₽' },
  { code: 'CAD', nameAr: 'دولار كندي', nameEn: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', nameAr: 'دولار أسترالي', nameEn: 'Australian Dollar', symbol: 'A$' },
  { code: 'NZD', nameAr: 'دولار نيوزيلندي', nameEn: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'CHF', nameAr: 'فرنك سويسري', nameEn: 'Swiss Franc', symbol: 'CHF' },
  { code: 'SEK', nameAr: 'كرونة سويدية', nameEn: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', nameAr: 'كرونة نرويجية', nameEn: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', nameAr: 'كرونة دنماركية', nameEn: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', nameAr: 'زلوتي بولندي', nameEn: 'Polish Zloty', symbol: 'zł' },
  { code: 'ZAR', nameAr: 'راند جنوب أفريقي', nameEn: 'South African Rand', symbol: 'R' },
  { code: 'BRL', nameAr: 'ريال برازيلي', nameEn: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', nameAr: 'بيزو مكسيكي', nameEn: 'Mexican Peso', symbol: 'MX$' },
  { code: 'ARS', nameAr: 'بيزو أرجنتيني', nameEn: 'Argentine Peso', symbol: 'AR$' },
  { code: 'CLP', nameAr: 'بيزو تشيلي', nameEn: 'Chilean Peso', symbol: 'CL$' },
  { code: 'COP', nameAr: 'بيزو كولومبي', nameEn: 'Colombian Peso', symbol: 'CO$' },
  { code: 'SGD', nameAr: 'دولار سنغافوري', nameEn: 'Singapore Dollar', symbol: 'S$' },
  { code: 'MYR', nameAr: 'رينغيت ماليزي', nameEn: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'THB', nameAr: 'بات تايلندي', nameEn: 'Thai Baht', symbol: '฿' },
  { code: 'IDR', nameAr: 'روبية إندونيسية', nameEn: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'PHP', nameAr: 'بيزو فلبيني', nameEn: 'Philippine Peso', symbol: '₱' },
  { code: 'VND', nameAr: 'دونج فيتنامي', nameEn: 'Vietnamese Dong', symbol: '₫' },
  { code: 'KRW', nameAr: 'وون كوري', nameEn: 'South Korean Won', symbol: '₩' },
  { code: 'HKD', nameAr: 'دولار هونغ كونغ', nameEn: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'TWD', nameAr: 'دولار تايواني', nameEn: 'Taiwan Dollar', symbol: 'NT$' },
];

export default function SettingsSection() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery<SchoolSettings>({
    queryKey: ['/api/school-settings'],
  });

  const [open, setOpen] = useState(false);
  const [dateTypeOpen, setDateTypeOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    schoolName: settings?.schoolName || '',
    schoolNameArabic: settings?.schoolNameArabic || 'مدرسة النور الأهلية',
    currentAcademicYear: settings?.currentAcademicYear || '2024-2025',
    currency: settings?.currency || 'SAR',
    dateType: settings?.dateType || 'gregorian',
    phone: settings?.phone || '',
    email: settings?.email || '',
    address: settings?.address || '',
    logoUrl: settings?.logoUrl || '',
    primaryColor: settings?.primaryColor || '#3b82f6',
    accentColor: settings?.accentColor || '#10b981',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        schoolName: settings.schoolName || '',
        schoolNameArabic: settings.schoolNameArabic || 'مدرسة النور الأهلية',
        currentAcademicYear: settings.currentAcademicYear || '2024-2025',
        currency: settings.currency || 'SAR',
        dateType: settings.dateType || 'gregorian',
        phone: settings.phone || '',
        email: settings.email || '',
        address: settings.address || '',
        logoUrl: settings.logoUrl || '',
        primaryColor: settings.primaryColor || '#3b82f6',
        accentColor: settings.accentColor || '#10b981',
      });
      setLogoPreview(settings.logoUrl || null);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest('PATCH', '/api/school-settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/school-settings'] });
      toast({
        title: "تم الحفظ بنجاح ✅",
        description: "تم حفظ إعدادات المدرسة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "حدث خطأ ❌",
        description: "فشل حفظ الإعدادات. الرجاء المحاولة مرة أخرى",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطأ ❌",
        description: "الرجاء اختيار ملف صورة",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "خطأ ❌",
        description: "حجم الصورة كبير جداً. الرجاء اختيار صورة أصغر من 5 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setLogoPreview(base64String);
      setFormData({ ...formData, logoUrl: base64String });
    };
    reader.readAsDataURL(file);
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const response = await fetch('/api/database/backup');
      
      if (!response.ok) {
        throw new Error('فشل إنشاء النسخة الاحتياطية');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `school_backup_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "تم إنشاء النسخة الاحتياطية ✅",
        description: "تم تصدير قاعدة البيانات بصيغة SQL بنجاح",
      });
    } catch (error) {
      toast({
        title: "حدث خطأ ❌",
        description: "فشل إنشاء النسخة الاحتياطية",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export/excel');
      
      if (!response.ok) {
        throw new Error('فشل تصدير البيانات');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `school_data_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "تم تصدير البيانات ✅",
        description: "تم تصدير بيانات المدرسة إلى ملف Excel بنجاح",
      });
    } catch (error) {
      toast({
        title: "حدث خطأ ❌",
        description: "فشل تصدير البيانات",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">إعدادات المدرسة</h1>
        <p className="text-gray-600 dark:text-gray-300">إدارة معلومات وإعدادات المدرسة</p>
      </div>

      <div className="glass-card rounded-2xl p-6 mb-8 transition-colors">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">معلومات المدرسة</h3>
        
        {isLoading ? (
          <div className="text-center py-8 text-gray-600">جاري التحميل...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="mb-6">
              <Label>شعار المدرسة</Label>
              <div className="flex items-center gap-4 mt-2">
                {logoPreview && (
                  <div className="w-24 h-24 rounded-lg border-2 border-gray-200 overflow-hidden bg-white flex items-center justify-center p-2">
                    <img src={logoPreview} alt="School Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="cursor-pointer bg-white dark:bg-gray-800"
                    data-testid="input-logo"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">اختر صورة للشعار (PNG, JPG, SVG)</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>اسم المدرسة (English)</Label>
                <Input
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  placeholder="Al-Noor Private School"
                  className="bg-white dark:bg-gray-800"
                  data-testid="input-school-name"
                />
              </div>
              <div>
                <Label>اسم المدرسة بالعربية</Label>
                <Input
                  value={formData.schoolNameArabic}
                  onChange={(e) => setFormData({ ...formData, schoolNameArabic: e.target.value })}
                  placeholder="مدرسة النور الأهلية"
                  className="bg-white dark:bg-gray-800"
                  data-testid="input-school-name-arabic"
                />
              </div>
              <div>
                <Label>العام الدراسي الحالي</Label>
                <Input
                  value={formData.currentAcademicYear}
                  onChange={(e) => setFormData({ ...formData, currentAcademicYear: e.target.value })}
                  placeholder="2024-2025"
                  className="bg-white dark:bg-gray-800"
                  data-testid="input-academic-year"
                />
              </div>
              <div>
                <Label>العملة المستخدمة</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between font-normal"
                      data-testid="select-currency"
                    >
                      {formData.currency
                        ? (() => {
                            const selected = CURRENCIES.find(c => c.code === formData.currency);
                            return selected ? `${selected.symbol} - ${selected.nameAr} (${selected.code})` : 'اختر العملة';
                          })()
                        : 'اختر العملة'}
                      <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="ابحث عن العملة..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>لم يتم العثور على عملة</CommandEmpty>
                        <CommandGroup>
                          {CURRENCIES.map((currency) => (
                            <CommandItem
                              key={currency.code}
                              value={`${currency.code} ${currency.nameAr} ${currency.nameEn}`}
                              onSelect={() => {
                                setFormData({ ...formData, currency: currency.code });
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={`ml-2 h-4 w-4 ${
                                  formData.currency === currency.code ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                              {currency.symbol} - {currency.nameAr} ({currency.code})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>نوع التاريخ المستخدم</Label>
                <Popover open={dateTypeOpen} onOpenChange={setDateTypeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={dateTypeOpen}
                      className="w-full justify-between font-normal"
                      data-testid="select-date-type"
                    >
                      {formData.dateType === 'gregorian' ? 'تاريخ ميلادي' : 'تاريخ هجري'}
                      <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          <CommandItem
                            value="gregorian"
                            onSelect={() => {
                              setFormData({ ...formData, dateType: 'gregorian' });
                              setDateTypeOpen(false);
                            }}
                          >
                            <Check
                              className={`ml-2 h-4 w-4 ${
                                formData.dateType === 'gregorian' ? 'opacity-100' : 'opacity-0'
                              }`}
                            />
                            تاريخ ميلادي (Gregorian)
                          </CommandItem>
                          <CommandItem
                            value="hijri"
                            onSelect={() => {
                              setFormData({ ...formData, dateType: 'hijri' });
                              setDateTypeOpen(false);
                            }}
                          >
                            <Check
                              className={`ml-2 h-4 w-4 ${
                                formData.dateType === 'hijri' ? 'opacity-100' : 'opacity-0'
                              }`}
                            />
                            تاريخ هجري (Hijri)
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>رقم الهاتف</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+966 XX XXX XXXX"
                  className="bg-white dark:bg-gray-800"
                  data-testid="input-phone"
                />
              </div>
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@school.edu.sa"
                  className="bg-white dark:bg-gray-800"
                  data-testid="input-email"
                />
              </div>
              <div>
                <Label>العنوان</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="الرياض، المملكة العربية السعودية"
                  className="bg-white dark:bg-gray-800"
                  data-testid="input-address"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={updateMutation.isPending}
              data-testid="button-save-settings"
            >
              {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="gradient-primary-bg rounded-2xl p-6 card-hover-effect">
          <h3 className="text-lg font-bold text-white mb-3">النسخ الاحتياطي</h3>
          <p className="text-sm text-white/80 mb-4">حفظ نسخة احتياطية من البيانات بصيغة SQL</p>
          <Button 
            className="w-full bg-white text-purple-600 hover:bg-white/90" 
            onClick={handleBackup}
            disabled={isBackingUp}
            data-testid="button-backup"
          >
            {isBackingUp ? 'جاري الإنشاء...' : 'إنشاء نسخة احتياطية'}
          </Button>
        </div>

        <div className="gradient-success-bg rounded-2xl p-6 card-hover-effect">
          <h3 className="text-lg font-bold text-white mb-3">تصدير البيانات</h3>
          <p className="text-sm text-white/80 mb-4">تصدير بيانات المدرسة بصيغة Excel</p>
          <Button 
            className="w-full bg-white text-green-600 hover:bg-white/90" 
            onClick={handleExport}
            disabled={isExporting}
            data-testid="button-export"
          >
            {isExporting ? 'جاري التصدير...' : 'تصدير البيانات'}
          </Button>
        </div>

      </div>
    </div>
  );
}
