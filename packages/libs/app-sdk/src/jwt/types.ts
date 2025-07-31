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

/** All valid Vincent JWT roles */
export type VincentJWTRole = 'platform-user' | 'app-user' | 'app-delegatee';

/** Shared base fields for all JWT payloads */
export interface BaseVincentJWTPayload extends BaseJWTPayload {
  iss: `0x${string}`;
  publicKey: string; // This is the uncompressed pubKey of the issuer
}

export interface VincentPKPPayload extends BaseVincentJWTPayload {
  pkpInfo: IRelayPKP;
  authentication: PKPAuthenticationMethod;
}

export interface VincentJWTPlatformUser extends BaseDecodedJWT {
  payload: VincentPKPPayload & {
    role: 'platform-user';
  };
}

export interface VincentJWTAppUser extends BaseDecodedJWT {
  payload: VincentPKPPayload & {
    role: 'app-user';
    app: {
      id: number;
      version: number;
    };
  };
}

export interface VincentJWTDelegatee extends BaseDecodedJWT {
  payload: BaseVincentJWTPayload & {
    role: 'app-delegatee';
    sub?: `0x${string}`;
  };
}

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

export type CreatePlatformUserJWTParams = VincentPKPJWTParams;

export interface CreateAppUserJWTParams extends VincentPKPJWTParams {
  app: {
    id: number;
    version: number;
  };
}

export interface CreateDelegateeJWTParams extends BaseJWTParams {
  ethersWallet: Wallet;
  subjectAddress: `0x${string}`; // This is typically the delegator address that we're trying to accessing data for
}
