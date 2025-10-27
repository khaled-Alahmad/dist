import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/hooks/use-auth';
import Sidebar from '@/components/Sidebar';
import DashboardSection from '@/components/DashboardSection';
import StudentsSection from '@/components/StudentsSection';
import TeachersSection from '@/components/TeachersSection';
import TeacherAssignmentsSection from '@/components/TeacherAssignmentsSection';
import UsersSection from '@/components/UsersSection';
import SubjectsSection from '@/components/SubjectsSection';
import ClassesSection from '@/components/ClassesSection';
import NewGradesSection from '@/components/NewGradesSection';
import StudentReportSection from '@/components/StudentReportSection';
import AttendanceSection from '@/components/AttendanceSection';
import FinanceSection from '@/components/FinanceSection';
import ReportsSection from '@/components/ReportsSection';
import SettingsSection from '@/components/SettingsSection';

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed } = useSidebar();
  const { logoutMutation } = useAuth();

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection onNavigate={setActiveSection} />;
      case 'students':
        return <StudentsSection />;
      case 'teachers':
        return <TeachersSection />;
      case 'teacher-assignments':
        return <TeacherAssignmentsSection />;
      case 'users':
        return <UsersSection />;
      case 'subjects':
        return <SubjectsSection />;
      case 'classes':
        return <ClassesSection />;
      case 'grades':
        return <NewGradesSection />;
      case 'student-reports':
        return <StudentReportSection />;
      case 'attendance':
        return <AttendanceSection />;
      case 'finance':
        return <FinanceSection />;
      case 'reports':
        return <ReportsSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <DashboardSection onNavigate={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <div className="absolute top-6 left-6 z-40 flex items-center gap-3">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-card border border-border hover-elevate active-elevate-2 transition-colors"
          data-testid="button-theme-toggle"
          aria-label="تبديل الوضع"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-foreground" />
          ) : (
            <Sun className="w-5 h-5 text-foreground" />
          )}
        </button>
        <button 
          className="px-6 py-2 bg-card border border-border hover-elevate active-elevate-2 text-foreground rounded-lg text-sm transition-colors"
          onClick={() => logoutMutation.mutate()}
          data-testid="button-logout"
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? "جاري الخروج..." : "تسجيل الخروج"}
        </button>
      </div>

      <div className={`p-8 overflow-y-auto min-h-screen flex flex-col transition-all duration-300 ${
        isCollapsed ? 'mr-20' : 'mr-80'
      }`}>
        <div className="flex-1">
          {renderSection()}
        </div>
        
        <footer className="mt-8 py-4 text-center border-t border-border">
          <p className="text-muted-foreground text-sm">
            تم تطوير هذا النظام من قبل{' '}
            <a 
              href="http://trendifyplus.media/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors font-semibold"
            >
              TRENDIFY PLUS
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
