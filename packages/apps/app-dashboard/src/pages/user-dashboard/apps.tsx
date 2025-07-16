import { Helmet } from 'react-helmet-async';
import { useAuthGuard } from '@/hooks/user-dashboard/consent/useAuthGuard';
import Loading from '@/components/shared/ui/Loading';

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
        <Loading />
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
