import { ComponentProps } from 'react';

import { cn } from '@/lib/utils';
import Header from './Header';

function AppLayout({ children, className }: ComponentProps<'div'>) {
  return (
    <div className={cn('min-h-screen min-w-screen flex flex-col align-center', className)}>
      <Header />
      <main className="mx-auto flex flex-col align-center max-w-screen-xl p-8">{children}</main>
    </div>
  );
}

export default AppLayout;
