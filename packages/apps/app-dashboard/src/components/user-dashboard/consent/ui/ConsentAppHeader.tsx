import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { ThemeType } from './theme';

interface ConsentAppHeaderProps {
  app: {
    name: string;
    description?: string;
    logo?: string;
    appUrl?: string;
    githubUrl?: string;
  };
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
          {app.logo ? (
            <img src={app.logo} alt={app.name} className="w-12 h-12" />
          ) : (
            <Globe className={`w-12 h-12 ${theme.textMuted}`} />
          )}
        </div>
        <div className="flex-1">
          <h2 className={`text-2xl font-bold ${theme.text}`}>{app.name}</h2>
          {app.description && (
            <p className={`text-lg ${theme.textMuted} mt-1`}>{app.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3">
            {app.appUrl && (
              <a
                href={app.appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm ${theme.linkColor} hover:underline`}
              >
                Visit App
              </a>
            )}
            {app.githubUrl && (
              <a
                href={app.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm ${theme.linkColor} hover:underline`}
              >
                GitHub
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
} 