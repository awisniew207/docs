import { IRelayPKP } from '@lit-protocol/types';
import { ethers } from 'ethers';
import { getPkpNftContract } from './get-pkp-nft-contract';
import { SELECTED_LIT_NETWORK } from './lit';
import { readOnlySigner } from '../developer-dashboard/readOnlySigner';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';

export type AgentAppPermission = {
  appId: number;
  pkp: IRelayPKP;
};

/**
 * Get Agent PKPs for a user address
 *
 * Finds all Agent PKPs owned by the user that are different from their current PKP.
 * Returns permitted agent PKPs as a flat array of app-PKP pairs.
 *
 * @param userAddress The ETH address of the user's current PKP
 * @returns Promise<AgentAppPermission[]> Array of permitted agent PKPs
 * @throws Error if there's an issue with the contract calls
 */
export async function getAgentPKPs(userAddress: string): Promise<AgentAppPermission[]> {
  try {
    const pkpNftContract = getPkpNftContract(SELECTED_LIT_NETWORK);

    const balance = await pkpNftContract.balanceOf(userAddress);
    if (balance.toNumber() === 0) {
      return [];
    }

    // Get all token IDs in parallel first
    const tokenIds = await Promise.all(
      Array.from({ length: balance.toNumber() }, (_, i) =>
        pkpNftContract.tokenOfOwnerByIndex(userAddress, i),
      ),
    );

    // Then get all PKP data in parallel
    const pkpDataPromises = tokenIds.map(async (tokenId) => {
      const [publicKey] = await Promise.all([pkpNftContract.getPubkey(tokenId)]);
      const ethAddress = ethers.utils.computeAddress(publicKey);

      return {
        tokenId: tokenId.toString(),
        publicKey,
        ethAddress,
      };
    });

    const allPKPs = await Promise.all(pkpDataPromises);

    // Filter out PKPs where the ethAddress matches the userAddress (userPKP)
    const agentPKPs = allPKPs.filter(
      (pkp) => pkp.ethAddress.toLowerCase() !== userAddress.toLowerCase(),
    );

    // For each agent PKP, fetch its appIds and categorize them
    const pkpPermissionPromises = agentPKPs.map(async (pkp) => {
      const client = getClient({ signer: readOnlySigner });
      const appIds = await client.getAllPermittedAppIdsForPkp({
        pkpEthAddress: pkp.ethAddress,
        offset: '0',
      });

      return { pkp, appIds };
    });

    const results = await Promise.all(pkpPermissionPromises);

    const permitted: AgentAppPermission[] = [];
    let unpermittedAgentPKP: IRelayPKP | null = null;

    for (const result of results) {
      const { pkp, appIds } = result;

      if (appIds.length > 0) {
        // PKP has permitted apps - add each app-PKP pair
        for (const appId of appIds) {
          permitted.push({ appId, pkp });
        }
      } else {
        // Store the first unpermitted agent PKP we find
        if (!unpermittedAgentPKP) {
          unpermittedAgentPKP = pkp;
        }
      }
    }

    // If no permitted PKPs found but we have an unpermitted agent PKP, return it with appId -1
    if (permitted.length === 0 && unpermittedAgentPKP) {
      permitted.push({ appId: -1, pkp: unpermittedAgentPKP });
    }

    console.log('[getAgentPKPs] Final result:', {
      permittedCount: permitted.length,
      permitted: permitted,
      hadUnpermittedFallback: permitted.length === 1 && permitted[0].appId === -1,
    });

    return permitted;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Failed to get Agent PKPs: ${error}`);
    }
  }
}

/**
 * Get the Agent PKP for a specific app ID
 *
 * @param agentPKPs Result from getAgentPKPs
 * @param appId The app ID to get the PKP for
 * @returns The PKP for the app, or null if not found
 */
export function getAgentPKPForApp(
  agentPKPs: AgentAppPermission[],
  appId: number,
): IRelayPKP | null {
  // Check if there are PKPs for this app
  const pkpForApp = agentPKPs.find((p) => p.appId === appId);

  if (pkpForApp) {
    console.log(
      `[getAgentPKPForApp] Found specific PKP for appId ${appId}:`,
      pkpForApp.pkp.ethAddress,
    );
    return pkpForApp.pkp;
  }

  console.log(`[getAgentPKPForApp] No PKP found for appId ${appId}`);
  return null;
}
