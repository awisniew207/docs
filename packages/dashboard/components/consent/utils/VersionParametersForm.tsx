import { useState, useEffect } from 'react';
import ParameterInput from './ParameterInput';

interface VersionParameter {
  toolIndex: number;
  policyIndex: number;
  paramIndex: number;
  name: string;
  type: number;
  value: any;
}

interface VersionParametersFormProps {
  versionData: any;
  onChange: (parameters: VersionParameter[]) => void;
}

export default function VersionParametersForm({
  versionData,
  onChange
}: VersionParametersFormProps) {
  const [parameters, setParameters] = useState<VersionParameter[]>([]);
  
  useEffect(() => {
    if (!versionData) return;
    
    try {
      // Extract parameters from version data - this matches the structure shown in the example
      const toolsData = versionData[1]?.[3];
      
      if (!toolsData || !Array.isArray(toolsData)) return;
      
      const extractedParams: VersionParameter[] = [];
      
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
                  extractedParams.push({
                    toolIndex,
                    policyIndex,
                    paramIndex,
                    name,
                    type: paramTypes[paramIndex],
                    value: '' // Default empty value
                  });
                }
              });
            }
          });
        }
      });
      
      setParameters(extractedParams);
    } catch (error) {
      console.error('Error parsing version data:', error);
    }
  }, [versionData]);
  
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