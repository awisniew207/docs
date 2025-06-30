import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { useAddressCheck } from '@/hooks/developer-dashboard/tool/useAddressCheck';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import {
  EditPolicyVersionForm,
  type EditPolicyVersionFormData,
} from '../forms/EditPolicyVersionForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/layout/Loading';
import { sortPolicyFromPolicies } from '@/utils/developer-dashboard/sortPolicyFromPolicies';
import { useUserPolicies } from '@/hooks/developer-dashboard/useUserPolicies';

export function EditPolicyVersionWrapper() {
  const { packageName, version } = useParams<{ packageName: string; version: string }>();
  const vincentApi = useVincentApiWithSIWE();

  // Fetching
  const { data: policies, isLoading: policiesLoading, isError: policiesError } = useUserPolicies();

  const policy = sortPolicyFromPolicies(policies, packageName);

  const {
    refetch: refetchVersions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetPolicyVersionsQuery({ packageName: packageName! });

  const {
    data: versionData,
    isLoading: versionLoading,
    isError: versionError,
    refetch: refetchVersionData,
  } = vincentApiClient.useGetPolicyVersionQuery({ packageName: packageName!, version: version! });

  // Mutation
  const [editPolicyVersion, { isLoading, isSuccess, isError, data, error }] =
    vincentApi.useEditPolicyVersionMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && policy && versionData) {
      refetchVersions();
      refetchVersionData();
      navigateWithDelay(
        navigate,
        `/developer/policyId/${encodeURIComponent(policy.packageName)}/version/${versionData.version}`,
      );
    }
  }, [isSuccess, data, refetchVersions, refetchVersionData, navigate, policy, versionData]);

  useAddressCheck(policy);

  // Loading states
  if (policiesLoading || versionsLoading || versionLoading) return <Loading />;

  // Error states
  if (policiesError) return <StatusMessage message="Failed to load policies" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load policy versions" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load version data" type="error" />;
  if (!policy) return <StatusMessage message={`Policy ${packageName} not found`} type="error" />;
  if (!versionData) return <StatusMessage message={`Version ${version} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Updating policy version..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Policy version updated successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to update policy version');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: EditPolicyVersionFormData) => {
    await editPolicyVersion({
      packageName: policy.packageName,
      version: versionData.version,
      policyVersionEdit: data,
    });
  };

  // Render with page UI and form component
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            Edit {policy.packageName} - Version {versionData.version}
          </h1>
          <p className="text-gray-600 mt-2">
            Update the settings and configuration for this version
          </p>
        </div>
      </div>

      <EditPolicyVersionForm
        versionData={versionData}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
      />
    </div>
  );
}
