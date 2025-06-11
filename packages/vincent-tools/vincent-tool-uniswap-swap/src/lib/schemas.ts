import { z } from 'zod';

export const toolParamsSchema = z.object({
  ethRpcUrl: z.string(),
  rpcUrlForUniswap: z.string(),
  chainIdForUniswap: z.number(),
  pkpEthAddress: z.string(),

  tokenInAddress: z.string(),
  tokenInDecimals: z.number(),
  tokenInAmount: z.number().refine((val) => val > 0, {
    message: 'tokenInAmount must be greater than 0',
  }),

  tokenOutAddress: z.string(),
  tokenOutDecimals: z.number(),

  poolFee: z.number().optional(),
  slippageTolerance: z.number().optional(),
  swapDeadline: z.number().optional(),
});

export const precheckSuccessSchema = z.object({
  allow: z.literal(true),
});

export const precheckFailSchema = z.object({
  allow: z.literal(false),
  error: z.string(),
});

export const executeSuccessSchema = z.object({
  swapTxHash: z.string(),
  spendTxHash: z.string().optional(),
});

export const executeFailSchema = z.object({
  error: z.string(),
});
