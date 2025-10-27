import StatCard from './StatCard';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useSchoolSettings } from '@/contexts/SchoolSettingsContext';
import { useAuth } from '@/hooks/use-auth';

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  activeTeachers: number;
  totalRevenue: number;
  pendingPayments: number;
  totalClasses: number;
}

interface DashboardSectionProps {
  onNavigate: (section: string) => void;
}

export default function DashboardSection({ onNavigate }: DashboardSectionProps) {
  const { currencySymbol, settings } = useSchoolSettings();
  const { user } = useAuth();
  
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    enabled: user?.role === 'admin',
  });

  const handleAddStudent = () => onNavigate('students');
  const handleAddTeacher = () => onNavigate('teachers');
  const handleSendNotification = () => onNavigate('communication');
  const handleRecordPayment = () => onNavigate('finance');

  const today = new Date();
  const dayOfMonth = today.getDate();
  const isPaymentReminderDay = dayOfMonth === 5;

  const helpfulTips = [
    {
      icon: '💡',
      title: 'نصيحة: تسجيل المستحقات المالية',
      message: 'تأكد من تسجيل جميع المستحقات المالية للطلاب بانتظام لضمان دقة الحسابات',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      messageColor: 'text-blue-700'
    },
    {
      icon: '📚',
      title: 'نصيحة: تحديث بيانات الطلاب',
      message: 'راجع بيانات الطلاب بشكل دوري وتأكد من تحديث معلومات الاتصال الخاصة بأولياء الأمور',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-600',
      titleColor: 'text-purple-900',
      messageColor: 'text-purple-700'
    },
    {
      icon: '👨‍🏫',
      title: 'نصيحة: توزيع المعلمين',
      message: 'تحقق من توزيع المعلمين على الصفوف بشكل متوازن وتأكد من تعيين معلم لكل مادة',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      messageColor: 'text-green-700'
    },
    {
      icon: '📊',
      title: 'نصيحة: مراجعة التقارير',
      message: 'راجع التقارير الأسبوعية للوقوف على أداء الطلاب والمعلمين واتخاذ القرارات المناسبة',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      iconColor: 'text-indigo-600',
      titleColor: 'text-indigo-900',
      messageColor: 'text-indigo-700'
    },
    {
      icon: '💰',
      title: 'نصيحة: متابعة الرسوم',
      message: 'تابع حالة الرسوم الدراسية بانتظام وتواصل مع أولياء الأمور للطلاب المتأخرين في السداد',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-900',
      messageColor: 'text-amber-700'
    },
    {
      icon: '📢',
      title: 'نصيحة: التواصل المستمر',
      message: 'حافظ على التواصل المستمر مع أولياء الأمور من خلال إرسال الإشعارات حول أداء أبنائهم',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      iconColor: 'text-teal-600',
      titleColor: 'text-teal-900',
      messageColor: 'text-teal-700'
    },
    {
      icon: '🎯',
      title: 'نصيحة: الحضور والغياب',
      message: 'سجل الحضور والغياب يومياً لجميع الصفوف لضمان متابعة دقيقة لحضور الطلاب',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      iconColor: 'text-cyan-600',
      titleColor: 'text-cyan-900',
      messageColor: 'text-cyan-700'
    },
    {
      icon: '⚙️',
      title: 'نصيحة: إعدادات النظام',
      message: 'راجع إعدادات المدرسة بشكل دوري وتأكد من صحة جميع المعلومات والبيانات المدخلة',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      iconColor: 'text-slate-600',
      titleColor: 'text-slate-900',
      messageColor: 'text-slate-700'
    }
  ];

  const randomTip = helpfulTips[Math.floor(Math.random() * helpfulTips.length)];

  if (user?.role === 'parent') {
    return (
      <div className="fade-in">
        <div className="max-w-4xl mx-auto mt-20">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-3xl p-12 text-center shadow-lg">
            <div className="mb-6">
              <span className="text-8xl">👨‍👩‍👧‍👦</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              مرحباً بك {user.fullName || 'ولي الأمر'}! 👋
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              أهلاً وسهلاً بك في نظام {settings?.schoolNameArabic || 'مدرسة النور الأهلية'}
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-md">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                📊 متابعة تقدم أبنائك
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                يمكنك متابعة التحصيل الدراسي والتقرير المالي لأبنائك من خلال قسم "تقارير الطلاب"
              </p>
              <Button 
                onClick={() => onNavigate('student-reports')}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
                data-testid="button-view-reports"
              >
                عرض التقارير 📑
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role === 'teacher') {
    return (
      <div className="fade-in">
        <div className="max-w-4xl mx-auto mt-20">
          <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-2 border-green-200 dark:border-green-700 rounded-3xl p-12 text-center shadow-lg">
            <div className="mb-6">
              <span className="text-8xl">👨‍🏫</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              مرحباً بك {user.fullName || 'الأستاذ'}! 👋
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              أهلاً وسهلاً بك في نظام {settings?.schoolNameArabic || 'مدرسة النور الأهلية'}
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-md">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                📝 إضافة علامات الطلاب
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                يمكنك إضافة وتعديل علامات طلابك من خلال قسم "إدخال العلامات"
              </p>
              <Button 
                onClick={() => onNavigate('grades')}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-8 py-3 text-lg"
                data-testid="button-add-grades"
              >
                إدخال العلامات 📝
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">مرحباً بك 👋</h1>
          <p className="text-gray-600 dark:text-gray-300">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">مرحباً بك 👋</h1>
        <p className="text-gray-600 dark:text-gray-300">نظرة شاملة على أداء {settings?.schoolNameArabic || 'المدرسة'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="إجمالي الطلاب" 
          value={stats?.totalStudents || 0} 
          subtitle={`${stats?.activeStudents || 0} نشط`} 
          icon="👥" 
          gradient="primary" 
        />
        <StatCard 
          title="المعلمين النشطين" 
          value={stats?.activeTeachers || 0} 
          subtitle="معلم مؤهل" 
          icon="👨‍🏫" 
          gradient="success" 
        />
        <StatCard 
          title="الصفوف الدراسية" 
          value={stats?.totalClasses || 0} 
          subtitle="صف دراسي" 
          icon="🏛️" 
          gradient="info" 
        />
        <StatCard 
          title="صافي الربح" 
          value={stats?.totalRevenue?.toLocaleString() || '0'} 
          subtitle={currencySymbol} 
          icon="💰" 
          gradient="warning" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card rounded-2xl p-6 transition-colors">
          <h3 className="text-xl font-bold text-black dark:text-white mb-4">الإجراءات السريعة</h3>
          <div className="space-y-3">
            <Button className="w-full" variant="default" onClick={handleAddStudent} data-testid="button-add-student">
              ➕ إضافة طالب جديد
            </Button>
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleAddTeacher} data-testid="button-add-teacher">
              👨‍🏫 إضافة معلم جديد
            </Button>
            <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={handleSendNotification} data-testid="button-send-notification">
              📢 إرسال إشعار عام
            </Button>
            <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={handleRecordPayment} data-testid="button-record-payment">
              💰 تسجيل دفعة
            </Button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 md:col-span-2 transition-colors">
          <h3 className="text-xl font-bold text-black dark:text-white mb-4">التنبيهات المهمة</h3>
          <div className="space-y-3">
            {isPaymentReminderDay && (
              <div className="bg-orange-50 border border-orange-300 p-4 rounded-lg animate-pulse">
                <div className="flex items-center">
                  <span className="text-orange-600 ml-2 text-xl">💰</span>
                  <div className="flex-1">
                    <div className="font-bold text-orange-900">تذكير: موعد تحصيل الرسوم الشهرية</div>
                    <div className="text-sm text-orange-700 mt-1">
                      اليوم هو الخامس من الشهر - الرجاء البدء في تحصيل الرسوم من الطلاب
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className={`${randomTip.bgColor} border ${randomTip.borderColor} p-4 rounded-lg`}>
              <div className="flex items-center">
                <span className={`${randomTip.iconColor} ml-2 text-xl`}>{randomTip.icon}</span>
                <div className="flex-1">
                  <div className={`font-bold ${randomTip.titleColor}`}>{randomTip.title}</div>
                  <div className={`text-sm ${randomTip.messageColor} mt-1`}>
                    {randomTip.message}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
