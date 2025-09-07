import { IRelayPKP } from '@lit-protocol/types';
import { ethers } from 'ethers';
import { getPkpNftContract } from './get-pkp-nft-contract';
import { SELECTED_LIT_NETWORK } from './lit';
import { readOnlySigner } from '../developer-dashboard/readOnlySigner';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';

export type AgentAppPermission = {
  appId: number;
  pkp: IRelayPKP;
  permittedVersion: number | null;
};

export type AgentPkpsResult = {
  permitted: AgentAppPermission[];
  unpermitted: AgentAppPermission[];
};

/**
 * Get Agent PKPs for a user address
 *
 * Finds all Agent PKPs owned by the user that are different from their current PKP.
 * Returns both currently permitted and previously permitted (unpermitted) agent PKPs.
 *
 * @param userAddress The ETH address of the user's current PKP
 * @returns Promise<AgentPkpsResult> Object containing permitted and unpermitted agent PKPs
 * @throws Error if there's an issue with the contract calls
 */
export async function getAgentPkps(userAddress: string): Promise<AgentPkpsResult> {
  try {
    const pkpNftContract = getPkpNftContract(SELECTED_LIT_NETWORK);

    const balance = await pkpNftContract.balanceOf(userAddress);
    if (balance.toNumber() === 0) {
      return { permitted: [], unpermitted: [] };
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

    // Fetch both permitted and unpermitted apps for all agent PKPs
    const client = getClient({ signer: readOnlySigner });
    const pkpEthAddresses = agentPKPs.map((pkp) => pkp.ethAddress);

    const [permittedAppsArray, unpermittedAppsArray] = await Promise.all([
      client.getPermittedAppsForPkps({
        pkpEthAddresses,
        offset: '0',
      }),
      client.getUnpermittedAppsForPkps({
        pkpEthAddresses,
        offset: '0',
      }),
    ]);

    // Convert the permitted apps results to our format
    const pkpToPermittedAppsMap = new Map<
      string,
      Array<{ appId: number; version: number | null }>
    >();
    for (const pkpPermittedApps of permittedAppsArray) {
      // Find the PKP by matching tokenId
      const pkp = agentPKPs.find((p) => p.tokenId === pkpPermittedApps.pkpTokenId);
      if (pkp) {
        const appsWithVersions = pkpPermittedApps.permittedApps.map((app) => ({
          appId: app.appId,
          version: app.version,
        }));
        pkpToPermittedAppsMap.set(pkp.ethAddress, appsWithVersions);
      }
    }

    // Convert the unpermitted apps results to our format
    const pkpToUnpermittedAppsMap = new Map<
      string,
      Array<{ appId: number; previousPermittedVersion: number | null }>
    >();
    for (const pkpUnpermittedApps of unpermittedAppsArray) {
      // Find the PKP by matching tokenId
      const pkp = agentPKPs.find((p) => p.tokenId === pkpUnpermittedApps.pkpTokenId);
      if (pkp) {
        const appsWithVersions = pkpUnpermittedApps.unpermittedApps.map((app) => ({
          appId: app.appId,
          previousPermittedVersion: app.previousPermittedVersion,
        }));
        pkpToUnpermittedAppsMap.set(pkp.ethAddress, appsWithVersions);
      }
    }

    const permitted: AgentAppPermission[] = [];
    const unpermitted: AgentAppPermission[] = [];
    let unpermittedAgentPKP: IRelayPKP | null = null;

    for (const pkp of agentPKPs) {
      const permittedApps = pkpToPermittedAppsMap.get(pkp.ethAddress) || [];
      const unpermittedApps = pkpToUnpermittedAppsMap.get(pkp.ethAddress) || [];

      // Add permitted apps
      for (const app of permittedApps) {
        permitted.push({
          appId: app.appId,
          pkp,
          permittedVersion: app.version,
        });
      }

      // Add unpermitted apps (previously permitted)
      for (const app of unpermittedApps) {
        unpermitted.push({
          appId: app.appId,
          pkp,
          permittedVersion: app.previousPermittedVersion,
        });
      }

      // Track PKPs with no apps at all
      if (permittedApps.length === 0 && unpermittedApps.length === 0 && !unpermittedAgentPKP) {
        unpermittedAgentPKP = pkp;
      }
    }

    // If no permitted PKPs found but we have an unpermitted agent PKP, return it with appId -1
    if (permitted.length === 0 && unpermittedAgentPKP) {
      permitted.push({
        appId: -1,
        pkp: unpermittedAgentPKP,
        permittedVersion: null,
      });
    }

    console.log('[getAgentPkps] Final result:', {
      permittedCount: permitted.length,
      unpermittedCount: unpermitted.length,
      permitted: permitted,
      unpermitted: unpermitted,
    });

    return { permitted, unpermitted };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Failed to get Agent PKPs: ${error}`);
    }
  }
}
