import { useState, useEffect } from 'react';
import { ParameterType, mapEnumToTypeName } from '../../../services/types/parameterTypes';

interface ParameterInputProps {
  name: string;
  type: number;
  onChange: (value: any) => void;
  value?: any;
}

export default function ParameterInput({ name, type, onChange, value }: ParameterInputProps) {
  const [inputValue, setInputValue] = useState<any>(value || '');
  const typeName = mapEnumToTypeName(type);
  
  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Convert value based on type
    let parsedValue: any;
    switch (type) {
      case ParameterType.INT256:
      case ParameterType.UINT256:
        parsedValue = newValue ? parseInt(newValue, 10) : 0;
        break;
      case ParameterType.BOOL:
        parsedValue = newValue === 'true';
        break;
      case ParameterType.INT256_ARRAY:
      case ParameterType.UINT256_ARRAY:
        parsedValue = newValue ? newValue.split(',').map(v => parseInt(v.trim(), 10)) : [];
        break;
      case ParameterType.BOOL_ARRAY:
        parsedValue = newValue ? newValue.split(',').map(v => v.trim() === 'true') : [];
        break;
      case ParameterType.STRING_ARRAY:
      case ParameterType.ADDRESS_ARRAY:
      case ParameterType.BYTES_ARRAY:
        parsedValue = newValue ? newValue.split(',').map(v => v.trim()) : [];
        break;
      default:
        parsedValue = newValue;
    }
    
    onChange(parsedValue);
  };

  const renderInputField = () => {
    switch (type) {
      case ParameterType.INT256:
      case ParameterType.UINT256:
        return (
          <input
            type="number"
            value={inputValue}
            onChange={handleChange}
            className="parameter-input"
            placeholder={`Enter a ${typeName} value`}
          />
        );
      
      case ParameterType.BOOL:
        return (
          <select
            value={inputValue.toString()}
            onChange={(e) => {
              setInputValue(e.target.value);
              onChange(e.target.value === 'true');
            }}
            className="parameter-input"
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        );
      
      case ParameterType.ADDRESS:
        return (
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            className="parameter-input"
            placeholder="0x..."
            pattern="^0x[a-fA-F0-9]{40}$"
          />
        );
      
      case ParameterType.BYTES:
        return (
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            className="parameter-input"
            placeholder="0x..."
            pattern="^0x[a-fA-F0-9]*$"
          />
        );
      
      case ParameterType.INT256_ARRAY:
      case ParameterType.UINT256_ARRAY:
      case ParameterType.BOOL_ARRAY:
      case ParameterType.STRING_ARRAY:
      case ParameterType.ADDRESS_ARRAY:
      case ParameterType.BYTES_ARRAY:
        return (
          <textarea
            value={inputValue}
            onChange={handleChange}
            className="parameter-input parameter-input--array"
            placeholder={`Enter comma-separated ${typeName} values`}
            rows={3}
          />
        );
      
      // Default to string input
      default:
        return (
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            className="parameter-input"
            placeholder={`Enter a ${typeName} value`}
          />
        );
    }
  };

  return (
    <div className="parameter-field">
      <label className="parameter-label">
        {name} <span className="parameter-type">({typeName})</span>
      </label>
      {renderInputField()}
    </div>
  );
} 