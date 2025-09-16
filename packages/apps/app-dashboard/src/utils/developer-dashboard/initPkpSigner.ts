import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient } from '@/utils/user-dashboard/lit';
import { SessionSigs } from '@lit-protocol/types';
import { AuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { env } from '@/config/env';

const { VITE_VINCENT_YELLOWSTONE_RPC } = env;

type initPkpSignerProps = {
  authInfo: AuthInfo | null;
  sessionSigs: SessionSigs | null;
};

export const initPkpSigner = async ({ authInfo, sessionSigs }: initPkpSignerProps) => {
  if (!authInfo || !sessionSigs || !authInfo.userPKP) {
    throw new Error('No auth info or session sigs found');
  }

  try {
    const pkpWallet = new PKPEthersWallet({
      controllerSessionSigs: sessionSigs,
      pkpPubKey: authInfo.userPKP.publicKey,
      litNodeClient: litNodeClient,
      rpc: VITE_VINCENT_YELLOWSTONE_RPC,
    });

    await pkpWallet.init();

    return pkpWallet;
  } catch (error) {
    console.error('Error initializing PKP signer:', error);
    throw new Error('Failed to initialize PKP signer');
  }
};
