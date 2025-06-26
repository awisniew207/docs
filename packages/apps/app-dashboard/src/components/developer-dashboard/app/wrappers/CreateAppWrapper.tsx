import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { CreateAppForm, type CreateAppFormData } from '../forms/CreateAppForm';
import {
  getErrorMessage,
  navigateWithDelay /* type ToolSelection */,
} from '@/utils/developer-dashboard/app-forms';

interface CreateAppWrapperProps {
  refetchApps: () => void;
}

export function CreateAppWrapper({ refetchApps }: CreateAppWrapperProps) {
  const vincentApi = useVincentApiWithSIWE();
  const [createApp, { isLoading: isCreatingApp }] = vincentApi.useCreateAppMutation();
  //const [createAppVersionTool] = vincentApi.useCreateAppVersionToolMutation();
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Success state
  if (result) {
    return <StatusMessage message="App created successfully! Redirecting..." type="success" />;
  }

  // Error state
  if (error) {
    return <StatusMessage message={error} type="error" />;
  }

  const handleSubmit = async (data: CreateAppFormData) => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }

    setError(null);
    setResult(null);
    setIsProcessing(true);

    try {
      const { tools, ...appDataForApi } = data;
      const appSubmissionData = { ...appDataForApi, managerAddress: address };

      // Step 1: Create the app (this automatically creates version 1)
      const appResponse = await createApp({ appCreate: appSubmissionData });

      if ('error' in appResponse) {
        setError(getErrorMessage(appResponse.error, 'Failed to create app'));
        return;
      }

      // Refetch apps to update cache
      await refetchApps();

      const newAppId = appResponse.data?.appId;

      // Navigate to the new app's detail page with delay BEFORE setting result
      navigateWithDelay(navigate, `/developer/appId/${newAppId}`);

      // Set result AFTER navigation is scheduled
      setResult({ message: 'App created successfully!' });
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to create app'));
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isCreatingApp || isProcessing;

  // Render pure form component
  return <CreateAppForm onSubmit={handleSubmit} isSubmitting={isLoading} />;
}
