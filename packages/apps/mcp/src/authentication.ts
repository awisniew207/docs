import { LIT_EVM_CHAINS } from '@lit-protocol/constants';
import { jwt } from '@lit-protocol/vincent-app-sdk';
import { SiweMessage } from 'siwe';

import { nonceManager } from './nonceManager';

import { env } from './env';

const { EXPECTED_AUDIENCE, SIWE_EXPIRATION_TIME, VINCENT_MCP_BASE_URL } = env;
const { verify } = jwt;

const YELLOWSTONE = LIT_EVM_CHAINS.yellowstone;

if (!EXPECTED_AUDIENCE || !VINCENT_MCP_BASE_URL) {
  throw new Error(
    '"EXPECTED_AUDIENCE" or "VINCENT_MCP_BASE_URL" environment variable missing. They are required for proper authentication',
  );
}

/**
 * Any address can request a SIWE msg
 * @param address
 */
export function getSiweMessageToAuthenticate(address: string) {
  const nonce = nonceManager.getNonce(address);

  const message = new SiweMessage({
    address,
    chainId: YELLOWSTONE.chainId,
    domain: VINCENT_MCP_BASE_URL,
    expirationTime: new Date(Date.now() + SIWE_EXPIRATION_TIME).toISOString(),
    issuedAt: new Date().toISOString(),
    nonce,
    statement: 'Sign in as delegatee to the Vincent MCP.',
    uri: EXPECTED_AUDIENCE,
    version: '1',
  });

  return message.prepareMessage();
}

/**
 * We will only accept valid signatures for the passed address
 *
 * @param messageToSign
 * @param signature
 */
export async function authenticateWithSiwe(
  messageToSign: string,
  signature: string,
): Promise<string> {
  const siweMsg = new SiweMessage(messageToSign);
  const verification = await siweMsg.verify({ signature });

  const { address, domain, nonce, uri } = verification.data;

  if (
    !verification.success ||
    !nonceManager.consumeNonce(address, nonce) ||
    // @ts-expect-error Env var is defined or this module would have thrown
    domain !== new URL(VINCENT_MCP_BASE_URL).host || // Env var is defined or this module would have thrown
    uri !== EXPECTED_AUDIENCE
  ) {
    throw new Error('SIWE message verification failed');
  }

  return address;
}

/**
 * JWT AUTHENTICATION. ONLY FOR DELEGATORS
 */
export function verifyDelegatorJwt(jwt: string, appId: string, appVersion: string): string {
  // @ts-expect-error Env var is defined or this module would have thrown
  const decodedJwt = verify(jwt, EXPECTED_AUDIENCE);
  const { id, version } = decodedJwt.payload.app;
  if (id !== appId || version !== parseInt(appVersion)) {
    throw new Error('JWT provided is not valid for this Vincent App MCP');
  }

  return decodedJwt.payload.pkp.ethAddress;
}
