import { useState, useEffect, useCallback } from 'react';
import { ParameterType, mapEnumToTypeName } from '../../../../services/types/parameterTypes';
import { z } from 'zod';

// Define Zod schemas for different parameter types
const zodSchemas: Record<number, z.ZodTypeAny> = {
  // Basic types
  [ParameterType.INT256]: z.union([
    z.string().refine(val => val === '' || val === '-' || !isNaN(parseInt(val)), {
      message: "Must be a valid integer or empty"
    }),
    z.number().int(),
    z.literal('')
  ]).optional(),
  
  [ParameterType.UINT256]: z.union([
    z.string().refine(val => val === '' || (!isNaN(parseInt(val)) && parseInt(val) >= 0), {
      message: "Must be a non-negative integer or empty"
    }),
    z.number().int().nonnegative(),
    z.literal('')
  ]).optional(),
  
  [ParameterType.BOOL]: z.union([
    z.boolean(), 
    z.literal(''), 
    z.enum(['true', 'false', 'not_set'])
  ]).optional(),
  
  [ParameterType.ADDRESS]: z.union([
    z.string().regex(/^(0x[a-fA-F0-9]{40}|0x\.\.\.|)$/, {
      message: "Must be a valid Ethereum address, 0x..., or empty"
    }), 
    z.literal('')
  ]).optional(),
  
  [ParameterType.STRING]: z.string().optional(),
  
  // Array types
  [ParameterType.INT256_ARRAY]: z.union([
    z.string().refine(val => {
      if (val === '') return true;
      return val.split(',').every(item => {
        const trimmed = item.trim();
        return trimmed === '' || trimmed === '-' || !isNaN(parseInt(trimmed));
      });
    }, {
      message: "Must be comma-separated integers or empty"
    }),
    z.array(z.union([z.number().int(), z.string(), z.literal('')])),
    z.literal('')
  ]).optional(),
  
  [ParameterType.UINT256_ARRAY]: z.union([
    z.string().refine(val => {
      if (val === '') return true;
      return val.split(',').every(item => {
        const trimmed = item.trim();
        return trimmed === '' || (!isNaN(parseInt(trimmed)) && parseInt(trimmed) >= 0);
      });
    }, {
      message: "Must be comma-separated non-negative integers or empty"
    }),
    z.array(z.union([z.number().int().nonnegative(), z.string(), z.literal('')])),
    z.literal('')
  ]).optional(),
  
  [ParameterType.BOOL_ARRAY]: z.union([
    z.string().refine(val => {
      if (val === '') return true;
      return val.split(',').every(item => {
        const trimmed = item.trim().toLowerCase();
        return trimmed === '' || 
               ['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'].includes(trimmed);
      });
    }, {
      message: "Must be comma-separated boolean values or empty"
    }),
    z.array(z.union([z.boolean(), z.string(), z.literal('')])),
    z.literal('')
  ]).optional(),
  
  [ParameterType.ADDRESS_ARRAY]: z.union([
    z.string().refine(val => {
      if (val === '') return true;
      return val.split(',').every(item => {
        const trimmed = item.trim();
        return trimmed === '' || 
               trimmed === '0x...' || 
               /^0x[a-fA-F0-9]{40}$/.test(trimmed);
      });
    }, {
      message: "Must be comma-separated Ethereum addresses or empty"
    }),
    z.array(z.string()),
    z.literal('')
  ]).optional(),
  
  [ParameterType.STRING_ARRAY]: z.union([
    z.string(),
    z.array(z.string()),
    z.literal('')
  ]).optional(),
};

interface ParameterInputProps {
  name: string;
  type: number;
  onChange: (value: any) => void;
  value?: any;
}

