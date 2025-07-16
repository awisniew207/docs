import { ethers, type Signer } from 'ethers';

import { getDelegatedAgentPkpTokenIds } from '@lit-protocol/vincent-contracts-sdk';

import { getPkpEthAddress } from './pkp';

async function fetchDelegatedAgentPKPTokenIds({
  appId,
  version,
  signer,
  pageOpts = { offset: '0', limit: '1000' },
}: {
  appId: number;
  version: number;
  signer: Signer;
  pageOpts?: {
    offset: string;
    limit: string;
  };
}) {
  try {
    const { offset, limit } = pageOpts;
    const tokenIds = await getDelegatedAgentPkpTokenIds({
      signer,
      args: {
        appId: appId.toString(),
        version: version.toString(),
        offset,
        limit, // Assuming a reasonable limit for the number of delegated PKPs as a default
      },
    });

    // Convert string token IDs to BigNumber for backward compatibility
    return tokenIds.map((id) => ethers.BigNumber.from(id));
  } catch (error) {
    throw new Error(`Error fetching delegated agent PKP token IDs: ${error}`);
  }
}

async function processWithConcurrency<T, R>(
  items: T[],
  processFn: (item: T) => Promise<R>,
  concurrencyLimit: number
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  // Start initial set of promises
  const workers = Array(concurrencyLimit)
    .fill(null)
    .map(async () => {
      while (index < items.length) {
        const currentIndex = index++;
        if (currentIndex >= items.length) break;

        try {
          const result = await processFn(items[currentIndex]);
          results[currentIndex] = result;
        } catch (error) {
          // Store the error but don't throw until all are done
          results[currentIndex] = error as R;
        }
      }
    });

  await Promise.all(workers);
  return results;
}

/**
 * Retrieves PKP Eth addresses for all delegators of a specific app version
 *
 * This function fetches the delegated agent PKP token IDs for a given app version
 * and then retrieves the PKP Eth address for each token ID. This information
 * can be used to identify and interact with the PKPs that are authorized as agents
 * for the application.
 *
 * The default behaviour of this method is to return the first discovered 1000 PKPs unless `pageOpts` is provided.
 *
 * @param appId - The ID of the Vincent application
 * @param appVersion - The version number of the application
 * @param signer - The ethers signer to use for the transaction
 * @param pageOpts - To fetch more than the first 1000 pkps, you must provide pageOpts w/ explicit offset + limit
 *
 * @returns An array of PKP Eth addresses
 *
 * @example
 * ```typescript
 * const pkpEthAddresses = await getDelegatorsAgentPkpAddresses({ appId: 123, appVersion: 1, signer });
 * console.log(`Found ${pkpEthAddresses.length} delegator PKPs`);
 * console.log(`First PKP eth address: ${pkpEthAddresses[0]}`);
 * ```
 */
export async function getDelegatorsAgentPkpAddresses({
  appId,
  appVersion,
  signer,
  pageOpts,
}: {
  appId: number;
  appVersion: number;
  signer: Signer;
  pageOpts?: { offset: string; limit: string };
}) {
  try {
    const delegators = await fetchDelegatedAgentPKPTokenIds({
      appId: appId,
      version: appVersion,
      signer: signer,
      pageOpts: pageOpts,
    });
    const delegatorsPkpEthAddresses = await processWithConcurrency(delegators, getPkpEthAddress, 5);

    return delegatorsPkpEthAddresses;
  } catch (error) {
    throw new Error(`Error fetching delegators agent PKP info: ${error}`);
  }
}
