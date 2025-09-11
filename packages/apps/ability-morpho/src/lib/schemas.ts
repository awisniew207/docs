import { z } from 'zod';

/**
 * Morpho Vault operation types
 */
export enum MorphoOperation {
  APPROVE = 'approve',
  DEPOSIT = 'deposit',
  REDEEM = 'redeem',
}

/**
 * Ability parameters schema - defines the input parameters for the Morpho ability
 */
export const abilityParamsSchema = z.object({
  operation: z
    .nativeEnum(MorphoOperation)
    .describe('The Morpho Vault operation to perform (approve, deposit, redeem)'),
  vaultAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid vault address')
    .describe('The address of the Morpho Vault contract'),
  amount: z
    .string()
    .regex(/^\d+$/, 'Invalid amount format')
    .describe(
      'The amount of tokens to approve/deposit/redeem, as a string without decimal point. Ex: 2123456 for 2.123456 USDC (6 decimals)',
    ),
  chain: z.string().describe('The blockchain network where the vault is deployed'),
  rpcUrl: z.string().optional().describe('RPC URL used for precheck validations'),
  // Gas sponsorship parameters for EIP-7702
  alchemyGasSponsor: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether to use Alchemy's gas sponsorship (EIP-7702)"),
  alchemyGasSponsorApiKey: z
    .string()
    .optional()
    .describe('Alchemy API key for gas sponsorship (required if alchemyGasSponsor is true)'),
  alchemyGasSponsorPolicyId: z
    .string()
    .optional()
    .describe('Alchemy gas policy ID for sponsorship (required if alchemyGasSponsor is true)'),
});

/**
 * Precheck success result schema
 */
export const precheckSuccessSchema = z.object({
  operationValid: z.boolean().describe('Whether the requested operation is valid'),
  vaultValid: z.boolean().describe('Whether the specified vault address is valid'),
  amountValid: z.boolean().describe('Whether the specified amount is valid'),
  userBalance: z
    .string()
    .describe(
      "The user's current balance of the underlying asset without decimal point. Ex: 2123456 for 2.123456 USDC (6 decimals)",
    ),
  allowance: z
    .string()
    .optional()
    .describe(
      'The current allowance approved for the vault contract without decimal point. Ex: 2123456 for 2.123456 USDC (6 decimals)',
    ),
  vaultShares: z.string().optional().describe("The user's current balance of vault shares"),
  estimatedGas: z.string().describe('Estimated gas cost for the operation in wei'),
});

/**
 * Precheck failure result schema
 */
export const precheckFailSchema = z.object({
  error: z.string().describe('A string containing the error message if the precheck failed.'),
});

/**
 * Execute success result schema
 */
export const executeSuccessSchema = z.object({
  txHash: z.string().describe('The transaction or user op hash of the executed operation'),
  vaultAddress: z.string().describe('The address of the vault involved in the operation'),
  amount: z
    .string()
    .describe(
      'The amount of tokens involved in the operation without decimal point. Ex: 2123456 for 2.123456 USDC (6 decimals)',
    ),
});

/**
 * Execute failure result schema
 */
export const executeFailSchema = z.object({
  error: z.string().describe('A string containing the error message if the execution failed.'),
});
