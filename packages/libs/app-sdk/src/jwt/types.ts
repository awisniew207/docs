import type { Wallet } from 'ethers';

import type { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import type { IRelayPKP } from '@lit-protocol/types';

export type JWTWalletSigner = Omit<Wallet, '_signingKey' | '_mnemonic'>;

type KnownKeys =
  | 'iss'
  | 'sub'
  | 'aud'
  | 'iat'
  | 'exp'
  | 'publicKey'
  | 'role'
  | '__vincentJWTApiVersion';

type DisallowKeys<T, K extends keyof any> = {
  [P in Exclude<keyof T, K>]: T[P];
} & {
  [P in K]?: never;
};

type PayloadWithoutInternallySetKeys = DisallowKeys<Record<string, any>, KnownKeys>;

export interface CreateJWSConfig {
  payload: PayloadWithoutInternallySetKeys;
  wallet: JWTWalletSigner;
  config: {
    audience: string | string[];
    expiresInMinutes: number;
    subjectAddress?: string;
    role: VincentJWTRole;
  };
}

/**
 *
 * @category Interfaces
 */
export interface BaseJWTPayload {
  iat: number;
  exp: number;
  iss: string;
  aud: string | string[];
  sub?: string;
  nbf?: number;

  __vincentJWTApiVersion: number;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
}

/**
 *
 * @category Interfaces
 */
export interface BaseDecodedJWT {
  header: {
    typ: 'JWT';
    alg: 'ES256K';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [x: string]: any;
  };
  payload: BaseJWTPayload;
  signature: string;
  data: string;
}

interface PKPAuthenticationMethod {
  type: string;
  value?: string;
}

/** All valid Vincent JWT roles
 *
 * @category Interfaces
 * */
export type VincentJWTRole = 'platform-user' | 'app-user' | 'app-delegatee';

/** Shared base fields for all JWT payloads
 *
 * @category Interfaces
 * */
export interface BaseVincentJWTPayload extends BaseJWTPayload {
  iss: `0x${string}`;
  publicKey: string; // This is the uncompressed pubKey of the issuer
}

/**
 *
 * @category Interfaces
 */
export interface VincentPKPPayload extends BaseVincentJWTPayload {
  pkpInfo: IRelayPKP;
  authentication: PKPAuthenticationMethod;
}

/**
 *
 * @category Interfaces
 */
export interface VincentJWTPlatformUser extends BaseDecodedJWT {
  payload: VincentPKPPayload & {
    role: 'platform-user';
  };
}

/**
 *
 * @category Interfaces
 */
export interface VincentJWTAppUser extends BaseDecodedJWT {
  payload: VincentPKPPayload & {
    role: 'app-user';
    app: {
      id: number;
      version: number;
    };
  };
}

/**
 *
 * @category Interfaces
 */
export interface VincentJWTDelegatee extends BaseDecodedJWT {
  payload: BaseVincentJWTPayload & {
    role: 'app-delegatee';
    sub?: `0x${string}`;
  };
}

/**
 *
 * @category Interfaces
 */
export type AnyVincentJWT = VincentJWTPlatformUser | VincentJWTAppUser | VincentJWTDelegatee;

interface BaseJWTParams {
  payload?: PayloadWithoutInternallySetKeys;
  audience: string | string[];
  expiresInMinutes: number;
}

interface VincentPKPJWTParams extends BaseJWTParams {
  pkpWallet: PKPEthersWallet;
  pkpInfo: IRelayPKP;
  authentication: PKPAuthenticationMethod;
}

/**
 *
 * @category Interfaces
 */
export type CreatePlatformUserJWTParams = VincentPKPJWTParams;

/**
 *
 * @category Interfaces
 */
export interface CreateAppUserJWTParams extends VincentPKPJWTParams {
  app: {
    id: number;
    version: number;
  };
}

/**
 *
 * @category Interfaces
 */
export interface CreateDelegateeJWTParams extends BaseJWTParams {
  ethersWallet: Wallet;
  subjectAddress: `0x${string}`; // This is typically the delegator address that we're trying to accessing data for
}
