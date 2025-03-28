/* eslint-disable */
import { ethers } from 'ethers';
import { type Policy } from '@lit-protocol/vincent-tool';

import { getOnChainPolicyParams, getTokenAmountInUsd, sendSpendTx, validateSpendingLimits, validateTokenAreAllowed } from './utils';

declare global {
  // Required Inputs
  const userRpcUrl: string;
  const vincentAppId: string;
  const vincentAppVersion: string;
  const userPkpInfo: { tokenId: string, ethAddress: string, publicKey: string };
  const policy: Policy;

  // This is being passed as a parameter and is the
  // Lit jsParams given to the Tool Lit Action
  // const toolParams: {
  //   pkpEthAddress: string;
  //   rpcUrl: string;
  //   chainId: string;
  //   tokenIn: string;
  //   tokenOut: string;
  //   amountIn: string;
  //   tokenInDecimals: string;
  //   tokenOutDecimals: string;
  // };
}

(async () => {
  const {
    maxAmountPerTx,
    maxSpendingLimit,
    spendingLimitDuration,
    allowedTokens
  } = getOnChainPolicyParams(policy.parameters);

  console.log(`Retrieved maxAmountPerTx: ${maxAmountPerTx?.toString()}`);
  console.log(`Retrieved maxSpendingLimit: ${maxSpendingLimit?.toString()}`);
  console.log(`Retrieved spendingLimitDuration: ${spendingLimitDuration?.toString()}`);
  console.log(`Retrieved allowedTokens: ${allowedTokens}`);

  if (allowedTokens && allowedTokens.length > 0) {
    validateTokenAreAllowed([toolParams.tokenIn, toolParams.tokenOut], allowedTokens);
  }

  const yellowstoneProvider = new ethers.providers.JsonRpcProvider(
    await Lit.Actions.getRpcUrl({
      chain: 'yellowstone',
    })
  );
  const userRpcProvider = new ethers.providers.JsonRpcProvider(userRpcUrl);

  const tokenAmountInUsd = await getTokenAmountInUsd(
    userRpcProvider,
    toolParams.chainId,
    toolParams.amountIn,
    toolParams.tokenIn,
    toolParams.tokenInDecimals
  )

  if (maxAmountPerTx) {
    validateSpendingLimits(
      vincentAppId,
      tokenAmountInUsd,
      maxAmountPerTx);
  }

  if (maxSpendingLimit && spendingLimitDuration) {
    const spendTxHash = await sendSpendTx(
      yellowstoneProvider,
      vincentAppId,
      tokenAmountInUsd,
      maxSpendingLimit,
      spendingLimitDuration,
      userPkpInfo.ethAddress,
      userPkpInfo.publicKey
    );
    console.log(`Spend transaction hash: ${spendTxHash}`);
  }

  console.log(`Policy ${policy.policyIpfsCid} executed successfully`);
})();