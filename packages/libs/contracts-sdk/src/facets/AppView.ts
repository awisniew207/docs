import { utils } from 'ethers';
import { decodeContractError, createContract } from '../utils';
import { GetAppByIdOptions, App } from '../types/App';

/**
 * Get detailed information about an app by its ID
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing appId
 * @returns Detailed view of the app containing its metadata and relationships
 */
export async function getAppById({ signer, args }: GetAppByIdOptions): Promise<App> {
  const contract = createContract(signer);

  try {
    const appId = utils.parseUnits(args.appId, 0);

    const app = await contract.getAppById(appId);

    return {
      id: app.id.toString(),
      isDeleted: app.isDeleted,
      manager: app.manager,
      latestVersion: app.latestVersion.toString(),
      delegatees: app.delegatees,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get App By ID: ${decodedError}`);
  }
}
