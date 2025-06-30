import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { CreateToolForm, type CreateToolFormData } from '../forms/CreateToolForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import { useUserTools } from '@/hooks/developer-dashboard/useUserTools';

export function CreateToolWrapper() {
  const vincentApi = useVincentApiWithSIWE();

  // Fetching
  const { refetch: refetchTools } = useUserTools();

  // Mutation
  const [createTool, { isLoading, isSuccess, isError, data, error }] =
    vincentApi.useCreateToolMutation();

  // Navigation
  const navigate = useNavigate();
  const { address } = useAccount(); // FIXME: Won't be needed once we have SIWE

  // Effect
  useEffect(() => {
    if (isSuccess && data) {
      refetchTools();
      navigateWithDelay(navigate, `/developer/toolId/${data.packageName}`);
    }
  }, [isSuccess, data, refetchTools, navigate]);

  // Loading states
  if (isLoading) {
    return <StatusMessage message="Creating tool..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Tool created successfully!" type="success" />;
  }

  // Error states
  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to create tool');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: CreateToolFormData) => {
    const { packageName, ...toolCreateData } = data;

    await createTool({
      packageName,
      toolCreate: { ...toolCreateData, authorWalletAddress: address },
    });
  };

  // Render pure form component
  return <CreateToolForm onSubmit={handleSubmit} isSubmitting={isLoading} />;
}
