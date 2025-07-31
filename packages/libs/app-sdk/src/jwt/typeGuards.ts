import type {
  VincentJWTPlatformUser,
  VincentJWTAppUser,
  VincentJWTDelegatee,
  AnyVincentJWT,
  BaseDecodedJWT,
} from './types';

import { JWT_ERROR, VINCENT_JWT_API_VERSION } from './constants';
import { isDefinedObject } from './core/utils/index';

/** Check if a decoded JWT is an app-specific JWT (role === 'app-user') */
export function isAppUser(decodedJWT: BaseDecodedJWT): decodedJWT is VincentJWTAppUser {
  return decodedJWT.payload?.role === 'app-user';
}

/** Check if a decoded JWT is a general platform-user JWT */
export function isPlatformUser(decodedJWT: BaseDecodedJWT): decodedJWT is VincentJWTPlatformUser {
  return decodedJWT.payload?.role === 'platform-user';
}

/** Check if a decoded JWT is a delegatee token (role === 'app-delegatee') */
export function isDelegateee(decodedJWT: BaseDecodedJWT): decodedJWT is VincentJWTDelegatee {
  return decodedJWT.payload?.role === 'app-delegatee';
}

/** Check if the decoded JWT matches any known Vincent JWT variant */
export function isAnyVincentJWT(decodedJWT: BaseDecodedJWT): decodedJWT is AnyVincentJWT {
  return isPlatformUser(decodedJWT) || isAppUser(decodedJWT) || isDelegateee(decodedJWT);
}

/**
 * Assert that the JWT contains expected fields for a PKP-authenticated JWT.
 * Used to validate `VincentJWT` and `VincentJWTAppSpecific` before accessing `.payload.pkp` or `.authentication`.
 */
export function assertIsPKPSignedVincentJWT(
  decodedJWT: BaseDecodedJWT
): asserts decodedJWT is VincentJWTPlatformUser | VincentJWTAppUser {
  const { authentication, pkpInfo } = decodedJWT.payload;

  if (!isDefinedObject(authentication)) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: Missing "authentication" field in JWT payload.`);
  }

  if (!isDefinedObject(pkpInfo)) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: Missing "pkp" field in JWT payload.`);
  }
}

export function assertJWTAPIVersion(apiVersion: number) {
  if (VINCENT_JWT_API_VERSION !== apiVersion) {
    throw new Error(
      `Invalid JWT API version. Expected ${VINCENT_JWT_API_VERSION}, got ${apiVersion}`
    );
  }
}
