import { useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useDeveloperData } from '@/contexts/DeveloperDataContext';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import AppEdit from '@/pages/developer-dashboard/app/AppEdit';
import AppOverview from '@/pages/developer-dashboard/app/AppOverview';
import AppDelete from '@/pages/developer-dashboard/app/AppDelete';
import CreateAppPage from '@/pages/developer-dashboard/CreateAppPage';
import AppVersions from '@/pages/developer-dashboard/app/AppVersions';
import AppVersionDetail from '@/pages/developer-dashboard/app/AppVersionDetail';
import AppCreateVersion from '@/pages/developer-dashboard/app/AppCreateVersion';
import AppEditVersion from '@/pages/developer-dashboard/app/AppEditVersion';

/**
 * App Route Component - Uses unified data context and provides app-specific data as props
 */
export function AppRoute() {
  const { appId, versionId } = useParams<{ appId: string; versionId: string }>();
  const location = useLocation();

  // Use unified data context for apps and version hooks
  const {
    userApps: apps,
    isLoading,
    hasErrors,
    refetchApps,
    useAppVersions,
    useAppVersion,
  } = useDeveloperData();

  // Find specific app for app-specific routes
  const app = useMemo(() => {
    return appId ? apps.find((app) => app.appId === Number(appId)) || null : null;
  }, [apps, appId]);

  // Use version hooks when we have appId (for version-level routes)
  const {
    data: appVersions,
    isLoading: versionsLoading,
    error: versionsError,
    refetch: refetchVersions,
  } = useAppVersions({ appId: Number(appId!) }, { skip: !appId });

  // Use specific version hook when we have both appId and versionId
  const {
    data: versionData,
    isLoading: versionLoading,
    error: versionError,
    refetch: refetchVersionData,
  } = useAppVersion(
    { appId: Number(appId!), version: Number(versionId!) },
    { skip: !appId || !versionId },
  );

  // Loading and error states for app data
  if (isLoading) return <Loading />;
  if (hasErrors) return <StatusMessage message="Failed to load apps" type="error" />;

  // Handle create-app route (no appId needed)
  if (!appId) {
    return <CreateAppPage refetchApps={refetchApps} />;
  }

  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;

  // Version-level routes (when versionId is present)
  if (versionId) {
    // Loading state for version data
    if (versionLoading || versionsLoading) return <Loading />;

    // Error handling for version data
    if (versionError || versionsError) {
      return <StatusMessage message="Error loading version data" type="error" />;
    }

    if (!versionData) {
      return <StatusMessage message={`Version ${versionId} not found`} type="error" />;
    }

    // Route based on URL path
    if (location.pathname.endsWith('/edit')) {
      return (
        <AppEditVersion
          app={app}
          versionData={versionData}
          refetchVersions={refetchVersions}
          refetchVersionData={refetchVersionData}
        />
      );
    }

    // Default version detail view
    return (
      <AppVersionDetail
        app={app}
        versionData={versionData}
        refetchVersions={refetchVersions}
        refetchVersionData={refetchVersionData}
      />
    );
  }

  // App-level routes (when no versionId) - route based on URL path
  if (location.pathname.endsWith('/edit-app')) {
    return <AppEdit app={app} refetchApps={refetchApps} />;
  }

  if (location.pathname.endsWith('/delete-app')) {
    return <AppDelete app={app} refetchApps={refetchApps} />;
  }

  if (location.pathname.endsWith('/versions')) {
    return (
      <AppVersions
        app={app}
        appVersions={versionsLoading ? [] : appVersions || []}
        isLoading={versionsLoading}
      />
    );
  }

  if (location.pathname.endsWith('/create-app-version')) {
    return <AppCreateVersion app={app} refetchVersions={refetchVersions} />;
  }

  // Default app overview
  return <AppOverview app={app} />;
}
