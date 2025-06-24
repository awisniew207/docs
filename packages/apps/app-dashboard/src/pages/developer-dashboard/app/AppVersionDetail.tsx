import { useNavigate } from 'react-router';
import { Edit } from 'lucide-react';
import { VersionDetails } from '@/components/developer-dashboard/VersionDetails';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import Loading from '@/components/layout/Loading';
import { useAppDetail } from '@/components/developer-dashboard/AppDetailContext';
import { useAddressCheck } from '@/hooks/developer-dashboard/useAddressCheck';

export default function AppVersionDetail() {
  const navigate = useNavigate();
  const { appId, app, appError, appLoading, versionData, versionError, versionLoading, versionId } =
    useAppDetail();

  useAddressCheck(app);

  // Loading state
  if (appLoading) return <Loading />;

  // Error handling
  if (appError || !app) {
    return <StatusMessage message="App not found" type="error" />;
  }

  // Version specific error handling
  if (versionError) {
    return <StatusMessage message="Error loading version data" type="error" />;
  }

  if (!versionId) {
    return <StatusMessage message="Version not found" type="error" />;
  }

  return (
    <div className="space-y-6">
      {/* Version Management Card */}
      <div className="bg-white border rounded-lg">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">Version Management</h3>
          <p className="text-gray-600 text-sm mt-1">Manage this specific version</p>
        </div>
        <div className="p-6">
          <button
            onClick={() => navigate(`/developer/appId/${appId}/version/${versionId}/edit`)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit Version
          </button>
        </div>
      </div>

      {/* Version Details */}
      {versionLoading ? (
        <Loading />
      ) : (
        <VersionDetails version={versionId} appName={app.name} versionData={versionData} />
      )}
    </div>
  );
}
