import * as ethers from 'ethers';
import { ParameterType } from '@/services/types/parameterTypes';

/**
 * Decodes parameter values from their encoded form based on their type.
 * Handles different parameter types like INT256, UINT256, BOOL, ADDRESS, STRING, and their array versions.
 * 
 * @param encodedValue The encoded value from the contract
 * @param paramType The parameter type (from ParameterType enum)
 * @returns The decoded value as a string or primitive value
 */
export const decodeParameterValue = (encodedValue: string, paramType: number): any => {
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
};

/**
 * Utility to check if a parameter value should be considered empty
 * 
 * @param value The parameter value to check
 * @param paramType The parameter type
 * @returns boolean indicating if the value should be considered empty
 */
export const isEmptyParameterValue = (value: string | undefined | null, type: ParameterType): boolean => {
  // Empty string, undefined, or null is always considered empty
  if (value === undefined || value === null || value === '') {
    return true;
  }

  // Special handling for different parameter types
  switch (type) {
    case ParameterType.BOOL:
      // No special handling needed for boolean
      return false;
    case ParameterType.INT256:
    case ParameterType.UINT256:
      // For numeric types, check if the value is "0" or only zeroes
      return value === '0' || /^0+$/.test(value);
    case ParameterType.ADDRESS:
      // For addresses, check if the value is a placeholder or zero address
      return value === '0x' || value === '0x0000000000000000000000000000000000000000';
    case ParameterType.STRING:
      // For strings, empty string is already checked above
      return false;
    case ParameterType.BOOL_ARRAY:
    case ParameterType.INT256_ARRAY:
    case ParameterType.UINT256_ARRAY:
    case ParameterType.ADDRESS_ARRAY:
    case ParameterType.STRING_ARRAY:
      // For arrays, first check if it's an empty array or string representation of empty array
      if (value === '[]' || value === '' || value === ',') {
        return true;
      }

      try {
        // Try to parse as array
        let arrayValues: string[];
        if (Array.isArray(value)) {
          arrayValues = value;
        } else {
          // Split by comma and handle potential empty spots
          arrayValues = value.split(',').map(v => v.trim());
        }

        // Check if array is effectively empty (all elements are empty)
        if (arrayValues.length === 0) {
          return true;
        }

        // Check if all array elements are empty or default values
        const allEmpty = arrayValues.every(v => {
          if (type === ParameterType.INT256_ARRAY || type === ParameterType.UINT256_ARRAY) {
            return v === '' || v === '0' || v === undefined || v === null;
          } else if (type === ParameterType.ADDRESS_ARRAY) {
            return v === '' || v === '0x' || v === '0x0000000000000000000000000000000000000000';
          } else if (type === ParameterType.STRING_ARRAY) {
            return v === '';
          } else if (type === ParameterType.BOOL_ARRAY) {
            return v === '';
          }
          return false;
        });

        return allEmpty;
      } catch (e) {
        console.error('Error parsing array value in isEmptyParameterValue:', e);
        // If parsing fails, assume it's not empty
        return false;
      }
    default:
      return false;
  }
}; 