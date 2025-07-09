import { utils } from 'ethers';
import { decodeContractError, createContract, gasAdjustedOverrides } from '../utils';
import { PermitAppOptions } from '../types/User';

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
