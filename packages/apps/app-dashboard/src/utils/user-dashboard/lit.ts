import {
  EthWalletProvider,
  WebAuthnProvider,
  BaseProvider,
  LitRelay,
  StytchAuthFactorOtpProvider,
} from '@lit-protocol/lit-auth-client';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import {
  AUTH_METHOD_SCOPE,
  AUTH_METHOD_TYPE,
  LIT_ABILITY,
  LIT_NETWORK,
  LIT_RPC,
} from '@lit-protocol/constants';
import { AuthMethod, IRelayPKP, SessionSigs, LIT_NETWORKS_KEYS } from '@lit-protocol/types';
import { LitActionResource, LitPKPResource } from '@lit-protocol/auth-helpers';
import { ethers } from 'ethers';
import { getPkpNftContract } from './get-pkp-nft-contract';
import { addPayee } from './addPayee';
import { env } from '@/config/env';
import { addVincentYieldToAgentPKP } from './addVincentYield';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { getAgentPKPs } from './getAgentPKP';

const { VITE_ENV, VITE_STYTCH_PROJECT_ID } = env;

export const DOMAIN = VITE_ENV === 'staging' ? 'localhost:5173' : 'dashboard.heyvincent.ai';
export const ORIGIN = VITE_ENV === 'staging' ? `http://${DOMAIN}` : `https://${DOMAIN}`;

export const SELECTED_LIT_NETWORK = LIT_NETWORK.Datil as LIT_NETWORKS_KEYS;

export const litNodeClient: LitNodeClient = new LitNodeClient({
  alertWhenUnauthorized: false,
  litNetwork: SELECTED_LIT_NETWORK,
  debug: false,
});

litNodeClient.connect();

const litRelay = new LitRelay({
  relayUrl: LitRelay.getRelayUrl(SELECTED_LIT_NETWORK),
  relayApiKey: 'test-api-key',
});

/**
 * Setting all available providers
 */
let ethWalletProvider: EthWalletProvider;
let webAuthnProvider: WebAuthnProvider;
let stytchEmailOtpProvider: StytchAuthFactorOtpProvider<'email'>;
let stytchSmsOtpProvider: StytchAuthFactorOtpProvider<'sms'>;

/**
 * Get the provider that is authenticated with the given auth method
 */
function getAuthenticatedProvider(authMethod: AuthMethod): BaseProvider {
  switch (authMethod.authMethodType) {
    case AUTH_METHOD_TYPE.EthWallet:
      return getEthWalletProvider();
    case AUTH_METHOD_TYPE.WebAuthn:
      return getWebAuthnProvider();
    case AUTH_METHOD_TYPE.StytchEmailFactorOtp:
      return getStytchEmailOtpProvider();
    case AUTH_METHOD_TYPE.StytchSmsFactorOtp:
      return getStytchSmsOtpProvider();
    default:
      throw new Error(`No provider found for auth method type: ${authMethod.authMethodType}`);
  }
}

export function getEthWalletProvider() {
  if (!ethWalletProvider) {
    ethWalletProvider = new EthWalletProvider({
      relay: litRelay,
      litNodeClient,
      domain: DOMAIN,
      origin: ORIGIN,
    });
  }

  return ethWalletProvider;
}

function getWebAuthnProvider() {
  if (!webAuthnProvider) {
    webAuthnProvider = new WebAuthnProvider({
      relay: litRelay,
      litNodeClient,
    });
  }

  return webAuthnProvider;
}
function getStytchEmailOtpProvider() {
  if (!stytchEmailOtpProvider) {
    stytchEmailOtpProvider = new StytchAuthFactorOtpProvider<'email'>(
      {
        relay: litRelay,
        litNodeClient,
      },
      { appId: VITE_STYTCH_PROJECT_ID },
      'email',
    );
  }

  return stytchEmailOtpProvider;
}
function getStytchSmsOtpProvider() {
  if (!stytchSmsOtpProvider) {
    stytchSmsOtpProvider = new StytchAuthFactorOtpProvider<'sms'>(
      {
        relay: litRelay,
        litNodeClient,
      },
      { appId: VITE_STYTCH_PROJECT_ID },
      'sms',
    );
  }

  return stytchSmsOtpProvider;
}

/**
 * Get auth method object by signing a message with an Ethereum wallet
 */
export async function authenticateWithEthWallet(
  address?: string,
  signMessage?: (message: string) => Promise<string>,
): Promise<AuthMethod> {
  const ethWalletProvider = getEthWalletProvider();
  return await ethWalletProvider.authenticate({
    address,
    signMessage,
  });
}

/**
 * Register new WebAuthn credential
 */
