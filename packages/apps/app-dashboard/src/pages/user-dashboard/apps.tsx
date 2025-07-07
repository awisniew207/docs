import { Helmet } from 'react-helmet-async';
import { useAuthGuard } from '@/components/user-dashboard/auth/AuthGuard';
import StatusMessage from '@/components/user-dashboard/consent/StatusMessage';
import { useReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';

export default function AppsPage() {
  const authGuardElement = useAuthGuard();
  const { authInfo } = useReadAuthInfo();
  console.log('authInfo', authInfo);

  // Show loading if authenticating or loading apps (but show errors immediately)
  if (authGuardElement) {
    return (
      <>
        <Helmet>
          <title>Vincent | My Applications</title>
          <meta name="description" content="View and manage your Vincent applications" />
        </Helmet>
        <StatusMessage message="Loading applications..." type="info" />
      </>
    );
  }

  // Show authentication required message
  if (!authInfo?.userPKP || !authInfo?.agentPKP) {
    return (
      <>
        <Helmet>
          <title>Vincent | My Applications</title>
          <meta name="description" content="View and manage your Vincent applications" />
        </Helmet>
        <main className="p-8 flex items-center justify-center min-h-screen">
          <StatusMessage message="Authentication required" type="warning" />
        </main>
      </>
    );
  }

  // Main apps content
  return (
    <>
      <Helmet>
        <title>Vincent | My Applications</title>
        <meta name="description" content="View and manage your Vincent applications" />
      </Helmet>

      <main className="p-8">
        <h1>Apps</h1>
      </main>
    </>
  );
}
