import { useCallback, useState, useRef } from 'react';
import { IRelayPKP } from '@lit-protocol/types';
import * as ethers from 'ethers';

import { 
  getAppViewRegistryContract, 
  getUserViewRegistryContract 
} from '../utils/contracts';
import { ParameterType } from '@/services/types/parameterTypes';
import { 
  AppView, 
  VersionParameter, 
  PolicyParameter, 
  PolicyWithParameters, 
  ToolWithPolicies 
} from '../types';

interface UseParameterManagementProps {
  appId: string | null;
  agentPKP?: IRelayPKP;
  appInfo: AppView | null;
  onStatusChange?: (message: string, type?: 'info' | 'warning' | 'success' | 'error') => void;
}

/**
 * This hook manages the parameters for an app version.
 * It handles loading, decoding, and updating parameters, as well as fetching version information.
 * Parameters are used to customize how an app interacts with tools and policies.
 */
export const useParameterManagement = ({
  appId,
  agentPKP,
  appInfo,
  onStatusChange
}: UseParameterManagementProps) => {
  const [parameters, setParameters] = useState<VersionParameter[]>([]);
  const [existingParameters, setExistingParameters] = useState<VersionParameter[]>([]);
  const [isLoadingParameters, setIsLoadingParameters] = useState<boolean>(false);
  const [versionInfo, setVersionInfo] = useState<any>(null);

  // Ref to track if we've already fetched parameters
  const parametersFetchedRef = useRef(false);
  
  /**
   * Decodes parameter values from their encoded form based on their type.
   * Handles different parameter types like INT256, UINT256, BOOL, ADDRESS, STRING, and their array versions.
   */
  const decodeParameterValue = useCallback((encodedValue: string, paramType: number) => {
    try {
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
  
  /**
   * Fetches existing parameters for the app from the smart contract.
   * This retrieves the current parameter values that were previously set for this PKP and app.
   * The parameters are then decoded and transformed into a user-friendly format.
   */
  const fetchExistingParameters = useCallback(async () => {
    // Safety check to ensure required values are present
    if (!appId) {
      console.error('Missing appId in fetchExistingParameters');
      return;
    }
    
    if (!agentPKP) {
      console.error('Missing agentPKP in fetchExistingParameters');
      return;
    }
    
    if (isLoadingParameters || existingParameters.length > 0 || parametersFetchedRef.current) {
      return;
    }
    
    parametersFetchedRef.current = true;
    setIsLoadingParameters(true);
    onStatusChange?.('Loading your existing app parameters...', 'info');
    
    try {
      console.log('Fetching parameters with:', { appId, tokenId: agentPKP.tokenId });
      const userViewContract = getUserViewRegistryContract();
      const appIdNum = Number(appId);
      
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
      onStatusChange?.('Successfully loaded your existing parameters', 'success');
      
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
      onStatusChange?.('Failed to load your existing parameters', 'error');
    } finally {
      setIsLoadingParameters(false);
    }
  }, [appId, agentPKP, decodeParameterValue, versionInfo, appInfo, isLoadingParameters, existingParameters, onStatusChange]);
  
  /**
   * Handles changes to the parameters in the form.
   * Updates the parameters state when user modifies values in the UI.
   */
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

  /**
   * Fetches version information for the specified app.
   * This provides details about the latest version of the app, including
   * tools, policies, and parameters that can be configured.
   */
  const fetchVersionInfo = useCallback(async () => {
    if (!appId || !appInfo) {
      console.error('Missing appId or appInfo in fetchVersionInfo');
      return null;
    }

    try {
      onStatusChange?.('Loading app version information...', 'info');
      const contract = getAppViewRegistryContract();
      const versionData = await contract.getAppVersion(Number(appId), Number(appInfo.latestVersion));
      console.log('Version info:', versionData);
      
      setVersionInfo(versionData);
      onStatusChange?.('Successfully loaded app version information', 'success');
      return versionData;
    } catch (err) {
      console.error('Error fetching version info:', err);
      onStatusChange?.('Failed to load app information', 'error');
      return null;
    }
  }, [appId, appInfo, onStatusChange]);

  return {
    parameters,
    setParameters,
    existingParameters,
    isLoadingParameters,
    versionInfo,
    fetchVersionInfo,
    decodeParameterValue,
    fetchExistingParameters,
    handleParametersChange
  };
}; 