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
  
  useEffect(() => {
    if (!versionData) return;
    
    // Prevent unnecessary re-processing if we've already initialized with these params
    if (initializedRef.current && parameters.length > 0) return;
    
    try {
      // Extract parameters from version data - this matches the structure shown in the example
      const toolsData = versionData[1]?.[3];
      
      if (!toolsData || !Array.isArray(toolsData)) return;
      
      const extractedParams: VersionParameter[] = [];
      console.log('Initializing version parameters form with existing parameters:', existingParameters);
      
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
                  // First: try to find a matching parameter by exact position (most reliable match)
                  let existingParam = existingParameters.find(p => 
                    p.toolIndex === toolIndex && 
                    p.policyIndex === policyIndex && 
                    p.paramIndex === paramIndex
                  );
                  
                  // If not found by position but name exists, try to find by name match
                  if (!existingParam && name) {
                    // Convert name to lowercase for case-insensitive matching
                    const paramName = typeof name === 'string' ? name.toLowerCase() : '';
                    
                    if (paramName) {
                      // Look for a parameter with the same name anywhere in existing parameters
                      existingParam = existingParameters.find(p => 
                        typeof p.name === 'string' && 
                        p.name.toLowerCase() === paramName
                      );
                      
                      if (existingParam) {
                        console.log(`Found parameter match by name: "${name}" (preserving value "${existingParam.value}")`);
                      }
                    }
                  }
                  
                  // Use existing value if found, otherwise use empty string based on type
                  let defaultValue: any = '';
                  const paramType = paramTypes[paramIndex];
                  
                  // Set appropriate default empty values based on parameter type
                  if (paramType === ParameterType.BOOL) {
                    defaultValue = false;
                  } else if (paramType === ParameterType.INT256 || paramType === ParameterType.UINT256) {
                    defaultValue = '0';
                  }
                  
                  const value = existingParam ? existingParam.value : defaultValue;
                  
                  extractedParams.push({
                    toolIndex,
                    policyIndex,
                    paramIndex,
                    name,
                    type: paramTypes[paramIndex],
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
        const preservedParams = extractedParams.filter(p => 
          p.value !== '' && p.value !== false && p.value !== '0'
        );
        
        if (preservedParams.length > 0) {
          console.log(`Preserved ${preservedParams.length} parameter values from previous version:`, 
            preservedParams.map(p => ({ name: p.name, value: p.value }))
          );
        }
        
        // Log which parameters are new and will start with empty values
        const newParams = extractedParams.filter(p => 
          p.value === '' || p.value === false || p.value === '0'
        );
        
        if (newParams.length > 0) {
          console.log(`${newParams.length} new parameters with empty values:`, 
            newParams.map(p => p.name)
          );
        }
      }
      
      // Set the parameters state without calling onChange directly
      setParameters(extractedParams);
      
      // Only after first initialization, set initial values via onChange
      if (!initializedRef.current && extractedParams.length > 0) {
        onChange(extractedParams);
        initializedRef.current = true;
      }
    } catch (error) {
      console.error('Error parsing version data:', error);
    }
  }, [versionData, existingParameters, onChange]);
  
  const handleParameterChange = (index: number, value: any) => {
    const updatedParams = [...parameters];
    updatedParams[index] = {
      ...updatedParams[index],
      value
    };
    
    setParameters(updatedParams);
    onChange(updatedParams);
  };
  
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
            onChange={(value) => handleParameterChange(index, value)}
          />
        ))}
      </div>
    </div>
  );
} 