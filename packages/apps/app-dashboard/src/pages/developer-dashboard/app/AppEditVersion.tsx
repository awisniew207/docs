import { EditAppVersionForm } from '@/components/developer-dashboard/app/AppVersionForms';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import Loading from '@/components/layout/Loading';
import { useAppDetail } from '@/components/developer-dashboard/app/AppDetailContext';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';

export default function AppEditVersion() {
  const { app, appError, appLoading, versionData, versionError, versionLoading, versionId } =
    useAppDetail();

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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Edit Version {versionId}</h1>
          <p className="text-gray-600 mt-2">Update this version of your application</p>
        </div>
      </div>

      <EditAppVersionForm versionData={versionData} />
    </div>
  );
}
