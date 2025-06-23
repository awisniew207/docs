import { useMemo } from 'react';
import { useAccount } from 'wagmi';
//import { vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

// FIXME: Mock hooks!!! import issue from vincent-registry-sdk. To be fixed.
const useListAppsQuery = () => ({
  data: [] as any[],
  error: null,
  isLoading: false,
});

const useListAllToolsQuery = () => ({
  data: [] as any[],
  error: null,
  isLoading: false,
});

const useListAllPoliciesQuery = () => ({
  data: [] as any[],
  error: null,
  isLoading: false,
});

interface DashboardData {
  apps: any[];
  tools: any[];
  policies: any[];
  loading: {
    apps: boolean;
    tools: boolean;
    policies: boolean;
  };
  errors: {
    apps: string | null;
    tools: string | null;
    policies: string | null;
  };
}

export function useDashboardData(): DashboardData {
  const { address } = useAccount();

  const { data: apiApps = [], error: appsError, isLoading: appsLoading } = useListAppsQuery();

  const {
    data: allTools = [],
    error: toolsError,
    isLoading: toolsLoading,
  } = useListAllToolsQuery();

  const {
    data: allPolicies = [],
    error: policiesError,
    isLoading: policiesLoading,
  } = useListAllPoliciesQuery();

  /* FIXME
  const { data: apiApps = [], error: appsError, isLoading: appsLoading } = 
    vincentApiClient.useListAppsQuery(undefined, { skip: !address });

  const { data: allTools = [], error: toolsError, isLoading: toolsLoading } = 
    vincentApiClient.useListAllToolsQuery(undefined, { skip: !address });

  const { data: allPolicies = [], error: policiesError, isLoading: policiesLoading } = 
    vincentApiClient.useListAllPoliciesQuery(undefined, { skip: !address });
  */

  // Filter data by user address
  const filteredApps = useMemo(() => {
    if (!address || !apiApps?.length) return [];
    return apiApps.filter((app: any) => app.managerAddress.toLowerCase() === address.toLowerCase());
  }, [apiApps, address]);

  const filteredTools = useMemo(() => {
    if (!address || !allTools?.length) return [];
    return allTools.filter(
      (tool: any) => tool.authorWalletAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [allTools, address]);

  const filteredPolicies = useMemo(() => {
    if (!address || !allPolicies?.length) return [];
    return allPolicies.filter(
      (policy: any) => policy.authorWalletAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [allPolicies, address]);

  return {
    apps: filteredApps,
    tools: filteredTools,
    policies: filteredPolicies,
    loading: {
      apps: appsLoading,
      tools: toolsLoading,
      policies: policiesLoading,
    },
    errors: {
      apps: appsError ? 'Failed to load apps' : null,
      tools: toolsError ? 'Failed to load tools' : null,
      policies: policiesError ? 'Failed to load policies' : null,
    },
  };
}
