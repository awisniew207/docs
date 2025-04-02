/* eslint-disable */
import { ethers } from 'ethers';
import { type Policy } from '@lit-protocol/vincent-tool';

import { getOnChainPolicyParams, getTokenAmountInUsd, sendSpendTx } from './utils';

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
    maxSpendingLimitInUsdCents,
  } = getOnChainPolicyParams(policy.parameters);

  console.log(`Retrieved maxSpendingLimitInUsdCents: ${maxSpendingLimitInUsdCents?.toString()}`);

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

  if (maxSpendingLimitInUsdCents) {
    // maxSpendingLimitInUsdCents has 2 decimal precision, but tokenAmountInUsd has 8,
    // so we multiply by 10^6 to match the precision
    const adjustedMaxSpendingLimit = maxSpendingLimitInUsdCents.mul(ethers.BigNumber.from(1_000_000));
    console.log(`Adjusted maxSpendingLimitInUsdCents to 8 decimal precision: ${adjustedMaxSpendingLimit.toString()}`);

    const spendTxHash = await sendSpendTx(
      yellowstoneProvider,
      vincentAppId,
      tokenAmountInUsd,
      adjustedMaxSpendingLimit,
      ethers.BigNumber.from(86400), // number of seconds in a day
      userPkpInfo.ethAddress,
      userPkpInfo.publicKey
    );
    console.log(`Spend transaction hash: ${spendTxHash}`);
  }

  console.log(`Policy ${policy.policyIpfsCid} executed successfully`);
})();