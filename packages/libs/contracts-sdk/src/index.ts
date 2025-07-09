import { Signer, Contract, utils } from 'ethers';

import { VINCENT_DIAMOND_CONTRACT_ADDRESS, COMBINED_ABI } from './constants';
import { decodeContractError } from './utils';

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

/**
 * Creates a contract instance with the provided signer
 * @param signer - The ethers signer to use for transactions
 * @returns Contract instance
 */
function createContract(signer: Signer): Contract {
  return new Contract(VINCENT_DIAMOND_CONTRACT_ADDRESS, COMBINED_ABI, signer);
}

/**
 * Register a new app version
 * @param ethersSigner - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param params - Object containing appId, delegatees, and versionTools
 * @returns The transaction hash and the new app version incremented on-chain. If for some reason the event is not found after a successful transaction, it will return -1.
 */
export async function registerApp(
  ethersSigner: Signer,
  params: RegisterAppParams,
): Promise<{ txHash: string; newAppVersion: string }> {
  const contract = createContract(ethersSigner);

  try {
    const appId = utils.parseUnits(params.appId, 0);

    const estimatedGas = await contract.estimateGas.registerApp(
      appId,
      params.delegatees,
      params.versionTools,
    );
    const gasLimit = Math.ceil(Number(estimatedGas) * 1.2);

    const tx = await contract.registerApp(appId, params.delegatees, params.versionTools, {
      gasLimit,
    });
    const receipt = await tx.wait();

    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'NewAppVersionRegistered';
      } catch {
        return false;
      }
    });

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
 * @param ethersSigner - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param params - Object containing appId and versionTools
 * @returns The transaction hash and the new app version incremented on-chain. If for some reason the event is not found after a successful transaction, it will return -1.
 */
export async function registerNextVersion(
  ethersSigner: Signer,
  params: RegisterNextVersionParams,
): Promise<{ txHash: string; newAppVersion: string }> {
  const contract = createContract(ethersSigner);

  try {
    const appId = utils.parseUnits(params.appId, 0);

    const estimatedGas = await contract.estimateGas.registerNextAppVersion(
      appId,
      params.versionTools,
    );
    const gasLimit = Math.ceil(Number(estimatedGas) * 1.2);

    const tx = await contract.registerNextAppVersion(appId, params.versionTools, {
      gasLimit,
    });
    const receipt = await tx.wait();

    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'NewAppVersionRegistered';
      } catch {
        return false;
      }
    });

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
 * @param ethersSigner - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param params - Object containing pkpTokenId, appId, appVersion, and permissionData
 * @returns The transaction hash. If for some reason the event is not found after a successful transaction, it will return null for the event data.
 */
export async function permitApp(
  ethersSigner: Signer,
  params: PermitAppParams,
): Promise<{ txHash: string; success: boolean }> {
  const contract = createContract(ethersSigner);

  try {
    const pkpTokenId = utils.parseUnits(params.pkpTokenId, 0);
    const appId = utils.parseUnits(params.appId, 0);
    const appVersion = utils.parseUnits(params.appVersion, 0);

    const estimatedGas = await contract.estimateGas.permitAppVersion(
      pkpTokenId,
      appId,
      appVersion,
      params.permissionData.toolIpfsCids,
      params.permissionData.policyIpfsCids,
      params.permissionData.policyParameterValues,
    );
    const gasLimit = Math.ceil(Number(estimatedGas) * 1.2);

    const tx = await contract.permitAppVersion(
      pkpTokenId,
      appId,
      appVersion,
      params.permissionData.toolIpfsCids,
      params.permissionData.policyIpfsCids,
      params.permissionData.policyParameterValues,
      {
        gasLimit,
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
