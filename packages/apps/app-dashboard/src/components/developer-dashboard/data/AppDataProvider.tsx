import { useMemo } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { useDeveloperData } from '@/contexts/DeveloperDataContext';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import AppEdit from '@/pages/developer-dashboard/app/AppEdit';
import AppOverview from '@/pages/developer-dashboard/app/AppOverview';
import AppDelete from '@/pages/developer-dashboard/app/AppDelete';
import CreateAppPage from '@/pages/developer-dashboard/CreateAppPage';

/**
 * App Route Component - Uses unified data context and provides app-specific data as props
 */
export function AppRoute() {
  const { appId } = useParams<{ appId: string }>();

  // Use unified data context instead of direct API calls
  const { userApps: apps, isLoading, hasErrors, refetchApps } = useDeveloperData();

  // Find specific app for app-specific routes
  const app = useMemo(() => {
    return appId ? apps.find((app) => app.appId === Number(appId)) || null : null;
  }, [apps, appId]);

  // Loading and error states
  if (isLoading) return <Loading />;
  if (hasErrors) return <StatusMessage message="Failed to load apps" type="error" />;

  // Handle create-app route (no appId needed)
  if (!appId) {
    return (
      <Routes>
        <Route index element={<CreateAppPage refetchApps={refetchApps} />} />
      </Routes>
    );
  }

  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;

  // Route to child components with app data as props
  return (
    <Routes>
      {/* App-level routes */}
      <Route index element={<AppOverview app={app} />} />
      <Route path="edit-app" element={<AppEdit app={app} refetchApps={refetchApps} />} />
      <Route path="delete-app" element={<AppDelete app={app} refetchApps={refetchApps} />} />
    </Routes>
  );
}
