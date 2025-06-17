// src/lib/policyCore/policyParameters/decodePolicyParams.ts

import { ethers } from 'ethers';

import type { DecodedValues, PolicyParameter } from './types';

const OnChainPolicyParamType = {
  INT256: 0,
  INT256_ARRAY: 1,
  UINT256: 2,
  UINT256_ARRAY: 3,
  BOOL: 4,
  BOOL_ARRAY: 5,
  ADDRESS: 6,
  ADDRESS_ARRAY: 7,
  STRING: 8,
  STRING_ARRAY: 9,
  BYTES: 10,
  BYTES_ARRAY: 11,
} as const;

// Helper function to convert BigNumber to bigint
const toBigInt = (value: ethers.BigNumber): bigint => {
  return BigInt(value.toString());
};

// Helper function to convert BigNumber array to bigint array
const toBigIntArray = (values: ethers.BigNumber[]): bigint[] => {
  return values.map((value) => BigInt(value.toString()));
};

// Helper function to convert ethers bytes to Uint8Array
const toUint8Array = (value: string): Uint8Array => {
  return ethers.utils.arrayify(value);
};

// Helper function to convert ethers bytes array to Uint8Array array
const toUint8ArrayArray = (values: string[]): Uint8Array[] => {
  return values.map((value) => ethers.utils.arrayify(value));
};

export const decodePolicyParams = ({
  params,
}: {
  params: PolicyParameter[];
}): Record<string, DecodedValues> => {
  try {
    const result: Record<string, DecodedValues> = {};

    for (const param of params) {
      console.log(
        'decoding param:',
        JSON.stringify({
          name: param.name,
          paramType: param.paramType,
          value: param.value,
        }),
      );
      const { name, paramType, value } = param;

      switch (paramType) {
        case OnChainPolicyParamType.INT256:
          result[name] = toBigInt(ethers.utils.defaultAbiCoder.decode(['int256'], value)[0]);
          break;
        case OnChainPolicyParamType.INT256_ARRAY:
          result[name] = toBigIntArray(ethers.utils.defaultAbiCoder.decode(['int256[]'], value)[0]);
          break;
        case OnChainPolicyParamType.UINT256:
          result[name] = toBigInt(ethers.utils.defaultAbiCoder.decode(['uint256'], value)[0]);
          break;
        case OnChainPolicyParamType.UINT256_ARRAY:
          result[name] = toBigIntArray(
            ethers.utils.defaultAbiCoder.decode(['uint256[]'], value)[0],
          );
          break;
        case OnChainPolicyParamType.BOOL:
          result[name] = ethers.utils.defaultAbiCoder.decode(['bool'], value)[0] as boolean;
          break;
        case OnChainPolicyParamType.BOOL_ARRAY:
          result[name] = ethers.utils.defaultAbiCoder.decode(['bool[]'], value)[0] as boolean[];
          break;
        case OnChainPolicyParamType.ADDRESS:
          result[name] = ethers.utils.defaultAbiCoder.decode(['address'], value)[0] as string;
          break;
        case OnChainPolicyParamType.ADDRESS_ARRAY:
          result[name] = ethers.utils.defaultAbiCoder.decode(['address[]'], value)[0] as string[];
          break;
        case OnChainPolicyParamType.STRING:
          result[name] = ethers.utils.defaultAbiCoder.decode(['string'], value)[0] as string;
          break;
        case OnChainPolicyParamType.STRING_ARRAY:
          result[name] = ethers.utils.defaultAbiCoder.decode(['string[]'], value)[0] as string[];
          break;
        case OnChainPolicyParamType.BYTES:
          result[name] = toUint8Array(ethers.utils.defaultAbiCoder.decode(['bytes'], value)[0]);
          break;
        case OnChainPolicyParamType.BYTES_ARRAY:
          result[name] = toUint8ArrayArray(
            ethers.utils.defaultAbiCoder.decode(['bytes[]'], value)[0],
          );
          break;
        default:
          throw new Error(`Unknown parameter type: ${paramType}`);
      }
    }

    return result;
  } catch (error) {
    throw new Error(
      `Error decoding policy parameters (abiDecodePolicyParameters): ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
