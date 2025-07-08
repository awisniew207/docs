import { Signer, Contract, utils } from 'ethers';

import { VINCENT_DIAMOND_CONTRACT_ADDRESS, COMBINED_ABI } from './constants';
import { decodeContractError } from './utils';

export interface AppVersionTools {
  toolIpfsCids: string[];
  toolPolicies: string[][];
}

export class VincentContracts {
  private contract: Contract;

  constructor(_signer: Signer) {
    this.contract = new Contract(VINCENT_DIAMOND_CONTRACT_ADDRESS, COMBINED_ABI, _signer);
  }

  /**
   * Register a new app version
   * @param _appId - appId from the Registry backend to be registered on-chain
   * @param delegatees - Array of addresses to be added as delegatees generated on the Developer Dashboard
   * @param versionTools - Object containing Tools & its Policies
   * @returns The transaction hash and the new app version incremented on-chain. If for some reason the event is not found after a successful transaction, it will return -1.
   */
  async registerApp(
    _appId: string,
    delegatees: string[],
    versionTools: AppVersionTools,
  ): Promise<{ txHash: string; newAppVersion: string }> {
    try {
      const appId = utils.parseUnits(_appId, 0);

      const estimatedGas = await this.contract.estimateGas.registerApp(
        appId,
        delegatees,
        versionTools,
      );
      const gasLimit = Math.ceil(Number(estimatedGas) * 1.2);

      const tx = await this.contract.registerApp(appId, delegatees, versionTools, {
        gasLimit,
      });
      const receipt = await tx.wait();

      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed?.name === 'NewAppVersionRegistered';
        } catch {
          return false;
        }
      });

      const newAppVersion = event
        ? this.contract.interface.parseLog(event)?.args.appVersion.toString() || '-1'
        : '-1';

      return {
        txHash: tx.hash,
        newAppVersion,
      };
    } catch (error: unknown) {
      const decodedError = decodeContractError(error, this.contract);
      throw new Error(`Failed to Register App: ${decodedError}`);
    }
  }
}
