import * as ethers from 'ethers';
import { ParameterType, PARAMETER_TYPE_NAMES } from '@/services/types/parameterTypes';

/**
 * Encodes a parameter value based on its type
 * @param paramType - The parameter type from ParameterType enum
 * @param paramValue - The value to encode
 * @param paramName - Optional name for logging purposes
 * @returns Encoded parameter as Uint8Array
 */
export const encodeParameterValue = (
  paramType: number,
  paramValue: any,
  paramName: string = 'unnamed'
): Uint8Array => {
  if (paramValue === undefined || paramValue === null) {
    return encodeDefaultValue(paramType, paramName);
  }

  try {
    const typeName = PARAMETER_TYPE_NAMES[paramType] || `unknown(${paramType})`;
    console.log(`Encoding parameter ${paramName} with type ${paramType} (${typeName})`, paramValue);
    
    switch(paramType) {
      case ParameterType.INT256: // int256
        if (paramValue === '') {
          return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["int256"], [0]));
        }
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["int256"], [paramValue]));
      
      case ParameterType.INT256_ARRAY: { // int256[]
        let arrayValue = parseArrayValue(paramValue, parseInt);
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["int256[]"], [arrayValue]));
      }
      
      case ParameterType.UINT256: // uint256
        if (paramValue === '') {
          return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["uint256"], [0]));
        }
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["uint256"], [paramValue]));
      
      case ParameterType.UINT256_ARRAY: { // uint256[]
        let arrayValue = parseArrayValue(paramValue, parseInt);
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["uint256[]"], [arrayValue]));
      }
      
      case ParameterType.BOOL: // bool
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["bool"], [
          paramValue === true || paramValue === 'true' || paramValue === '1' || paramValue === 1
        ]));
      
      case ParameterType.BOOL_ARRAY: { // bool[]
        let arrayValue = parseArrayValue(paramValue, value => {
          const trimmed = typeof value === 'string' ? value.trim() : value;
          return trimmed === true || trimmed === 'true' || trimmed === '1' || trimmed === 1;
        });
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["bool[]"], [arrayValue]));
      }
      
      case ParameterType.ADDRESS: // address
        if (paramValue === '') {
          return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["address"], ["0x0000000000000000000000000000000000000000"]));
        }
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["address"], [paramValue]));
      
      case ParameterType.ADDRESS_ARRAY: { // address[]
        let arrayValue = parseArrayValue(paramValue, value => value.trim());
        arrayValue = arrayValue.filter(addr => addr !== '');
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["address[]"], [arrayValue]));
      }
      
      case ParameterType.STRING: // string
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["string"], [String(paramValue)]));
      
      case ParameterType.STRING_ARRAY: { // string[]
        let arrayValue = parseArrayValue(paramValue, value => String(value).trim());
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["string[]"], [arrayValue]));
      }
      
      case ParameterType.BYTES: // bytes
        try {
          if (typeof paramValue === 'string' && paramValue.startsWith('0x')) {
            return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["bytes"], [ethers.utils.arrayify(paramValue)]));
          } else {
            return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["bytes"], [ethers.utils.toUtf8Bytes(String(paramValue))]));
          }
        } catch (e) {
          console.error("Error encoding bytes:", e);
          return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["bytes"], [ethers.utils.toUtf8Bytes("")]));
        }
      
      case ParameterType.BYTES_ARRAY: { // bytes[]
        try {
          const arrayValue = parseArrayValue(paramValue, value => {
            if (typeof value === 'string') {
              const trimmed = value.trim();
              if (trimmed.startsWith('0x')) {
                return ethers.utils.arrayify(trimmed);
              }
              return ethers.utils.toUtf8Bytes(trimmed);
            } 
            return ethers.utils.toUtf8Bytes(String(value));
          });
          
          return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["bytes[]"], [arrayValue]));
        } catch (e) {
          console.error("Error encoding bytes array:", e);
          return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["bytes[]"], [[]]));
        }
      }
      
      default:
        console.warn(`Unknown parameter type ${paramType}, defaulting to string encoding`);
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["string"], [String(paramValue)]));
    }
  } catch (encodeError) {
    console.error(`Error encoding parameter ${paramName}:`, encodeError, {
      paramValue,
      paramType
    });
    
    return getFallbackValue(paramType);
  }
};

