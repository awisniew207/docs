import { AppVersionsListView } from '@/components/developer-dashboard/AppVersionsListView';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import Loading from '@/components/layout/Loading';
import { useAppDetail } from '@/components/developer-dashboard/AppDetailContext';
import { useAddressCheck } from '@/hooks/developer-dashboard/useAddressCheck';

export default function AppVersions() {
  const { appId, app, appError, appLoading, versions, versionsError, versionsLoading } =
    useAppDetail();

  useAddressCheck(app);

  // Loading state
  if (appLoading) return <Loading />;

  // Error handling
  if (appError || !app) {
    return <StatusMessage message="App not found" type="error" />;
  }

  // Versions error handling
  if (versionsError) {
    return <StatusMessage message="Error loading app versions" type="error" />;
  }

  return (
    <AppVersionsListView
      versions={versions || []}
      appId={appId}
      latestVersion={app.latestVersion}
      isLoading={versionsLoading}
      error={versionsError}
    />
  );
}
