import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { Tool } from '@/types/developer-dashboard/appTypes';

export function useUserTools() {
  const { address } = useAccount();

  const {
    data: allTools,
    isLoading,
    isError,
    error,
    ...rest
  } = vincentApiClient.useListAllToolsQuery();

  // Filter tools by current user
  const filteredTools = useMemo(() => {
    if (!address || !allTools?.length) return [];
    return allTools.filter(
      (tool: Tool) => tool.authorWalletAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [allTools, address]);

  // FIXME: Remove this once the API is updated
  // @ts-expect-error FIXME: Remove this once the API is updated -- isDeleted currently not in the type
  const userTools = filteredTools.filter((tool: Tool) => !tool.isDeleted!);
  // @ts-expect-error FIXME: Remove this once the API is updated -- isDeleted currently not in the type
  const deletedTools = filteredTools.filter((tool: Tool) => tool.isDeleted);

  return {
    data: userTools,
    deletedTools,
    isLoading,
    isError,
    error,
    ...rest,
  };
}
