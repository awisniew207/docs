import { useState, useCallback } from 'react';
import { createAppUserJWT } from '@lit-protocol/vincent-app-sdk/jwt';
import { IRelayPKP } from '@lit-protocol/types';
import { ReadAuthInfo } from '@/hooks/user-dashboard';
import { env } from '@/config/env';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient } from '@/utils/user-dashboard/lit';
import { useConnectInfo } from '@/hooks/user-dashboard/connect/useConnectInfo';

const VINCENT_YIELD_APPID = Number(env.VITE_VINCENT_YIELD_APPID);

export interface UseVincentYieldActivationReturn {
  activateVincentYield: (params: {
    agentPKP: IRelayPKP;
    readAuthInfo: ReadAuthInfo;
  }) => Promise<void>;
  isActivating: boolean;
  isInitializing: boolean;
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
  const connectInfo = useConnectInfo(String(VINCENT_YIELD_APPID));

  const activateVincentYield = useCallback(
    async ({ agentPKP, readAuthInfo }: { agentPKP: IRelayPKP; readAuthInfo: ReadAuthInfo }) => {
      try {
        setIsLoading(true);
        setError(null);
        setLoadingStatus('Fetching app information...');

        if (!agentPKP || !readAuthInfo.authInfo?.userPKP || !readAuthInfo.sessionSigs) {
          throw new Error('Missing authentication information. Please try refreshing the page.');
        }

        if (connectInfo.isError || !connectInfo.data.app.activeVersion) {
          throw new Error('Failed to fetch Vincent Yield app information');
        }

        const { app } = connectInfo.data;
        const activeVersion = app.activeVersion!;

        setLoadingStatus('Generating authentication...');

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

        const jwt = await createAppUserJWT({
          pkpWallet: agentPkpWallet,
          pkpInfo: agentPKP,
          expiresInMinutes: env.VITE_JWT_EXPIRATION_MINUTES,
          audience: ['https://yield.heyvincent.ai'],
          app: {
            id: env.VITE_VINCENT_YIELD_APPID, // Use env app ID consistently
            version: activeVersion,
          },
          authentication: {
            type: readAuthInfo.authInfo.type,
            value: readAuthInfo.authInfo.value,
          },
        });

        if (!jwt) {
          throw new Error('Failed to generate JWT token');
        }

        // Open window first to avoid popup blocker
        const newWindow = window.open('about:blank', '_blank');

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
          // Close the window if request fails
          if (newWindow) newWindow.close();
          throw new Error(
            `Failed to schedule Vincent Yield: ${response.status} ${response.statusText}`,
          );
        }

        setLoadingStatus('Opening Vincent Yield...');

        // Navigate the already-opened window to Vincent Yield with JWT
        const redirectUrl = new URL('https://yield.heyvincent.ai');
        redirectUrl.searchParams.set('jwt', jwt);
        if (newWindow) {
          newWindow.location.href = redirectUrl.toString();
          // Refresh current page after a short delay to update state
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          // Fallback if popup was blocked - navigate directly without refresh
          window.location.href = redirectUrl.toString();
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
    [connectInfo],
  );

  return {
    activateVincentYield,
    isActivating: isLoading, // Only true when activation is in progress
    isInitializing: connectInfo.isLoading, // Only true when loading connect info
    error: error || (connectInfo.isError ? 'Failed to load app information' : null),
    loadingStatus,
  };
}
