import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { useAddressCheck } from '@/hooks/developer-dashboard/tool/useAddressCheck';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { EditToolVersionForm, type EditToolVersionFormData } from '../forms/EditToolVersionForm';
import { getErrorMessage, navigateWithDelay } from '@/utils/developer-dashboard/app-forms';
import Loading from '@/components/layout/Loading';
import { sortToolFromTools } from '@/utils/developer-dashboard/sortToolFromTools';
import { useUserTools } from '@/hooks/developer-dashboard/useUserTools';

export function EditToolVersionWrapper() {
  const { packageName, version } = useParams<{ packageName: string; version: string }>();
  const vincentApi = useVincentApiWithSIWE();

  // Fetching
  const { data: tools, isLoading: toolsLoading, isError: toolsError } = useUserTools();

  const tool = sortToolFromTools(tools, packageName);

  const {
    refetch: refetchVersions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetToolVersionsQuery({ packageName: packageName! });

  const {
    data: versionData,
    isLoading: versionLoading,
    isError: versionError,
    refetch: refetchVersionData,
  } = vincentApiClient.useGetToolVersionQuery({ packageName: packageName!, version: version! });

  // Mutation
  const [editToolVersion, { isLoading, isSuccess, isError, data, error }] =
    vincentApi.useEditToolVersionMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data && tool && versionData) {
      refetchVersions();
      refetchVersionData();
      navigateWithDelay(
        navigate,
        `/developer/toolId/${encodeURIComponent(tool.packageName)}/version/${versionData.version}`,
      );
    }
  }, [isSuccess, data, refetchVersions, refetchVersionData, navigate, tool, versionData]);

  useAddressCheck(tool);

  // Loading states
  if (toolsLoading || versionsLoading || versionLoading) return <Loading />;

  // Error states
  if (toolsError) return <StatusMessage message="Failed to load tools" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load tool versions" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load version data" type="error" />;
  if (!tool) return <StatusMessage message={`Tool ${packageName} not found`} type="error" />;
  if (!versionData) return <StatusMessage message={`Version ${version} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Updating tool version..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Tool version updated successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to update tool version');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async (data: EditToolVersionFormData) => {
    await editToolVersion({
      packageName: tool.packageName,
      version: versionData.version,
      toolVersionEdit: data,
    });
  };

  // Render with page UI and form component
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            Edit {tool.packageName} - Version {versionData.version}
          </h1>
          <p className="text-gray-600 mt-2">
            Update the settings and configuration for this version
          </p>
        </div>
      </div>

      <EditToolVersionForm
        versionData={versionData}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
      />
    </div>
  );
}
