import { useState, useEffect } from 'react';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { useUserPermissionsForApps } from '@/hooks/user-dashboard/dashboard/useUserPermissionsForApps';
import { useAllAgentAppPermissions } from '@/hooks/user-dashboard/useAllAgentAppIds';
import { App } from '@/types/developer-dashboard/appTypes';

interface UseSidebarDataProps {
  userAddress: string;
}

interface UseSidebarDataReturn {
  apps: App[];
  permittedAppVersions: Record<string, string>;
  appVersionsMap: Record<string, any[]>;
  isLoading: boolean;
  error: string | null;
}

export function useSidebarData({ userAddress }: UseSidebarDataProps): UseSidebarDataReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [apps, setApps] = useState<App[]>([]);
  const [permittedAppVersions, setPermittedAppVersions] = useState<Record<string, string>>({});
  const [appVersionsMap, setAppVersionsMap] = useState<Record<string, any[]>>({});
  const [error, setError] = useState<string | null>(null);

  // Get all agent app permissions to get the list of agent PKPs
  const {
    permittedPKPs: agentAppPermissions,
    loading: agentPermissionsLoading,
    error: agentPermissionsError,
  } = useAllAgentAppPermissions(userAddress);

  // Get unique agent PKPs
  const allAgentPKPs = Array.from(
    new Map(agentAppPermissions.map((p) => [p.pkp.ethAddress, p.pkp])).values(),
  );

  // Get permissions data for all agent PKPs
  const {
    permittedApps,
    permittedAppVersions: permittedVersionsFromHook,
    isLoading: permissionsLoading,
    error: permissionsError,
  } = useUserPermissionsForApps({ agentPKPs: allAgentPKPs });

  // Lazy queries
  const [triggerGetApps] = vincentApiClient.useLazyListAppsQuery();
  const [triggerGetAppVersions] = vincentApiClient.useLazyGetAppVersionsQuery();

  // Fetch all data when permissions are ready
  useEffect(() => {
    console.log(
      '[useSidebarData] agentPermissionsLoading:',
      agentPermissionsLoading,
      'permissionsLoading:',
      permissionsLoading,
      'permittedApps:',
      permittedApps,
    );

    // Don't start if agent permissions or PKP permissions are still loading
    if (agentPermissionsLoading || permissionsLoading) {
      return;
    }

    // Handle permissions errors
    if (agentPermissionsError) {
      setError(`Failed to load agent permissions: ${agentPermissionsError}`);
      setIsLoading(false);
      return;
    }

    // Handle permissions error
    if (permissionsError) {
      setError(`Failed to load permissions: ${permissionsError}`);
      setIsLoading(false);
      return;
    }

    // If no permitted apps and we have confirmed agent permissions, we can finish early
    if (permittedApps !== null && permittedApps.length === 0 && agentAppPermissions.length === 0) {
      console.log(
        '[useSidebarData] No permitted apps and no agent permissions, setting empty state and finishing loading',
      );
      setApps([]);
      setPermittedAppVersions({});
      setAppVersionsMap({});
      setIsLoading(false);
      return;
    }

    // Don't proceed if we don't have real permitted apps data yet
    if (permittedApps === null || permittedApps.length === 0) {
      console.log('[useSidebarData] Waiting for permitted apps data, not proceeding...');
      return;
    }

    // Reset states when starting fetch
    setIsLoading(true);
    setError(null);

    const fetchAllData = async () => {
      try {
        // Set permitted app versions from permissions
        setPermittedAppVersions(permittedVersionsFromHook || {});

        // If no permitted apps, we're done immediately
        if (!permittedApps.length) {
          setApps([]);
          setAppVersionsMap({});
          setIsLoading(false);
          return;
        }

        // Fetch all apps first
        const appsResponse = await triggerGetApps();
        const allApps = appsResponse.data || [];

        // Filter apps based on permitted app IDs
        const filteredApps = allApps.filter((app) => permittedApps.includes(app.appId));

        setApps(filteredApps);

        // If no filtered apps, we're done
        if (!filteredApps.length) {
          setAppVersionsMap({});
          setIsLoading(false);
          return;
        }

        // Fetch app versions for filtered apps
        const versionPromises = filteredApps.map(async (app) => {
          const response = await triggerGetAppVersions({ appId: app.appId });
          return { appId: app.appId.toString(), versions: response.data || [] };
        });

        const results = await Promise.all(versionPromises);
        const versionsMap: Record<string, any[]> = {};

        results.forEach(({ appId, versions }) => {
          versionsMap[appId] = versions;
        });

        setAppVersionsMap(versionsMap);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching sidebar data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch sidebar data');
        setIsLoading(false); // Only set false on failure (with error)
      }
    };

    fetchAllData();
  }, [
    agentPermissionsLoading,
    agentAppPermissions.length,
    permissionsLoading,
    permissionsError,
    permittedApps,
    permittedVersionsFromHook,
  ]); // Dependencies from permissions hook

  return {
    apps,
    permittedAppVersions,
    appVersionsMap,
    isLoading,
    error,
  };
}
