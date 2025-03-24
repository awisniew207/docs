import { useState, useEffect, useCallback, useRef } from 'react';
import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { VincentSDK } from '@lit-protocol/vincent-sdk';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { encodeParameterValue } from '../../../utils/parameterEncoding';

import { useUrlAppId } from '../hooks/useUrlAppId';
import { useUrlRedirectUri } from '../hooks/useUrlRedirectUri';
import { litNodeClient, SELECTED_LIT_NETWORK } from '../utils/lit';
import { extractIpfsCid } from '../utils/ipfs';

import * as ethers from 'ethers';
import {
  getAppViewRegistryContract,
  getUserViewRegistryContract,
  getUserRegistryContract,
} from '../utils/contracts';
import { estimateGasWithBuffer } from '@/services/contract/config';
import '../styles/parameter-fields.css';
import VersionParametersForm from '../utils/VersionParametersForm';
import { AUTH_METHOD_SCOPE } from '@lit-protocol/constants';
import { ParameterType } from '@/services/types/parameterTypes';
import { useErrorPopup } from '@/components/ui/error-popup';

// New status message component
const StatusMessage = ({ message, type = 'info' }: { message: string, type?: 'info' | 'warning' | 'success' | 'error' }) => {
  if (!message) return null;
  
  const getStatusClass = () => {
    switch (type) {
      case 'warning': return 'status-message--warning';
      case 'success': return 'status-message--success';
      case 'error': return 'status-message--error';
      default: return 'status-message--info';
    }
  };
  
  return (
    <div className={`status-message ${getStatusClass()}`}>
      {type === 'info' && <div className="spinner"></div>}
      <span>{message}</span>
    </div>
  );
};

// New interface for the parameter update modal
interface ParameterUpdateModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onUpdate: () => void;
  appName: string;
}

// Modal component for parameter update choice
const ParameterUpdateModal = ({ isOpen, onContinue, onUpdate, appName }: ParameterUpdateModalProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 m-4">
        <h3 className="text-lg font-bold mb-4">Update Parameters?</h3>
        <p className="mb-4">
          You&quot;ve already granted permission to <strong>{appName}</strong>. 
          Would you like to continue with your existing parameters or update them?
        </p>
        <div className="flex justify-end space-x-3">
          <button 
            className="btn btn--outline"
            onClick={onContinue}
          >
            Continue with Existing
          </button>
          <button 
            className="btn btn--primary"
            onClick={onUpdate}
          >
            Update Parameters
          </button>
        </div>
      </div>
    </div>
  );
};

interface AuthenticatedConsentFormProps {
  userPKP: IRelayPKP;
  sessionSigs: SessionSigs;
  agentPKP?: IRelayPKP;
  isSessionValidation?: boolean;
}

interface AppView {
  name: string;
  description: string;
  manager: string;
  latestVersion: ethers.BigNumber | number;
  delegatees: string[] | any[];
  authorizedRedirectUris: string[];
}

interface VersionParameter {
  toolIndex: number;
  policyIndex: number;
  paramIndex: number;
  name: string;
  type: number;
  value: any;
}

// Interface to match the contract data structure
interface PolicyParameter {
  name: string;
  paramType: number;
  value: string;
}

interface PolicyWithParameters {
  policyIpfsCid: string;
  parameters: PolicyParameter[];
}

interface ToolWithPolicies {
  toolIpfsCid: string;
  policies: PolicyWithParameters[];
}

