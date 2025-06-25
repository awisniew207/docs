import { CreateAppVersionForm } from '@/components/developer-dashboard/AppVersionForms';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import Loading from '@/components/layout/Loading';
import { useAppDetail } from '@/components/developer-dashboard/AppDetailContext';
import { useAddressCheck } from '@/hooks/developer-dashboard/useAddressCheck';

export default function AppCreateVersion() {
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
          <h1 className="text-3xl font-bold text-gray-900">Create New Version</h1>
          <p className="text-gray-600 mt-2">
            Create a new version of your application with updated features
          </p>
        </div>
      </div>

      <CreateAppVersionForm appData={app} />
    </div>
  );
}
