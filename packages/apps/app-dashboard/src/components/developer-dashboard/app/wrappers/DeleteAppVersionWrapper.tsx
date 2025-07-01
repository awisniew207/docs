import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DeleteAppVersionForm } from '../forms/DeleteAppVersionForm';
import { useUserApps } from '@/hooks/developer-dashboard/useUserApps';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/layout/Loading';
import { sortAppFromApps } from '@/utils/developer-dashboard/sortAppFromApps';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

export function DeleteAppVersionWrapper() {
  const { appId, versionId } = useParams<{ appId: string; versionId: string }>();

  // Fetching
  const { data: apps, isLoading: appsLoading, isError: appsError } = useUserApps();

  const app = sortAppFromApps(apps, appId);

  // Note: The data here is barely used, but we need to confirm the version exists with a query
  const {
    data: versionData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetAppVersionQuery({ appId: Number(appId), version: Number(versionId) });

  // Mutation
  const [deleteAppVersion, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useDeleteAppVersionMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data) {
      navigate(`/developer/appId/${appId}/versions`); // Navigate immediately, no delay needed
    }
  }, [isSuccess, data, navigate]);

  useAddressCheck(app);

  // Loading states
  if (appsLoading || versionLoading) return <Loading />;

  // Error states
  if (appsError) return <StatusMessage message="Failed to load apps" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load app version" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;
  if (!versionData)
    return <StatusMessage message={`App version ${versionId} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Deleting app..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="App deleted successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to delete app');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async () => {
    await deleteAppVersion({ appId: app.appId, version: Number(versionId) });
  };
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Delete App Version</h1>
          <p className="text-gray-600 mt-2">
            Delete "{app.name}" version {versionData.version}. This action can be undone.
          </p>
        </div>
      </div>

      <DeleteAppVersionForm
        title={app.name}
        version={versionData.version}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
      />
    </div>
  );
}