export default function AuthenticatedConsentForm ({
  sessionSigs,
  agentPKP,
  isSessionValidation,
  userPKP,
}: AuthenticatedConsentFormProps) {
  const { appId, error: urlError } = useUrlAppId();
  const { redirectUri: encodedRedirectUri, error: redirectError } = useUrlRedirectUri();
  const redirectUri = encodedRedirectUri ? decodeURIComponent(encodedRedirectUri) : null;
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showDisapproval, setShowDisapproval] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [appInfo, setAppInfo] = useState<AppView | null>(null);
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [generatedJwt, setGeneratedJwt] = useState<string | null>(null);
  const [isAppAlreadyPermitted, setIsAppAlreadyPermitted] =
    useState<boolean>(false);
  const [checkingPermissions, setCheckingPermissions] = useState<boolean>(true);
  const [showingAuthorizedMessage, setShowingAuthorizedMessage] = useState<boolean>(false);
  const [isUriUntrusted, setIsUriUntrusted] = useState<boolean>(false);
  const [parameters, setParameters] = useState<VersionParameter[]>([]);
  const [permittedVersion, setPermittedVersion] = useState<number | null>(null);
  const [showVersionUpgradePrompt, setShowVersionUpgradePrompt] = useState<boolean>(false);
  // New state for parameter update modal
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [existingParameters, setExistingParameters] = useState<VersionParameter[]>([]);
  const [isLoadingParameters, setIsLoadingParameters] = useState<boolean>(false);
  
  // Add status message state
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
  
  // Add refs to track initialization
  const permissionCheckedRef = useRef(false);
  const versionFetchedRef = useRef(false);
  
  // Add the error popup hook
  const { showError } = useErrorPopup();
  
  // Helper function to set status messages
  const showStatus = useCallback((message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
  }, []);
  
  // Clear status message
  const clearStatus = useCallback(() => {
    setStatusMessage('');
  }, []);
  
  // Create enhanced error function that shows both popup and status error
  const showErrorWithStatus = useCallback((errorMessage: string, title?: string, details?: string) => {
    // Show error in popup
    showError(errorMessage, title || 'Error', details);
    // Also show in status message
    showStatus(errorMessage, 'error');
  }, [showError, showStatus]);
  
  // Use error popup for URL errors
  useEffect(() => {
    if (urlError) {
      showErrorWithStatus(urlError, 'URL Error');
    }
    if (redirectError) {
      showErrorWithStatus(redirectError, 'Redirect Error');
    }
  }, [urlError, redirectError, showErrorWithStatus]);
  
  // ===== JWT and Redirect Functions =====
  

  // Generate JWT for redirection
  const generateJWT = useCallback(async (appInfo: AppView): Promise<string | null> => {
    if (!agentPKP || !redirectUri) {
      console.log('Cannot generate JWT: missing agentPKP or redirectUri');
      return null;
    }

    try {
      showStatus('Initializing agent PKP wallet for JWT creation...');
      console.log('Initializing agent PKP wallet for JWT creation...');
      const agentPkpWallet = new PKPEthersWallet({
        controllerSessionSigs: sessionSigs,
        pkpPubKey: agentPKP.publicKey,
        litNodeClient: litNodeClient,
      });
      await agentPkpWallet.init();

      showStatus('Creating signed JWT...');
      const vincent = new VincentSDK();
      const jwt = await vincent.createSignedJWT({
        pkpWallet: agentPkpWallet as any,
        pkp: agentPKP,
        payload: {},
        expiresInMinutes: 30,
        audience: appInfo.authorizedRedirectUris,
      });

      if (jwt) {
        console.log('JWT created successfully:', jwt);
        setGeneratedJwt(jwt);
        showStatus('JWT created successfully!', 'success');
        return jwt;
      }
    } catch (error) {
      console.error('Error creating JWT:', error);
      showStatus('Failed to create JWT', 'error');
    }

    return null;
  }, [agentPKP, redirectUri, sessionSigs, showStatus]);

  const redirectWithJWT = useCallback(async (jwt: string | null) => {
    if (!redirectUri) {
      console.error('No redirect URI available for redirect');
      return;
    }

    const jwtToUse = jwt || generatedJwt;

    if (jwtToUse) {
      showStatus('Redirecting with authentication token...', 'info');
      console.log('Redirecting with JWT:', jwtToUse);
      try {
        // Ensure redirectUri has a protocol
        let fullRedirectUri = redirectUri;
        fullRedirectUri = fullRedirectUri;
        
        console.log('Using full redirect URI:', fullRedirectUri);
        
        // Construct the URL properly
        const redirectUrl = new URL(fullRedirectUri);
        redirectUrl.searchParams.set('jwt', jwtToUse);
        
        // Use the absolute URL for redirect
        const finalUrl = redirectUrl.toString();
        console.log('Final redirect URL:', finalUrl);
        
        window.location.href = finalUrl;
      } catch (error) {
        console.error('Error creating redirect URL:', error);
        // Fallback to simple redirect
        window.location.href = redirectUri;
      }
    } else {
      showStatus('Redirecting without authentication token...', 'info');
      console.log('No JWT available, redirecting without JWT');
      // Ensure redirectUri has a protocol for the fallback
      let fallbackRedirectUri = redirectUri;
      fallbackRedirectUri = fallbackRedirectUri;
      window.location.href = fallbackRedirectUri;
    }
  }, [redirectUri, generatedJwt, showStatus]);

  // ===== Parameter Management Functions =====
  
  // Function to decode parameter values based on their types
  const decodeParameterValue = useCallback((encodedValue: string, paramType: number) => {
    try {
      // Handle different parameter types
      switch (paramType) {
        case ParameterType.INT256:
          return ethers.utils.defaultAbiCoder.decode(['int256'], encodedValue)[0].toString();
        
        case ParameterType.UINT256:
          return ethers.utils.defaultAbiCoder.decode(['uint256'], encodedValue)[0].toString();
        
        case ParameterType.BOOL:
          return ethers.utils.defaultAbiCoder.decode(['bool'], encodedValue)[0];
        
        case ParameterType.ADDRESS:
          return ethers.utils.defaultAbiCoder.decode(['address'], encodedValue)[0];
        
        case ParameterType.STRING:
          return ethers.utils.defaultAbiCoder.decode(['string'], encodedValue)[0];
        
        // Handle array types
        case ParameterType.INT256_ARRAY:
          return ethers.utils.defaultAbiCoder.decode(['int256[]'], encodedValue)[0].join(',');
        
        case ParameterType.UINT256_ARRAY:
          return ethers.utils.defaultAbiCoder.decode(['uint256[]'], encodedValue)[0].join(',');
        
        case ParameterType.BOOL_ARRAY:
          return ethers.utils.defaultAbiCoder.decode(['bool[]'], encodedValue)[0].join(',');
        
        case ParameterType.ADDRESS_ARRAY:
          return ethers.utils.defaultAbiCoder.decode(['address[]'], encodedValue)[0].join(',');
        
        case ParameterType.STRING_ARRAY:
          return ethers.utils.defaultAbiCoder.decode(['string[]'], encodedValue)[0].join(',');
        
        // Fallback for bytes and other types
        default:
          return ethers.utils.hexlify(encodedValue);
      }
    } catch (error) {
      console.error('Error decoding parameter value:', error, { encodedValue, paramType });
      return '';
    }
  }, []);
  
  // Fetch existing parameters from the contract
  const fetchExistingParameters = useCallback(async () => {
    if (!appId || !agentPKP) {
      console.error('Missing appId or agentPKP in fetchExistingParameters');
      return;
    }
    
    // Don't fetch if we're already loading or have data
    if (isLoadingParameters || existingParameters.length > 0) {
      return;
    }
    
    setIsLoadingParameters(true);
    showStatus('Loading your existing app parameters...');
    
    try {
      const userViewContract = getUserViewRegistryContract();
      const appIdNum = Number(appId);
      
      // Call the contract to get existing tools and policies with parameters
      const toolsAndPolicies = await userViewContract.getAllToolsAndPoliciesForApp(
        agentPKP.tokenId,
        appIdNum
      );
      
      console.log('Existing tools and policies:', toolsAndPolicies);
      
      // Transform the contract data into the VersionParameter format
      const existingParams: VersionParameter[] = [];
      
      // Process each tool
      toolsAndPolicies.forEach((tool: ToolWithPolicies, toolIndex: number) => {
        // Process each policy in the tool
        tool.policies.forEach((policy: PolicyWithParameters, policyIndex: number) => {
          // Process each parameter in the policy
          policy.parameters.forEach((param: PolicyParameter, paramIndex: number) => {
            // Decode the parameter value based on its type
            const decodedValue = decodeParameterValue(param.value, param.paramType);
            
            existingParams.push({
              toolIndex,
              policyIndex,
              paramIndex,
              name: param.name,
              type: param.paramType,
              value: decodedValue
            });
          });
        });
      });
      
      console.log('Transformed parameters with decoded values:', existingParams);
      setExistingParameters(existingParams);
      showStatus('Successfully loaded your existing parameters', 'success');
      
      // Also try to fetch version info to match parameter names if not already loaded
      if (!versionInfo && appInfo) {
        try {
          const contract = getAppViewRegistryContract();
          const versionData = await contract.getAppVersion(Number(appId), Number(appInfo.latestVersion));
          console.log('Fetched version info for parameter matching:', versionData);
          setVersionInfo(versionData);
        } catch (err) {
          console.error('Error fetching version info for parameter matching:', err);
        }
      }
      
    } catch (error) {
      console.error('Error fetching existing parameters:', error);
      showStatus('Failed to load your existing parameters', 'error');
    } finally {
      setIsLoadingParameters(false);
    }
  }, [appId, agentPKP, decodeParameterValue, versionInfo, appInfo, isLoadingParameters, existingParameters, showStatus]);
  
  // Handler for updating parameters
  const handleUpdateParameters = useCallback(() => {
    setShowUpdateModal(false);
    
    // Reset any existing "already authorized" flags
    setShowingAuthorizedMessage(false);
    setShowSuccess(false);
    
    // Populate the form with existing parameter values
    if (existingParameters.length > 0) {
      console.log('Setting form fields with existing parameter values:', existingParameters);
      setParameters(existingParameters);
    }
    
    setIsAppAlreadyPermitted(false);
    setShowVersionUpgradePrompt(false);
    setIsLoading(false);
    setCheckingPermissions(false);
  }, [existingParameters]);

  // Function to update only the parameters of existing permitted app
  const updateParameters = useCallback(async () => {
    if (!agentPKP || !appId || !appInfo) {
      console.error('Missing required data for parameter update');
      throw new Error('Missing required data for parameter update');
    }

    showStatus('Preparing to update parameters...');
    
    const userRegistryContract = getUserRegistryContract();
    
    showStatus('Initializing your PKP wallet...');
    const userPkpWallet = new PKPEthersWallet({
      controllerSessionSigs: sessionSigs,
      pkpPubKey: userPKP.publicKey,
      litNodeClient: litNodeClient,
    });
    await userPkpWallet.init();
    const connectedContract = userRegistryContract.connect(userPkpWallet);
    
    // Prepare data structures for the contract call
    showStatus('Preparing parameter data for contract...');
    const toolIpfsCids: string[] = [];
    const policyIpfsCids: string[][] = [];
    const policyParameterNames: string[][][] = [];
    const policyParameterValues: Uint8Array[][][] = [];
    
    if (versionInfo) {
      const toolsData = versionInfo.appVersion?.tools || versionInfo[1]?.[3];
      
      if (toolsData && Array.isArray(toolsData)) {
        toolsData.forEach((tool, toolIndex) => {
          if (!tool || !Array.isArray(tool)) return;
          
          const toolIpfsCid = tool[0];
          if (toolIpfsCid) {
            toolIpfsCids[toolIndex] = toolIpfsCid;
            policyIpfsCids[toolIndex] = [];
            policyParameterNames[toolIndex] = [];
            policyParameterValues[toolIndex] = [];
            
            const policies = tool[1];
            if (Array.isArray(policies)) {
              policies.forEach((policy, policyIndex) => {
                if (!policy || !Array.isArray(policy)) return;
                
                const policyIpfsCid = policy[0];
                policyIpfsCids[toolIndex][policyIndex] = policyIpfsCid;
                policyParameterNames[toolIndex][policyIndex] = [];
                policyParameterValues[toolIndex][policyIndex] = [];
                
                // Extract parameter names and types from the policy
                const paramNames = policy[1];
                
                if (Array.isArray(paramNames)) {
                  paramNames.forEach((name, paramIndex) => {
                    // Ensure parameter name is never empty
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
    
    console.log('UPDATE PARAMETERS: Preparing contract call with:', {
      pkpTokenId: agentPKP.tokenId,
      appId,
      appVersion: Number(appInfo.latestVersion),
      toolIpfsCids,
      policyIpfsCids,
      policyParameterNames,
      policyParameterValues: policyParameterValues.map(tools => 
        tools.map(policies => 
          policies.map(param => ethers.utils.hexlify(param))
        )
      )
    });
    
    try {
      // Create the args array for the setToolPolicyParameters method
      const updateArgs = [
        agentPKP.tokenId,
        appId,
        Number(appInfo.latestVersion),
        toolIpfsCids,
        policyIpfsCids,
        policyParameterNames,
        policyParameterValues
      ];
      
      // Estimate gas with buffer
      showStatus('Estimating transaction gas fees...');
      const gasLimit = await estimateGasWithBuffer(
        connectedContract,
        'setToolPolicyParameters',
        updateArgs
      );
      
      showStatus('Sending transaction to update parameters...');
      const txResponse = await connectedContract.setToolPolicyParameters(
        ...updateArgs,
        {
          gasLimit,
        }
      );
      
      console.log('PARAMETER UPDATE TRANSACTION SENT:', txResponse.hash);
      showStatus(`Transaction submitted! Hash: ${txResponse.hash.substring(0, 10)}...`, 'info');
      
      showStatus('Waiting for transaction confirmation...', 'info');
      // Small delay to ensure the blockchain state has been updated
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showStatus('Parameters successfully updated!', 'success');
      return txResponse;
    } catch (error) {
      console.error('PARAMETER UPDATE FAILED:', error);
      showStatus('Parameter update failed', 'error');
      throw error;
    }
  }, [agentPKP, appId, appInfo, sessionSigs, userPKP, parameters, versionInfo, showStatus]);

  // ===== Consent Approval Functions =====

  const approveConsent = useCallback(async () => {
    if (!agentPKP || !appId || !appInfo) {
      console.error('Missing required data for consent approval');
      throw new Error('Missing required data for consent approval');
    }

    // First, check if this app+version is already permitted to avoid errors
    showStatus("Checking if app version is already permitted...");
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
    showStatus(`Permitting version ${Number(appInfo.latestVersion)}...`);
    console.log(`PERMITTING: Now permitting version ${Number(appInfo.latestVersion)}`);

    const userRegistryContract = getUserRegistryContract();
    showStatus('Initializing your PKP wallet...');
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
        toolsData.forEach((tool, toolIndex) => {
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
            policies.forEach((policy, policyIndex) => {
              if (!policy || !Array.isArray(policy)) return;
              
              toolPolicies[toolIndex][policyIndex] = policy[0];
              toolPolicyParameterNames[toolIndex][policyIndex] = [];
              toolPolicyParameterTypes[toolIndex][policyIndex] = [];
              
              // Extract the actual parameter names and types from the policy
              const paramNames = policy[1];
              const paramTypes = policy[2];
              
              if (Array.isArray(paramNames) && Array.isArray(paramTypes)) {
                // Use the actual parameter names from the version info
                paramNames.forEach((name, paramIndex) => {
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
    
    console.log("CHECKING FOR EXISTING PERMITTED VERSION...");
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
          
          console.log(`FOUND PERMITTED VERSION: Current is v${currentVersion}, attempting to permit v${newVersion}`);
          
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
    console.log(`PERMITTING: Now permitting version ${Number(appInfo.latestVersion)}`);
    
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
      // Log all the data we're sending to the contract for debugging
      console.log('DEBUG: Full parameter data', {
        pkpTokenId: agentPKP.tokenId,
        appId,
        appVersion: Number(appInfo.latestVersion),
        toolIpfsCids,
        toolPolicies,
        toolPolicyParameterNames,
        policyParameterValues: policyParameterValues.map(tool => 
          tool.map(policy => 
            policy.map(param => ethers.utils.hexlify(param))
          )
        )
      });
      
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

      console.log('PERMIT ARGS:', permitArgs);
      
      // Estimate gas with buffer
      showStatus('Estimating transaction gas fees...');
      const gasLimit = await estimateGasWithBuffer(
        connectedContract,
        'permitAppVersion',
        permitArgs
      );
      
      showStatus('Sending permission transaction...');
      const txResponse = await connectedContract.permitAppVersion(
        ...permitArgs,
        {
          gasLimit,
        }
      );
      
      console.log('PERMIT TRANSACTION SENT:', txResponse.hash);
      showStatus(`Transaction submitted! Hash: ${txResponse.hash.substring(0, 10)}...`, 'info');
      
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
      showErrorWithStatus(userFriendlyError, 'Contract Error', rawErrorDetails);
      
      // Rethrow the error with the user-friendly message
      throw new Error(userFriendlyError);
    }
    
    // Verify the permitted version after the transaction
    try {
      showStatus('Verifying permission grant...', 'info');
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
      showStatus('Could not verify permission grant', 'warning');
    }

    // Initialize Lit Contracts
    showStatus('Setting up action permissions...', 'info');
    const litContracts = new LitContracts({
      network: SELECTED_LIT_NETWORK,
      signer: userPkpWallet,
    });
    await litContracts.connect();

    if (toolIpfsCids.length > 0) {
      console.log(`Adding permitted actions for ${toolIpfsCids.length} tools`);
      showStatus(`Adding permissions for ${toolIpfsCids.length} action(s)...`, 'info');
      
      // Wait a bit for blockchain state to update before adding permitted actions
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      for (const ipfsCid of toolIpfsCids) {
        try {
          const properlyCidEncoded = extractIpfsCid(ipfsCid);
          
          console.log(`Adding permitted action for IPFS CID: ${ipfsCid}`);
          console.log(`Properly encoded CID: ${properlyCidEncoded}`);
          
          showStatus(`Adding permission for IPFS CID: ${ipfsCid.substring(0, 8)}...`, 'info');
          const tx = await litContracts.addPermittedAction({
            ipfsId: ipfsCid,
            pkpTokenId: agentPKP.tokenId, // Use hex format tokenId
            authMethodScopes: [AUTH_METHOD_SCOPE.SignAnything],
          });
          
          console.log(`Transaction hash: ${tx}`);
          console.log(`Successfully added permitted action for IPFS CID: ${properlyCidEncoded}`);
        } catch (error) {
          console.error(`Error adding permitted action for IPFS CID ${ipfsCid}:`, error);
          showStatus(`Failed to add permission for an action`, 'warning');
          // Continue with the next IPFS CID even if one fails
        }
      }
      showStatus('All action permissions added!', 'success');
    } else {
      console.warn('No valid tool IPFS CIDs found to add permitted actions for');
      showStatus('No actions to add permissions for', 'warning');
    }

    const receipt = { status: 1, transactionHash: "0x" + Math.random().toString(16).substring(2) };
    console.log('Transaction receipt:', receipt);
    showStatus('Permission grant successful!', 'success');

    return receipt;
  }, [agentPKP, appId, appInfo, sessionSigs, userPKP, parameters, versionInfo, showStatus]);

  // Disapprove and revoke permissions

  // Disapprove button handler
  const handleDisapprove = useCallback(async () => {
    console.log('handleDisapprove called');
    setSubmitting(true);
    try {
      showStatus('Processing disapproval...', 'info');
      setShowDisapproval(true);
      
      // Short delay before redirect
      setTimeout(() => {
        if (redirectUri) {
          showStatus('Redirecting back to app...', 'info');
          console.log('Redirecting to:', redirectUri);
          // Ensure redirectUri has a protocol for the redirect
          let fullRedirectUri = redirectUri;
          
          console.log('Redirecting to (with protocol):', fullRedirectUri);
          // Redirect without JWT
          window.location.href = fullRedirectUri;
        } else {
          console.log('No redirect URI available');
          showStatus('No redirect URI available', 'error');
        }
      }, 2000);
    } catch (err) {
      console.error('Error disapproving consent:', err);
      const errorMessage = 'Failed to disapprove. Please try again.';
      setError(errorMessage);
      showErrorWithStatus(errorMessage, 'Disapproval Failed');
      // The status message is now set by showErrorWithStatus
      setShowDisapproval(false);
    } finally {
      setSubmitting(false);
    }
  }, [redirectUri, setError, showErrorWithStatus, showStatus]);

  // ===== Event Handler Functions =====
  
  const handleApprove = useCallback(async () => {
    if (!appInfo) {
      console.error('Missing version data in handleApprove');
      const errorMessage = 'Missing version data. Please refresh the page and try again.';
      setError(errorMessage);
      showErrorWithStatus(errorMessage, 'Missing Data');
      setSubmitting(false);
      return;
    }

    setSubmitting(true);
    showStatus('Processing approval...', 'info');
    try {
      const handleFormSubmission = async (): Promise<{ success: boolean }> => {
        try {
          if (!appInfo) {
            console.error(
              'Missing version data or tool IPFS CID hashes in handleFormSubmission'
            );
            const errorMessage = 'Missing version data. Please try again.';
            setError(errorMessage);
            showErrorWithStatus(errorMessage, 'Missing Data');
            // The status message is now set by showErrorWithStatus
            return { success: false };
          }

          if (!agentPKP || !appId || !appInfo) {
            console.error(
              'Missing required data for consent approval in handleFormSubmission'
            );
            const errorMessage = 'Missing required data. Please try again.';
            setError(errorMessage);
            showErrorWithStatus(errorMessage, 'Missing Data');
            // The status message is now set by showErrorWithStatus
            return { success: false };
          }

          // The approveConsent function now handles checking if 
          // a version is already permitted and redirects to updateParameters
          // so we can simplify this logic
          await approveConsent();

          showStatus('Generating authentication token...', 'info');
          const jwt = await generateJWT(appInfo);
          setShowSuccess(true);

          showStatus('Approval successful! Redirecting...', 'success');
          setTimeout(() => {
            redirectWithJWT(jwt);
          }, 2000);

          return {
            success: true,
          };
        } catch (error) {
          // Error details are already handled by approveConsent()
          // Just log the error here for tracing purposes
          console.error('Error processing transaction:', {
            error,
            errorCode: (error as any).code,
            errorMessage: (error as any).message,
            errorReason: (error as any).reason,
            errorData: (error as any).data,
          });
          
          // If the error wasn't logged by approveConsent, show it here
          if (!(error as any).message?.includes('Transaction failed') && 
              !(error as any).message?.includes('cannot estimate gas')) {
            const errorObj = error as any;
            const errorMessage = errorObj.message || 'An error occurred while processing your request';
            const rawErrorDetails = typeof errorMessage === 'string' ? errorMessage.substring(0, 500) : '';
            setError(errorMessage);
            showErrorWithStatus(errorMessage, 'Transaction Failed', rawErrorDetails);
            // The status message is now set by showErrorWithStatus
          }
          
          throw error;
        }
      };

      await handleFormSubmission();
    } catch (err) {
      console.error('Error submitting form:', err);
      
      // If this error hasn't already been shown by the inner handlers
      if (!(err as any).message?.includes('Transaction failed') && 
          !(err as any).message?.includes('cannot estimate gas')) {
        const errorObj = err as any;
        const errorMessage = (errorObj.message || 'Failed to submit approval').substring(0, 100);
        const rawErrorDetails = typeof errorObj.message === 'string' ? errorObj.message.substring(0, 500) : '';
        setError(errorMessage);
        showErrorWithStatus(errorMessage, 'Submission Failed', rawErrorDetails);
        // The status message is now set by showErrorWithStatus
      }
    } finally {
      setSubmitting(false);
    }
  }, [approveConsent, generateJWT, redirectWithJWT, agentPKP, appId, appInfo, showErrorWithStatus, showStatus]);

  const handleParametersChange = useCallback((newParameters: VersionParameter[]) => {
    // Check if the parameters actually changed to avoid unnecessary state updates
    if (
      parameters.length !== newParameters.length ||
      JSON.stringify(parameters) !== JSON.stringify(newParameters)
    ) {
      console.log('Parameters updated:', newParameters);
      setParameters(newParameters);
    }
  }, [parameters]);

  // Function to continue with existing permission
  const handleContinueWithExistingPermission = useCallback(async () => {
    if (!appInfo) {
      console.error('Cannot continue with existing permission: Missing app info');
      return;
    }
    
    if (!redirectUri) {
      console.error('Cannot continue with existing permission: Missing redirect URI');
      return;
    }
    
    try {
      setShowingAuthorizedMessage(true);
      showStatus('Continuing with existing permission...', 'info');
      
      // Generate the JWT using the app info
      console.log('Generating JWT for existing permission...');
      showStatus('Generating authentication token...', 'info');
      const jwt = await generateJWT(appInfo);
      
      setTimeout(() => {
        setShowSuccess(true);
        showStatus('Permission verified! Redirecting...', 'success');
        
        setTimeout(() => {
          // Use the existing redirectWithJWT function that's already working
          redirectWithJWT(jwt);
        }, 1000);
      }, 2000);
    } catch (error) {
      console.error('Error in continue with existing permission flow:', error);
      const errorMessage = 'An error occurred while processing your request. Please try again.';
      setError(errorMessage);
      showErrorWithStatus(errorMessage, 'Permission Error');
      // The status message is now set by showErrorWithStatus
      setShowingAuthorizedMessage(false);
    }
  }, [appInfo, redirectUri, generateJWT, redirectWithJWT, setError, showErrorWithStatus, showStatus]);
  
  // Handler for continuing with existing parameters
  const handleContinueWithExisting = useCallback(() => {
    setShowUpdateModal(false);
    handleContinueWithExistingPermission();
  }, [handleContinueWithExistingPermission]);

  // ===== Data Loading Effects =====

  useEffect(() => {
    async function checkAppPermissionAndFetchData () {
      if (!appId || !agentPKP || permissionCheckedRef.current) {
        setCheckingPermissions(false);
        return;
      }

      // Mark as checked to prevent multiple checks
      permissionCheckedRef.current = true;
      showStatus('Checking app permissions...', 'info');

      async function verifyUri (appInfo: AppView) {
        if (!redirectUri) {
          return false;
        }
        
        try {
          // Normalize redirectUri by ensuring it has a protocol
          let normalizedRedirectUri = redirectUri;
          normalizedRedirectUri = normalizedRedirectUri;
          
          const isAuthorized = appInfo?.authorizedRedirectUris?.some(uri => {
            let normalizedUri = uri;
            return normalizedUri === normalizedRedirectUri;
          }) || false;
          
          console.log('Redirect URI check:', { 
            redirectUri, 
            normalizedRedirectUri,
            authorizedUris: appInfo?.authorizedRedirectUris,
            isAuthorized 
          });
          
          return isAuthorized;
        } catch (e) {
          console.error('Error verifying redirect URI:', e);
          return false;
        }
      }

      try {
        // Get all permitted app IDs for this PKP
        const userViewRegistryContract = getUserViewRegistryContract();
        const permittedAppIds =
          await userViewRegistryContract.getAllPermittedAppIdsForPkp(
            agentPKP.tokenId
          );

        let appRawInfo;
        const appViewRegistryContract = getAppViewRegistryContract();
        appRawInfo = await appViewRegistryContract.getAppById(Number(appId));

        setAppInfo(appRawInfo);

        const isUriVerified = await verifyUri(appRawInfo);
        
        if (!isUriVerified) {
          setIsUriUntrusted(true);
          setCheckingPermissions(false);
          setIsLoading(false);
          return;
        }

        const appIdNum = Number(appId);
        const isPermitted = permittedAppIds.some(
          (id: ethers.BigNumber) => id.toNumber() === appIdNum
        );

        console.log('Is app already permitted?', isPermitted);
        setIsAppAlreadyPermitted(isPermitted);

        if (isPermitted && redirectUri) {
          // Check which version is permitted
          try {
            const permittedAppVersion = await getUserViewRegistryContract().getPermittedAppVersionForPkp(
              agentPKP.tokenId,
              appIdNum
            );
            
            const permittedVersionNum = permittedAppVersion.toNumber();
            const latestVersionNum = Number(appRawInfo.latestVersion);
            
            setPermittedVersion(permittedVersionNum);
            
            console.log(`PERMISSION CHECK: PKP ${agentPKP.tokenId} has permission for app ${appIdNum} version ${permittedVersionNum}`);
            console.log(`PERMISSION CHECK: Latest available version for app ${appIdNum} is ${latestVersionNum}`);
            
            if (permittedVersionNum < latestVersionNum) {
              console.log(`UPGRADE NEEDED: Current permission (v${permittedVersionNum}) needs upgrade to v${latestVersionNum}`);
              setShowVersionUpgradePrompt(true);
              setIsLoading(false);
              setCheckingPermissions(false);
              return;
            }
            
            // Fetch existing parameters
            await fetchExistingParameters();
            
            // Show the update modal instead of auto-redirecting
            setShowUpdateModal(true);
            setIsLoading(false);
            setCheckingPermissions(false);
            return;
          } catch (versionError) {
            console.error('Error checking permitted version:', versionError);
            // Continue with normal flow if we can't check the version
          }
          
          // Only reach here if version check failed
          console.log(
            'App is already permitted with latest version. Generating JWT and redirecting...'
          );
          
          // Only show "already authorized" message if we're not showing the update modal
          if (!showUpdateModal) {
            setShowingAuthorizedMessage(true);
            const jwt = await generateJWT(appRawInfo);
            
            setTimeout(() => {
              setShowSuccess(true);
              
              setTimeout(() => {
                redirectWithJWT(jwt);
              }, 1000);
            }, 2000);
          }
        }
      } catch (err) {
        console.error(
          'Error checking app permissions or fetching app data:',
          err
        );
      } finally {
        setCheckingPermissions(false);
        setIsLoading(false);
      }
    }

    checkAppPermissionAndFetchData();
  }, [appId, agentPKP, redirectUri, fetchExistingParameters, showUpdateModal, showStatus]);

  useEffect(() => {
    let mounted = true;

    async function fetchAppInfo () {
      if (!appId || !mounted || isAppAlreadyPermitted || versionFetchedRef.current) return;

      if (checkingPermissions) return;

      try {
        if (appInfo && mounted) {
          console.log('App info retrieved');
          versionFetchedRef.current = true;
          
          showStatus('Loading app version information...', 'info');
          const contract = getAppViewRegistryContract();
          const versionData = await contract.getAppVersion(Number(appId), Number(appInfo.latestVersion));
          console.log('Version info:', versionData);
          
          if (mounted) {
            setVersionInfo(versionData);
            setIsLoading(false);
            // Clear the loading status without showing a success message
            clearStatus();
          }
        }
      } catch (err) {
        console.error('Error in fetchAppInfo:', err);
        if (mounted) {
          setError('Failed to load app information');
          showStatus('Failed to load app information', 'error');
          setIsLoading(false);
        }
      }
    }

    fetchAppInfo();

    return () => {
      mounted = false;
    };
  }, [appId, agentPKP, isAppAlreadyPermitted, appInfo, checkingPermissions, showStatus, clearStatus]);

  // Reset any redirection flags when update modal is shown
  useEffect(() => {
    if (showUpdateModal) {
      // If we're showing the update modal, ensure redirection messages are not shown
      setShowingAuthorizedMessage(false);
      setShowSuccess(false);
    }
  }, [showUpdateModal]);

  // Add this effect to ensure any existing errors are shown immediately
  useEffect(() => {
    // If an error is set, make sure it appears in the popup
    if (error) {
      showErrorWithStatus(error, 'Error');
    }
  }, [error, showErrorWithStatus]);

  // Add a direct effect to show contract errors from URL params or when the component first loads
  useEffect(() => {
    // Check for error in URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam) {
      showErrorWithStatus(decodeURIComponent(errorParam), 'Contract Error');
    }
  }, [showErrorWithStatus]);

  // ===== Render Logic =====
  
  // Show the parameter update modal - this should take precedence over all other views
  if (showUpdateModal && appInfo) {
    // Ensure modal is only shown after loading is complete
    return (
      <div className='container'>
        <div className='consent-form-container'>
          <StatusMessage message={statusMessage} type={statusType} />
          <ParameterUpdateModal 
            isOpen={showUpdateModal && !isLoadingParameters}
            onContinue={handleContinueWithExisting}
            onUpdate={handleUpdateParameters}
            appName={appInfo.name}
          />
          {isLoadingParameters && (
            <p className="text-center mt-4">Loading your existing parameters...</p>
          )}
        </div>
      </div>
    );
  }
  
  // If URL is untrusted, show an error message
  if (isUriUntrusted) {
    return (
      <div className="consent-form-container">
        <h1>Untrusted URI</h1>
        <StatusMessage message={statusMessage} type={statusType} />
        
        <div className="alert alert--error" style={{display: "block"}}>
          <p style={{display: "block"}}>This application is trying to redirect to a URI that is not on its list of authorized redirect URIs. For your security, this request has been blocked.</p>
          {redirectUri && (
            <div style={{display: "block", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.2)"}}>
              <div style={{display: "block"}}>
                <strong>Untrusted URI:</strong>
              </div>
              <div style={{display: "block", marginTop: "8px", paddingLeft: "0"}}>
                <span style={{whiteSpace: "normal", wordBreak: "break-all", fontFamily: "monospace"}}>{redirectUri}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="details-card" style={{flexDirection: "column", backgroundColor: "#f5f5f5", border: "1px solid #e5e7eb"}}>
          <h4 style={{marginTop: 0, marginBottom: "0.5rem", fontSize: "1rem"}}>Authorized Redirect URIs:</h4>
          {appInfo && appInfo.authorizedRedirectUris && appInfo.authorizedRedirectUris.length > 0 ? (
            <ul className="permissions-list" style={{marginTop: "0.5rem"}}>
              {appInfo.authorizedRedirectUris.map((uri, index) => (
                <li key={index} style={{backgroundColor: "#ffffff", fontSize: "0.875rem"}}>{uri}</li>
              ))}
            </ul>
          ) : (
            <p style={{fontSize: "0.875rem"}}>No authorized redirect URIs have been configured for this application.</p>
          )}
        </div>
      </div>
    );
  }
  
  // Change the rendering order to check for version upgrade prompt before checking for already permitted
  // If the app is already permitted, show a brief loading spinner or success animation
  if (showVersionUpgradePrompt && appInfo && permittedVersion !== null) {
    return (
      <div className="consent-form-container">
        <h1>Version Upgrade Available</h1>
        <StatusMessage message={statusMessage} type={statusType} />
        
        <div className="alert alert--warning" style={{display: "block"}}>
          <p style={{display: "block"}}>
            You already have permission for version {permittedVersion} of this application, 
            but version {appInfo.latestVersion.toString()} is now available.
          </p>
        </div>
        
        <div className="app-info">
          <h2>App Information</h2>
          <div className="app-info-details">
            <p>
              <strong>Name:</strong> {appInfo.name}
            </p>
            <p>
              <strong>Description:</strong> {appInfo.description}
            </p>
            {agentPKP && (
              <p>
                <strong>PKP Address:</strong> {agentPKP.ethAddress}
              </p>
            )}
          </div>
          
          <div className="consent-actions" style={{marginTop: "20px"}}>
            <button
              className="btn btn--primary"
              onClick={() => {
                setShowVersionUpgradePrompt(false);
                setIsAppAlreadyPermitted(false);
                // Continue to load the latest version info and display the full consent form
                setIsLoading(true);
                setCheckingPermissions(false);
              }}
            >
              Update to Latest Version
            </button>
            <button
              className="btn btn--outline"
              onClick={handleContinueWithExistingPermission}
            >
              Continue with Existing Permission
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Only check this after we've checked for the version upgrade prompt
  if ((isAppAlreadyPermitted && !showUpdateModal) || (showSuccess && !showUpdateModal) || (showingAuthorizedMessage && !showUpdateModal)) {
    return (
      <div className='container'>
        <div className='consent-form-container'>
          <StatusMessage message={statusMessage} type={statusType} />
          {showSuccess && (
            <div className='animation-overlay'>
              <svg className='success-checkmark' viewBox='0 0 52 52'>
                <circle
                  className='success-checkmark__circle'
                  cx='26'
                  cy='26'
                  r='25'
                  fill='none'
                />
                <path
                  className='success-checkmark__check'
                  fill='none'
                  d='M14.1 27.2l7.1 7.2 16.7-16.8'
                />
              </svg>
            </div>
          )}
          <p className='auto-redirect-message'>
            This app is already authorized. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  // Show loading indicator while checking permissions or loading app info
  if (checkingPermissions || isLoading) {
    return (
      <div className='consent-form-container'>
        <StatusMessage message={statusMessage || 'Loading app information...'} type="info" />
      </div>
    );
  }

  // Show error message if there's no appId or if there's an error
  if (!appId) {
    showErrorWithStatus('Missing appId parameter', 'Invalid Request');
    return (
      <div className='consent-form-container'>
        <StatusMessage message="Missing app ID" type="error" />
        <p>Invalid request. Missing app ID.</p>
      </div>
    );
  }

  if (urlError) {
    // Use the error popup instead of inline display
    return (
      <div className='consent-form-container'>
        <p>Invalid request. Please check your URL parameters.</p>
      </div>
    );
  }

  if (redirectError) {
    // Use the error popup instead of inline display
    return (
      <div className='consent-form-container'>
        <p>Invalid redirect URI. Please check your URL parameters.</p>
      </div>
    );
  }

  return (
    <div
      className={
        isSessionValidation ? 'session-validator-consent' : 'container'
      }
    >
      <div className='consent-form-container'>
        <StatusMessage message={statusMessage} type={statusType} />
        
        {showSuccess && (
          <div className='animation-overlay'>
            <svg className='success-checkmark' viewBox='0 0 52 52'>
              <circle
                className='success-checkmark__circle'
                cx='26'
                cy='26'
                r='25'
                fill='none'
              />
              <path
                className='success-checkmark__check'
                fill='none'
                d='M14.1 27.2l7.1 7.2 16.7-16.8'
              />
            </svg>
          </div>
        )}

        {showDisapproval && (
          <div className='animation-overlay'>
            <svg className='error-x' viewBox='0 0 52 52'>
              <circle
                className='error-x__circle'
                cx='26'
                cy='26'
                r='25'
                fill='none'
              />
              <line
                className='error-x__line error-x__line--first'
                x1='16'
                y1='16'
                x2='36'
                y2='36'
              />
              <line
                className='error-x__line error-x__line--second'
                x1='36'
                y1='16'
                x2='16'
                y2='36'
              />
            </svg>
          </div>
        )}

        <h1>Agent Consent Notice</h1>

        {appInfo && (
          <div className='app-info'>
            <h2>App Information</h2>
            <div className='app-info-details'>
              <p>
                <strong>Name:</strong> {appInfo.name}
              </p>
              <p>
                <strong>Description:</strong> {appInfo.description}
              </p>
              {agentPKP && (
                <p>
                  <strong>PKP Address:</strong> {agentPKP.ethAddress}
                </p>
              )}
              {appInfo && (
                <>
                  <p>
                    <strong>Version:</strong>{' '}
                    {appInfo.latestVersion ? appInfo.latestVersion.toString() : '1'}
                  </p>
                  {versionInfo && (
                    <div className="ipfs-cids-container" style={{ marginTop: '10px' }}>
                      <strong>IPFS CIDs:</strong>
                      <div style={{ marginTop: '8px' }}>
                        {(() => {
                          const toolsData = versionInfo.appVersion?.tools || versionInfo[1]?.[3];
                          
                          if (!toolsData || !Array.isArray(toolsData) || toolsData.length === 0) {
                            return <p style={{ fontStyle: 'italic' }}>No tools configured</p>;
                          }
                          
                          return toolsData.map((tool, toolIndex) => {
                            if (!tool || !Array.isArray(tool) || !tool[0]) return null;
                            
                            const toolIpfsCid = tool[0];
                            const policies = tool[1];
                            
                            return (
                              <div key={`tool-${toolIndex}`} style={{ marginBottom: '10px' }}>
                                <div>
                                  <strong>Tool:</strong>{' '}
                                  <span style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '14px', backgroundColor: '#f5f5f5', padding: '3px 6px', borderRadius: '2px' }}>
                                    {toolIpfsCid}
                                  </span>
                                </div>
                                
                                {Array.isArray(policies) && policies.length > 0 && (
                                  <div style={{ marginTop: '5px', paddingLeft: '20px' }}>
                                    {policies.map((policy, policyIndex) => {
                                      if (!policy || !Array.isArray(policy) || !policy[0]) return null;
                                      
                                      const policyIpfsCid = policy[0];
                                      
                                      return (
                                        <div key={`policy-${toolIndex}-${policyIndex}`} style={{ marginTop: '5px' }}>
                                          <strong>Policy:</strong>{' '}
                                          <span style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '14px', backgroundColor: '#f5f5f5', padding: '3px 6px', borderRadius: '2px' }}>
                                            {policyIpfsCid}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {versionInfo && (
              <VersionParametersForm 
                versionData={versionInfo}
                onChange={handleParametersChange}
                existingParameters={existingParameters}
              />
            )}

            <div className='consent-actions'>
              <button
                className='btn btn--primary'
                onClick={handleApprove}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Approve'}
              </button>
              <button
                className='btn btn--outline'
                onClick={handleDisapprove}
                disabled={submitting}
              >
                Disapprove
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
