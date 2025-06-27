import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { EditAppForm, type EditAppFormData } from '../forms/EditAppForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import { App, AppVersion } from '@/contexts/DeveloperDataContext';

interface EditAppWrapperProps {
  app: App;
  appVersions: AppVersion[];
  refetchApps: () => Promise<void>;
}

export function EditAppWrapper({ app, appVersions, refetchApps }: EditAppWrapperProps) {
  const vincentApi = useVincentApiWithSIWE();
  const [editApp, { isLoading, isSuccess, isError, data, error }] = vincentApi.useEditAppMutation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSuccess && data) {
      refetchApps();
      navigateWithDelay(navigate, `/developer/appId/${app.appId}`);
    }
  }, [isSuccess, data, refetchApps, navigate, app.appId]);

  // Show spinner while updating app or after success while refetching/navigating
  if (isLoading) {
    return <StatusMessage message="Updating app..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="App updated successfully!" type="success" />;
  }

  // Error state
  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to update app');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: EditAppFormData) => {
    await editApp({
      appId: app.appId,
      appEdit: data,
    });
  };

  // Render pure form component - app is guaranteed to exist
  return (
    <EditAppForm
      appData={app}
      appVersions={appVersions}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
    />
  );
}
