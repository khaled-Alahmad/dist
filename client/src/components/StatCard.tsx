interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  gradient: 'primary' | 'success' | 'warning' | 'info' | 'glass';
}

export default function StatCard({ title, value, subtitle, icon, gradient }: StatCardProps) {
  if (gradient === 'glass') {
    return (
      <div className="glass-card p-6 rounded-2xl card-hover-effect transition-colors" data-testid="stat-glass">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-bold">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
          <div className="text-4xl">{icon}</div>
        </div>
      </div>
    );
  }

  const gradientClasses = {
    primary: 'gradient-primary-bg',
    success: 'gradient-success-bg',
    warning: 'gradient-warning-bg',
    info: 'gradient-info-bg',
  };

  const gradientClass = gradientClasses[gradient] || '';

  return (
    <div className={`${gradientClass} text-white p-6 rounded-2xl card-hover-effect`} data-testid={`stat-${gradient}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-bold">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}
