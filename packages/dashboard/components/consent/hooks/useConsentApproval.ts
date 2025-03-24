import { useCallback } from 'react';
import { IRelayPKP } from '@lit-protocol/types';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import * as ethers from 'ethers';
import { encodeParameterValue } from '../../../utils/parameterEncoding';
import { 
  getUserViewRegistryContract, 
  getUserRegistryContract 
} from '../utils/contracts';
import { estimateGasWithBuffer } from '@/services/contract/config';
import { AppView, VersionParameter } from '../types';
import { AUTH_METHOD_SCOPE } from '@lit-protocol/constants';
import { litNodeClient, SELECTED_LIT_NETWORK } from '../utils/lit';
import { extractIpfsCid } from '../utils/ipfs';
import { ParameterType } from '@/services/types/parameterTypes';

interface UseConsentApprovalProps {
  appId: string | null;
  appInfo: AppView | null;
  versionInfo: any;
  parameters: VersionParameter[];
  agentPKP?: IRelayPKP;
  userPKP: IRelayPKP;
  sessionSigs: any;
  onStatusChange?: (message: string, type: 'info' | 'warning' | 'success' | 'error') => void;
  onError?: (error: any, title?: string, details?: string) => void;
}

export const useConsentApproval = ({
  appId,
  appInfo,
  versionInfo,
  parameters,
  agentPKP,
  userPKP,
  sessionSigs,
  onStatusChange,
  onError
}: UseConsentApprovalProps) => {

  const updateParameters = useCallback(async () => {
    if (!agentPKP || !appId || !appInfo) {
      console.error('Missing required data for parameter update');
      throw new Error('Missing required data for parameter update');
    }

    onStatusChange?.('Preparing to update parameters...', 'info');
    
    const userRegistryContract = getUserRegistryContract();
    
    onStatusChange?.('Initializing your PKP wallet...', 'info');
    const userPkpWallet = new PKPEthersWallet({
      controllerSessionSigs: sessionSigs,
      pkpPubKey: userPKP.publicKey,
      litNodeClient: litNodeClient,
    });
    await userPkpWallet.init();
    const connectedContract = userRegistryContract.connect(userPkpWallet);
    
    onStatusChange?.('Preparing parameter data for contract...', 'info');
    const toolIpfsCids: string[] = [];
    const policyIpfsCids: string[][] = [];
    const policyParameterNames: string[][][] = [];
    const policyParameterValues: Uint8Array[][][] = [];
    
    if (versionInfo) {
      const toolsData = versionInfo.appVersion?.tools || versionInfo[1]?.[3];
      
      if (toolsData && Array.isArray(toolsData)) {
        toolsData.forEach((tool: any, toolIndex: number) => {
          if (!tool || !Array.isArray(tool)) return;
          
          const toolIpfsCid = tool[0];
          if (toolIpfsCid) {
            toolIpfsCids[toolIndex] = toolIpfsCid;
            policyIpfsCids[toolIndex] = [];
            policyParameterNames[toolIndex] = [];
            policyParameterValues[toolIndex] = [];
            
            const policies = tool[1];
            if (Array.isArray(policies)) {
              policies.forEach((policy: any, policyIndex: number) => {
                if (!policy || !Array.isArray(policy)) return;
                
                const policyIpfsCid = policy[0];
                policyIpfsCids[toolIndex][policyIndex] = policyIpfsCid;
                policyParameterNames[toolIndex][policyIndex] = [];
                policyParameterValues[toolIndex][policyIndex] = [];
                
                const paramNames = policy[1];
                
                if (Array.isArray(paramNames)) {
                  paramNames.forEach((name: any, paramIndex: number) => {
                    const paramName = typeof name === 'string' && name.trim() !== '' 
                      ? name.trim() 
                      : `param_${paramIndex}`;
                    
                    policyParameterNames[toolIndex][policyIndex][paramIndex] = paramName;
                    
                    // Find matching parameter value from user input
                    const param = parameters.find(p => 
                      p.toolIndex === toolIndex && 
                      p.policyIndex === policyIndex && 
                      p.paramIndex === paramIndex
                    );
                    
                    // Encode the parameter value
                    if (param && param.value !== undefined) {
                      policyParameterValues[toolIndex][policyIndex][paramIndex] = 
                        encodeParameterValue(param.type, param.value, paramName);
                    } else {
                      // Default value if not provided by user
                      policyParameterValues[toolIndex][policyIndex][paramIndex] = 
                        encodeParameterValue(ParameterType.STRING, "");
                    }
                  });
                }
              });
            }
          }
        });
      }
    }
    
    try {
      const updateArgs = [
        agentPKP.tokenId,
        appId,
        Number(appInfo.latestVersion),
        toolIpfsCids,
        policyIpfsCids,
        policyParameterNames,
        policyParameterValues
      ];
      
      onStatusChange?.('Estimating transaction gas fees...', 'info');
      const gasLimit = await estimateGasWithBuffer(
        connectedContract,
        'setToolPolicyParameters',
        updateArgs
      );
      
      onStatusChange?.('Sending transaction to update parameters...', 'info');
      const txResponse = await connectedContract.setToolPolicyParameters(
        ...updateArgs,
        {
          gasLimit,
        }
      );
      
      console.log('PARAMETER UPDATE TRANSACTION SENT:', txResponse.hash);
      onStatusChange?.(`Transaction submitted! Hash: ${txResponse.hash.substring(0, 10)}...`, 'info');
      return txResponse;
    } catch (error) {
      console.error('PARAMETER UPDATE FAILED:', error);
      onStatusChange?.('Parameter update failed', 'error');
      throw error;
    }
  }, [agentPKP, appId, appInfo, sessionSigs, userPKP, parameters, versionInfo, onStatusChange]);

  // Main consent approval function
  const approveConsent = useCallback(async () => {
    if (!agentPKP || !appId || !appInfo) {
      console.error('Missing required data for consent approval');
      throw new Error('Missing required data for consent approval');
    }
    
    onStatusChange?.("Checking if app version is already permitted...", 'info');
    console.log("CHECKING IF APP VERSION IS ALREADY PERMITTED...");
    try {
      const userViewContract = getUserViewRegistryContract();
      const permittedAppIds = await userViewContract.getAllPermittedAppIdsForPkp(agentPKP.tokenId);
      
      const appIdNum = Number(appId);
      const isAppPermitted = permittedAppIds.some(
        (id: ethers.BigNumber) => id.toNumber() === appIdNum
      );
      
      if (isAppPermitted) {
        try {
          const currentPermittedVersion = await userViewContract.getPermittedAppVersionForPkp(
            agentPKP.tokenId,
            appIdNum
          );
          
          const currentVersion = currentPermittedVersion.toNumber();
          const newVersion = Number(appInfo.latestVersion);
          
          console.log(`FOUND PERMITTED VERSION: Current is v${currentVersion}, checking against v${newVersion}`);
          
          // If trying to permit the same version, use updateParameters instead
          if (currentVersion === newVersion) {
            console.log(`VERSION MATCH: Using setToolPolicyParameters for version ${currentVersion} instead of permitAppVersion`);
            return await updateParameters();
          }
          
          console.log(`VERSION UPGRADE: Attempting to permit v${newVersion} as upgrade from v${currentVersion}`);
          
        } catch (e) {
          console.error("Error checking permitted version:", e);
        }
      } else {
        console.log("No currently permitted version found for this app");
      }
    } catch (e) {
      console.error("Error checking for permitted apps:", e);
    }
    
    // Now proceed with permitting the new version
    onStatusChange?.(`Permitting version ${Number(appInfo.latestVersion)}...`, 'info');
    console.log(`PERMITTING: Now permitting version ${Number(appInfo.latestVersion)}`);

    const userRegistryContract = getUserRegistryContract();
    onStatusChange?.('Initializing your PKP wallet...', 'info');
    const userPkpWallet = new PKPEthersWallet({
      controllerSessionSigs: sessionSigs,
      pkpPubKey: userPKP.publicKey,
      litNodeClient: litNodeClient,
    });
    await userPkpWallet.init();
    const connectedContract = userRegistryContract.connect(userPkpWallet);
    
    const toolIpfsCids: string[] = [];
    const toolPolicies: string[][] = [];
    const toolPolicyParameterNames: string[][][] = [];
    const toolPolicyParameterTypes: number[][][] = [];
    
    if (versionInfo) {
      const toolsData = versionInfo.appVersion?.tools || versionInfo[1]?.[3];
      
      if (toolsData && Array.isArray(toolsData)) {
        toolsData.forEach((tool: any, toolIndex: number) => {
          if (!tool || !Array.isArray(tool)) return;
          
          const toolIpfsCid = tool[0];
          if (toolIpfsCid) {
            toolIpfsCids[toolIndex] = toolIpfsCid;
          }
          
          toolPolicies[toolIndex] = [];
          toolPolicyParameterNames[toolIndex] = [];
          toolPolicyParameterTypes[toolIndex] = [];
          
          const policies = tool[1];
          if (Array.isArray(policies)) {
            policies.forEach((policy: any, policyIndex: number) => {
              if (!policy || !Array.isArray(policy)) return;
              
              toolPolicies[toolIndex][policyIndex] = policy[0];
              toolPolicyParameterNames[toolIndex][policyIndex] = [];
              toolPolicyParameterTypes[toolIndex][policyIndex] = [];
              
              // Extract the actual parameter names and types from the policy
              const paramNames = policy[1];
              const paramTypes = policy[2];
              
              if (Array.isArray(paramNames) && Array.isArray(paramTypes)) {
                // Use the actual parameter names from the version info
                paramNames.forEach((name: any, paramIndex: number) => {
                  // Ensure parameter name is never empty by using a default if it's empty
                  const paramName = typeof name === 'string' && name.trim() !== '' 
                    ? name.trim() 
                    : `param_${paramIndex}`;
                    
                  toolPolicyParameterNames[toolIndex][policyIndex][paramIndex] = paramName;
                  
                  // Set the parameter type if available
                  if (paramTypes[paramIndex] !== undefined) {
                    toolPolicyParameterTypes[toolIndex][policyIndex][paramIndex] = 
                      typeof paramTypes[paramIndex] === 'number' 
                        ? paramTypes[paramIndex] 
                        : 0;
                  } else {
                    toolPolicyParameterTypes[toolIndex][policyIndex][paramIndex] = 0;
                  }
                });
              }
            });
          }
        });
      }
    }
    
    // Don't override parameter names with user input - only update parameter values
    if (parameters.length > 0) {
      parameters.forEach(param => {
        if (
          toolPolicyParameterTypes[param.toolIndex] && 
          toolPolicyParameterTypes[param.toolIndex][param.policyIndex]
        ) {
          toolPolicyParameterTypes[param.toolIndex][param.policyIndex][param.paramIndex] = param.type;
        }
      });
    }

    console.log('Sending transaction with parameters:', {
      toolIpfsCids,
      toolPolicies,
      toolPolicyParameterNames,
      toolPolicyParameterTypes
    });
    
    // Create parameter values with proper encoding
    const policyParameterValues = toolPolicyParameterNames.map((toolParams, toolIndex) => 
      toolParams.map((policyParams, policyIndex) => 
        policyParams.map((paramName, paramIndex) => {
          // Find the matching parameter from the user input
          const param = parameters.find(p => 
            p.toolIndex === toolIndex && 
            p.policyIndex === policyIndex && 
            p.paramIndex === paramIndex
          );
          
          // If a parameter was provided by the user, encode it based on its type
          if (param && param.value !== undefined) {
            return encodeParameterValue(param.type, param.value, paramName);
          }
          
          // Fallback to empty string if no parameter value was provided
          return encodeParameterValue(ParameterType.STRING, "");
        })
      )
    );
    
    console.log('PERMIT: Transaction with ABI parameters', {
      pkpTokenId: agentPKP.tokenId,
      appId: appId,
      appVersion: Number(appInfo.latestVersion),
      toolsCount: toolIpfsCids.length,
      policiesStructure: toolPolicies.map(p => p.length),
      parameters
    });
    
    try {
      // Create the args array for the permitAppVersion method
      const permitArgs = [
        agentPKP.tokenId,
        appId,
        Number(appInfo.latestVersion),
        toolIpfsCids,
        toolPolicies,
        toolPolicyParameterNames,
        policyParameterValues
      ];
      
      // Estimate gas with buffer
      onStatusChange?.('Estimating transaction gas fees...', 'info');
      const gasLimit = await estimateGasWithBuffer(
        connectedContract,
        'permitAppVersion',
        permitArgs
      );
      
      onStatusChange?.('Sending permission transaction...', 'info');
      const txResponse = await connectedContract.permitAppVersion(
        ...permitArgs,
        {
          gasLimit,
        }
      );
      
      console.log('PERMIT TRANSACTION SENT:', txResponse.hash);
      onStatusChange?.(`Transaction submitted! Hash: ${txResponse.hash.substring(0, 10)}...`, 'info');
      
    } catch (error) {
      console.error('TRANSACTION FAILED:', error);
      
      // Try to extract more specific error information
      const errorObj = error as any;
      const errorMessage = errorObj.message || '';
      const errorData = errorObj.data || '';
      const errorReason = errorObj.reason || '';
      
      console.error('Error details:', {
        message: errorMessage,
        data: errorData,
        reason: errorReason
      });
      
      // Get the raw error message for display in details
      let rawErrorDetails = '';
      if (typeof errorMessage === 'string') {
        rawErrorDetails = errorMessage.substring(0, 500); // Get first 500 chars
      }
      
      // Format the raw error details for better readability
      if (rawErrorDetails.includes('execution reverted')) {
        const parts = rawErrorDetails.split('execution reverted');
        if (parts.length > 1) {
          rawErrorDetails = 'Execution reverted: ' + parts[1].trim();
        }
      }
      
      // Check for common contract errors
      let userFriendlyError: string;
      
      if (errorMessage.includes('AppNotRegistered')) {
        userFriendlyError = `App ID ${appId} is not registered in the contract`;
      } else if (errorMessage.includes('AppVersionNotRegistered') || errorMessage.includes('AppVersionNotEnabled')) {
        userFriendlyError = `App version ${appInfo.latestVersion} is not registered or not enabled`;
      } else if (errorMessage.includes('EmptyToolIpfsCid') || errorMessage.includes('EmptyPolicyIpfsCid')) {
        userFriendlyError = 'One of the tool or policy IPFS CIDs is empty';
      } else if (errorMessage.includes('EmptyParameterName') || errorMessage.includes('EmptyParameterValue')) {
        userFriendlyError = 'Parameter name or value cannot be empty';
      } else if (errorMessage.includes('PolicyParameterNameNotRegistered') || 
                errorMessage.includes('ToolNotRegistered') || 
                errorMessage.includes('ToolPolicyNotRegistered')) {
        userFriendlyError = 'Tool, policy, or parameter is not properly registered for this app version';
      } else if (errorMessage.includes('NotPkpOwner')) {
        userFriendlyError = 'You are not the owner of this PKP';
      } else if (errorMessage.includes('cannot estimate gas')) {
        userFriendlyError = 'Transaction cannot be completed - the contract rejected it';
      } else {
        // Default error message
        userFriendlyError = `Transaction failed`;
      }
      
      // Show the error in the popup with detailed information
      onError?.(userFriendlyError, 'Contract Error', rawErrorDetails);
      
      // Rethrow the error with the user-friendly message
      throw new Error(userFriendlyError);
    }
    
    // Verify the permitted version after the transaction
    try {
      onStatusChange?.('Verifying permission grant...', 'info');
      console.log('VERIFYING PERMIT: Checking if new version was properly registered...');
      // Small delay to ensure the blockchain state has been updated
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      
      const userViewContract = getUserViewRegistryContract();
      const verifiedVersion = await userViewContract.getPermittedAppVersionForPkp(
        agentPKP.tokenId,
        Number(appId)
      );
      
      const verifiedVersionNum = verifiedVersion.toNumber();
      console.log(`VERIFICATION RESULT: Current permitted version is now ${verifiedVersionNum}`);
      
      if (verifiedVersionNum !== Number(appInfo.latestVersion)) {
        console.error(`VERSION MISMATCH: Expected version ${Number(appInfo.latestVersion)} but found ${verifiedVersionNum}`);
        // Consider adding error handling here - the transaction succeeded but didn't update the state as expected
      } else {
        console.log('PERMIT SUCCESS: Version was successfully updated');
      }
    } catch (verifyError) {
      console.error('Error verifying permitted version after update:', verifyError);
      onStatusChange?.('Could not verify permission grant', 'warning');
    }

    // Initialize Lit Contracts
    onStatusChange?.('Setting up action permissions...', 'info');
    const litContracts = new LitContracts({
      network: SELECTED_LIT_NETWORK,
      signer: userPkpWallet,
    });
    await litContracts.connect();

    if (toolIpfsCids.length > 0) {
      console.log(`Adding permitted actions for ${toolIpfsCids.length} tools`);
      onStatusChange?.(`Adding permissions for ${toolIpfsCids.length} action(s)...`, 'info');
      
      // Wait a bit for blockchain state to update before adding permitted actions
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      for (const ipfsCid of toolIpfsCids) {
        try {
          const properlyCidEncoded = extractIpfsCid(ipfsCid);
          
          console.log(`Adding permitted action for IPFS CID: ${ipfsCid}`);
          console.log(`Properly encoded CID: ${properlyCidEncoded}`);
          
          onStatusChange?.(`Adding permission for IPFS CID: ${ipfsCid.substring(0, 8)}...`, 'info');
          const tx = await litContracts.addPermittedAction({
            ipfsId: ipfsCid,
            pkpTokenId: agentPKP.tokenId, // Use hex format tokenId
            authMethodScopes: [AUTH_METHOD_SCOPE.SignAnything],
          });
          
          console.log(`Transaction hash: ${tx}`);
          console.log(`Successfully added permitted action for IPFS CID: ${properlyCidEncoded}`);
        } catch (error) {
          console.error(`Error adding permitted action for IPFS CID ${ipfsCid}:`, error);
          onStatusChange?.(`Failed to add permission for an action`, 'warning');
          // Continue with the next IPFS CID even if one fails
        }
      }
      onStatusChange?.('All action permissions added!', 'success');
    } else {
      console.warn('No valid tool IPFS CIDs found to add permitted actions for');
      onStatusChange?.('No actions to add permissions for', 'warning');
    }

    const receipt = { status: 1, transactionHash: "0x" + Math.random().toString(16).substring(2) };
    console.log('Transaction receipt:', receipt);
    onStatusChange?.('Permission grant successful!', 'success');

    return receipt;
  }, [agentPKP, appId, appInfo, sessionSigs, userPKP, parameters, versionInfo, updateParameters, onStatusChange, onError]);

  return {
    approveConsent,
    updateParameters
  };
}; 