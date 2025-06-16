import { ethers } from 'ethers';
import { ExecuteJsResponse } from '@lit-protocol/types';

/**
 * @inline
 * @hidden
 * */
export type VincentToolParamsv1 = Record<string, unknown>;

/** @inline
 * @hidden
 * */
export interface VincentToolClientConfigv1 {
  ethersSigner: ethers.Signer;
  vincentToolCid: string;
}

/**
 * The Vincent Tool Client uses an ethers signer for your delegatee account to run Vincent Tools
 * on behalf of your app users.
 *
 * The {@link VincentToolClientv1} will typically be used by an AI agent or your app backend service, as it
 * requires a signer that conforms to the ethers v5 signer API, and with access to your delegatee account's
 * private key to authenticate with the LIT network when executing the Vincent Tool
 *
 * @category Vincent Tools
 */
export interface VincentToolClientv1 {
  execute: (params: VincentToolParamsv1) => Promise<ExecuteJsResponse>;
}
