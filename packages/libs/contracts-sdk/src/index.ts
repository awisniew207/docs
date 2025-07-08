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

  /**
   * Register a new version of an existing application
   * @param _appId - appId from the Registry backend for which to register a new version
   * @param versionTools - Object containing Tools & its Policies
   * @returns The transaction hash and the new app version incremented on-chain. If for some reason the event is not found after a successful transaction, it will return -1.
   */
  async registerNextVersion(
    _appId: string,
    versionTools: AppVersionTools,
  ): Promise<{ txHash: string; newAppVersion: string }> {
    try {
      const appId = utils.parseUnits(_appId, 0);

      const estimatedGas = await this.contract.estimateGas.registerNextAppVersion(
        appId,
        versionTools,
      );
      const gasLimit = Math.ceil(Number(estimatedGas) * 1.2);

      const tx = await this.contract.registerNextAppVersion(appId, versionTools, {
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
      throw new Error(`Failed to Register Next Version: ${decodedError}`);
    }
  }

  /**
   * Permits an app version for an Agent Wallet PKP token and optionally sets tool policy parameters
   * @param _pkpTokenId - The token ID of the Agent Wallet PKP to permit the app version for. Note: The client should be the User PKP that owns the Agent Wallet PKP: _pkpTokenId
   * @param _appId - The appId to permit
   * @param _appVersion - The version of the app to permit
   * @param permissionData - Object containing tool IPFS CIDs, policy IPFS CIDs, and policy parameter values
   * @returns The transaction hash. If for some reason the event is not found after a successful transaction, it will return null for the event data.
   */
  async permitApp(
    _pkpTokenId: string,
    _appId: string,
    _appVersion: string,
    permissionData: AppPermissionData,
  ): Promise<{ txHash: string; success: boolean }> {
    try {
      const pkpTokenId = utils.parseUnits(_pkpTokenId, 0);
      const appId = utils.parseUnits(_appId, 0);
      const appVersion = utils.parseUnits(_appVersion, 0);

      const estimatedGas = await this.contract.estimateGas.permitAppVersion(
        pkpTokenId,
        appId,
        appVersion,
        permissionData.toolIpfsCids,
        permissionData.policyIpfsCids,
        permissionData.policyParameterValues,
      );
      const gasLimit = Math.ceil(Number(estimatedGas) * 1.2);

      const tx = await this.contract.permitAppVersion(
        pkpTokenId,
        appId,
        appVersion,
        permissionData.toolIpfsCids,
        permissionData.policyIpfsCids,
        permissionData.policyParameterValues,
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
      const decodedError = decodeContractError(error, this.contract);
      throw new Error(`Failed to Permit App: ${decodedError}`);
    }
  }
}
