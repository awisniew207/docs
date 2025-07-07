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

  async registerApp(
    appId: string | number,
    delegatees: string[],
    versionTools: AppVersionTools,
  ): Promise<{ txHash: string; newAppVersion: string }> {
    try {
      const appIdBN = utils.parseUnits(appId.toString(), 0);

      const estimatedGas = await this.contract.estimateGas.registerApp(
        appIdBN,
        delegatees,
        versionTools,
      );
      const gasLimit = Math.ceil(Number(estimatedGas) * 1.2);
      console.log(`Estimated gas: ${estimatedGas}, Using gas limit: ${gasLimit}`);

      const tx = await this.contract.registerApp(appIdBN, delegatees, versionTools, {
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
        ? this.contract.interface.parseLog(event)?.args.appVersion.toString() || '0'
        : '0';

      return {
        txHash: tx.hash,
        newAppVersion,
      };
    } catch (error: unknown) {
      const decodedError = decodeContractError(error, this.contract);
      throw new Error(`Failed to register app: ${decodedError}`);
    }
  }
}
