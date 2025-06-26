import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { CreateAppVersionForm, type CreateAppVersionFormData } from '../forms/CreateAppVersionForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';

interface CreateAppVersionWrapperProps {
  app: any;
  refetchVersions: () => Promise<any>;
}

export function CreateAppVersionWrapper({ app, refetchVersions }: CreateAppVersionWrapperProps) {
  const vincentApi = useVincentApiWithSIWE();
  const [createAppVersion, { isLoading: isCreatingVersion }] =
    vincentApi.useCreateAppVersionMutation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Success state
  if (result) {
    return <StatusMessage message="App version created successfully!" type="success" />;
  }

  // Error state
  if (error) {
    return <StatusMessage message={error} type="error" />;
  }

  const handleSubmit = async (data: CreateAppVersionFormData) => {
    setError(null);
    setResult(null);
    setIsProcessing(true);

    try {
      const versionResult = await createAppVersion({
        appId: app.appId,
        appVersionCreate: data,
      });

      if ('error' in versionResult) {
        setError(getErrorMessage(versionResult.error, 'Failed to create app version'));
        return;
      }

      const createdVersion = versionResult.data;
      const newVersionNumber = createdVersion?.version;

      setResult({
        message: 'App version created successfully!',
        type: 'success',
      });

      // Refetch app versions to update cache
      await refetchVersions();

      // Navigate to the new version's detail page with delay
      navigateWithDelay(
        navigate,
        `/developer/appId/${app.appId}/version/${newVersionNumber}/tools`,
      );
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to create app version'));
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isCreatingVersion || isProcessing;

  // Render pure form component - app is guaranteed to exist
  return <CreateAppVersionForm appData={app} onSubmit={handleSubmit} isSubmitting={isLoading} />;
}