export default function ParameterInput({ name, type, onChange, value }: ParameterInputProps) {
  const [inputValue, setInputValue] = useState<any>(value || '');
  const [error, setError] = useState<string | null>(null);
  const typeName = mapEnumToTypeName(type);
  

  const schema = zodSchemas[type] || z.any();
  
  useEffect(() => {
    if (value !== undefined && value !== inputValue) {
      setInputValue(value);
      validateValue(value);
    }
  }, [value]);

  const validateValue = useCallback((val: any) => {
    try {
      schema.parse(val);
      setError(null);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message || 'Invalid value');
      } else {
        setError('Invalid value');
      }
      return false;
    }
  }, [schema]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Validate the new value
    if (validateValue(newValue)) {
      // Convert value based on type
      let parsedValue: any;
      switch (type) {
        case ParameterType.INT256:
          // Special case for just typing a minus sign
          if (newValue === '-') {
            parsedValue = newValue;
          } else if (newValue === '') {
            parsedValue = '';
          } else {
            try {
              // Keep as string but validate by parsing (don't assign the parsed number)
              const num = parseInt(newValue, 10);
              parsedValue = isNaN(num) ? '' : newValue;
            } catch (e) {
              parsedValue = '';
            }
          }
          break;
        case ParameterType.UINT256:
          if (newValue === '') {
            parsedValue = ''; // Keep empty string
          } else {
            try {
              parsedValue = parseInt(newValue, 10);
              parsedValue = isNaN(parsedValue) ? '' : Math.max(0, parsedValue);
            } catch (e) {
              parsedValue = '';
            }
          }
          break;
        case ParameterType.BOOL:
          if (newValue === "not_set" || newValue === "") {
            parsedValue = "";
          } else {
            parsedValue = newValue === 'true';
          }
          break;
        case ParameterType.INT256_ARRAY:
          if (newValue === '') {
            parsedValue = '';
          } else {
            parsedValue = newValue.split(',').map(v => {
              const trimmed = v.trim();
              if (trimmed === '' || trimmed === '-') return trimmed;
              
              const num = parseInt(trimmed, 10);
              return isNaN(num) ? '' : num;
            });
          }
          break;
        case ParameterType.UINT256_ARRAY:
          if (newValue === '') {
            parsedValue = ''; // Keep empty string for empty array
          } else {
            parsedValue = newValue.split(',').map(v => {
              const trimmed = v.trim();
              if (trimmed === '') return trimmed;
              
              const num = parseInt(trimmed, 10);
              return isNaN(num) ? '' : Math.max(0, num);
            });
          }
          break;
        case ParameterType.BOOL_ARRAY:
          if (newValue === '') {
            parsedValue = ''; // Keep empty string for empty array
          } else {
            parsedValue = newValue.split(',').map(v => {
              const trimmed = v.trim().toLowerCase();
              if (trimmed === '') return '';
              
              return ['true', '1', 'yes', 'y', 'on'].includes(trimmed);
            });
          }
          break;
        case ParameterType.STRING_ARRAY:
          if (newValue === '') {
            parsedValue = ''; // Keep empty string for empty array
            parsedValue = newValue.split(',').map(v => v.trim());
          }
          break;
        case ParameterType.ADDRESS_ARRAY:
          if (newValue === '') {
            parsedValue = ''; // Keep empty string for empty array
          } else {
            // Get cleaned array of addresses
            parsedValue = newValue.split(',').map(v => v.trim());
          }
          break;
        case ParameterType.STRING:
          // Strings can use as-is
          parsedValue = newValue;
          break;
        case ParameterType.ADDRESS:
          // Addresses should be trimmed
          parsedValue = newValue.trim();
          break;
        default:
          parsedValue = newValue;
      }
      
      onChange(parsedValue);
    }
  }, [type, onChange, validateValue]);

  // Add these helper functions for array manipulation
  const addArrayItem = (defaultValue: any = '') => {
    // Get current array or initialize empty array
    const currentArray = Array.isArray(inputValue) ? [...inputValue] : 
                        (typeof inputValue === 'string' && inputValue.length > 0) ? 
                          inputValue.split(',').map(v => v.trim()) : 
                          [];
    
    if (type === ParameterType.INT256_ARRAY || type === ParameterType.UINT256_ARRAY) {
      defaultValue = ''; // Use empty string instead of 0 for numeric arrays
    }
    
    // Add the new item
    currentArray.push(defaultValue);
    
    // Update state
    const stringValue = currentArray.join(', ');
    setInputValue(stringValue);
    
    // Pass to parent
    if (validateValue(currentArray)) {
      onChange(currentArray);
    }
  };

  const removeArrayItem = (index: number) => {
    // Get current array or initialize empty array
    const currentArray = Array.isArray(inputValue) ? [...inputValue] : 
                        (typeof inputValue === 'string' && inputValue.length > 0) ? 
                          inputValue.split(',').map(v => v.trim()) : 
                          [];
    
    // Remove the item at the specified index
    if (index >= 0 && index < currentArray.length) {
      currentArray.splice(index, 1);
      
      const stringValue = currentArray.length > 0 ? currentArray.join(', ') : '';
      setInputValue(stringValue);
      

      if (validateValue(currentArray)) {
        // Remove only empty values from end of array
        let trimmedArray = [...currentArray];
        while (trimmedArray.length > 0 && trimmedArray[trimmedArray.length - 1] === '') {
          trimmedArray.pop();
        }
        
        // If all elements were removed or only empty elements remain, return empty string
        if (trimmedArray.length === 0) {
          onChange('');
        } else {
          onChange(trimmedArray);
        }
      }
    }
  };

  const updateArrayItem = (index: number, value: any) => {
    // Get current array or initialize empty array
    const currentArray = Array.isArray(inputValue) ? [...inputValue] : 
                        (typeof inputValue === 'string' && inputValue.length > 0) ? 
                          inputValue.split(',').map(v => v.trim()) : 
                          [];
    
    // Update the value at the specified index
    if (index >= 0 && index < currentArray.length) {
      currentArray[index] = value;
      
      // Update state
      const stringValue = currentArray.join(', ');
      setInputValue(stringValue);
      
      // Pass to parent
      if (validateValue(currentArray)) {
        // Remove only empty values from end of array
        let trimmedArray = [...currentArray];
        while (trimmedArray.length > 0 && trimmedArray[trimmedArray.length - 1] === '') {
          trimmedArray.pop();
        }
        
        onChange(trimmedArray.length > 0 ? trimmedArray : '');
      }
    }
  };

  // Render array input fields dynamically
  const renderArrayFields = (arrayType: ParameterType) => {
    // Parse the current value into an array
    const currentArray = Array.isArray(inputValue) ? [...inputValue] : 
                        (typeof inputValue === 'string' && inputValue.length > 0) ? 
                          inputValue.split(',').map(v => v.trim()) : 
                          [];
    
    // Get the appropriate input type based on the array type
    let inputType = 'text';
    let placeholder = '';
    let defaultValue: any = '';
    
    switch (arrayType) {
      case ParameterType.INT256_ARRAY:
        inputType = 'number';
        placeholder = 'Enter an integer';
        defaultValue = '';
        break;
      case ParameterType.UINT256_ARRAY:
        inputType = 'number';
        placeholder = 'Enter a non-negative integer';
        defaultValue = '';
        break;
      case ParameterType.BOOL_ARRAY:
        inputType = 'checkbox';
        placeholder = '';
        defaultValue = false;
        break;
      case ParameterType.ADDRESS_ARRAY:
        inputType = 'text';
        placeholder = '0x...';
        defaultValue = '';
        break;
      case ParameterType.STRING_ARRAY:
        inputType = 'text';
        placeholder = 'Enter a string';
        defaultValue = '';
        break;
    }
    
    return (
      <div className="array-inputs">
        {currentArray.length === 0 ? (
          <div className="empty-array-message">No items added yet</div>
        ) : (
          currentArray.map((item, index) => (
            <div key={index} className="array-item">
              {arrayType === ParameterType.BOOL_ARRAY ? (
                <div className="bool-array-item">
                  <input
                    type="checkbox"
                    checked={item === true || item === 'true'}
                    onChange={(e) => updateArrayItem(index, e.target.checked)}
                  />
                  <span className="bool-array-item-label">
                    Item {index + 1}: {item === true || item === 'true' ? 'True' : 'False'}
                  </span>
                </div>
              ) : (
                <input
                  type={inputType}
                  value={item}
                  min={arrayType === ParameterType.UINT256_ARRAY ? "0" : undefined}
                  placeholder={placeholder}
                  onChange={(e) => updateArrayItem(index, e.target.value)}
                  className="array-item-input"
                />
              )}
              <button
                type="button"
                onClick={() => removeArrayItem(index)}
                className="array-item-remove-btn"
                aria-label="Remove item"
              >
                ✕
              </button>
            </div>
          ))
        )}
        
        <div className="array-actions">
          <button
            type="button"
            className="parameter-input btn-add-item"
            onClick={() => addArrayItem(defaultValue)}
          >
            Add Item
          </button>
        </div>
      </div>
    );
  };

  const renderInputField = () => {
    switch (type) {
      case ParameterType.INT256:
        return (
          <input
            type="number"
            value={inputValue}
            onChange={handleChange}
            className={`parameter-input ${error ? 'input-error' : ''}`}
            placeholder="Enter an int256 value (can be negative)"
          />
        );
      
      case ParameterType.UINT256:
        return (
          <input
            type="number"
            value={inputValue}
            onChange={handleChange}
            className={`parameter-input ${error ? 'input-error' : ''}`}
            placeholder="Enter a uint256 value (non-negative)"
            min="0"
          />
        );
      
      case ParameterType.BOOL:
        return (
          <select
            value={String(inputValue)}
            onChange={(e) => {
              const newValue = e.target.value;
              // Special handling for "not set" value
              if (newValue === "not_set") {
                setInputValue("");
                onChange("");
              } else {
                setInputValue(newValue === 'true');
                onChange(newValue === 'true');
              }
            }}
            className={`parameter-input ${error ? 'input-error' : ''}`}
          >
            <option value="not_set">Not set</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      
      case ParameterType.ADDRESS:
        return (
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            className={`parameter-input ${error ? 'input-error' : ''}`}
            placeholder="0x..."
          />
        );
      
      case ParameterType.STRING:
        return (
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            className={`parameter-input ${error ? 'input-error' : ''}`}
            placeholder="Enter a string value"
          />
        );
      
      case ParameterType.INT256_ARRAY:
      case ParameterType.UINT256_ARRAY:
      case ParameterType.BOOL_ARRAY:
      case ParameterType.ADDRESS_ARRAY:
      case ParameterType.STRING_ARRAY:
        return renderArrayFields(type);
      
      default:
        return (
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            className={`parameter-input ${error ? 'input-error' : ''}`}
            placeholder={`Enter a ${typeName} value`}
          />
        );
    }
  };

  return (
    <div className="parameter-input-container">
      <label className="parameter-label">
        {name} <span className="parameter-type">({typeName})</span>
      </label>
      {renderInputField()}
      {error && <div className="parameter-error">{error}</div>}
    </div>
  );
} 