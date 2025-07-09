import { Signer, utils } from 'ethers';
import {
  decodeContractError,
  createContract,
  findEventByName,
  gasAdjustedOverrides,
} from './utils';

export interface AppVersionTools {
  toolIpfsCids: string[];
  toolPolicies: string[][];
}

export interface AppPermissionData {
  toolIpfsCids: string[];
  policyIpfsCids: string[][];
  policyParameterValues: string[][];
}

export interface RegisterAppParams {
  appId: string;
  delegatees: string[];
  versionTools: AppVersionTools;
}

export interface RegisterNextVersionParams {
  appId: string;
  versionTools: AppVersionTools;
}

export interface PermitAppParams {
  pkpTokenId: string;
  appId: string;
  appVersion: string;
  permissionData: AppPermissionData;
}

export interface RegisterAppOptions {
  signer: Signer;
  args: RegisterAppParams;
  overrides?: any;
}

export interface RegisterNextVersionOptions {
  signer: Signer;
  args: RegisterNextVersionParams;
  overrides?: any;
}

export interface PermitAppOptions {
  signer: Signer;
  args: PermitAppParams;
  overrides?: any;
}

/**
 * Register a new app version
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing appId, delegatees, and versionTools
 * @param overrides - Optional override params for the transaction call like manual gas limit
 * @returns The transaction hash and the new app version incremented on-chain. If for some reason the event is not found after a successful transaction, it will return -1.
 */
export async function registerApp({
  signer,
  args,
  overrides,
}: RegisterAppOptions): Promise<{ txHash: string; newAppVersion: string }> {
  const contract = createContract(signer);

  try {
    const appId = utils.parseUnits(args.appId, 0);

    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'registerApp',
      [appId, args.delegatees, args.versionTools],
      overrides,
    );
    console.log('adjustedOverrides: ', adjustedOverrides);

    const tx = await contract.registerApp(appId, args.delegatees, args.versionTools, {
      ...adjustedOverrides,
    });
    const receipt = await tx.wait();

    const event = findEventByName(contract, receipt.logs, 'NewAppVersionRegistered');
    const newAppVersion = event
      ? contract.interface.parseLog(event)?.args.appVersion.toString() || '-1'
      : '-1';

    return {
      txHash: tx.hash,
      newAppVersion,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Register App: ${decodedError}`);
  }
}

/**
 * Register a new version of an existing application
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing appId and versionTools
 * @param overrides - Optional override params for the transaction call like manual gas limit
 * @returns The transaction hash and the new app version incremented on-chain. If for some reason the event is not found after a successful transaction, it will return -1.
 */
export async function registerNextVersion({
  signer,
  args,
  overrides,
}: RegisterNextVersionOptions): Promise<{ txHash: string; newAppVersion: string }> {
  const contract = createContract(signer);

  try {
    const appId = utils.parseUnits(args.appId, 0);

    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'registerNextAppVersion',
      [appId, args.versionTools],
      overrides,
    );

    const tx = await contract.registerNextAppVersion(appId, args.versionTools, {
      ...adjustedOverrides,
    });
    const receipt = await tx.wait();

    const event = findEventByName(contract, receipt.logs, 'NewAppVersionRegistered');
    const newAppVersion = event
      ? contract.interface.parseLog(event)?.args.appVersion.toString() || '-1'
      : '-1';

    return {
      txHash: tx.hash,
      newAppVersion,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Register Next Version: ${decodedError}`);
  }
}

/**
 * Permits an app version for an Agent Wallet PKP token and optionally sets tool policy parameters
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing pkpTokenId, appId, appVersion, and permissionData
 * @param overrides - Optional override params for the transaction call like manual gas limit
 * @returns The transaction hash. If for some reason the event is not found after a successful transaction, it will return null for the event data.
 */
export async function permitApp({
  signer,
  args,
  overrides,
}: PermitAppOptions): Promise<{ txHash: string; success: boolean }> {
  const contract = createContract(signer);

  try {
    const pkpTokenId = utils.parseUnits(args.pkpTokenId, 0);
    const appId = utils.parseUnits(args.appId, 0);
    const appVersion = utils.parseUnits(args.appVersion, 0);

    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'permitAppVersion',
      [
        pkpTokenId,
        appId,
        appVersion,
        args.permissionData.toolIpfsCids,
        args.permissionData.policyIpfsCids,
        args.permissionData.policyParameterValues,
      ],
      overrides,
    );

    const tx = await contract.permitAppVersion(
      pkpTokenId,
      appId,
      appVersion,
      args.permissionData.toolIpfsCids,
      args.permissionData.policyIpfsCids,
      args.permissionData.policyParameterValues,
      {
        ...adjustedOverrides,
      },
    );
    await tx.wait();

    return {
      txHash: tx.hash,
      success: true,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Permit App: ${decodedError}`);
  }
}
