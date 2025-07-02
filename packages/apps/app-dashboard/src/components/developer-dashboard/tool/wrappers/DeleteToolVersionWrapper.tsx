import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DeleteToolVersionForm } from '../forms/DeleteToolVersionForm';
import { useAddressCheck } from '@/hooks/developer-dashboard/tool/useAddressCheck';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { getErrorMessage } from '@/utils/developer-dashboard/app-forms';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/layout/Loading';
import { sortToolFromTools } from '@/utils/developer-dashboard/sortToolFromTools';
import { useUserTools } from '@/hooks/developer-dashboard/tool/useUserTools';

export function DeleteToolVersionWrapper() {
  const { packageName, version } = useParams<{ packageName: string; version: string }>();

  // Fetching
  const { data: tools, isLoading: toolsLoading, isError: toolsError } = useUserTools();

  const tool = sortToolFromTools(tools, packageName);

  // Note: The data here is barely used, but we need to confirm the version exists with a query
  const {
    data: versionData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetToolVersionQuery({
    packageName: packageName || '',
    version: version || '',
  });

  // Mutation
  const [deleteToolVersion, { isLoading, isSuccess, isError, data, error }] =
    vincentApiClient.useDeleteToolVersionMutation();

  // Navigation
  const navigate = useNavigate();

  // Effect
  useEffect(() => {
    if (isSuccess && data) {
      navigate(`/developer/toolId/${encodeURIComponent(packageName!)}/versions`); // Navigate immediately, no delay needed
    }
  }, [isSuccess, data, navigate]);

  useAddressCheck(tool);

  // Loading states
  if (toolsLoading || versionLoading) return <Loading />;

  // Error states
  if (toolsError) return <StatusMessage message="Failed to load tools" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load tool version" type="error" />;
  if (!tool) return <StatusMessage message={`Tool ${packageName} not found`} type="error" />;
  if (!versionData)
    return <StatusMessage message={`Tool version ${version} not found`} type="error" />;

  // Mutation states
  if (isLoading) {
    return <StatusMessage message="Deleting tool..." type="info" />;
  }

  if (isSuccess && data) {
    return <StatusMessage message="Tool deleted successfully!" type="success" />;
  }

  if (isError && error) {
    const errorMessage = getErrorMessage(error, 'Failed to delete tool');
    return <StatusMessage message={errorMessage} type="error" />;
  }

  const handleSubmit = async () => {
    await deleteToolVersion({
      packageName: tool.packageName,
      version: versionData.version,
    });
  };
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Delete Tool Version</h1>
          <p className="text-gray-600 mt-2">
            Delete "{tool.title}" version {versionData.version}. This action can be undone.
          </p>
        </div>
      </div>

      <DeleteToolVersionForm
        title={tool.title || ''}
        version={versionData.version}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
      />
    </div>
  );
}
