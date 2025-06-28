import { useEffect } from 'react';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import {
  EditAppVersionToolForm,
  type EditAppVersionToolFormData,
} from '../forms/EditAppVersionToolForm';
import { AppVersionTool } from '@/types/developer-dashboard/appTypes';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';

interface EditAppVersionToolWrapperProps {
  appId: number;
  versionId: number;
  tool: AppVersionTool;
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

  // Mutation
  const [editAppVersionTool, { isLoading, isSuccess, isError, data, error }] =
    vincentApi.useEditAppVersionToolMutation();

  // Effect
  useEffect(() => {
    if (!isSuccess || !data) return;
    const timer = setTimeout(() => {
      onSuccess();
    }, 1500);

    return () => clearTimeout(timer);
  }, [isSuccess, data, onSuccess]);

  // Loading states
  if (isLoading) {
    return <StatusMessage message="Updating tool..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Tool updated successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to update tool');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: EditAppVersionToolFormData) => {
    await editAppVersionTool({
      appId,
      appVersion: versionId,
      toolPackageName: tool.toolPackageName,
      appVersionToolEdit: data,
    });
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
