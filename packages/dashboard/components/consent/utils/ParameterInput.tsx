import { useState, useEffect, useCallback } from 'react';
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
  
  // Update local state when prop value changes
  useEffect(() => {
    if (value !== undefined && value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  // Memoize handlers to prevent recreating on each render
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Convert value based on type
    let parsedValue: any;
    switch (type) {
      case ParameterType.INT256:
        // Special case for just typing a minus sign
        if (newValue === '-') {
          parsedValue = newValue; // Keep as-is for now
        } else {
          try {
            parsedValue = newValue ? parseInt(newValue, 10) : 0;
            if (isNaN(parsedValue)) parsedValue = 0;
          } catch (e) {
            parsedValue = 0;
          }
        }
        break;
      case ParameterType.UINT256:
        try {
          parsedValue = newValue ? parseInt(newValue, 10) : 0;
          // Ensure non-negative for uint256
          parsedValue = isNaN(parsedValue) || parsedValue < 0 ? 0 : parsedValue;
        } catch (e) {
          parsedValue = 0;
        }
        break;
      case ParameterType.BOOL:
        parsedValue = newValue === 'true';
        break;
      case ParameterType.INT256_ARRAY:
      case ParameterType.UINT256_ARRAY:
        try {
          parsedValue = newValue 
            ? newValue.split(',')
                .map(v => {
                  try {
                    const num = parseInt(v.trim(), 10);
                    return isNaN(num) ? 0 : num;
                  } catch (e) {
                    return 0;
                  }
                })
            : [];
        } catch (e) {
          parsedValue = [];
        }
        break;
      case ParameterType.BOOL_ARRAY:
        // For boolean arrays, properly parse each item
        parsedValue = newValue 
          ? newValue.split(',').map(v => {
              const trimmed = v.trim().toLowerCase();
              return trimmed === 'true' || 
                     trimmed === '1' || 
                     trimmed === 'yes' || 
                     trimmed === 'y' || 
                     trimmed === 'on';
            }) 
          : [];
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
  }, [type, onChange]);

  // Special handler for number array inputs to prevent NaN values
  const handleNumberArrayChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawValue = e.target.value;
    
    // Keep the raw input value in the textarea
    setInputValue(rawValue);
    
    // Parse the comma-separated values, replacing invalid numbers with 0
    try {
      const parsedArray = rawValue 
        ? rawValue.split(',')
            .map(item => {
              const trimmed = item.trim();
              // Handle empty input
              if (trimmed === '') return 0;
              
              // Special case for just a minus sign (typing in progress)
              if (trimmed === '-') {
                // For int256 arrays, we'll allow this temporarily during typing
                return type === ParameterType.INT256_ARRAY ? '-' : 0;
              }
              
              // Parse the number correctly including negative sign
              const num = parseInt(trimmed, 10);
              
              // For uint256 arrays, ensure non-negative
              if (type === ParameterType.UINT256_ARRAY && num < 0) {
                return 0;
              }
              
              return isNaN(num) ? 0 : num;
            })
        : [];
      
      onChange(parsedArray);
    } catch (error) {
      console.error('Error parsing number array:', error);
      onChange([]);
    }
  };

  // Special handler specifically for int256 inputs to better handle negative numbers
  const handleIntChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Always preserve the raw input to allow typing of negative signs
    setInputValue(rawValue);
    
    // Special case for just typing a minus sign
    if (rawValue === '-') {
      // Don't convert to a number yet, just keep the dash
      onChange(rawValue);
      return;
    }
    
    // Otherwise parse as a number when possible
    let parsedValue: number;
    try {
      parsedValue = rawValue ? parseInt(rawValue, 10) : 0;
      if (isNaN(parsedValue)) parsedValue = 0;
    } catch (e) {
      parsedValue = 0;
    }
    
    onChange(parsedValue);
  };

  // Handler for individual boolean array items
  const handleBoolArrayItem = (index: number, checked: boolean) => {
    // Get current array or initialize empty array
    const currentArray = Array.isArray(inputValue) ? [...inputValue] : 
                        (typeof inputValue === 'string' && inputValue.length > 0) ? 
                          inputValue.split(',').map(v => {
                            const trimmed = v.trim().toLowerCase();
                            return trimmed === 'true' || 
                                  trimmed === '1' || 
                                  trimmed === 'yes' || 
                                  trimmed === 'y' || 
                                  trimmed === 'on';
                          }) : 
                          [];
    
    // Update the value at the specified index
    if (index >= currentArray.length) {
      // Extend array if needed
      while (currentArray.length < index) {
        currentArray.push(false);
      }
      currentArray.push(checked);
    } else {
      currentArray[index] = checked;
    }
    
    // Convert array to string representation for the textarea
    const stringValue = currentArray.join(', ');
    setInputValue(stringValue);
    
    // Pass the actual array to parent
    onChange(currentArray);
  };

  // Add a new boolean to the array
  const addBoolToArray = () => {
    handleBoolArrayItem(
      Array.isArray(inputValue) ? inputValue.length : 
      typeof inputValue === 'string' && inputValue.length > 0 ? 
        inputValue.split(',').length : 0,
      false
    );
  };

  // Format number array for display - this helps prevent NaN from showing
  const formatNumberArrayForDisplay = (value: any): string => {
    if (Array.isArray(value)) {
      return value.join(', ');
    } else if (typeof value === 'string') {
      return value;
    }
    return '';
  };

  const renderInputField = () => {
    switch (type) {
      case ParameterType.INT256:
        return (
          <input
            type="number"
            value={inputValue}
            onChange={handleIntChange}
            className="parameter-input"
            placeholder="Enter an int256 value (can be negative)"
          />
        );
      
      case ParameterType.UINT256:
        return (
          <input
            type="number"
            value={inputValue}
            onChange={handleChange}
            className="parameter-input"
            placeholder="Enter a uint256 value (non-negative)"
            min="0"
          />
        );
      
      case ParameterType.BOOL:
        return (
          <select
            value={String(inputValue)}
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
      
      case ParameterType.BOOL_ARRAY:
        // Parse the current array values for displaying checkboxes
        const boolArray = Array.isArray(inputValue) ? inputValue : 
                       typeof inputValue === 'string' && inputValue.length > 0 ? 
                       inputValue.split(',').map(v => {
                         const trimmed = v.trim().toLowerCase();
                         return trimmed === 'true' || 
                                trimmed === '1' || 
                                trimmed === 'yes' || 
                                trimmed === 'y' || 
                                trimmed === 'on';
                       }) : [];
                       
        return (
          <div className="bool-array-input">
            <textarea
              value={inputValue}
              onChange={handleChange}
              className="parameter-input parameter-input--array"
              placeholder={`Enter comma-separated ${typeName} values (true, false)`}
              rows={3}
            />
            <div className="bool-array-items">
              {boolArray.map((isChecked, index) => (
                <div key={index} className="bool-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleBoolArrayItem(index, e.target.checked)}
                    />
                    Item {index + 1}
                  </label>
                </div>
              ))}
              <button 
                type="button" 
                className="bool-add-btn"
                onClick={addBoolToArray}
              >
                + Add Boolean
              </button>
            </div>
          </div>
        );
      
      case ParameterType.INT256_ARRAY:
        return (
          <div className="number-array-input">
            <textarea
              value={inputValue}
              onChange={handleNumberArrayChange}
              className="parameter-input parameter-input--array"
              placeholder="Enter comma-separated int256 values (e.g. -42, 0, 123)"
              rows={3}
            />
            <div className="number-array-help">
              Enter comma-separated numbers (can include negative values). Invalid entries will be converted to 0.
            </div>
          </div>
        );
      
      case ParameterType.UINT256_ARRAY:
        return (
          <div className="number-array-input">
            <textarea
              value={inputValue}
              onChange={handleNumberArrayChange}
              className="parameter-input parameter-input--array"
              placeholder="Enter comma-separated uint256 values (e.g. 42, 123, 456)"
              rows={3}
            />
            <div className="number-array-help">
              Enter comma-separated non-negative numbers. Invalid entries will be converted to 0.
            </div>
          </div>
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
          <div className="bytes-input">
            <input
              type="text"
              value={inputValue}
              onChange={handleChange}
              className="parameter-input"
              placeholder="Enter bytes (0x1234... or plain text)"
              pattern="^(0x[a-fA-F0-9]*|.*)$"
            />
            <div className="bytes-help">
              Enter bytes as hex with 0x prefix (0x1234...) for raw binary data, or as plain text to be encoded as UTF-8.
            </div>
          </div>
        );
      
      case ParameterType.STRING_ARRAY:
      case ParameterType.ADDRESS_ARRAY:
        return (
          <textarea
            value={inputValue}
            onChange={handleChange}
            className="parameter-input parameter-input--array"
            placeholder={`Enter comma-separated ${typeName} values`}
            rows={3}
          />
        );
      
      case ParameterType.BYTES_ARRAY:
        return (
          <div className="bytes-array-input">
            <textarea
              value={inputValue}
              onChange={handleChange}
              className="parameter-input parameter-input--array"
              placeholder="Enter comma-separated bytes values (0x1234... or plain text)"
              rows={3}
            />
            <div className="bytes-array-help">
              Enter comma-separated bytes values. Use 0x prefix for hex values (0x1234...), or plain text for UTF-8 encoding.
            </div>
          </div>
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