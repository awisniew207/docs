import { useNavigate, useParams } from 'react-router';
import { ToolVersionsListView } from '../views/ToolVersionsListView';
import { useAddressCheck } from '@/hooks/developer-dashboard/tool/useAddressCheck';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { useUserTools } from '@/hooks/developer-dashboard/useUserTools';
import { sortToolFromTools } from '@/utils/developer-dashboard/sortToolFromTools';

export function ToolVersionsWrapper() {
  const { packageName } = useParams<{ packageName: string }>();
  const { data: tools, isLoading: toolsLoading, isError: toolsError } = useUserTools();

  const tool = sortToolFromTools(tools, packageName);

  // Fetch
  const {
    data: versions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetToolVersionsQuery({ packageName: packageName! });

  // Navigation
  const navigate = useNavigate();

  useAddressCheck(tool);

  // Loading states first
  if (toolsLoading || versionsLoading) return <Loading />;

  // Combined error states
  if (toolsError) return <StatusMessage message="Failed to load tools" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load tool versions" type="error" />;
  if (!tool) return <StatusMessage message={`Tool ${packageName} not found`} type="error" />;
  if (!versions) return <StatusMessage message="No tool versions found" type="info" />;

  const handleVersionClick = (version: string) => {
    navigate(`/developer/toolId/${encodeURIComponent(packageName!)}/version/${version}`);
  };

  return (
    <ToolVersionsListView
      versions={versions || []}
      tool={tool}
      onVersionClick={handleVersionClick}
    />
  );
}
