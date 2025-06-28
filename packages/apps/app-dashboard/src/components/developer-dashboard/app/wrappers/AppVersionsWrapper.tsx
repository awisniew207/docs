import { useNavigate, useParams } from 'react-router';
import { useMemo } from 'react';
import { AppVersionsListView } from '../views/AppVersionsListView';
import { useUserApps } from '@/hooks/developer-dashboard/useUserApps';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';

export function AppVersionsWrapper() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { data: apps, isLoading: appsLoading, isError: appsError } = useUserApps();

  const app = useMemo(() => {
    return appId ? apps?.find((app) => app.appId === Number(appId)) || null : null;
  }, [apps, appId]);

  // Fetch app versions
  const {
    data: versions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetAppVersionsQuery({ appId: Number(appId) });

  // Loading states first
  if (appsLoading || versionsLoading) return <Loading />;

  // Combined error states
  if (appsError) return <StatusMessage message="Failed to load apps" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load app versions" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;

  useAddressCheck(app);

  const handleVersionClick = (version: number) => {
    navigate(`/developer/appId/${appId}/version/${version}`);
  };

  return (
    <AppVersionsListView
      versions={versions || []}
      activeVersion={app.activeVersion}
      onVersionClick={handleVersionClick}
    />
  );
}
