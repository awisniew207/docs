import { z } from 'zod';

export const toolParamsSchema = z.object({
  rpcUrl: z.string(),
  chainId: z.number(),
  spenderAddress: z.string(),

  tokenAddress: z.string(),
  tokenDecimals: z.number(),
  tokenAmount: z.number().gte(0, 'tokenAmount cannot be a negative number'),
});

export const precheckSuccessSchema = z.object({
  allow: z.literal(true),
  existingApprovalSufficient: z.boolean(),
});

export const precheckFailSchema = z.object({
  allow: z.literal(false),
  error: z.string(),
});

export const executeSuccessSchema = z.object({
  // Whether the existing approval amount is sufficient for the requested amount
  existingApprovalSufficient: z.boolean(),
  // Transaction hash if a new approval was created, undefined if existing approval was used
  approvalTxHash: z.string().optional(),
  // The approved amount that is now active (either from existing or new approval)
  approvedAmount: z.string(),
  // The token address that was approved
  tokenAddress: z.string(),
  // The token decimals that was approved
  tokenDecimals: z.number(),
  // The spender address that was approved
  spenderAddress: z.string(),
});

export const executeFailSchema = z.object({
  error: z.string(),
});
