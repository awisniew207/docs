import { ComponentProps } from 'react';
import { useLocation } from 'react-router-dom';
import { useUrlRedirectUri } from '@/hooks/user-dashboard/consent/useUrlRedirectUri';
import { cn } from '@/lib/utils';
import { SidebarWrapper } from '@/components/user-dashboard/sidebar/SidebarWrapper';

function UserLayout({ children, className }: ComponentProps<'div'>) {
  const { redirectUri } = useUrlRedirectUri();
  const location = useLocation();

  // Don't show sidebar on home page or when using redirectUri
  const isHomePage = location.pathname === '/user';

  // Show sidebar when:
  // 1. Not on home page
  // 2. Not using redirectUri (for app consent flows)
  // AuthGuard will handle authentication redirection for protected routes
  const shouldShowSidebar = !isHomePage && !redirectUri;

  return (
    <div className={cn('min-h-screen min-w-screen bg-gray flex', className)}>
      {shouldShowSidebar ? (
        <div className="flex min-h-screen">
          <SidebarWrapper />
          <div className="flex-1 p-8 flex justify-center">{children}</div>
        </div>
      ) : (
        <div className="flex justify-center w-full">{children}</div>
      )}
    </div>
  );
}

export default UserLayout;
