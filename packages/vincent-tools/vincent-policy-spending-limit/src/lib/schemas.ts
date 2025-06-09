import { z } from 'zod';

export const toolParamsSchema = z.object({
  pkpEthAddress: z.string(),
  ethRpcUrl: z.string(),
  rpcUrlForUniswap: z.string(),
  chainIdForUniswap: z.number(),
  tokenAddress: z.string(),
  tokenDecimals: z.number(),
  buyAmount: z.number(),
});

export const userParamsSchema = z.object({
  maxDailySpendingLimitInUsdCents: z.bigint(),
});

export const precheckAllowResultSchema = z.object({
  appId: z.number(),
  maxSpendingLimitInUsd: z.number(),
  buyAmountInUsd: z.number(),
});

export const precheckDenyResultSchema = z.object({
  appId: z.number(),
  reason: z.literal('Attempted buy amount exceeds daily limit'),
  maxSpendingLimitInUsd: z.number(),
  buyAmountInUsd: z.number(),
});

export const evalAllowResultSchema = z.object({
  appId: z.number(),
  maxSpendingLimitInUsd: z.number(),
  buyAmountInUsd: z.number(),
});

export const evalDenyResultSchema = z.object({
  reason: z.string(),
  maxSpendingLimitInUsd: z.number().optional(),
  buyAmountInUsd: z.number().optional(),
});

export const commitParamsSchema = z.object({
  appId: z.number(),
  amountSpentUsd: z.number(),
  maxSpendingLimitInUsd: z.number(),
  pkpEthAddress: z.string(),
  pkpPubKey: z.string(),
});

export const commitAllowResultSchema = z.object({
  spendTxHash: z.string(),
});

export const commitDenyResultSchema = z.object({
  error: z.string(),
});
