import { Helmet } from 'react-helmet-async';
import { useAuthGuard } from '@/components/user-dashboard/auth/AuthGuard';
import StatusMessage from '@/components/user-dashboard/consent/StatusMessage';

export default function AppsPage() {
  const authGuardElement = useAuthGuard();

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
