import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { useEffect, useState } from 'react';
import { IRelayPKP } from '@lit-protocol/types';

export type UseUserPermissionsForAppProps = {
  agentPKPs: IRelayPKP[];
  appId: number;
};

export type UseUserPermissionsForAppReturn = {
  agentPKPForApp: IRelayPKP | null;
  appVersion: string | null;
  isLoading: boolean;
  error: string | null;
};

export const useUserPermissionsForApp = ({
  agentPKPs,
  appId,
}: UseUserPermissionsForAppProps): UseUserPermissionsForAppReturn => {
  const [state, setState] = useState<UseUserPermissionsForAppReturn>({
    agentPKPForApp: null,
    appVersion: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Early return if params are missing
    if (!agentPKPs.length || !appId) {
      setState({
        agentPKPForApp: null,
        appVersion: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    const checkAppPermission = async () => {
      try {
        const client = getClient({ signer: readOnlySigner });

        // Check each PKP to see if it has permission for this specific app
        const pkpCheckPromises = agentPKPs.map(async (pkp) => {
          const userApps = await client.getAllPermittedAppIdsForPkp({
            pkpEthAddress: pkp.ethAddress,
            offset: '0',
          });

          const hasApp = userApps.includes(appId);
          if (!hasApp) {
            return { pkp, hasApp: false, version: null };
          }

          // If PKP has the app, get its version
          const version = await client.getPermittedAppVersionForPkp({
            pkpEthAddress: pkp.ethAddress,
            appId,
          });

          return { pkp, hasApp: true, version };
        });

        const results = await Promise.all(pkpCheckPromises);

        // Find the first PKP that has permission for this app
        const pkpWithPermission = results.find((result) => result.hasApp);

        if (pkpWithPermission) {
          setState({
            agentPKPForApp: pkpWithPermission.pkp,
            appVersion: pkpWithPermission.version?.toString() || null,
            isLoading: false,
            error: null,
          });
        } else {
          setState({
            agentPKPForApp: null,
            appVersion: null,
            isLoading: false,
            error: null,
          });
        }
      } catch (error: any) {
        setState({
          agentPKPForApp: null,
          appVersion: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'An error occurred',
        });
      }
    };

    checkAppPermission();
  }, [agentPKPs, appId]);

  return state;
};
