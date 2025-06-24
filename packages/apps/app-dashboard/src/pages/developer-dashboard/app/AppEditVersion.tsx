import { EditAppVersionForm } from '@/components/developer-dashboard/AppForms';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import Loading from '@/components/layout/Loading';
import { useAppDetail } from '@/components/developer-dashboard/AppDetailContext';
import { useAddressCheck } from '@/hooks/developer-dashboard/useAddressCheck';

export default function AppEditVersion() {
  const { app, appError, appLoading, versionData, versionError, versionLoading } = useAppDetail();

  useAddressCheck(app);

  // Loading state
  if (appLoading || versionLoading) return <Loading />;

  // Error handling
  if (appError || !app) {
    return <StatusMessage message="App not found" type="error" />;
  }

  if (versionError || !versionData) {
    return <StatusMessage message="App version not found" type="error" />;
  }

  return <EditAppVersionForm hideHeader={false} />;
}
