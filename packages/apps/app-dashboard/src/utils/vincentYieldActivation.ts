import { useState, useCallback } from 'react';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { IRelayPKP } from '@lit-protocol/types';
import { ReadAuthInfo } from '@/hooks/user-dashboard';
import { env } from '@/config/env';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient } from '@/utils/user-dashboard/lit';
import { useConnectInfo } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { useAddPermittedActions } from '@/hooks/user-dashboard/connect/useAddPermittedActions';

export interface UseVincentYieldActivationReturn {
  activateVincentYield: (params: {
    agentPKP: IRelayPKP;
    readAuthInfo: ReadAuthInfo;
  }) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  loadingStatus: string | null;
}

/**
 * Hook for Vincent Yield activation using useConnectInfo pattern like ConnectPage
 */
export function useVincentYieldActivation(): UseVincentYieldActivationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const vincentYieldAppId = '961992704'; // Staging registry app ID
  const connectInfo = useConnectInfo(vincentYieldAppId);
  const { addPermittedActions } = useAddPermittedActions();

  const activateVincentYield = useCallback(
    async ({ agentPKP, readAuthInfo }: { agentPKP: IRelayPKP; readAuthInfo: ReadAuthInfo }) => {
      try {
        setIsLoading(true);
        setError(null);
        setLoadingStatus('Fetching app information...');

        if (!agentPKP || !readAuthInfo.authInfo?.userPKP || !readAuthInfo.sessionSigs) {
          throw new Error('Missing authentication information. Please try refreshing the page.');
        }

        // Wait for connect info to load
        if (connectInfo.isLoading) {
          setLoadingStatus('Loading app information...');
          return;
        }

        if (connectInfo.isError || !connectInfo.data.app.activeVersion) {
          throw new Error('Failed to fetch Vincent Yield app information');
        }

        const {
          app,
          supportedPoliciesByAbilityVersion,
          abilityVersionsByAppVersionAbility,
          appVersionAbilitiesByAppVersion,
        } = connectInfo.data;
        const activeVersion = app.activeVersion!;
        const versionKey = `${vincentYieldAppId}-${activeVersion}`;

        // Get app version abilities for this version
        const appVersionAbilities = appVersionAbilitiesByAppVersion[versionKey] || [];

        setLoadingStatus('Initializing wallet...');

        // Create user PKP wallet
        const userPkpWallet = new PKPEthersWallet({
          controllerSessionSigs: readAuthInfo.sessionSigs,
          pkpPubKey: readAuthInfo.authInfo.userPKP.publicKey,
          litNodeClient: litNodeClient,
        });
        await userPkpWallet.init();

        // Hardcode required ability IPFS CIDs for Vincent Yield v6
        const requiredAbilityIpfsCids = [
          'QmUmcUkg2i9g3BzU9YQ92meyPMQAxH8zyrWitsB6NGWn6x',
          'Qmd6awVfUfDedhUgAPjc6BUbLDsgemSZfgb2Xqme1BRsGf',
        ];

        setLoadingStatus('Adding permitted actions...');
        await addPermittedActions({
          wallet: userPkpWallet,
          agentPKPTokenId: agentPKP.tokenId,
          abilityIpfsCids: requiredAbilityIpfsCids,
        });

        setLoadingStatus('Permitting Vincent Yield app...');

        // Hardcode permission data for the required abilities
        const permissionData: Record<string, any> = {
          QmUmcUkg2i9g3BzU9YQ92meyPMQAxH8zyrWitsB6NGWn6x: {},
          Qmd6awVfUfDedhUgAPjc6BUbLDsgemSZfgb2Xqme1BRsGf: {},
        };

        /*
      // Build permission data using the same pattern as ConnectPage
      const permissionData: Record<string, any> = {};
      
      appVersionAbilities.forEach((ability) => {
        const abilityKey = `${ability.abilityPackageName}-${ability.abilityVersion}`;
        const policies = supportedPoliciesByAbilityVersion[abilityKey] || [];
        const abilityVersions = abilityVersionsByAppVersionAbility[abilityKey] || [];
        const abilityVersion = abilityVersions[0];

        if (abilityVersion) {
          permissionData[abilityVersion.ipfsCid] = {};
          
          // Add all policies with empty default values (same as ConnectPage initial state)
          policies.forEach((policy) => {
            permissionData[abilityVersion.ipfsCid][policy.ipfsCid] = {};
          });
        }
      });
      */

        // Get the client and permit the Vincent Yield app
        const client = getClient({ signer: userPkpWallet });
        await client.permitApp({
          pkpEthAddress: agentPKP.ethAddress,
          appId: Number(env.VITE_VINCENT_YIELD_APPID),
          appVersion: 6, // Hardcoded to version 6
          permissionData,
        });

        setLoadingStatus('Generating authentication token...');

        // Generate JWT directly without relying on redirectUrl state
        if (!readAuthInfo.authInfo || !readAuthInfo.sessionSigs || !app.redirectUris) {
          throw new Error('Cannot generate JWT: missing authentication information');
        }

        // Create agent PKP wallet for JWT signing
        const agentPkpWallet = new PKPEthersWallet({
          controllerSessionSigs: readAuthInfo.sessionSigs,
          pkpPubKey: agentPKP.publicKey,
          litNodeClient: litNodeClient,
        });
        await agentPkpWallet.init();

        // Import JWT creation function
        const { createAppUserJWT } = await import('@lit-protocol/vincent-app-sdk/jwt');

        const jwt = await createAppUserJWT({
          pkpWallet: agentPkpWallet,
          pkpInfo: agentPKP,
          expiresInMinutes: env.VITE_JWT_EXPIRATION_MINUTES,
          audience: app.redirectUris,
          app: {
            id: Number(env.VITE_VINCENT_YIELD_APPID), // Use env app ID consistently
            version: 6, // Hardcoded to version 6
          },
          authentication: {
            type: readAuthInfo.authInfo.type,
            value: readAuthInfo.authInfo.value,
          },
        });

        if (!jwt) {
          throw new Error('Failed to generate JWT token');
        }

        setLoadingStatus('Scheduling Vincent Yield...');

        // Make POST request to schedule endpoint with the JWT
        const response = await fetch('https://api.yield.heyvincent.ai/schedule', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          // No payload as specified
        });

        if (!response.ok) {
          throw new Error(
            `Failed to schedule Vincent Yield: ${response.status} ${response.statusText}`,
          );
        }

        setLoadingStatus('Activation complete!');
        setIsLoading(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to activate Vincent Yield';
        setError(errorMessage);
        setIsLoading(false);
        setLoadingStatus(null);
        throw err;
      }
    },
    [connectInfo, addPermittedActions, vincentYieldAppId],
  );

  return {
    activateVincentYield,
    isLoading: isLoading || connectInfo.isLoading,
    error: error || (connectInfo.isError ? 'Failed to load app information' : null),
    loadingStatus,
  };
}

export function buildActivationUrl(redirectUri = 'https://yield.heyvincent.ai'): string {
  return `https://dashboard.heyvincent.ai/user/appId/${env.VITE_VINCENT_YIELD_APPID}/connect?redirectUri=${encodeURIComponent(redirectUri)}`;
}
