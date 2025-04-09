import { useState, useEffect, useRef } from 'react';
import ParameterInput from './ParameterInput';
import { VersionParameter, ContractVersionResult } from '../../types';
import { decodeParameterValue } from '../../utils/parameterDecoding';

interface VersionParametersFormProps {
  versionInfo: ContractVersionResult;
  onChange: (parameters: VersionParameter[]) => void;
  existingParameters?: VersionParameter[];
}

export default function VersionParametersForm({
  versionInfo,
  onChange,
  existingParameters = []
}: VersionParametersFormProps) {
  const [parameters, setParameters] = useState<VersionParameter[]>([]);
  const initializedRef = useRef(false);
  const processedVersionRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Generate a version key for tracking changes
    let versionKey: string;
    
    try {
      // Use named properties instead of array indices
      versionKey = `${versionInfo.app.id.hex}:${versionInfo.appVersion.version.hex}`;
    } catch (error) {
      console.error('Error generating version key:', error);
      versionKey = 'unknown';
    }
    
    const shouldInitialize = !initializedRef.current || 
                             existingParameters.length > 0 ||
                             versionKey !== processedVersionRef.current;
    
    if (!shouldInitialize && parameters.length > 0) return;
    
    processedVersionRef.current = versionKey;
    
    try {
      const tools = versionInfo.appVersion.tools;
      
      if (!Array.isArray(tools) || tools.length === 0) {
        console.warn('No tools array found or empty tools array');
        setParameters([]);
        initializedRef.current = true;
        return;
      }

      const extractedParams: VersionParameter[] = [];
      
      tools.forEach((tool, toolIndex) => {
        if (!tool) return;
        const policies = tool.policies;
        
        if (!Array.isArray(policies) || policies.length === 0) {
          return;
        }
        
        policies.forEach((policy, policyIndex) => {
          if (!policy) return;
          const parameterNames = policy.parameterNames;
          const parameterTypes = policy.parameterTypes;
          
          if (!Array.isArray(parameterNames) || !Array.isArray(parameterTypes)) {
            return;
          }
          
          parameterNames.forEach((name, paramIndex) => {
            if (paramIndex < parameterTypes.length) {
              const paramType = parameterTypes[paramIndex];
              const paramName = typeof name === 'string' && name.trim() !== '' 
                ? name.trim() 
                : `param_${paramIndex}`;
              
              let existingParam = existingParameters.find(p => 
                typeof p.name === 'string' && 
                p.name.toLowerCase() === paramName.toLowerCase() &&
                p.type === paramType
              );
              
              extractedParams.push({
                toolIndex,
                policyIndex,
                paramIndex,
                name: paramName,
                type: paramType,
                value: existingParam ? existingParam.value : ''
              });
            }
          });
        });
      });

      setParameters(extractedParams);
      initializedRef.current = true;
      
    } catch (error) {
      console.error('Error parsing version data:', error);
      setParameters([]);
      initializedRef.current = true;
    }
  }, [versionInfo, existingParameters]);
  
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
    if (existingParameters.length > 0 && initializedRef.current && parameters.length > 0) {
      // Use a ref to prevent multiple updates for the same set of parameters
      const existingParamsKey = existingParameters.map(p => `${p.name}:${p.value}`).join('|');
      const currentParamsKey = parameters.map(p => `${p.name}:${p.value}`).join('|');
      
      // Skip if the parameters haven't actually changed (prevents loops)
      if (existingParamsKey === currentParamsKey) {
        return;
      }
      // Create a copy of the current parameters
      const updatedParams = [...parameters];
      let hasChanges = false;
      
      // Apply each existing parameter value to the matching form field
      existingParameters.forEach(existingParam => {
        // Find the matching parameter in our form
        const formParamIndex = updatedParams.findIndex(p => 
          // Match by name AND type to avoid type mismatches
          (p.name === existingParam.name && p.type === existingParam.type) || 
          // Match by position AND type
          (p.toolIndex === existingParam.toolIndex && 
           p.policyIndex === existingParam.policyIndex && 
           p.paramIndex === existingParam.paramIndex &&
           p.type === existingParam.type) // Ensure type matches
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
  
  if (parameters.length === 0) {
    return (
      <div className="version-parameters">
        <h3>Parameter Inputs</h3>
        <div className="parameters-list">
          <p style={{padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', 
                     border: '1px solid #e9ecef', color: '#495057'}}>
            No parameter inputs found for this application version.
          </p>
        </div>
      </div>
    );
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
