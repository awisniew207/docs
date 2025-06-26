import { useMemo } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import AppEdit from '@/pages/developer-dashboard/app/AppEdit';
import AppOverview from '@/pages/developer-dashboard/app/AppOverview';
import AppDelete from '@/pages/developer-dashboard/app/AppDelete';
import CreateAppPage from '@/pages/developer-dashboard/CreateAppPage';

/**
 * App Route Component - Fetches app data and passes to children
 */
export function AppRoute() {
  const { appId } = useParams<{ appId: string }>();
  const { address } = useAccount();

  // Layer 1: Fetch all apps - used for both create-app and app-specific routes
  const {
    data: apps = [],
    isLoading: appsLoading,
    error: appsError,
    refetch: refetchApps,
  } = vincentApiClient.useListAppsQuery(undefined, {
    skip: !address,
  });

  // Find specific app for app-specific routes (always call useMemo)
  const app = useMemo(() => {
    return appId ? apps.find((app) => app.appId === Number(appId)) || null : null;
  }, [apps, appId]);

  // Loading and error states
  if (appsLoading) return <Loading />;
  if (appsError) return <StatusMessage message="Failed to load apps" type="error" />;

  // Handle create-app route (no appId needed)
  if (!appId) {
    return (
      <Routes>
        <Route index element={<CreateAppPage refetchApps={refetchApps} />} />
      </Routes>
    );
  }

  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;

  // Route to child components with app data
  return (
    <Routes>
      {/* App-level routes */}
      <Route index element={<AppOverview app={app} />} />
      <Route path="edit-app" element={<AppEdit app={app} refetchApps={refetchApps} />} />
      <Route path="delete-app" element={<AppDelete />} />
    </Routes>
  );
}
