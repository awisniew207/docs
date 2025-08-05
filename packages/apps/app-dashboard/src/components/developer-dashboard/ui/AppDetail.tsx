interface AppDetailProps {
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}

export function AppDetail({ label, children, isLast = false }: AppDetailProps) {
  return (
    <div className={`pb-3 ${!isLast ? 'border-b border-gray-100 dark:border-white/10' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:justify-between">
        <span className="font-medium text-gray-600 dark:text-white/60 text-sm uppercase tracking-wide">
          {label}
        </span>
        <div className="mt-1 sm:mt-0 sm:text-right">{children}</div>
      </div>
    </div>
  );
}
