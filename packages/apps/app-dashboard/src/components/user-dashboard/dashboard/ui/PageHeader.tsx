import React from 'react';
import { theme } from '@/components/user-dashboard/connect/ui/theme';

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function PageHeader({ icon, title, description }: PageHeaderProps) {
  return (
    <div className={`px-3 sm:px-4 py-3 border-b ${theme.cardBorder}`}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div
            className={`w-8 h-8 rounded-full ${theme.accentBg} flex items-center justify-center`}
          >
            {icon}
          </div>
        </div>
        <div>
          <h1 className={`text-lg font-bold ${theme.text}`}>{title}</h1>
          <p className={`text-xs ${theme.textMuted}`}>{description}</p>
        </div>
      </div>
    </div>
  );
}
