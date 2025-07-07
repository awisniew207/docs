import { Signer, Contract, utils } from 'ethers';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';

const appFacetAbi = require('../abis/VincentAppFacet.abi.json');
const appViewFacetAbi = require('../abis/VincentAppViewFacet.abi.json');
const userFacetAbi = require('../abis/VincentUserFacet.abi.json');
const userViewFacetAbi = require('../abis/VincentUserViewFacet.abi.json');

export interface AppVersionTools {
  toolIpfsCids: string[];
  toolPolicies: string[][];
}

// Union type for compatible signers
export type CompatibleSigner = Signer | PKPEthersWallet;

export class VincentContracts {
  private contract: Contract;
  signer: CompatibleSigner;

  constructor(_signer: CompatibleSigner) {
    this.signer = _signer;

    const combinedAbi = [...appFacetAbi, ...appViewFacetAbi, ...userFacetAbi, ...userViewFacetAbi];

    // Create contract with the signer
    // PKPEthersWallet works with ethers contracts despite type differences
    // as evidenced by its usage throughout the codebase
    this.contract = new Contract(
      '0xa1979393bbe7D59dfFBEB38fE5eCf9BDdFE6f4aD', // TODO!: Pull from the ABI
      combinedAbi,
      _signer as any, // Type assertion to bypass type incompatibilities
    );
  }

  // TODO!: Move this to a utils file
  // TODO!: Simplify and generalize error handling
  private decodeContractError(error: any): string {
    console.error('Decoding contract error:', error);
    try {
      // Check if it's a contract revert error
      if (error.code === 'CALL_EXCEPTION' || error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        // Try to decode the error data
        if (error.data) {
          try {
            const decodedError = this.contract.interface.parseError(error.data);
            if (decodedError) {
              // Format the arguments nicely
              const formattedArgs = decodedError.args.map((arg: any) => {
                if (typeof arg === 'bigint') {
                  return arg.toString();
                }
                return arg;
              });
              return `Contract Error: ${decodedError.name} - ${JSON.stringify(formattedArgs)}`;
            }
          } catch (decodeError) {
            // If we can't decode the specific error, try to get the reason
            if (error.reason) {
              return `Contract Error: ${error.reason}`;
            }
          }
        }

        // If no data but has reason
        if (error.reason) {
          return `Contract Error: ${error.reason}`;
        }
      }

      // Check if it's a transaction revert
      if (error.transaction) {
        try {
          const decodedError = this.contract.interface.parseError(error.data);
          if (decodedError) {
            const formattedArgs = decodedError.args.map((arg: any) => {
              if (typeof arg === 'bigint') {
                return arg.toString();
              }
              return arg;
            });
            return `Transaction Error: ${decodedError.name} - ${JSON.stringify(formattedArgs)}`;
          }
        } catch (decodeError) {
          // Fallback to error message
        }
      }

      // Check if it's a gas estimation error
      if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        if (error.error && error.error.data) {
          try {
            const decodedError = this.contract.interface.parseError(error.error.data);
            if (decodedError) {
              const formattedArgs = decodedError.args.map((arg: any) => {
                if (typeof arg === 'bigint') {
                  return arg.toString();
                }
                return arg;
              });
              return `Gas Estimation Error: ${decodedError.name} - ${JSON.stringify(formattedArgs)}`;
            }
          } catch (decodeError) {
            return `Gas Estimation Error: ${error.error.message || error.message}`;
          }
        }
      }

      // Try to extract errorArgs if available (like in the example you showed)
      if (error.errorArgs && Array.isArray(error.errorArgs)) {
        return `Contract Error: ${error.errorSignature || 'Unknown'} - ${JSON.stringify(error.errorArgs)}`;
      }

      // Return original error message if we can't decode
      return error.message || 'Unknown contract error';
    } catch (decodeError) {
      // If all decoding fails, return the original error
      return error.message || 'Unknown contract error';
    }
  }

  async registerApp(
    appId: string | number,
    delegatees: string[],
    versionTools: AppVersionTools,
  ): Promise<{ txHash: string; newAppVersion: string }> {
    try {
      const appIdBN = utils.parseUnits(appId.toString(), 0);

      // Estimate gas and add 20% buffer
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
      // const tx = await this.contract['registerApp'](appIdBN, delegatees, versionTools);
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
      // Decode the contract error
      const decodedError = this.decodeContractError(error);
      throw new Error(`Failed to register app: ${decodedError}`);
    }
  }
}
