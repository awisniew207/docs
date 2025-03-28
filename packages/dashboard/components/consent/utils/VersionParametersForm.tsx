import { useState, useEffect, useRef } from 'react';
import ParameterInput from './ParameterInput';
import { VersionParameter } from '../types';
import { ParameterType } from '@/services/types/parameterTypes';

interface VersionParametersFormProps {
  versionData: any;
  onChange: (parameters: VersionParameter[]) => void;
  existingParameters?: VersionParameter[];
}

export default function VersionParametersForm({
  versionData,
  onChange,
  existingParameters = []
}: VersionParametersFormProps) {
  const [parameters, setParameters] = useState<VersionParameter[]>([]);
  const initializedRef = useRef(false);
  const processedVersionRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!versionData) return;
    
    // Create a version key to detect changes in version data
    const versionKey = `${versionData[1]?.[0]}:${versionData[1]?.[1]}`;
    
    // When existingParameters change, we should re-initialize
    const shouldInitialize = !initializedRef.current || 
                             // Re-initialize when existing parameters are updated
                             (existingParameters && existingParameters.length > 0) ||
                             // Re-initialize when version data changes
                             (versionKey !== processedVersionRef.current);
    
    if (!shouldInitialize && parameters.length > 0) return;
    
    // Record the current version we're processing
    processedVersionRef.current = versionKey;
    
    try {
      // Extract parameters from version data - this matches the structure shown in the example
      const toolsData = versionData[1]?.[3];
      
      if (!toolsData || !Array.isArray(toolsData)) return;
      
      console.log(`Initializing parameters for version: ${versionKey}`);
      const extractedParams: VersionParameter[] = [];
      console.log('Initializing version parameters form with existing parameters:', existingParameters);
      
      // Debug information to help track parameter resolution
      if (existingParameters.length > 0) {
        console.log('Existing parameter details:');
        existingParameters.forEach(param => {
          console.log(`${param.name} (type: ${param.type}): ${param.value?.toString().substring(0, 30)}${param.value?.toString().length > 30 ? '...' : ''}`);
        });
      }
      
      // Loop through tools
      toolsData.forEach((tool, toolIndex) => {
        if (!tool || !Array.isArray(tool)) return;
        
        const policies = tool[1];
        
        // Loop through policies for each tool
        if (Array.isArray(policies)) {
          policies.forEach((policy, policyIndex) => {
            if (!policy || !Array.isArray(policy)) return;
            
            const paramNames = policy[1];
            const paramTypes = policy[2];
            
            // Loop through parameters for each policy
            if (Array.isArray(paramNames) && Array.isArray(paramTypes)) {
              paramNames.forEach((name, paramIndex) => {
                if (paramIndex < paramTypes.length) {
                  const paramType = paramTypes[paramIndex];
                  const paramName = typeof name === 'string' && name.trim() !== '' 
                    ? name.trim() 
                    : `param_${paramIndex}`;
                  
                  // Find existing parameter with matching criteria - using multiple strategies
                  let existingParam = null;
                  
                  // Strategy 1: Match by name AND type (most accurate)
                  existingParam = existingParameters.find(p => 
                    typeof p.name === 'string' && 
                    p.name.toLowerCase() === paramName.toLowerCase() &&
                    p.type === paramType
                  );
                  
                  if (existingParam) {
                    console.log(`Found parameter by name AND type: "${paramName}" (type: ${paramType})`);
                  }
                  
                  // Strategy 2: If not found, try matching by name only, but ONLY if types are compatible
                  if (!existingParam) {
                    const nameMatch = existingParameters.find(p => 
                      typeof p.name === 'string' && 
                      p.name.toLowerCase() === paramName.toLowerCase()
                    );
                    
                    // Only use name match if types are compatible
                    if (nameMatch) {
                      const isCompatible = areTypesCompatible(nameMatch.type, paramType);
                      
                      if (isCompatible) {
                        existingParam = nameMatch;
                        console.log(`Found parameter by name with compatible type: "${paramName}" (stored: ${nameMatch.type}, required: ${paramType})`);
                      } else {
                        console.log(`Found parameter by name but types incompatible: "${paramName}" (stored: ${nameMatch.type}, required: ${paramType})`);
                        // Don't use the value if types are incompatible
                      }
                    }
                  }
                  
                  // We explicitly DON'T fall back to position-based match anymore as this causes type issues
                  
                  // Use existing value if found, otherwise use empty string based on type
                  let defaultValue: any = '';
                  
                  // Set appropriate default empty values based on parameter type
                  if (paramType === ParameterType.BOOL) {
                    defaultValue = ''; // Use empty string as "not set" for booleans
                  } else if (paramType === ParameterType.INT256 || paramType === ParameterType.UINT256) {
                    defaultValue = '';  // Empty string for numbers
                  } else if (paramType === ParameterType.ADDRESS) {
                    defaultValue = '';  // Empty string for addresses
                  } else if (paramType === ParameterType.BOOL_ARRAY) {
                    defaultValue = '';  // Empty string for bool arrays
                  } else if (paramType === ParameterType.INT256_ARRAY || paramType === ParameterType.UINT256_ARRAY) {
                    defaultValue = '';  // Empty string for number arrays  
                  } else if (paramType === ParameterType.STRING_ARRAY || paramType === ParameterType.ADDRESS_ARRAY) {
                    defaultValue = '';  // Empty string for string/address arrays
                  }
                  
                  // After finding a match, process the value appropriately based on type
                  const processExistingValue = (existingValue: any, paramType: number) => {
                    // If no existing value, return appropriate default
                    if (existingValue === undefined || existingValue === null) {
                      return getDefaultForType(paramType);
                    }
                    
                    // For hex-encoded array values (often from contract), try to decode them
                    if (typeof existingValue === 'string' && 
                        existingValue.startsWith('0x') && 
                        existingValue.length > 42 && // Longer than a typical address
                        [ParameterType.INT256_ARRAY, 
                         ParameterType.UINT256_ARRAY, 
                         ParameterType.BOOL_ARRAY,
                         ParameterType.ADDRESS_ARRAY, 
                         ParameterType.STRING_ARRAY].includes(paramType)) {
                      
                      console.log(`Found hex-encoded array value for type ${paramType}: ${existingValue.substring(0, 20)}...`);
                      
                      // For hex-encoded arrays, convert to a more readable form if possible
                      try {
                        switch(paramType) {
                          case ParameterType.INT256_ARRAY:
                          case ParameterType.UINT256_ARRAY:
                            // For numeric arrays, try to extract values
                            // This is a simplified approach - a real decoder would be more robust
                            return existingValue; // Return as is for now, prevent empty value
                          case ParameterType.ADDRESS_ARRAY:
                            return existingValue; // Return as is for now, prevent empty value
                          case ParameterType.STRING_ARRAY:
                            return existingValue; // Return as is for now, prevent empty value
                          case ParameterType.BOOL_ARRAY:
                            return existingValue; // Return as is for now, prevent empty value
                          default:
                            return existingValue;
                        }
                      } catch (err) {
                        console.error(`Error processing encoded array value: ${err}`);
                        return existingValue; // Return as is to prevent data loss
                      }
                    }
                    
                    // Return value as is for other types
                    return existingValue;
                  }
                  
                  // Helper function to get default empty value for a type
                  const getDefaultForType = (paramType: number): any => {
                    switch(paramType) {
                      case ParameterType.BOOL:
                        return ''; // Use empty string as "not set" for booleans
                      case ParameterType.INT256:
                      case ParameterType.UINT256:
                        return '';  // Empty string for numbers
                      case ParameterType.ADDRESS:
                        return '';  // Empty string for addresses
                      case ParameterType.BOOL_ARRAY:
                      case ParameterType.INT256_ARRAY:
                      case ParameterType.UINT256_ARRAY:
                      case ParameterType.STRING_ARRAY:
                      case ParameterType.ADDRESS_ARRAY:
                        return '';  // Empty string for arrays
                      default:
                        return '';
                    }
                  }
                  
                  // Preserve value handling
                  const value = existingParam ? processExistingValue(existingParam.value, paramType) : getDefaultForType(paramType);
                  
                  if (existingParam) {
                    console.log(`Using existing value for "${paramName}": ${value} (type: ${paramType})`);
                  }
                  
                  extractedParams.push({
                    toolIndex,
                    policyIndex,
                    paramIndex,
                    name: paramName,
                    type: paramType,
                    value 
                  });
                }
              });
            }
          });
        }
      });
      
      // Log parameter initialization info - showing which parameters are new vs preserved
      if (!initializedRef.current) {
        console.log('Form initialized with parameters:', extractedParams);
        
        // Log which parameters had values preserved from previous version
        const preservedParams = extractedParams.filter(p => {
          // Empty string, false, and '0' are considered empty
          if (p.value === '' || p.value === false || p.value === '0') return false;
          
          // Address-specific checks
          if (p.type === ParameterType.ADDRESS) {
            // Check for default/empty addresses
            if (p.value === '0x0000000000000000000000000000000000000000' || 
                p.value === '0x...' ||
                p.value.startsWith('0x00000000000000000000000000000000000000')) {
              return false;
            }
          }
          
          // Array-specific checks
          if (p.type === ParameterType.ADDRESS_ARRAY || 
              p.type === ParameterType.STRING_ARRAY || 
              p.type === ParameterType.INT256_ARRAY || 
              p.type === ParameterType.UINT256_ARRAY ||
              p.type === ParameterType.BOOL_ARRAY) {
            
            // If it's an empty array or empty string
            if (Array.isArray(p.value) && p.value.length === 0) return false;
            if (typeof p.value === 'string' && p.value === '') return false;
            
            // If it's a comma-separated string, check if all values are empty
            if (typeof p.value === 'string') {
              const values = p.value.split(',').map(v => v.trim());
              if (values.every(v => v === '' || v === '0' || v === '0x...' || 
                              v.startsWith('0x00000000000000000000000000000000000000'))) {
                return false;
              }
            }
          }
          
          return true;
        });
        
        if (preservedParams.length > 0) {
          console.log(`Preserved ${preservedParams.length} parameter values from previous version:`, 
            preservedParams.map(p => ({ name: p.name, value: p.value }))
          );
        }
        
        // Log which parameters are new and will start with empty values
        const newParams = extractedParams.filter(p => !preservedParams.some(pp => 
          pp.toolIndex === p.toolIndex && 
          pp.policyIndex === p.policyIndex && 
          pp.paramIndex === p.paramIndex
        ));
        
        if (newParams.length > 0) {
          console.log(`${newParams.length} new parameters with empty values:`, 
            newParams.map(p => p.name)
          );
        }
      }
      
      // Set the parameters state without calling onChange directly
      setParameters(extractedParams);
      
      // Mark as initialized
      initializedRef.current = true;
      
    } catch (error) {
      console.error('Error parsing version data:', error);
    }
  }, [versionData, existingParameters]);
  
  // Separate useEffect to handle notifying parent component about parameter changes
  // This ensures we don't trigger state updates during render
  useEffect(() => {
    if (initializedRef.current && parameters.length > 0) {
      // Use setTimeout to defer the update to the next tick
      const timeoutId = setTimeout(() => {
        onChange(parameters);
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [parameters, onChange]);
  
  // Add debugging to track parameter changes
  const handleParameterChange = (updatedParam: VersionParameter) => {
    console.log(`Parameter changed: ${updatedParam.name} (${updatedParam.type}) = ${updatedParam.value}`);
    
    // Update the parameters state by replacing the matching parameter
    setParameters(prevParams => {
      const updatedParams = prevParams.map(param => {
        if (param.toolIndex === updatedParam.toolIndex &&
            param.policyIndex === updatedParam.policyIndex && 
            param.paramIndex === updatedParam.paramIndex) {
          return updatedParam;
        }
        return param;
      });
      
      return updatedParams;
    });
  };
  
  // Add a specific useEffect to handle applying existingParameters to the form
  useEffect(() => {
    // Only apply if we have both existing parameters and the form is already initialized
    if (existingParameters && existingParameters.length > 0 && initializedRef.current && parameters.length > 0) {
      // Use a ref to prevent multiple updates for the same set of parameters
      const existingParamsKey = existingParameters.map(p => `${p.name}:${p.value}`).join('|');
      const currentParamsKey = parameters.map(p => `${p.name}:${p.value}`).join('|');
      
      // Skip if the parameters haven't actually changed (prevents loops)
      if (existingParamsKey === currentParamsKey) {
        return;
      }
      
      console.log('Applying existing parameters to form fields:', existingParameters);
      
      // Create a copy of the current parameters
      const updatedParams = [...parameters];
      let hasChanges = false;
      
      // Apply each existing parameter value to the matching form field
      existingParameters.forEach(existingParam => {
        // Find the matching parameter in our form
        const formParamIndex = updatedParams.findIndex(p => 
          (p.name === existingParam.name) || // Match by name
          (p.toolIndex === existingParam.toolIndex && 
           p.policyIndex === existingParam.policyIndex && 
           p.paramIndex === existingParam.paramIndex) // Or match by position
        );
        
        if (formParamIndex !== -1) {
          // Only update if value is different (prevents needless rerenders)
          if (updatedParams[formParamIndex].value !== existingParam.value) {
            // Update the form parameter with the existing value
            updatedParams[formParamIndex] = {
              ...updatedParams[formParamIndex],
              value: existingParam.value
            };
            hasChanges = true;
            console.log(`Applied existing value for "${existingParam.name}": ${existingParam.value}`);
          }
        }
      });
      
      // Only update the parameters state if something actually changed
      if (hasChanges) {
        setParameters(updatedParams);
      }
    }
  // Remove parameters from dependency array to break the loop
  }, [existingParameters]);
  
  if (!parameters.length) {
    return null;
  }
  
  return (
    <div className="version-parameters">
      <h3>Parameter Inputs</h3>
      <div className="parameters-list">
        {parameters.map((param, index) => (
          <ParameterInput
            key={`${param.toolIndex}-${param.policyIndex}-${param.paramIndex}`}
            name={param.name}
            type={param.type}
            value={param.value}
            onChange={(value) => handleParameterChange({
              ...param,
              value
            })}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Helper function to check if two parameter types are compatible
 * This prevents issues like using a number as a boolean array
 */
function areTypesCompatible(storedType: number, requiredType: number): boolean {
  // If types are exactly the same, they're compatible
  if (storedType === requiredType) return true;
  
  // Check basic type compatibility
  const numericTypes = [ParameterType.INT256, ParameterType.UINT256];
  const stringTypes = [ParameterType.STRING, ParameterType.ADDRESS];
  const booleanTypes = [ParameterType.BOOL];
  
  // Numeric array types
  const numericArrayTypes = [ParameterType.INT256_ARRAY, ParameterType.UINT256_ARRAY];
  
  // String array types
  const stringArrayTypes = [ParameterType.STRING_ARRAY, ParameterType.ADDRESS_ARRAY];
  
  // Boolean array types
  const booleanArrayTypes = [ParameterType.BOOL_ARRAY];
  
  // Check within groups - numbers can be compatible with other numbers
  if (numericTypes.includes(storedType) && numericTypes.includes(requiredType)) return true;
  
  // Strings can be compatible with other strings
  if (stringTypes.includes(storedType) && stringTypes.includes(requiredType)) return true;
  
  // Numeric arrays can be compatible with other numeric arrays
  if (numericArrayTypes.includes(storedType) && numericArrayTypes.includes(requiredType)) return true;
  
  // String arrays can be compatible with other string arrays
  if (stringArrayTypes.includes(storedType) && stringArrayTypes.includes(requiredType)) return true;
  
  // For all other cases, types are not compatible
  return false;
}

// Function to process an existing value based on parameter type
function processExistingValue(type: ParameterType, value: any): any {
  console.log(`Processing existing value for type ${type}:`, value);
  
  // Return default for undefined or null values
  if (value === undefined || value === null) {
    return getDefaultForType(type);
  }

  // Handle hex-encoded values for arrays (they need special processing)
  if (typeof value === 'string' && value.startsWith('0x') && value.length > 42) {
    console.log(`Found hex-encoded value for ${type}:`, value.substring(0, 20) + '...');
    
    // Return empty string for hex-encoded arrays - they'll be handled by contract directly
    if ([
      ParameterType.INT256_ARRAY,
      ParameterType.UINT256_ARRAY,
      ParameterType.BOOL_ARRAY,
      ParameterType.ADDRESS_ARRAY,
      ParameterType.STRING_ARRAY
    ].includes(type)) {
      return '';
    }
  }
  
  return value;
}

// Helper to get default values by type
function getDefaultForType(type: ParameterType): any {
  switch (type) {
    case ParameterType.BOOL:
      return '';
    case ParameterType.INT256:
    case ParameterType.UINT256:
      return '';
    case ParameterType.ADDRESS:
      return '0x...';
    case ParameterType.STRING:
      return '';
    case ParameterType.INT256_ARRAY:
    case ParameterType.UINT256_ARRAY:
    case ParameterType.BOOL_ARRAY:
    case ParameterType.ADDRESS_ARRAY:
    case ParameterType.STRING_ARRAY:
      return '';
    default:
      return '';
  }
}

function preserveExistingValues(
  parameterNames: string[],
  parameterTypes: ParameterType[],
  existingParameters: VersionParameter[]
): Record<string, any> {
  const initialValues: Record<string, any> = {};
  console.log('Preserving values from existing parameters:', existingParameters);

  // Create lookup map for existing parameters by name & type for faster access
  const existingParamsMap = new Map<string, VersionParameter>();
  existingParameters.forEach(param => {
    const key = `${param.name}:${param.type}`;
    existingParamsMap.set(key, param);
  });

  for (let i = 0; i < parameterNames.length; i++) {
    const name = parameterNames[i];
    const type = parameterTypes[i];
    const key = `${name}:${type}`;
    
    // First try exact match by name and type
    const existingParam = existingParamsMap.get(key);
    
    if (existingParam) {
      console.log(`Found existing parameter for ${name} (${type}):`, 
        typeof existingParam.value === 'string' && existingParam.value.length > 30 
          ? existingParam.value.substring(0, 30) + '...' 
          : existingParam.value);
      
      initialValues[name] = processExistingValue(type, existingParam.value);
    } else {
      console.log(`No existing parameter found for ${name} (${type}), using default`);
      initialValues[name] = getDefaultForType(type);
    }
  }
  
  console.log('Initial values for form:', initialValues);
  return initialValues;
} 