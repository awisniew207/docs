import { useMemo } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import AppEdit from '@/pages/developer-dashboard/app/AppEdit';
import AppOverview from '@/pages/developer-dashboard/app/AppOverview';

/**
 * App Route Component - Fetches app data and passes to children
 */
export function AppRoute() {
  const { appId } = useParams<{ appId: string }>();
  const { address } = useAccount();

  // Layer 1: Fetch all apps and validate specific app exists
  const {
    data: apps = [],
    isLoading: appsLoading,
    error: appsError,
    refetch: refetchApps,
  } = vincentApiClient.useListAppsQuery(undefined, {
    skip: !address,
  });

  // Find specific app
  const app = useMemo(() => {
    return apps.find((app) => app.appId === Number(appId)) || null;
  }, [apps, appId]);

  // Loading and error states
  if (appsLoading) return <Loading />;
  if (appsError) return <StatusMessage message="Failed to load apps" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;

  // Route to child components with app data
  return (
    <Routes>
      {/* App-level routes */}
      <Route index element={<AppOverview app={app} />} />
      <Route path="edit-app" element={<AppEdit app={app} refetchApps={refetchApps} />} />
    </Routes>
  );
}
