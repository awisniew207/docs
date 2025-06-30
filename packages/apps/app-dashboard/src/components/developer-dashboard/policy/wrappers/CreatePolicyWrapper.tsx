import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { CreatePolicyForm, type CreatePolicyFormData } from '../forms/CreatePolicyForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import { useUserPolicies } from '@/hooks/developer-dashboard/useUserPolicies';

export function CreatePolicyWrapper() {
  const vincentApi = useVincentApiWithSIWE();

  // Fetching
  const { refetch: refetchPolicies } = useUserPolicies();

  // Mutation
  const [createPolicy, { isLoading, isSuccess, isError, data, error }] =
    vincentApi.useCreatePolicyMutation();

  // Navigation
  const navigate = useNavigate();
  const { address } = useAccount(); // FIXME: Won't be needed once we have SIWE

  // Effect
  useEffect(() => {
    if (isSuccess && data) {
      refetchPolicies();
      navigateWithDelay(navigate, `/developer/policyId/${encodeURIComponent(data.packageName)}`); // Need to encodeURIComponent because packageName can contain special characters
    }
  }, [isSuccess, data, refetchPolicies, navigate]);

  // Loading states
  if (isLoading) {
    return <StatusMessage message="Creating policy..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Policy created successfully!" type="success" />;
  }

  // Error states
  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to create policy');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: CreatePolicyFormData) => {
    const { packageName, ...policyCreateData } = data;

    await createPolicy({
      packageName,
      policyCreate: { ...policyCreateData, authorWalletAddress: address },
    });
  };

  // Render pure form component
  return <CreatePolicyForm onSubmit={handleSubmit} isSubmitting={isLoading} />;
}