/**
 * Parses a value into an array based on the conversion function
 * @param value - The value to parse (string, array, or primitive)
 * @param converter - Function to convert each item
 * @returns Array of converted values
 */
function parseArrayValue<T>(value: any, converter: (item: any) => T): T[] {
  if (typeof value === 'string' && value.includes(',')) {
    return value.split(',').map(item => converter(item.trim()));
  } else if (Array.isArray(value)) {
    return value.map(converter);
  } else if (value !== '') {
    return [converter(value)];
  }
  return [];
}

/**
 * Provides a fallback value for a given parameter type when encoding fails
 * @param paramType - The parameter type from ParameterType enum
 * @returns Fallback encoded value as Uint8Array
 */
function getFallbackValue(paramType: number): Uint8Array {
  try {
    switch(paramType) {
      case ParameterType.INT256: // int256
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["int256"], [0]));
      case ParameterType.UINT256: // uint256
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["uint256"], [0]));
      case ParameterType.BOOL: // bool
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["bool"], [false]));
      case ParameterType.ADDRESS: // address
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["address"], ["0x0000000000000000000000000000000000000000"]));
      case ParameterType.STRING: // string
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["string"], [""]));
      case ParameterType.BYTES: // bytes
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["bytes"], ["0x"]));
      case ParameterType.INT256_ARRAY: // int256[]
      case ParameterType.UINT256_ARRAY: // uint256[]
      case ParameterType.BOOL_ARRAY: // bool[]
      case ParameterType.ADDRESS_ARRAY: // address[]
      case ParameterType.STRING_ARRAY: // string[]
      case ParameterType.BYTES_ARRAY: // bytes[]
        const typeName = PARAMETER_TYPE_NAMES[paramType];
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode([typeName], [[]]));
      default:
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["string"], [""]));
    }
  } catch (fallbackError) {
    console.error("Fallback encoding also failed:", fallbackError);
    return ethers.utils.arrayify("0x");
  }
}

/**
 * Encodes a default value for a parameter type
 * @param paramType - The parameter type from ParameterType enum
 * @param paramName - Optional name for logging purposes
 * @returns Default encoded value as Uint8Array
 */
export const encodeDefaultValue = (paramType: number, paramName: string = 'unnamed'): Uint8Array => {
  try {
    const typeName = PARAMETER_TYPE_NAMES[paramType] || `unknown(${paramType})`;
    console.log(`Using default value for parameter ${paramName} with type ${paramType} (${typeName})`);
    
    switch(paramType) {
      case ParameterType.INT256: // int256
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["int256"], [0]));
      
      case ParameterType.INT256_ARRAY: // int256[]
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["int256[]"], [[]]));
      
      case ParameterType.UINT256: // uint256
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["uint256"], [0]));
      
      case ParameterType.UINT256_ARRAY: // uint256[]
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["uint256[]"], [[]]));
      
      case ParameterType.BOOL: // bool
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["bool"], [false]));
      
      case ParameterType.BOOL_ARRAY: // bool[]
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["bool[]"], [[]]));
      
      case ParameterType.ADDRESS: // address
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["address"], ["0x0000000000000000000000000000000000000000"]));
      
      case ParameterType.ADDRESS_ARRAY: // address[]
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["address[]"], [[]]));
      
      case ParameterType.STRING: // string
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["string"], [""]));
      
      case ParameterType.STRING_ARRAY: // string[]
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["string[]"], [[]]));
      
      case ParameterType.BYTES: // bytes
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["bytes"], [ethers.utils.arrayify("0x")]));
      
      case ParameterType.BYTES_ARRAY: // bytes[]
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["bytes[]"], [[]]));
      
      default:
        return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["string"], [""]));
    }
  } catch (defaultEncodeError) {
    console.error(`Error encoding default parameter ${paramName}:`, defaultEncodeError);
    return ethers.utils.arrayify(ethers.utils.defaultAbiCoder.encode(["string"], [""]));
  }
}; 