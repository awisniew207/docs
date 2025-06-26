import { useMemo, useState } from 'react';
import { useDeveloperData } from '@/contexts/DeveloperDataContext';

export function useAppFilters() {
  const [sortOption, setSortOption] = useState<string>('all');

  const { userApps: apps, isLoading: loading, hasErrors: error } = useDeveloperData();

  const filteredApps = useMemo(() => {
    if (sortOption === 'all') {
      return apps;
    }

    // Sort based on deployment status (0: DEV, 1: TEST, 2: PROD)
    const statusValue = sortOption === 'dev' ? 0 : sortOption === 'test' ? 1 : 2;
    return apps.filter((app: any) => app.deploymentStatus === statusValue);
  }, [apps, sortOption]);

  return {
    sortOption,
    setSortOption,
    filteredApps,
    loading,
    error,
  };
}
