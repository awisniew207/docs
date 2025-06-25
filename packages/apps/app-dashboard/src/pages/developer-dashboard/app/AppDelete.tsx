import { DeleteAppForm } from '@/components/developer-dashboard/app/AppForms';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import Loading from '@/components/layout/Loading';
import { useAppDetail } from '@/components/developer-dashboard/app/AppDetailContext';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';

export default function AppDelete() {
  const { app, appError, appLoading } = useAppDetail();

  useAddressCheck(app);

  // Loading state
  if (appLoading) return <Loading />;

  // Error handling
  if (appError || !app) {
    return <StatusMessage message="App not found" type="error" />;
  }

  return <DeleteAppForm appData={app} hideHeader={false} />;
}
