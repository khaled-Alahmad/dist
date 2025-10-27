import { useSchoolSettings } from '@/contexts/SchoolSettingsContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/hooks/use-auth';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  badgeColor?: string;
  allowedRoles?: ('admin' | 'teacher' | 'parent')[]; // إذا لم تُحدد، فهي متاحة للجميع
}

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: '📊', allowedRoles: ['admin'] },
  { id: 'dashboard', label: 'الصفحة الرئيسية', icon: '🏠', allowedRoles: ['parent', 'teacher'] },
  { id: 'students', label: 'إدارة الطلاب', icon: '👥', allowedRoles: ['admin'] },
  { id: 'teachers', label: 'إدارة المعلمين', icon: '👨‍🏫', allowedRoles: ['admin'] },
  { id: 'teacher-assignments', label: 'تعيين المدرسين للمواد', icon: '📋', allowedRoles: ['admin'] },
  { id: 'users', label: 'إدارة المستخدمين', icon: '🔐', allowedRoles: ['admin'] },
  { id: 'subjects', label: 'المواد الدراسية', icon: '📚', allowedRoles: ['admin'] },
  { id: 'classes', label: 'المراحل الدراسية والصفوف', icon: '🏛️', allowedRoles: ['admin'] },
  { id: 'grades', label: 'إدخال العلامات', icon: '📝', allowedRoles: ['admin', 'teacher'] },
  { id: 'student-reports', label: 'تقارير الطلاب', icon: '📄', allowedRoles: ['admin', 'parent'] },
  { id: 'attendance', label: 'الحضور والغياب', icon: '📅', allowedRoles: ['admin'] },
  { id: 'finance', label: 'المحاسبة والرسوم', icon: '💰', allowedRoles: ['admin'] },
  { id: 'reports', label: 'التقارير والإحصائيات', icon: '📋', allowedRoles: ['admin'] },
  { id: 'settings', label: 'إعدادات المدرسة', icon: '⚙️', allowedRoles: ['admin'] },
];

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { settings } = useSchoolSettings();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { user } = useAuth();
  
  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => {
    // إذا لم تُحدد allowedRoles، فهي متاحة للجميع
    if (!item.allowedRoles) {
      return true;
    }
    // إذا حُددت allowedRoles، تحقق من أن role المستخدم موجود في القائمة
    return user?.role && item.allowedRoles.includes(user.role as any);
  });
  
  return (
    <div className={`h-screen fixed right-0 top-0 z-50 overflow-y-auto bg-sidebar border-l border-sidebar-border transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-80'
    }`}>
      {/* زر التصغير/التوسيع */}
      <button
        onClick={toggleSidebar}
        className="absolute left-0 top-6 -translate-x-1/2 bg-sidebar-accent border border-sidebar-border rounded-full p-2 hover-elevate active-elevate-2 transition-all z-10"
        data-testid="button-toggle-sidebar"
        aria-label={isCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
      >
        {isCollapsed ? (
          <ChevronLeft className="w-4 h-4 text-sidebar-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
        )}
      </button>

      <div className="p-6">
        <div className="mb-8">
          {settings?.logoUrl && (
            <div className="mb-4 flex justify-center">
              <div className="bg-sidebar-accent rounded-2xl p-4 shadow-lg border border-sidebar-border hover-elevate transition-all">
                <img 
                  src={settings.logoUrl} 
                  alt="School Logo" 
                  className={`object-contain transition-all duration-300 ${
                    isCollapsed ? 'h-10 w-10' : 'h-20 w-20'
                  }`}
                  data-testid="sidebar-logo"
                />
              </div>
            </div>
          )}
          {!isCollapsed && (
            <div className="text-2xl font-bold text-gray-800 dark:text-white text-center">
              {settings?.schoolNameArabic || 'مدرسة النور الأهلية'}
            </div>
          )}
        </div>

        <nav className="space-y-2 mb-8 pb-6">
          {filteredMenuItems.map((item) => (
            <div
              key={item.id}
              className={`p-3 text-sidebar-foreground cursor-pointer rounded-xl transition-all duration-300 hover-elevate hover:-translate-x-1 ${
                activeSection === item.id ? 'bg-sidebar-accent border-r-4 border-primary' : ''
              }`}
              onClick={() => onSectionChange(item.id)}
              data-testid={`nav-${item.id}`}
              title={isCollapsed ? item.label : undefined}
            >
              {item.badge ? (
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                  <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
                    <span className="text-xl">{item.icon}</span>
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                  {!isCollapsed && (
                    <span className={`${item.badgeColor} text-white text-xs px-2 py-1 rounded-full notification-pulse`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              ) : (
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <span className="text-xl">{item.icon}</span>
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
