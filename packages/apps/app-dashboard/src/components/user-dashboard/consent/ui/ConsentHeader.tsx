import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { ThemeType } from './theme';

interface ConsentHeaderProps {
  isDark: boolean;
  theme: ThemeType;
  onToggleTheme: () => void;
}

export function ConsentHeader({ isDark, theme, onToggleTheme }: ConsentHeaderProps) {
  return (
    <div className={`px-6 py-4 border-b ${theme.cardBorder}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className={`${theme.text}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTheme}
            className={`${theme.text} hover:bg-white/10`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
} 