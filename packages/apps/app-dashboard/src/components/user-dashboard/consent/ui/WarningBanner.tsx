import { AlertTriangle } from 'lucide-react';
import { ThemeType } from './theme';

interface WarningBannerProps {
  theme: ThemeType;
}

export function WarningBanner({ theme }: WarningBannerProps) {
  return (
    <div className={`rounded-lg p-4 border ${theme.warningBg}`}>
      <div className="flex items-center gap-3">
        <AlertTriangle className={`w-5 h-5 ${theme.warningText}`} />
        <div>
          <h4 className={`font-semibold ${theme.warningText}`}>
            Permission Request
          </h4>
          <p className={`text-sm ${theme.warningText} opacity-80 mt-1`}>
            This application is requesting access to specific policies. Please review
            and configure the permissions below.
          </p>
        </div>
      </div>
    </div>
  );
} 