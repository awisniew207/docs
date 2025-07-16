import { utils } from 'ethers';
import { decodeContractError, createContract, gasAdjustedOverrides } from '../utils';
import { encodePermissionDataForChain } from '../utils/policyParams';
import {
  PermitAppOptions,
  UnPermitAppOptions,
  SetToolPolicyParametersOptions,
} from '../types/User';

/**
 * Permits an app version for an Agent Wallet PKP token and optionally sets tool policy parameters
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing pkpTokenId, appId, appVersion, and permissionData in nested object format
 * @param overrides - Optional override params for the transaction call like manual gas limit
 * @returns The transaction hash and a success flag
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

    // Convert nested policy parameters to flattened format
    const flattenedParams = encodePermissionDataForChain(args.permissionData);

    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'permitAppVersion',
      [
        pkpTokenId,
        appId,
        appVersion,
        flattenedParams.toolIpfsCids,
        flattenedParams.policyIpfsCids,
        flattenedParams.policyParameterValues,
      ],
      overrides,
    );

    const tx = await contract.permitAppVersion(
      pkpTokenId,
      appId,
      appVersion,
      flattenedParams.toolIpfsCids,
      flattenedParams.policyIpfsCids,
      flattenedParams.policyParameterValues,
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

/**
 * Revokes permission for a PKP to use a specific app version
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing pkpTokenId, appId, and appVersion
 * @param overrides - Optional override params for the transaction call like manual gas limit
 * @returns The transaction hash and a success flag
 */
export async function unPermitApp({
  signer,
  args,
  overrides,
}: UnPermitAppOptions): Promise<{ txHash: string; success: boolean }> {
  const contract = createContract(signer);

  try {
    const pkpTokenId = utils.parseUnits(args.pkpTokenId, 0);
    const appId = utils.parseUnits(args.appId, 0);
    const appVersion = utils.parseUnits(args.appVersion, 0);

    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'unPermitAppVersion',
      [pkpTokenId, appId, appVersion],
      overrides,
    );

    const tx = await contract.unPermitAppVersion(pkpTokenId, appId, appVersion, {
      ...adjustedOverrides,
    });
    await tx.wait();

    return {
      txHash: tx.hash,
      success: true,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to UnPermit App: ${decodedError}`);
  }
}

/**
 * Sets tool policy parameters for a specific app version
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing pkpTokenId, appId, appVersion, and policyParams in nested object format
 * @param overrides - Optional override params for the transaction call like manual gas limit
 * @returns The transaction hash and a success flag
 */
export async function setToolPolicyParameters({
  signer,
  args,
  overrides,
}: SetToolPolicyParametersOptions): Promise<{ txHash: string; success: boolean }> {
  const contract = createContract(signer);

  try {
    const pkpTokenId = utils.parseUnits(args.pkpTokenId, 0);
    const appId = utils.parseUnits(args.appId, 0);
    const appVersion = utils.parseUnits(args.appVersion, 0);

    // Convert nested policy parameters to flattened format
    const flattenedParams = encodePermissionDataForChain({ nestedParams: args.policyParams });

    const adjustedOverrides = await gasAdjustedOverrides(
      contract,
      'setToolPolicyParameters',
      [
        pkpTokenId,
        appId,
        appVersion,
        flattenedParams.toolIpfsCids,
        flattenedParams.policyIpfsCids,
        flattenedParams.policyParameterValues,
      ],
      overrides,
    );

    const tx = await contract.setToolPolicyParameters(
      pkpTokenId,
      appId,
      appVersion,
      flattenedParams.toolIpfsCids,
      flattenedParams.policyIpfsCids,
      flattenedParams.policyParameterValues,
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
    throw new Error(`Failed to Set Tool Policy Parameters: ${decodedError}`);
  }
}