export async function registerWebAuthn(displayName: string): Promise<IRelayPKP> {
  const webAuthnProvider = getWebAuthnProvider();
  // Register new WebAuthn credential
  const options = await webAuthnProvider.register();

  const passkeyName = displayName;

  if (options.user) {
    options.user.displayName = passkeyName;
    options.user.name = passkeyName.toLowerCase().replace(/\s+/g, '-');
    // Make sure id exists - use name as id if missing
    if (!options.user.id) {
      options.user.id = options.user.name;
    }
  } else {
    const userName = passkeyName.toLowerCase().replace(/\s+/g, '-');
    options.user = {
      displayName: passkeyName,
      name: userName,
      id: userName,
    };
  }

  // Verify registration and mint PKP through relay server
  const userTxHash = await webAuthnProvider.verifyAndMintPKPThroughRelayer(options);
  const userResponse = await webAuthnProvider.relay.pollRequestUntilTerminalState(userTxHash);
  if (
    userResponse.status !== 'Succeeded' ||
    !userResponse.pkpTokenId ||
    !userResponse.pkpPublicKey ||
    !userResponse.pkpEthAddress
  ) {
    throw new Error('Minting failed: Invalid response data');
  }
  const newUserPKP: IRelayPKP = {
    tokenId: userResponse.pkpTokenId,
    publicKey: userResponse.pkpPublicKey,
    ethAddress: userResponse.pkpEthAddress,
  };

  try {
    await addPayee(newUserPKP.ethAddress);
  } catch (err) {
    console.warn('Failed to add payee', err);
  }

  // Mint agent PKP controlled by the user PKP
  await mintPKPToExistingPKP(newUserPKP);

  return newUserPKP;
}

/**
 * Get auth method object by authenticating with a WebAuthn credential
 */
export async function authenticateWithWebAuthn(
  vincentYieldInfo: ConnectInfoMap,
): Promise<AuthMethod> {
  const webAuthnProvider = getWebAuthnProvider();
  const authMethod = await webAuthnProvider.authenticate();

  // Get user PKP associated with this auth method
  const userPKPs = await getPKPs(authMethod);
  const userPKP = userPKPs[0];

  // Get the agent PKPs owned by the user
  const agentPKPs = await getAgentPKPs(userPKP.ethAddress);

  // Get the first agent PKP (could be unpermitted with appId -1 or a permitted one)
  if (agentPKPs.length === 0) {
    throw new Error('No agent PKP found for user');
  }

  const agentPKP = agentPKPs[0].pkp;

  // If we have exactly one agent PKP with appId -1, it means we need to add VY to it
  if (agentPKPs.length === 1 && agentPKPs[0].appId === -1 && vincentYieldInfo?.app?.activeVersion) {
    console.log('Vincent Yield not yet permitted, adding it now...');
    const sessionSigs = await getSessionSigs({ pkpPublicKey: userPKP.publicKey, authMethod });

    // Add Vincent Yield and wait for it to complete
    await addVincentYieldToAgentPKP({
      userPKP,
      agentPKP,
      sessionSigs,
      connectInfoData: vincentYieldInfo,
    });

    console.log('Vincent Yield permission has been added');
  } else {
    console.log('Vincent Yield already permitted or multiple agent PKPs exist');
  }

  return authMethod;
}

/**
 * Get auth method object by validating Stytch JWT
 */
export async function authenticateWithStytch(
  accessToken: string,
  userId?: string,
  method?: 'email' | 'sms',
): Promise<AuthMethod> {
  const provider = method === 'email' ? getStytchEmailOtpProvider() : getStytchSmsOtpProvider();
  if (!provider) {
    throw new Error('Failed to initialize Stytch provider');
  }
  return await provider.authenticate({ accessToken, userId });
}

/**
 * Generate session sigs for given params
 */
export async function getSessionSigs({
  pkpPublicKey,
  authMethod,
}: {
  pkpPublicKey: string;
  authMethod: AuthMethod;
}): Promise<SessionSigs> {
  await litNodeClient.connect();

  const sessionSigs = await litNodeClient.getPkpSessionSigs({
    chain: 'ethereum',
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 1 day
    pkpPublicKey,
    authMethods: [authMethod],
    resourceAbilityRequests: [
      {
        resource: new LitActionResource('*'),
        ability: LIT_ABILITY.LitActionExecution,
      },
      {
        resource: new LitPKPResource('*'),
        ability: LIT_ABILITY.PKPSigning,
      },
    ],
  });

  return sessionSigs;
}

/**
 * Fetch PKPs associated with given auth method
 */
export async function getPKPs(authMethod: AuthMethod): Promise<IRelayPKP[]> {
  const provider = getAuthenticatedProvider(authMethod);
  return await provider.fetchPKPsThroughRelayer(authMethod);
}

/**
 * Mint PKPs for given auth method with Vincent Yield setup
 */
