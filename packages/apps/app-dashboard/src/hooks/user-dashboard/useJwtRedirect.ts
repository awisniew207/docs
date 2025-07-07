import { useCallback, useState } from 'react';
import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { jwt } from '@lit-protocol/vincent-app-sdk';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { AppView } from '@/types';
import { litNodeClient } from '@/utils/user-dashboard/lit';
import { useReadAuthInfo } from './useAuthInfo';
import { env } from '@/config/env';

const { create } = jwt;
const { VITE_JWT_EXPIRATION_MINUTES } = env;

interface UseJwtRedirectProps {
  agentPKP?: IRelayPKP;
  sessionSigs: SessionSigs;
  redirectUri: string | null;
}

export const useJwtRedirect = ({
  agentPKP,
  sessionSigs,
  redirectUri,
}: UseJwtRedirectProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const authInfo = useReadAuthInfo();

  // Generate JWT for redirection
  const generateJWT = useCallback(
    async (appId: string, appVersion: number, appInfo: AppView): Promise<string> => {
      if (!agentPKP || !redirectUri) {
        throw new Error('Cannot generate JWT: missing agentPKP or redirectUri');
      }

      if (!authInfo || !authInfo.authInfo) {
        throw new Error('Cannot generate JWT: missing authInfo');
      }

      if (!appInfo.authorizedRedirectUris.includes(redirectUri)) {
        throw new Error('Cannot generate JWT: redirectUri not in authorizedRedirectUris');
      }

      try {
        setIsGenerating(true);

        const agentPkpWallet = new PKPEthersWallet({
          controllerSessionSigs: sessionSigs,
          pkpPubKey: agentPKP.publicKey,
          litNodeClient: litNodeClient,
        });
        await agentPkpWallet.init();

        const jwt = await create({
          pkpWallet: agentPkpWallet,
          pkp: agentPKP,
          payload: {},
          expiresInMinutes: VITE_JWT_EXPIRATION_MINUTES,
          audience: appInfo.authorizedRedirectUris,
          app: {
            id: appId,
            version: appVersion,
          },
          authentication: {
            type: authInfo.authInfo.type,
            value: authInfo.authInfo.value,
          },
        });

        return jwt;
      } catch (error) {
        console.error('Error creating JWT:', error);
        throw new Error('Failed to create JWT');
      } finally {
        setIsGenerating(false);
      }
    },
    [agentPKP, authInfo, redirectUri, sessionSigs],
  );

  const redirectWithJWT = useCallback(
    (jwt: string) => {
      if (!redirectUri) {
        console.error('No redirect URI available for redirect');
        return;
      }

      try {
        const redirectUrl = new URL(redirectUri);
        redirectUrl.searchParams.set('jwt', jwt);
        window.location.href = redirectUrl.toString();
      } catch (error) {
        console.error('Error creating redirect URL:', error);
      }
    },
    [redirectUri],
  );

  return {
    isGenerating,
    generateJWT,
    redirectWithJWT,
  };
};
