import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { supportedPoliciesForTool } from '@lit-protocol/vincent-tool-sdk/src/lib/toolCore/helpers';
import { createPublicClient, http, parseUnits } from 'viem';

import { getCurrentAllowance, sendErc20ApprovalTx } from './tool-helpers';
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
  supportedPolicies: supportedPoliciesForTool([]),

  precheckSuccessSchema,
  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ toolParams }, { succeed, delegation: { delegatorPkpInfo } }) => {
    const { ethAddress } = delegatorPkpInfo;
    const { rpcUrl, spenderAddress, tokenAddress, tokenDecimals, tokenAmount } = toolParams;

    const client = createPublicClient({
      transport: http(rpcUrl),
    });

    await checkNativeTokenBalance({
      client,
      pkpEthAddress: ethAddress as `0x${string}`,
    });

    const currentAllowance = await getCurrentAllowance({
      client,
      tokenAddress: tokenAddress as `0x${string}`,
      owner: ethAddress as `0x${string}`,
      spender: spenderAddress as `0x${string}`,
    });

    const requiredAmount = parseUnits(tokenAmount.toString(), tokenDecimals);

    return succeed({
      allow: true,
      existingApprovalSufficient: currentAllowance >= requiredAmount,
    });
  },
  execute: async ({ toolParams }, { succeed, delegation: { delegatorPkpInfo } }) => {
    console.log('Executing ERC20 Approval Tool');

    const { ethAddress, publicKey } = delegatorPkpInfo;
    const { rpcUrl, chainId, spenderAddress, tokenAddress, tokenDecimals, tokenAmount } =
      toolParams;

    const client = createPublicClient({
      transport: http(rpcUrl),
    });

    await checkNativeTokenBalance({
      client,
      pkpEthAddress: ethAddress as `0x${string}`,
    });

    const currentAllowance = await getCurrentAllowance({
      client,
      tokenAddress: tokenAddress as `0x${string}`,
      owner: ethAddress as `0x${string}`,
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
      pkpEthAddress: ethAddress as `0x${string}`,
      pkpPublicKey: publicKey,
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
