import { EditAppForm } from '@/components/developer-dashboard/app/AppForms';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import Loading from '@/components/layout/Loading';
import { useAppDetail } from '@/components/developer-dashboard/app/AppDetailContext';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';

export default function AppEdit() {
  const { app, appError, appLoading } = useAppDetail();

  useAddressCheck(app);

  // Loading state
  if (appLoading) return <Loading />;

  // Error handling
  if (appError || !app) {
    return <StatusMessage message="App not found" type="error" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Edit App</h1>
          <p className="text-gray-600 mt-2">Update your application settings and configuration</p>
        </div>
      </div>

      <EditAppForm appData={app} />
    </div>
  );
}
