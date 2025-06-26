import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { EditAppForm, type EditAppFormData } from '../forms/EditAppForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';

interface EditAppWrapperProps {
  app: any;
  appVersions: any[];
  refetchApps: () => Promise<any>;
}

export function EditAppWrapper({ app, appVersions, refetchApps }: EditAppWrapperProps) {
  const vincentApi = useVincentApiWithSIWE();
  const [editApp, { isLoading }] = vincentApi.useEditAppMutation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Success state
  if (result) {
    return <StatusMessage message="App updated successfully!" type="success" />;
  }

  // Error state
  if (error) {
    return <StatusMessage message={error} type="error" />;
  }

  const handleSubmit = async (data: EditAppFormData) => {
    setError(null);
    setResult(null);

    try {
      const response = await editApp({
        appId: parseInt(app.appId),
        appEdit: data,
      });

      if ('error' in response) {
        setError(getErrorMessage(response.error, 'Failed to update app'));
        return;
      }

      setResult({ message: 'App updated successfully!' });

      // Refetch apps to update cache
      await refetchApps();

      // Navigate back to app detail page with delay
      navigateWithDelay(navigate, `/developer/appId/${app.appId}`);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to update app'));
    }
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
