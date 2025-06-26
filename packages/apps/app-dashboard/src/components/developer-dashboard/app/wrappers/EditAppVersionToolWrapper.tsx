import { useState } from 'react';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import {
  EditAppVersionToolForm,
  type EditAppVersionToolFormData,
} from '../forms/EditAppVersionToolForm';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';

interface EditAppVersionToolWrapperProps {
  appId: number;
  versionId: number;
  tool: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditAppVersionToolWrapper({
  appId,
  versionId,
  tool,
  onSuccess,
  onCancel,
}: EditAppVersionToolWrapperProps) {
  const vincentApi = useVincentApiWithSIWE();
  const [editAppVersionTool, { isLoading }] = vincentApi.useEditAppVersionToolMutation();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Success state
  if (result) {
    return <StatusMessage message="Tool updated successfully!" type="success" />;
  }

  // Error state
  if (error) {
    return <StatusMessage message={error} type="error" />;
  }

  const handleSubmit = async (data: EditAppVersionToolFormData) => {
    setError(null);
    setResult(null);

    try {
      const response = await editAppVersionTool({
        appId,
        appVersion: versionId,
        toolPackageName: tool.toolPackageName,
        appVersionToolEdit: data,
      });

      if ('error' in response) {
        setError(getErrorMessage(response.error, 'Failed to update tool'));
        return;
      }

      setResult({ message: 'Tool updated successfully!' });

      // Call success callback after a brief delay to show success message
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to update tool'));
    }
  };

  return (
    <EditAppVersionToolForm
      tool={tool}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isSubmitting={isLoading}
    />
  );
}
