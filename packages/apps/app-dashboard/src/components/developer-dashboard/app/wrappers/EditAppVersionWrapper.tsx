import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { EditAppVersionForm, type EditAppVersionFormData } from '../forms/EditAppVersionForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';

interface EditAppVersionWrapperProps {
  app: any;
  versionData: any;
  refetchVersions: () => Promise<any>;
  refetchVersionData: () => Promise<any>;
}

export function EditAppVersionWrapper({
  app,
  versionData,
  refetchVersions,
  refetchVersionData,
}: EditAppVersionWrapperProps) {
  const vincentApi = useVincentApiWithSIWE();
  const [editAppVersion, { isLoading }] = vincentApi.useEditAppVersionMutation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Success state
  if (result) {
    return <StatusMessage message="App version updated successfully!" type="success" />;
  }

  // Error state
  if (error) {
    return <StatusMessage message={error} type="error" />;
  }

  const handleSubmit = async (data: EditAppVersionFormData) => {
    setError(null);
    setResult(null);

    try {
      const response = await editAppVersion({
        appId: app.appId,
        version: versionData.version,
        appVersionEdit: data,
      });

      if ('error' in response) {
        setError(getErrorMessage(response.error, 'Failed to update app version'));
        return;
      }

      setResult({ message: 'App version updated successfully!' });

      // Refetch version data to update cache
      await Promise.all([refetchVersions(), refetchVersionData()]);

      // Navigate back to version detail page with delay
      navigateWithDelay(navigate, `/developer/appId/${app.appId}/version/${versionData.version}`);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to update app version'));
    }
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
