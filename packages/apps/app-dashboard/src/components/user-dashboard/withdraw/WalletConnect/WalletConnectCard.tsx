import { ReactNode } from 'react';
import { theme } from '@/components/user-dashboard/connect/ui/theme';

interface WalletConnectCardProps {
  children: ReactNode;
  variant: 'sessions' | 'requests' | 'proposal';
  title: string;
  icon?: ReactNode;
  subtitle?: string;
  className?: string;
}

const getVariantStyles = () => ({
  sessions: {
    gradient: theme.cardBg,
    border: theme.cardBorder,
    text: theme.textMuted,
    titleText: 'text-orange-500',
    titleBorder: theme.cardBorder,
  },
  requests: {
    gradient: theme.cardBg,
    border: theme.cardBorder,
    text: theme.textMuted,
    titleText: 'text-orange-500',
    titleBorder: theme.cardBorder,
  },
  proposal: {
    gradient: theme.mainCard,
    border: theme.mainCardBorder,
    text: theme.text,
    titleText: 'text-orange-500',
    titleBorder: theme.cardBorder,
  },
});

export function WalletConnectCard({
  children,
  variant,
  title,
  icon,
  subtitle,
  className = '',
}: WalletConnectCardProps) {
  const styles = getVariantStyles()[variant];

  return (
    <div
      className={`w-full mt-4 p-3 ${styles.gradient} border ${styles.border} ${styles.text} text-sm rounded-lg mb-3 shadow-sm ${className}`}
    >
      <div
        className={`font-semibold mb-3 ${styles.titleText} border-b ${styles.titleBorder} pb-2 flex items-center`}
      >
        {icon && <span className="mr-2 flex items-center">{icon}</span>}
        {title}
        {subtitle && <span className="text-xs ml-2 font-normal">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}
