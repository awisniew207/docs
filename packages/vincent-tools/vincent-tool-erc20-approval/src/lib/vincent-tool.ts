import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { supportedPoliciesForTool } from '@lit-protocol/vincent-tool-sdk/src/lib/toolCore/helpers';
import { ethers } from 'ethers';

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

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    await checkNativeTokenBalance({
      provider,
      pkpEthAddress: ethAddress,
    });

    const currentAllowance = await getCurrentAllowance({
      provider,
      tokenAddress,
      owner: ethAddress,
      spender: spenderAddress,
    });

    const requiredAmount = ethers.utils.parseUnits(tokenAmount.toString(), tokenDecimals);

    return succeed({
      allow: true,
      existingApprovalSufficient: currentAllowance >= requiredAmount.toBigInt(),
    });
  },
  execute: async ({ toolParams }, { succeed, delegation: { delegatorPkpInfo } }) => {
    console.log('Executing ERC20 Approval Tool');

    const { ethAddress, publicKey } = delegatorPkpInfo;
    const { rpcUrl, chainId, spenderAddress, tokenAddress, tokenDecimals, tokenAmount } =
      toolParams;

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    await checkNativeTokenBalance({
      provider,
      pkpEthAddress: ethAddress,
    });

    const currentAllowance = await getCurrentAllowance({
      provider,
      tokenAddress,
      owner: ethAddress,
      spender: spenderAddress,
    });
    const requiredAmount = ethers.utils
      .parseUnits(tokenAmount.toString(), tokenDecimals)
      .toBigInt();

    console.log(
      `currentAllowance: ${currentAllowance} >= requiredAmount: ${requiredAmount} (execute)`,
    );

    if (currentAllowance >= requiredAmount && requiredAmount > 0n) {
      // requiredAmount of 0 would indicate we are _explicitly removing an existing approval_

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
      pkpEthAddress: ethAddress,
      pkpPublicKey: publicKey,
      spenderAddress,
      tokenAmount: requiredAmount,
      tokenAddress,
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
