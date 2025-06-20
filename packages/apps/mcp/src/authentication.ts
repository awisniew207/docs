import { LIT_EVM_CHAINS } from '@lit-protocol/constants';
import { jwt } from '@lit-protocol/vincent-app-sdk';
import { generateNonce, SiweMessage } from 'siwe';

import { env } from './env';

const { EXPECTED_AUDIENCE, SIWE_EXPIRATION_TIME, VINCENT_MCP_BASE_URL } = env;
const { verify } = jwt;

const YELLOWSTONE = LIT_EVM_CHAINS.yellowstone;

/**
 * Any address can request a SIWE msg
 * @param address
 */
export function getSiweMessageToAuthenticate(address: string) {
  const nonce = generateNonce();

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

  if (!verification.success) {
    throw new Error('SIWE message verification failed');
  }

  return verification.data.address;
}

/**
 * JWT AUTHENTICATION. ONLY FOR DELEGATORS
 */
export function verifyDelegatorJwt(jwt: string, appId: string, appVersion: string): string {
  // @ts-expect-error only http will import this file which should have this as required property (check env.ts)
  const decodedJwt = verify(jwt, EXPECTED_AUDIENCE);
  const { id, version } = decodedJwt.payload.app;
  if (id !== appId || version !== parseInt(appVersion)) {
    throw new Error('JWT provided is not valid for this Vincent App MCP');
  }

  return decodedJwt.payload.pkp.ethAddress;
}
