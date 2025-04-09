import * as ethers from 'ethers';
import { getUserViewRegistryContract } from './contracts';

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
  console.log('CHECKING IF APP VERSION IS ALREADY PERMITTED...');
  
  try {
    const userViewContract = getUserViewRegistryContract();
    const permittedAppIds = await userViewContract.getAllPermittedAppIdsForPkp(agentPKPTokenId);

    const appIdNum = Number(appId);
    const isAppPermitted = permittedAppIds.some(
      (id: ethers.BigNumber) => id.toNumber() === appIdNum,
    );

    if (isAppPermitted) {
      try {
        const currentPermittedVersion = await userViewContract.getPermittedAppVersionForPkp(
          agentPKPTokenId,
          appIdNum,
        );

        const versionNumber = currentPermittedVersion.toNumber();
        console.log(`FOUND PERMITTED VERSION: v${versionNumber}`);
        
        return { 
          isPermitted: true, 
          permittedVersion: versionNumber 
        };
      } catch (e) {
        console.error('Error checking permitted version:', e);
        return { isPermitted: true, permittedVersion: null };
      }
    } else {
      console.log('No currently permitted version found for this app');
      return { isPermitted: false, permittedVersion: null };
    }
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
    console.log('VERIFYING PERMIT: Checking if new version was properly registered...');
    
    // Small delay to ensure the blockchain state has been updated
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const userViewContract = getUserViewRegistryContract();
    const verifiedVersion = await userViewContract.getPermittedAppVersionForPkp(
      agentPKPTokenId,
      Number(appId),
    );

    const verifiedVersionNum = verifiedVersion.toNumber();
    console.log(`VERIFICATION RESULT: Current permitted version is now ${verifiedVersionNum}`);

    if (verifiedVersionNum !== expectedVersion) {
      console.error(
        `VERSION MISMATCH: Expected version ${expectedVersion} but found ${verifiedVersionNum}`,
      );
      statusCallback?.('Version verification failed - unexpected version number', 'warning');
      return verifiedVersionNum;
    } else {
      console.log('PERMIT SUCCESS: Version was successfully updated');
      return verifiedVersionNum;
    }
  } catch (verifyError) {
    console.error('Error verifying permitted version after update:', verifyError);
    statusCallback?.('Could not verify permission grant', 'warning');
    return null;
  }
}; 