import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { createPolicyMapFromToolPolicies } from '@lit-protocol/vincent-tool-sdk/src/lib/toolCore/helpers';
import { createPublicClient, http, parseUnits } from 'viem';

import { getCurrentAllowance, getPkpInfo, sendErc20ApprovalTx } from './tool-helpers';
import { checkNativeTokenBalance } from './tool-checks';
import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  toolParamsSchema,
} from './schemas';

export const vincentTool = createVincentTool({
  // packageName: '@lit-protocol/vincent-tool-erc20-approval' as const,

  toolParamsSchema,
  policyMap: createPolicyMapFromToolPolicies([]),

  precheckSuccessSchema,
  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ toolParams }, { succeed }) => {
    const { rpcUrl, pkpEthAddress, spenderAddress, tokenAddress, tokenDecimals, tokenAmount } =
      toolParams;

    const client = createPublicClient({
      transport: http(rpcUrl),
    });

    await checkNativeTokenBalance({
      client,
      pkpEthAddress: pkpEthAddress as `0x${string}`,
    });

    const currentAllowance = await getCurrentAllowance({
      client,
      tokenAddress: tokenAddress as `0x${string}`,
      owner: pkpEthAddress as `0x${string}`,
      spender: spenderAddress as `0x${string}`,
    });

    const requiredAmount = parseUnits(tokenAmount.toString(), tokenDecimals);

    return succeed({
      allow: true,
      existingApprovalSufficient: currentAllowance >= requiredAmount,
    });
  },
  execute: async ({ toolParams }, { succeed }) => {
    console.log('Executing ERC20 Approval Tool');

    const {
      rpcUrl,
      chainId,
      pkpEthAddress,
      spenderAddress,
      tokenAddress,
      tokenDecimals,
      tokenAmount,
    } = toolParams;

    const pkpInfo = await getPkpInfo({
      pkpEthAddress: pkpEthAddress as `0x${string}`,
    });

    const client = createPublicClient({
      transport: http(rpcUrl),
    });

    await checkNativeTokenBalance({
      client,
      pkpEthAddress: pkpEthAddress as `0x${string}`,
    });

    const currentAllowance = await getCurrentAllowance({
      client,
      tokenAddress: tokenAddress as `0x${string}`,
      owner: pkpEthAddress as `0x${string}`,
      spender: spenderAddress as `0x${string}`,
    });

    const requiredAmount = parseUnits(tokenAmount.toString(), tokenDecimals);

    if (currentAllowance >= requiredAmount) {
      console.log(
        `currentAllowance: ${currentAllowance} >= requiredAmount: ${requiredAmount} (execute)`,
      );

      console.log('Tool execution successful', {
        existingApprovalSufficient: true,
        approvedAmount: currentAllowance.toString(),
        spenderAddress,
        tokenAddress,
        tokenDecimals: parseInt(tokenDecimals.toString()),
      });

      return succeed({
        existingApprovalSufficient: true,
        approvedAmount: currentAllowance.toString(),
        tokenAddress,
        tokenDecimals: parseInt(tokenDecimals.toString()),
        spenderAddress,
      });
    }

    const approvalTxHash = await sendErc20ApprovalTx({
      rpcUrl,
      chainId,
      pkpEthAddress: pkpEthAddress as `0x${string}`,
      pkpPublicKey: pkpInfo.publicKey,
      spenderAddress: spenderAddress as `0x${string}`,
      tokenAmount: parseUnits(tokenAmount.toString(), tokenDecimals),
      tokenDecimals,
      tokenAddress: tokenAddress as `0x${string}`,
    });

    console.log('Tool execution successful', {
      existingApprovalSufficient: false,
      approvalTxHash,
      approvedAmount: requiredAmount.toString(),
      spenderAddress,
      tokenAddress,
      tokenDecimals: parseInt(tokenDecimals.toString()),
    });

    return succeed({
      existingApprovalSufficient: false,
      approvalTxHash,
      approvedAmount: requiredAmount.toString(),
      tokenAddress,
      tokenDecimals: parseInt(tokenDecimals.toString()),
      spenderAddress,
    });
  },
});
