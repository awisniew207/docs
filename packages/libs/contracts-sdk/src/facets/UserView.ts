import { utils } from 'ethers';
import { decodeContractError, createContract } from '../utils';
import { decodePermissionDataFromChain } from '../utils/policyParams';

import type {
  GetAllRegisteredAgentPkpsOptions,
  GetPermittedAppVersionForPkpOptions,
  GetAllPermittedAppIdsForPkpOptions,
  GetAllToolsAndPoliciesForAppOptions,
  PermissionData,
} from '../types/User';
import type { ToolWithPolicies } from '../types/internal';

/**
 * Get all PKP tokens that are registered as agents for a specific user address
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing userAddress
 * @returns Array of PKP token IDs that are registered as agents for the user
 */
export async function getAllRegisteredAgentPkps({
  signer,
  args,
}: GetAllRegisteredAgentPkpsOptions): Promise<string[]> {
  const contract = createContract(signer);

  try {
    const pkps = await contract.getAllRegisteredAgentPkps(args.userAddress);

    return pkps.map((pkp: any) => pkp.toString());
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get All Registered Agent PKPs: ${decodedError}`);
  }
}

/**
 * Get the permitted app version for a specific PKP token and app
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing pkpTokenId and appId
 * @returns The permitted app version for the PKP token and app
 */
export async function getPermittedAppVersionForPkp({
  signer,
  args,
}: GetPermittedAppVersionForPkpOptions): Promise<string> {
  const contract = createContract(signer);

  try {
    const pkpTokenId = utils.parseUnits(args.pkpTokenId, 0);
    const appId = utils.parseUnits(args.appId, 0);

    const appVersion = await contract.getPermittedAppVersionForPkp(pkpTokenId, appId);

    return appVersion.toString();
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get Permitted App Version For PKP: ${decodedError}`);
  }
}

/**
 * Get all app IDs that have permissions for a specific PKP token, excluding deleted apps
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing pkpTokenId
 * @returns Array of app IDs that have permissions for the PKP token and haven't been deleted
 */
export async function getAllPermittedAppIdsForPkp({
  signer,
  args,
}: GetAllPermittedAppIdsForPkpOptions): Promise<string[]> {
  const contract = createContract(signer);

  try {
    const pkpTokenId = utils.parseUnits(args.pkpTokenId, 0);

    const appIds = await contract.getAllPermittedAppIdsForPkp(pkpTokenId);

    return appIds.map((appId: any) => appId.toString());
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get All Permitted App IDs For PKP: ${decodedError}`);
  }
}

/**
 * Get all permitted tools, policies, and policy parameters for a specific app and PKP in a nested object structure
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing pkpTokenId and appId
 * @returns Nested object structure where keys are tool IPFS CIDs and values are objects with policy IPFS CIDs as keys
 */
export async function getAllToolsAndPoliciesForApp({
  signer,
  args,
}: GetAllToolsAndPoliciesForAppOptions): Promise<PermissionData> {
  const contract = createContract(signer);

  try {
    const pkpTokenId = utils.parseUnits(args.pkpTokenId, 0);
    const appId = utils.parseUnits(args.appId, 0);

    const tools: ToolWithPolicies[] = await contract.getAllToolsAndPoliciesForApp(
      pkpTokenId,
      appId,
    );

    // Convert directly to nested format without creating intermediary arrays
    return decodePermissionDataFromChain(tools);
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get All Tools And Policies For App: ${decodedError}`);
  }
}
