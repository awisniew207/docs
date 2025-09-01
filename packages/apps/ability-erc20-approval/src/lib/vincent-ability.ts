import {
  createVincentAbility,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { ethers } from 'ethers';

import { getCurrentAllowance, checkNativeTokenBalance } from './helpers';
import { sendErc20ApprovalTx } from './lit-action-helpers';
import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  abilityParamsSchema,
} from './schemas';

export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/vincent-ability-erc20-approval' as const,
  abilityDescription:
    'Allow, up to a limit, of an ERC20 token spending to another address.' as const,
  abilityParamsSchema,
  supportedPolicies: supportedPoliciesForAbility([]),

  precheckSuccessSchema,
  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    const { ethAddress } = delegatorPkpInfo;
    const { alchemyGasSponsor, rpcUrl, spenderAddress, tokenAddress, tokenAmount } = abilityParams;

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    if (!alchemyGasSponsor) {
      const hasNativeTokenBalance = await checkNativeTokenBalance({
        provider,
        pkpEthAddress: ethAddress,
      });

      if (!hasNativeTokenBalance) {
        return fail({ noNativeTokenBalance: true });
      }
    }

    const currentAllowance = await getCurrentAllowance({
      provider,
      tokenAddress,
      owner: ethAddress,
      spender: spenderAddress,
    });

    const requiredAmount = ethers.BigNumber.from(tokenAmount);

    return succeed({
      alreadyApproved: currentAllowance.eq(requiredAmount),
      currentAllowance: currentAllowance.toString(),
    });
  },
  execute: async ({ abilityParams }, { succeed, delegation: { delegatorPkpInfo } }) => {
    console.log('Executing ERC20 Approval Ability');

    const { ethAddress, publicKey } = delegatorPkpInfo;
    const {
      rpcUrl,
      chainId,
      spenderAddress,
      tokenAddress,
      tokenAmount,
      alchemyGasSponsor,
      alchemyGasSponsorApiKey,
      alchemyGasSponsorPolicyId,
    } = abilityParams;

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
    const requiredAmount = ethers.BigNumber.from(tokenAmount);

    console.log(
      `Execute: currentAllowance: ${currentAllowance.toString()} - requiredAmount: ${requiredAmount.toString()}`,
    );

    if (currentAllowance.eq(requiredAmount)) {
      const result = {
        approvedAmount: currentAllowance.toString(),
        spenderAddress,
        tokenAddress,
      };

      console.log('Ability execution successful', result);

      return succeed(result);
    }

    const approvalTxHash = await sendErc20ApprovalTx({
      rpcUrl,
      chainId,
      pkpEthAddress: ethAddress,
      pkpPublicKey: publicKey,
      spenderAddress,
      tokenAmount: requiredAmount,
      tokenAddress,
      alchemyGasSponsor,
      alchemyGasSponsorApiKey,
      alchemyGasSponsorPolicyId,
    });

    const result = {
      approvalTxHash,
      approvedAmount: requiredAmount.toString(),
      spenderAddress,
      tokenAddress,
    };

    console.log('Ability execution successful', result);

    return succeed(result);
  },
});