export async function mintPKPs(
  authMethod: AuthMethod,
  vincentYieldInfo: ConnectInfoMap,
): Promise<IRelayPKP[]> {
  if (authMethod.authMethodType === AUTH_METHOD_TYPE.WebAuthn) {
    throw new Error('WebAuthn PKPs should be minted through registerWebAuthn');
  }

  const userPKP = await mintPKP(authMethod);
  const sessionSigs = await getSessionSigs({ pkpPublicKey: userPKP.publicKey, authMethod });
  const agentPKP = await mintPKPToExistingPKP(userPKP);

  await addVincentYieldToAgentPKP({
    userPKP,
    agentPKP,
    sessionSigs,
    connectInfoData: vincentYieldInfo,
  });

  const provider = getAuthenticatedProvider(authMethod);
  return await provider.fetchPKPsThroughRelayer(authMethod);
}

/**
 * Mint a new PKP for current auth method
 */
export async function mintPKP(authMethod: AuthMethod): Promise<IRelayPKP> {
  const provider = getAuthenticatedProvider(authMethod);
  // Set scope of signing any data
  const options = {
    permittedAuthMethodScopes: [[AUTH_METHOD_SCOPE.SignAnything]],
  };

  // Mint PKP through relay server
  const txHash = await provider.mintPKPThroughRelayer(authMethod, options);

  let attempts = 3;
  let response = null;

  while (attempts > 0) {
    try {
      const tempResponse = await provider.relay.pollRequestUntilTerminalState(txHash);
      if (
        tempResponse.status === 'Succeeded' &&
        tempResponse.pkpTokenId &&
        tempResponse.pkpPublicKey &&
        tempResponse.pkpEthAddress
      ) {
        response = {
          status: tempResponse.status,
          pkpTokenId: tempResponse.pkpTokenId,
          pkpPublicKey: tempResponse.pkpPublicKey,
          pkpEthAddress: tempResponse.pkpEthAddress,
        };
        break;
      }
      throw new Error('Invalid response data');
    } catch (err) {
      console.warn('Minting failed, retrying...', err);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts--;
      if (attempts === 0) {
        throw new Error('Minting failed after all attempts');
      }
    }
  }

  if (!response) {
    throw new Error('Minting failed');
  }

  const newPKP: IRelayPKP = {
    tokenId: response.pkpTokenId,
    publicKey: response.pkpPublicKey,
    ethAddress: response.pkpEthAddress,
  };

  try {
    await addPayee(newPKP.ethAddress);
  } catch (err) {
    console.warn('Failed to add payee', err);
  }

  return newPKP;
}

/**
 * Mint a PKP to be controlled by an existing PKP
 */
export async function mintPKPToExistingPKP(pkp: IRelayPKP): Promise<IRelayPKP> {
  const requestBody = {
    keyType: '2',
    permittedAuthMethodTypes: ['2'],
    permittedAuthMethodIds: [pkp.tokenId],
    permittedAuthMethodPubkeys: ['0x'],
    permittedAuthMethodScopes: [['1']],
    addPkpEthAddressAsPermittedAddress: true,
    sendPkpToItself: false,
    burnPkp: false,
    sendToAddressAfterMinting: pkp.ethAddress,
  };

  const agentMintResponse = await fetch(
    'https://datil-relayer.getlit.dev/mint-next-and-add-auth-methods',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': 'test-api-key',
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!agentMintResponse.ok) {
    const errorText = await agentMintResponse.text();
    console.log('Full minting error response:', {
      status: agentMintResponse.status,
      statusText: agentMintResponse.statusText,
      errorText,
      requestBody,
    });
    throw new Error(
      `Failed to mint PKP to existing PKP: ${agentMintResponse.status} ${agentMintResponse.statusText} - ${errorText}`,
    );
  }

  const agentMintResponseJson = await agentMintResponse.json();

  // Wait for transaction and verify
  const provider = new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE);
  const txReceipt = await provider.waitForTransaction(agentMintResponseJson.requestId);

  if (txReceipt.status !== 1) {
    throw new Error(
      `Transaction failed with status: ${txReceipt.status}. Transaction hash: ${agentMintResponseJson.requestId}`,
    );
  }

  // Get the token ID from the transaction logs
  const pkpNft = getPkpNftContract(SELECTED_LIT_NETWORK);
  const mintEvent = txReceipt.logs.find((log) => {
    try {
      return pkpNft.interface.parseLog(log).name === 'PKPMinted';
    } catch {
      return false;
    }
  });

  if (!mintEvent) {
    throw new Error(
      `Failed to find PKPMinted event in transaction logs. Found ${txReceipt.logs.length} logs. Transaction hash: ${agentMintResponseJson.requestId}`,
    );
  }

  const tokenId = pkpNft.interface.parseLog(mintEvent).args.tokenId;
  if (!tokenId) {
    throw new Error(
      `Token ID not found in mint event. Transaction hash: ${agentMintResponseJson.requestId}`,
    );
  }

  // Get the public key and eth address from the PKP NFT contract
  const publicKey = await pkpNft.getPubkey(tokenId);
  const ethAddress = ethers.utils.computeAddress(publicKey);

  const agentPKP: IRelayPKP = {
    tokenId: tokenId.toString(),
    publicKey,
    ethAddress,
  };

  return agentPKP;
}
