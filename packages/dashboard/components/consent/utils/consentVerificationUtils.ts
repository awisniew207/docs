import { getUserViewRegistryContract } from './contracts';
import { IPFS_POLICIES_THAT_NEED_SIGNING } from '@/app/config/policyConstants';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { SELECTED_LIT_NETWORK } from './lit';
import bs58 from 'bs58';
import { LIT_RPC } from '@lit-protocol/constants';
import { ethers } from 'ethers';

/**
 * Converts a hex-encoded IPFS CID to base58 format
 * @param hexCid Hex-encoded IPFS CID
 * @returns Base58-encoded IPFS CID or the original string if conversion fails
 */
const hexToBase58 = (hexCid: string): string => {
  try {
    const bytes = Buffer.from(hexCid.substring(2), 'hex');
    return bs58.encode(bytes);
  } catch (error) {
    console.error('Error converting hex to base58:', error);
    return hexCid;
  }
};

/**
 * Checks if all required actions are permitted for a PKP
 * @param agentPKPTokenId Token ID of the agent PKP
 * @param toolIpfsCids Array of tool IPFS CIDs to check
 * @param policyIpfsCids Array of policy IPFS CIDs to check
 * @param statusCallback Optional callback for status updates
 * @returns An array of missing tools/policies, empty if all required actions are permitted
 */
export const checkRequiredPermittedActions = async (
  agentPKPTokenId: string,
  toolIpfsCids: string[],
  policyIpfsCids: string[],
  statusCallback?: (message: string, type: 'info' | 'warning' | 'success' | 'error') => void
) => {
  let missingTools: string[] = [];
  
  try {
    console.log('Starting checkRequiredPermittedActions for PKP:', agentPKPTokenId);
    console.log('Tools to check:', toolIpfsCids);
    console.log('Policies to check:', policyIpfsCids);
    
    const policiesToCheck = policyIpfsCids.filter(cid => 
      cid && IPFS_POLICIES_THAT_NEED_SIGNING[cid]
    );
    
    console.log('Filtered policies that need signing:', policiesToCheck);
    
    const litContracts = new LitContracts({
      network: SELECTED_LIT_NETWORK,
      signer: new ethers.Wallet(ethers.Wallet.createRandom().privateKey, new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE))
    });
    
    try {
      await litContracts.connect();

      const permittedActions = await litContracts.pkpPermissionsContractUtils.read.getPermittedActions(
        agentPKPTokenId
      );

      const permittedActionSet = new Set(
        permittedActions
          .map((cid: string) => {
            const base58Cid = cid.startsWith('0x') ? hexToBase58(cid) : cid;
            return base58Cid;
          })
          .filter(Boolean)
      );

      for (const toolIpfsCid of toolIpfsCids) {
        if (toolIpfsCid && !permittedActionSet.has(toolIpfsCid)) {
          console.warn(`Tool IPFS CID not found in permitted actions: ${toolIpfsCid}`);
          missingTools.push(toolIpfsCid);
        }
      }
      
      for (const policyIpfsCid of policiesToCheck) {
        if (!permittedActionSet.has(policyIpfsCid)) {
          console.warn(`Required policy IPFS CID not found in permitted actions: ${policyIpfsCid} (${IPFS_POLICIES_THAT_NEED_SIGNING[policyIpfsCid].description})`);
          missingTools.push(policyIpfsCid);
        }
      }
    } catch (connectionError) {
      console.error('Error connecting to Lit Contracts or fetching permitted actions:', connectionError);
      return [];
    }
    
    if (missingTools.length > 0) {
      statusCallback?.(`Error: Found ${missingTools.length} tools without permitted actions. This indicates a transaction failure.`, 'error');
    }
  } catch (err) {
    console.error('Error checking permitted actions:', err);
    return [];
  }
  
  return missingTools;
};

/**
 * Checks if an app is already permitted for a PKP
 * @param agentPKPTokenId Token ID of the agent PKP
 * @param appId ID of the app to check
 * @param statusCallback Optional callback for status updates
 * @returns Object with permission status and version if permitted
 */
export const checkAppPermissionStatus = async (
  agentPKPTokenId: string,
  appId: string | number,
  statusCallback?: (message: string, type: 'info' | 'warning' | 'success' | 'error') => void
) => {
  if (!agentPKPTokenId || !appId) {
    console.error('Missing required data for permission check');
    return { isPermitted: false, permittedVersion: null };
  }

  statusCallback?.('Checking if app version is already permitted...', 'info');

  try {
    const userViewContract = getUserViewRegistryContract();
    const appIdNum = Number(appId);
    const currentPermittedVersion = await userViewContract.getPermittedAppVersionForPkp(
      agentPKPTokenId,
      appIdNum,
    );
    const versionNumber = currentPermittedVersion.toNumber();
    return { isPermitted: true, permittedVersion: versionNumber };
  } catch (e) {
    console.error('Error checking for permitted apps:', e);
    return { isPermitted: false, permittedVersion: null };
  }
};

/**
 * Verifies that a permission grant was successful by checking the permitted version
 * @param agentPKPTokenId Token ID of the agent PKP
 * @param appId ID of the app to check
 * @param expectedVersion The version number that should be permitted
 * @param statusCallback Optional callback for status updates
 * @returns The verified version number if successful, null otherwise
 */
export const verifyPermissionGrant = async (
  agentPKPTokenId: string,
  appId: string | number,
  expectedVersion: number,
  statusCallback?: (message: string, type: 'info' | 'warning' | 'success' | 'error') => void
) => {
  if (!agentPKPTokenId || !appId || expectedVersion === undefined) {
    console.error('Missing required data for verification');
    return null;
  }

  try {
    statusCallback?.('Verifying permission grant...', 'info');

    const userViewContract = getUserViewRegistryContract();
    const verifiedVersion = await userViewContract.getPermittedAppVersionForPkp(
      agentPKPTokenId,
      Number(appId),
    );

    const verifiedVersionNum = verifiedVersion.toNumber();

    if (verifiedVersionNum !== expectedVersion) {
      console.error(
        `VERSION MISMATCH: Expected version ${expectedVersion} but found ${verifiedVersionNum}`,
      );
      statusCallback?.('Version verification failed - unexpected version number', 'warning');
      return verifiedVersionNum;
    } else {
      return verifiedVersionNum;
    }
  } catch (verifyError) {
    console.error('Error verifying permitted version after update:', verifyError);
    statusCallback?.('Could not verify permission grant', 'warning');
    return null;
  }
}; 