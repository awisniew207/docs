import { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

function AppLayout({ children, className }: ComponentProps<'div'>) {
  return (
    <div className={cn('h-screen min-w-screen flex flex-col align-center', className)}>
      <main className="flex-1 mx-auto flex flex-col align-center max-w-screen-xl xl:w-screen p-8">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

export default AppLayout;
