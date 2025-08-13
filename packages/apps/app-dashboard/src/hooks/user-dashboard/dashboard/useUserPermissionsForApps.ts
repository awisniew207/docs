import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { useEffect, useState, useMemo } from 'react';
import { IRelayPKP } from '@lit-protocol/types';

export type UseUserPermissionsForAppsProps = {
  agentPKPs: IRelayPKP[];
};

export type UseUserPermissionsForAppsReturn = {
  permittedApps: number[] | null;
  permittedAppVersions: Record<string, string>;
  isLoading: boolean;
  error: string | null;
};

export const useUserPermissionsForApps = ({
  agentPKPs,
}: UseUserPermissionsForAppsProps): UseUserPermissionsForAppsReturn => {
  const [state, setState] = useState<UseUserPermissionsForAppsReturn>({
    permittedApps: null,
    permittedAppVersions: {},
    isLoading: true,
    error: null,
  });

  // Memoize PKPs with stable reference to prevent infinite re-renders
  const stablePKPs = useMemo(() => {
    return [...agentPKPs].sort((a, b) => a.ethAddress.localeCompare(b.ethAddress));
  }, [JSON.stringify(agentPKPs.map((pkp) => pkp.ethAddress).sort())]);

  useEffect(() => {
    // Early return if params are missing
    if (!stablePKPs.length) {
      setState({
        permittedApps: [],
        permittedAppVersions: {},
        isLoading: false,
        error: null,
      });
      return;
    }

    const checkPermitted = async () => {
      try {
        const client = getClient({ signer: readOnlySigner });

        // Get permitted apps for all PKPs in parallel
        const pkpAppsPromises = stablePKPs.map(async (pkp) => {
          const userApps = await client.getAllPermittedAppIdsForPkp({
            pkpEthAddress: pkp.ethAddress,
            offset: '0',
          });
          return { pkp, userApps };
        });

        const pkpAppsResults = await Promise.all(pkpAppsPromises);

        // Flatten all app-PKP combinations and fetch versions in parallel
        const allAppVersionPromises: Promise<{
          appId: number;
          version: any;
          pkpAddress: string;
        }>[] = [];
        const allPermittedApps: number[] = [];

        for (const { pkp, userApps } of pkpAppsResults) {
          allPermittedApps.push(...userApps);

          // Add version fetching promises for this PKP's apps
          const versionPromises = userApps.map(async (appId) => {
            const version = await client.getPermittedAppVersionForPkp({
              pkpEthAddress: pkp.ethAddress,
              appId,
            });
            return { appId, version, pkpAddress: pkp.ethAddress };
          });

          allAppVersionPromises.push(...versionPromises);
        }

        // Fetch all versions in parallel
        const allVersionResults = await Promise.all(allAppVersionPromises);

        // Combine version results
        const allAppVersions: Record<string, string> = {};
        for (const { appId, version } of allVersionResults) {
          allAppVersions[appId.toString()] = version?.toString() ?? '';
        }

        setState({
          permittedApps: allPermittedApps,
          permittedAppVersions: allAppVersions,
          isLoading: false,
          error: null,
        });
      } catch (error: any) {
        setState({
          permittedApps: null,
          permittedAppVersions: {},
          isLoading: false,
          error: error instanceof Error ? error.message : 'An error occurred',
        });
      }
    };

    checkPermitted();
  }, [stablePKPs]);

  return state;
};
