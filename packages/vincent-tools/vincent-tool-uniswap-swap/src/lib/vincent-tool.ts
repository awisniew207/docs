import { createVincentTool, createVincentToolPolicy } from '@lit-protocol/vincent-tool-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-spending-limit';

import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core';
import { createPublicClient, http } from 'viem';
import { createPolicyMapFromToolPolicies } from '@lit-protocol/vincent-tool-sdk/src/lib/toolCore/helpers';

import { getPkpInfo, getTokenAmountInUsd, sendUniswapTx } from './tool-helpers';
import {
  checkErc20Allowance,
  checkNativeTokenBalance,
  checkTokenInBalance,
  checkUniswapPoolExists,
} from './tool-checks';
import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  toolParamsSchema,
} from './schemas';

const SpendingLimitPolicy = createVincentToolPolicy({
  toolParamsSchema,
  bundledVincentPolicy,
  toolParameterMappings: {
    rpcUrlForUniswap: 'rpcUrlForUniswap',
    chainIdForUniswap: 'chainIdForUniswap',
    pkpEthAddress: 'pkpEthAddress',
    ethRpcUrl: 'ethRpcUrl',
    tokenInAddress: 'tokenAddress',
    tokenInDecimals: 'tokenDecimals',
    tokenInAmount: 'buyAmount',
  },
});

export const vincentTool = createVincentTool({
  // packageName: '@lit-protocol/vincent-tool-uniswap-swap' as const,

  toolParamsSchema,
  policyMap: createPolicyMapFromToolPolicies([SpendingLimitPolicy]),

  precheckSuccessSchema,
  precheckFailSchema,
  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ toolParams }, { fail, succeed }) => {
    const {
      pkpEthAddress,
      rpcUrlForUniswap,
      chainIdForUniswap,
      tokenInAddress,
      tokenInDecimals,
      tokenInAmount,
      tokenOutAddress,
      tokenOutDecimals,
    } = toolParams;

    const client = createPublicClient({
      transport: http(rpcUrlForUniswap),
    });

    await checkNativeTokenBalance({
      client,
      pkpEthAddress: pkpEthAddress as `0x${string}`,
    });

    const uniswapRouterAddress = CHAIN_TO_ADDRESSES_MAP[
      chainIdForUniswap as keyof typeof CHAIN_TO_ADDRESSES_MAP
    ].quoterAddress as `0x${string}`;
    if (uniswapRouterAddress === undefined) {
      return fail({
        allow: false,
        error: `Uniswap router address not found for chainId ${chainIdForUniswap} (UniswapSwapToolPrecheck)`,
      });
    }

    await checkErc20Allowance({
      client,
      tokenAddress: tokenInAddress as `0x${string}`,
      owner: pkpEthAddress as `0x${string}`,
      spender: uniswapRouterAddress,
      tokenAmount: BigInt(tokenInAmount),
    });

    await checkTokenInBalance({
      client,
      pkpEthAddress: pkpEthAddress as `0x${string}`,
      tokenInAddress: tokenInAddress as `0x${string}`,
      tokenInAmount: BigInt(tokenInAmount),
    });

    await checkUniswapPoolExists({
      rpcUrl: rpcUrlForUniswap,
      chainId: chainIdForUniswap,
      tokenInAddress: tokenInAddress as `0x${string}`,
      tokenInDecimals,
      tokenInAmount,
      tokenOutAddress: tokenOutAddress as `0x${string}`,
      tokenOutDecimals,
    });

    return succeed({
      allow: true,
    });
  },
  execute: async ({ toolParams }, { succeed, fail, policiesContext }) => {
    console.log('Executing UniswapSwapTool', JSON.stringify(toolParams, null, 2));

    const {
      pkpEthAddress,
      ethRpcUrl,
      rpcUrlForUniswap,
      chainIdForUniswap,
      tokenInAddress,
      tokenInDecimals,
      tokenInAmount,
      tokenOutAddress,
      tokenOutDecimals,
    } = toolParams;

    const pkpInfo = await getPkpInfo(pkpEthAddress);

    const spendingLimitPolicyContext =
      policiesContext.allowedPolicies['@lit-protocol/vincent-policy-spending-limit'];

    console.log('Spending limit policy context', JSON.stringify(spendingLimitPolicyContext));
    console.log('Policy context', JSON.stringify(policiesContext));

    const swapTxHash = await sendUniswapTx({
      rpcUrl: rpcUrlForUniswap,
      chainId: chainIdForUniswap,
      pkpEthAddress: pkpEthAddress as `0x${string}`,
      pkpPublicKey: pkpInfo.publicKey,
      tokenInAddress: tokenInAddress as `0x${string}`,
      tokenOutAddress: tokenOutAddress as `0x${string}`,
      tokenInDecimals,
      tokenOutDecimals,
      tokenInAmount,
    });

    let spendTxHash: string | undefined;

    if (spendingLimitPolicyContext !== undefined) {
      const tokenInAmountInUsd = await getTokenAmountInUsd({
        ethRpcUrl,
        rpcUrlForUniswap,
        chainIdForUniswap,
        tokenAddress: tokenInAddress,
        tokenAmount: tokenInAmount,
        tokenDecimals: tokenInDecimals,
      });

      console.log('Spending limit policy context', spendingLimitPolicyContext);
      console.log('Spending limit policy context result', spendingLimitPolicyContext.result);

      const { appId, maxSpendingLimitInUsd } = spendingLimitPolicyContext.result;
      const commitResult = await spendingLimitPolicyContext.commit({
        appId,
        amountSpentUsd: tokenInAmountInUsd.toNumber(),
        maxSpendingLimitInUsd,
        pkpEthAddress,
        pkpPubKey: pkpInfo.publicKey,
      });

      console.log('Spending limit policy commit result', JSON.stringify(commitResult));
      if (commitResult.allow) {
        spendTxHash = commitResult.result.spendTxHash;
      } else {
        return fail({
          error:
            commitResult.error ?? 'Unknown error occurred while committing spending limit policy',
        });
      }
      console.log(
        `Committed spending limit policy for transaction: ${spendTxHash} (UniswapSwapToolExecute)`,
      );
    }

    return succeed({
      swapTxHash,
      spendTxHash,
    });
  },
});
