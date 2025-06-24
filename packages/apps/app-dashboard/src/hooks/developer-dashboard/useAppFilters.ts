import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

export function useAppFilters() {
  const [sortOption, setSortOption] = useState<string>('all');
  const { address } = useAccount();

  const {
    data: apiApps = [],
    error: appsError,
    isLoading: appsLoading,
  } = vincentApiClient.useListAppsQuery();

  // Filter apps by user address
  const userApps = useMemo(() => {
    if (!address || !apiApps?.length) return [];
    return apiApps.filter((app: any) => app.managerAddress.toLowerCase() === address.toLowerCase());
  }, [apiApps, address]);

  // Filter apps by deployment status
  const filteredApps = useMemo(() => {
    if (sortOption === 'all') return userApps;

    // Convert sortOption to deployment status value (0: DEV, 1: TEST, 2: PROD)
    const statusValue = sortOption === 'dev' ? 0 : sortOption === 'test' ? 1 : 2;
    return userApps.filter((app: any) => app.deploymentStatus === statusValue);
  }, [userApps, sortOption]);

  return {
    sortOption,
    setSortOption,
    filteredApps,
    loading: appsLoading,
    error: appsError ? 'Failed to load apps' : null,
  };
}
