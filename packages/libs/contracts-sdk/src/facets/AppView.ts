import type { BigNumber } from 'ethers';

import type {
  App,
  AppVersion,
  AppWithVersions,
  GetAppByDelegateeOptions,
  GetAppByIdOptions,
  GetAppsByManagerOptions,
  GetAppVersionOptions,
  GetDelegatedPkpEthAddressesOptions,
} from '../types/App';
import type { AppChain, AppVersionChain, AppWithVersionsChain } from '../types/internal';

import { DEFAULT_PAGE_SIZE } from '../constants';
import { createContract, decodeContractError } from '../utils';
import { getPkpEthAddress } from '../utils/pkpInfo';

/**
 * Get detailed information about an app by its ID
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing appId
 * @returns Detailed view of the app containing its metadata and relationships, or null if the app is not registered
 */
export async function getAppById({
  signer,
  args: { appId },
}: GetAppByIdOptions): Promise<App | null> {
  const contract = createContract(signer);

  try {
    const chainApp: AppChain = await contract.getAppById(appId);

    const { delegatees, ...app } = chainApp;
    return {
      ...app,
      id: app.id.toNumber(),
      latestVersion: app.latestVersion.toNumber(),
      delegateeAddresses: delegatees,
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);

    // Check if the error is due to AppNotRegistered
    if (decodedError.includes('AppNotRegistered')) {
      return null;
    }

    throw new Error(`Failed to Get App By ID: ${decodedError}`);
  }
}

/**
 * Get detailed information about a specific version of an app
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing appId and version
 * @returns Object containing basic app information and version-specific information including tools and policies, or null if the app version is not registered
 */
export async function getAppVersion({
  signer,
  args: { appId, version },
}: GetAppVersionOptions): Promise<{ appVersion: AppVersion } | null> {
  const contract = createContract(signer);

  try {
    const [, appVersion]: [never, AppVersionChain] = await contract.getAppVersion(appId, version);

    return {
      appVersion: { ...appVersion, version: appVersion.version.toNumber() },
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);

    // Check if the error is due to AppVersionNotRegistered
    if (
      decodedError.includes('AppVersionNotRegistered') ||
      decodedError.includes('AppNotRegistered')
    ) {
      return null;
    }

    throw new Error(`Failed to Get App Version: ${decodedError}`);
  }
}

/**
 * Get all apps managed by a specific address with all their versions
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing manager address
 * @returns Array of apps with all their versions managed by the specified address
 */
export async function getAppsByManagerAddress({
  signer,
  args: { managerAddress },
}: GetAppsByManagerOptions): Promise<AppWithVersions[]> {
  const contract = createContract(signer);

  try {
    const appsWithVersions: AppWithVersionsChain[] =
      await contract.getAppsByManager(managerAddress);

    return appsWithVersions.map(({ app: appChain, versions }) => {
      const { delegatees, ...app } = appChain;
      return {
        app: {
          ...app,
          delegateeAddresses: delegatees,
          id: app.id.toNumber(),
          latestVersion: app.latestVersion.toNumber(),
        },
        versions: versions.map(({ enabled, tools, version: appVersion }) => ({
          version: appVersion.toNumber(),
          enabled: enabled,
          tools,
        })),
      };
    });
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);

    // Check if the error is due to NoAppsFoundForManager or ZeroAddressNotAllowed
    if (decodedError.includes('NoAppsFoundForManager')) {
      return [];
    }

    throw new Error(`Failed to Get Apps By Manager: ${decodedError}`);
  }
}

/**
 * Get the app associated with a delegatee address
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing delegatee address
 * @returns Detailed view of the app the delegatee is associated with
 */
export async function getAppByDelegateeAddress({
  signer,
  args: { delegateeAddress },
}: GetAppByDelegateeOptions): Promise<App | null> {
  const contract = createContract(signer);

  try {
    const chainApp: AppChain = await contract.getAppByDelegatee(delegateeAddress);

    const { delegatees, ...app } = chainApp;
    return {
      ...app,
      delegateeAddresses: delegatees,
      id: app.id.toNumber(),
      latestVersion: app.latestVersion.toNumber(),
    };
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);

    // Check if the error is due to DelegateeNotRegistered or ZeroAddressNotAllowed
    if (decodedError.includes('DelegateeNotRegistered')) {
      return null;
    }

    throw new Error(`Failed to Get App By Delegatee: ${decodedError}`);
  }
}

/**
 * Get delegated agent PKP token IDs for a specific app version with pagination
 * Returns the first 500 PKP eth addresses.
 * Provide `pageOpts.offset` to fetch more than the initial 500
 * Provide `pageOpts.limit` to fetch more or less than 500-at-a-time
 *
 * @param signer - The ethers signer to use for the transaction. Could be a standard Ethers Signer or a PKPEthersWallet
 * @param args - Object containing appId, version, and pageOpts for offset and an optional limit
 * @returns Array of delegated agent PKP token IDs
 */
export async function getDelegatedPkpEthAddresses({
  signer,
  args: { appId, version, pageOpts },
}: GetDelegatedPkpEthAddressesOptions): Promise<string[]> {
  const contract = createContract(signer);

  try {
    const delegatedAgentPkpTokenIds: BigNumber[] = await contract.getDelegatedAgentPkpTokenIds(
      appId,
      version,
      pageOpts?.offset || 0,
      pageOpts?.limit || DEFAULT_PAGE_SIZE,
    );

    const delegatedAgentPkpEthAddresses: string[] = [];
    for (const tokenId of delegatedAgentPkpTokenIds) {
      // TODO: add paginated fetching to the pkp router contract (or try some concurrency here)
      const ethAddress = await getPkpEthAddress({ tokenId, signer });
      delegatedAgentPkpEthAddresses.push(ethAddress);
    }

    return delegatedAgentPkpEthAddresses;
  } catch (error: unknown) {
    const decodedError = decodeContractError(error, contract);
    throw new Error(`Failed to Get Delegated Agent PKP Token IDs: ${decodedError}`);
  }
}
