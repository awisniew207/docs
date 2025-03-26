import { checkAllowedTokens, parsePolicyParameters, calculateUsdValue, checkSpendingLimits, sendSpendTransaction } from "./utils";

declare global {
  // Required Inputs
  const vincentAppId: string;
  const vincentAppVersion: string;
  const SPENDING_LIMIT_ADDRESS: string;
  const userParams: {
    pkpEthAddress: string;
    pkpPubKey: string;
    rpcUrl: string;
    chainId: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
  };
  const policy: {
    policyIpfsCid: string;
    parameters: {
      name: string;
      paramType: number;
      value: string;
    }[];
  };
}

(async () => {
  console.log(`Executing policy ${policy.policyIpfsCid}`);
  console.log(`Policy parameters: ${JSON.stringify(policy.parameters, null, 2)}`);

  const provider = new ethers.providers.JsonRpcProvider(userParams.rpcUrl);
  const tokenIn = ethers.utils.getAddress(userParams.tokenIn);

  const { maxAmountPerTx, maxSpendingLimit, spendingLimitDuration, allowedTokens } = parsePolicyParameters(policy.parameters);

  const amountInUsd = await calculateUsdValue(provider, tokenIn, ethers.BigNumber.from(userParams.amountIn), userParams.chainId);

  checkAllowedTokens(tokenIn, ethers.utils.getAddress(userParams.tokenOut), allowedTokens);

  await checkSpendingLimits(
    SPENDING_LIMIT_ADDRESS,
    userParams.pkpEthAddress,
    vincentAppId,
    amountInUsd,
    maxAmountPerTx!,
    maxSpendingLimit!,
    spendingLimitDuration!
  );

  console.log('All policy checks passed');

  console.log('Updating the Spending Limit Contract...');

  const spendTxHash = await sendSpendTransaction(
    SPENDING_LIMIT_ADDRESS,
    userParams.pkpEthAddress,
    userParams.pkpPubKey,
    vincentAppId,
    amountInUsd,
    maxSpendingLimit!,
    spendingLimitDuration!,
  );

  console.log(`Spending Limit Contract updated transaction hash: ${spendTxHash}`);
})();
