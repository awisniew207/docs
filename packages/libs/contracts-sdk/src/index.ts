import { Signer, Contract, ethers } from 'ethers';

const appFacetAbi = require('../abis/VincentAppFacet.abi.json');
const appViewFacetAbi = require('../abis/VincentAppViewFacet.abi.json');
const userFacetAbi = require('../abis/VincentUserFacet.abi.json');
const userViewFacetAbi = require('../abis/VincentUserViewFacet.abi.json');

export interface AppVersionTools {
  toolIpfsCids: string[];
  toolPolicies: string[][];
}

export interface VincentSDKConfig {
  contractAddress: string;
  provider: ethers.Provider;
  signer?: Signer;
}

export class VincentContracts {
  private contract: Contract;
  private signer: Signer;

  constructor(_signer: Signer) {
    this.signer = _signer;

    const combinedAbi = [...appFacetAbi, ...appViewFacetAbi, ...userFacetAbi, ...userViewFacetAbi];

    this.contract = new Contract(
      '0xa1979393bbe7D59dfFBEB38fE5eCf9BDdFE6f4aD', // TODO: Pull from the ABI
      combinedAbi,
      this.signer,
    );
  }

  async registerApp(
    appId: string | number,
    delegatees: string[],
    versionTools: AppVersionTools,
  ): Promise<{ txHash: string; newAppVersion: string }> {
    try {
      const appIdBN = ethers.parseUnits(appId.toString(), 0);

      const tx = await this.contract.registerApp(appIdBN, delegatees, versionTools);
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to register app: ${errorMessage}`);
    }
  }
}
