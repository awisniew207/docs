import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

// Types - Export these for use in other files
export interface App {
  appId: number;
  managerAddress: string;
  [key: string]: any;
}

export interface Tool {
  packageName: string;
  authorWalletAddress: string;
  [key: string]: any;
}

export interface Policy {
  packageName: string;
  authorWalletAddress: string;
  [key: string]: any;
}

interface DeveloperDataContextType {
  // Raw data
  allApps: App[];
  allTools: Tool[];
  allPolicies: Policy[];

  // Filtered data (by current user)
  userApps: App[];
  userTools: Tool[];
  userPolicies: Policy[];

  // Loading states
  isLoading: boolean;
  loading: {
    apps: boolean;
    tools: boolean;
    policies: boolean;
  };

  // Error states
  errors: {
    apps: string | null;
    tools: string | null;
    policies: string | null;
  };
  hasErrors: boolean;

  // Utilities
  findAppById: (appId: number) => App | null;
  findToolByPackageName: (packageName: string) => Tool | null;
  findPolicyByPackageName: (packageName: string) => Policy | null;

  // Refetch functions
  refetchApps: () => void;
  refetchTools: () => void;
  refetchPolicies: () => void;
}

const DeveloperDataContext = createContext<DeveloperDataContextType | undefined>(undefined);

interface DeveloperDataProviderProps {
  children: ReactNode;
  shouldFetch?: boolean; // Allow conditional fetching
}

export function DeveloperDataProvider({
  children,
  shouldFetch = true,
}: DeveloperDataProviderProps) {
  const { address } = useAccount();

  // Fetch all data with conditional skipping
  const {
    data: allApps = [],
    error: appsError,
    isLoading: appsLoading,
    refetch: refetchApps,
  } = vincentApiClient.useListAppsQuery(undefined, {
    skip: !shouldFetch || !address,
  });

  const {
    data: allTools = [],
    error: toolsError,
    isLoading: toolsLoading,
    refetch: refetchTools,
  } = vincentApiClient.useListAllToolsQuery(undefined, {
    skip: !shouldFetch || !address,
  });

  const {
    data: allPolicies = [],
    error: policiesError,
    isLoading: policiesLoading,
    refetch: refetchPolicies,
  } = vincentApiClient.useListAllPoliciesQuery(undefined, {
    skip: !shouldFetch || !address,
  });

  // Filter data by current user
  const userApps = useMemo(() => {
    if (!address || !allApps?.length) return [];
    return allApps.filter((app: App) => app.managerAddress.toLowerCase() === address.toLowerCase());
  }, [allApps, address]);

  const userTools = useMemo(() => {
    if (!address || !allTools?.length) return [];
    return allTools.filter(
      (tool: Tool) => tool.authorWalletAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [allTools, address]);

  const userPolicies = useMemo(() => {
    if (!address || !allPolicies?.length) return [];
    return allPolicies.filter(
      (policy: Policy) => policy.authorWalletAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [allPolicies, address]);

  // Utility functions
  const findAppById = useMemo(() => {
    return (appId: number): App | null => {
      return userApps.find((app) => app.appId === appId) || null;
    };
  }, [userApps]);

  const findToolByPackageName = useMemo(() => {
    return (packageName: string): Tool | null => {
      return userTools.find((tool) => tool.packageName === packageName) || null;
    };
  }, [userTools]);

  const findPolicyByPackageName = useMemo(() => {
    return (packageName: string): Policy | null => {
      return userPolicies.find((policy) => policy.packageName === packageName) || null;
    };
  }, [userPolicies]);

  // Error and loading state aggregation
  const errors = useMemo(
    () => ({
      apps: appsError ? 'Failed to load apps' : null,
      tools: toolsError ? 'Failed to load tools' : null,
      policies: policiesError ? 'Failed to load policies' : null,
    }),
    [appsError, toolsError, policiesError],
  );

  const loading = useMemo(
    () => ({
      apps: appsLoading,
      tools: toolsLoading,
      policies: policiesLoading,
    }),
    [appsLoading, toolsLoading, policiesLoading],
  );

  const isLoading = appsLoading || toolsLoading || policiesLoading;
  const hasErrors = !!(appsError || toolsError || policiesError);

  const contextValue: DeveloperDataContextType = {
    // Raw data
    allApps,
    allTools,
    allPolicies,

    // Filtered data
    userApps,
    userTools,
    userPolicies,

    // Loading states
    isLoading,
    loading,

    // Error states
    errors,
    hasErrors,

    // Utilities
    findAppById,
    findToolByPackageName,
    findPolicyByPackageName,

    // Refetch functions
    refetchApps,
    refetchTools,
    refetchPolicies,
  };

  return (
    <DeveloperDataContext.Provider value={contextValue}>{children}</DeveloperDataContext.Provider>
  );
}

export function useDeveloperData(): DeveloperDataContextType {
  const context = useContext(DeveloperDataContext);
  if (context === undefined) {
    throw new Error('useDeveloperData must be used within a DeveloperDataProvider');
  }
  return context;
}
