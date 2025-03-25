import { encodePacked, isHex, toHex } from 'viem';
import { z } from 'zod';

export const ParameterType = {
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

type ParameterTypeString = keyof typeof ParameterType;

export const parameterTypeSchema = z
  .enum(
    Object.keys(ParameterType) as [
      ParameterTypeString,
      ...ParameterTypeString[],
    ],
  )
  .transform((type) => ParameterType[type]);

export type ParameterTypeInput = z.input<typeof parameterTypeSchema>;

// Base schema for raw values
export const rawParameterValueSchema = z.array(
  z.array(
    z.array(
      z.union([
        z.bigint(),
        z.array(z.bigint()),
        z.boolean(),
        z.array(z.boolean()),
        z.string(),
        z.array(z.string()),
      ]),
    ),
  ),
);

/**
 * Schema that transforms raw parameter values into their hex-encoded format.
 * The schema handles different types of values:
 * - Already hex-encoded strings (e.g., addresses)
 * - Arrays (converted to comma-separated strings then hex)
 * - BigInts (encoded as INT256)
 * - Other values (converted directly to hex)
 */
export const hexEncodedParameterValueSchema = rawParameterValueSchema.transform(
  (values) =>
    values.map((toolPolicies) =>
      toolPolicies.map((policies) =>
        policies.map((value) => {
          // Pass through if already in hex format (e.g., addresses)
          if (isHex(value)) return value;

          // Handle arrays by joining with commas and converting to hex
          // Used for array types like ADDRESS_ARRAY, STRING_ARRAY, etc.
          if (Array.isArray(value)) return toHex(value.join(','));

          // Handle BigInt values (including negative numbers)
          // Uses viem's encodePacked for proper INT256 encoding
          if (typeof value === 'bigint')
            return encodePacked(['int256'], [value]);

          // Convert all other values to hex (strings, booleans, etc.)
          return toHex(value);
        }),
      ),
    ),
);
