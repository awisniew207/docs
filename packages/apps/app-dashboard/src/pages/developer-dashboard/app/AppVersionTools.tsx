import {
  AppVersionToolsList,
  CreateAppVersionToolsForm,
} from '@/components/developer-dashboard/app/AppVersionToolForms';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import Loading from '@/components/layout/Loading';
import { useAppDetail } from '@/components/developer-dashboard/app/AppDetailContext';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';

export default function AppVersionTools() {
  const { appId, app, appError, appLoading, versionId } = useAppDetail();

  useAddressCheck(app);

  // Loading state
  if (appLoading) return <Loading />;

  // Error handling
  if (appError || !app) {
    return <StatusMessage message="App not found" type="error" />;
  }

  if (!versionId) {
    return <StatusMessage message="Version not found" type="error" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {app.name} - Version {versionId} Tools
          </h1>
          <p className="text-gray-600 mt-2">Manage tools for this app version</p>
        </div>
      </div>

      {/* Add Tools Form */}
      <CreateAppVersionToolsForm appId={appId} versionId={versionId} hideHeader={false} />

      {/* Current Tools List */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Current Tools</h3>
          <p className="text-gray-600 text-sm mt-1">
            Tools currently associated with this version. Click the edit button to modify settings
            inline.
          </p>
        </div>
        <AppVersionToolsList appId={appId} versionId={versionId} />
      </div>
    </div>
  );
}
