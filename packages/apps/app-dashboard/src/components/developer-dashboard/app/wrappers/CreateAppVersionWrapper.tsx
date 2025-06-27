import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { CreateAppVersionForm, type CreateAppVersionFormData } from '../forms/CreateAppVersionForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import { App } from '@/contexts/DeveloperDataContext';

interface CreateAppVersionWrapperProps {
  app: App;
  refetchVersions: () => Promise<void>;
}

export function CreateAppVersionWrapper({ app, refetchVersions }: CreateAppVersionWrapperProps) {
  const vincentApi = useVincentApiWithSIWE();
  const [createAppVersion, { isLoading, isSuccess, isError, data, error }] =
    vincentApi.useCreateAppVersionMutation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSuccess && data) {
      refetchVersions();

      const newVersionNumber = data.version;
      if (newVersionNumber) {
        navigateWithDelay(
          navigate,
          `/developer/appId/${app.appId}/version/${newVersionNumber}/tools`,
        );
      }
    }
  }, [isSuccess, data, refetchVersions, navigate, app.appId]);

  // Show spinner while creating version or after success while refetching/navigating
  if (isLoading || (isSuccess && data)) {
    return <StatusMessage message="Creating app version..." type="info" />;
  }

  // Error state
  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to create app version');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: CreateAppVersionFormData) => {
    await createAppVersion({
      appId: app.appId,
      appVersionCreate: data,
    });
  };

  // Render pure form component - app is guaranteed to exist
  return <CreateAppVersionForm appData={app} onSubmit={handleSubmit} isSubmitting={isLoading} />;
}
