import { AlertTriangle, CheckCircle } from 'lucide-react';
import { theme } from './theme';
import { ReactNode } from 'react';

interface InfoBannerProps {
  type?: 'warning' | 'success' | 'orange';
  title?: string;
  message?: string | ReactNode;
}

export function InfoBanner({
  type = 'warning',
  title = 'Permission Request',
  message = 'This application is requesting access to specific policies. Please review and configure the permissions below.',
}: InfoBannerProps) {
  const isSuccess = type === 'success';
  const isOrange = type === 'orange';
  const Icon = isSuccess || isOrange ? CheckCircle : AlertTriangle;

  let bgClass, iconClass;
  if (isOrange) {
    bgClass = 'bg-orange-50 border-orange-300 dark:bg-orange-500/10 dark:border-orange-500/30';
    iconClass = 'text-orange-700 dark:text-orange-400';
  } else if (isSuccess) {
    bgClass = theme.successBg;
    iconClass = theme.successText;
  } else {
    bgClass = theme.warningBg;
    iconClass = theme.warningText;
  }

  return (
    <div className={`rounded-lg p-3 border ${bgClass}`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${iconClass}`} />
        <div>
          <p className={`text-sm font-medium ${theme.text}`}>{title}</p>
          <div className={`text-xs ${theme.textMuted} mt-0.5`}>{message}</div>
        </div>
      </div>
    </div>
  );
}
