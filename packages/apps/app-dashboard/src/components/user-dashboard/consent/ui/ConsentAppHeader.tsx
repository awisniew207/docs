import { motion } from 'framer-motion';
import { ThemeType } from './theme';
import { App } from '@/types/developer-dashboard/appTypes';
import { Logo } from '@/components/shared/ui/Logo';

interface ConsentAppHeaderProps {
  app: App;
  theme: ThemeType;
}

export function ConsentAppHeader({ app, theme }: ConsentAppHeaderProps) {
  return (
    <motion.div
      className={`rounded-xl p-6 ${theme.itemBg} border ${theme.cardBorder} ${theme.cardHoverBorder}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-2xl ${theme.iconBg} border ${theme.iconBorder}`}>
          <Logo logo={app.logo} alt={app.name} className="w-12 h-12" />
        </div>
        <div className="flex-1">
          <h2 className={`text-2xl font-bold ${theme.text}`}>{app.name}</h2>
          {app.description && (
            <p className={`text-lg ${theme.textMuted} mt-1`}>{app.description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
