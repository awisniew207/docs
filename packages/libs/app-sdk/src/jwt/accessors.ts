import type { IRelayPKP } from '@lit-protocol/types';

import type {
  VincentJWTPlatformUser,
  VincentJWTAppUser,
  AnyVincentJWT,
  VincentJWTDelegatee,
} from './types';

import { JWT_ERROR } from './constants';
import { assertIsPKPSignedVincentJWT, isAppUser } from './typeGuards';

export function getAppInfo(decodedJWT: VincentJWTAppUser): {
  appId: number;
  version: number;
} {
  if (!isAppUser(decodedJWT)) {
    throw new Error('JWT is not app specific');
  }

  return { appId: decodedJWT.payload.app.id, version: decodedJWT.payload.app.version };
}

export function getPKPInfo(decodedJWT: VincentJWTPlatformUser | VincentJWTAppUser): IRelayPKP {
  assertIsPKPSignedVincentJWT(decodedJWT);
  return decodedJWT.payload.pkpInfo;
}

export function getRole(decodedJWT: AnyVincentJWT): string {
  return decodedJWT.payload.role;
}

export function getAuthentication(decodedJWT: VincentJWTPlatformUser | VincentJWTAppUser): {
  type: string;
  value?: string;
} {
  assertIsPKPSignedVincentJWT(decodedJWT);
  return decodedJWT.payload.authentication;
}

export function getPublicKey(decodedJWT: AnyVincentJWT): string {
  return decodedJWT.payload.publicKey;
}

export function getIssuerAddress(decodedJWT: AnyVincentJWT): string | undefined {
  return decodedJWT.payload.iss;
}

export function getSubjectAddress(decodedJWT: VincentJWTDelegatee): string | undefined {
  if (!decodedJWT.payload.sub) {
    throw new Error(JWT_ERROR.INVALID_JWT + ' - Missing subject address');
  }
  return decodedJWT.payload.sub;
}

export function getAudience(decodedJWT: AnyVincentJWT): string[] {
  const aud = decodedJWT.payload.aud;

  if (!aud) {
    throw new Error(JWT_ERROR.INVALID_AUDIENCE + ' - Missing audience');
  }

  return Array.isArray(aud) ? aud : [aud];
}
