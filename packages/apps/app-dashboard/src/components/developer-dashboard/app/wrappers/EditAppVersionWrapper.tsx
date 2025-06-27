import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { EditAppVersionForm, type EditAppVersionFormData } from '../forms/EditAppVersionForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import { App, AppVersion } from '@/contexts/DeveloperDataContext';

interface EditAppVersionWrapperProps {
  app: App;
  versionData: AppVersion;
  refetchVersions: () => Promise<void>;
  refetchVersionData: () => Promise<void>;
}

export function EditAppVersionWrapper({
  app,
  versionData,
  refetchVersions,
  refetchVersionData,
}: EditAppVersionWrapperProps) {
  const vincentApi = useVincentApiWithSIWE();
  const [editAppVersion, { isLoading, isSuccess, isError, data, error }] =
    vincentApi.useEditAppVersionMutation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSuccess && data) {
      refetchVersions();
      refetchVersionData();
      navigateWithDelay(navigate, `/developer/appId/${app.appId}/version/${versionData.version}`);
    }
  }, [isSuccess, data, refetchVersions, refetchVersionData, navigate]);

  // Show spinner while updating app version or after success while refetching/navigating
  if (isLoading) {
    return <StatusMessage message="Updating app version..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="App version updated successfully!" type="success" />;
  }

  // Error state
  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to update app version');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: EditAppVersionFormData) => {
    await editAppVersion({
      appId: app.appId,
      version: versionData.version,
      appVersionEdit: data,
    });
  };

  // Render pure form component - versionData is guaranteed to exist
  return (
    <EditAppVersionForm
      versionData={versionData}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
    />
  );
}
