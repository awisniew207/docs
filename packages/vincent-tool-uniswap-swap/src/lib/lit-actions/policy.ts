// @ts-nocheck
import { getBestQuote, getSpendingLimitContract, getUniswapQuoterRouter, getEthPriceInUsd, createSpendTx, signTx, broadcastTransaction } from "./utils";

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
  const spendingLimitContract = await getSpendingLimitContract(SPENDING_LIMIT_ADDRESS);

  let maxAmountPerTx: any;
  let maxSpendingLimit: any;
  let spendingLimitDuration: any;
  let allowedTokens: string[] = [];

  for (const parameter of policy.parameters) {
    console.log(`Policy Parameter: ${JSON.stringify(parameter, null, 2)}`);

    switch (parameter.name) {
      case 'maxAmountPerTx':
        // Parameter type 2 = UINT256
        if (parameter.paramType === 2) {
          maxAmountPerTx = ethers.utils.defaultAbiCoder.decode(['uint256'], parameter.value)[0];
          console.log(`Parsed maxAmountPerTx: ${maxAmountPerTx.toString()}`);
        } else {
          console.warn(`Unexpected parameter type for maxAmountPerTx: ${parameter.paramType}`);
        }
        break;
      case 'maxSpendingLimit':
        // Parameter type 2 = UINT256
        if (parameter.paramType === 2) {
          maxSpendingLimit = ethers.utils.defaultAbiCoder.decode(['uint256'], parameter.value)[0];
          console.log(`Parsed maxSpendingLimit: ${maxSpendingLimit.toString()}`);

          // Find the corresponding duration parameter
          spendingLimitDuration = policy.parameters.find(p => p.name === 'spendingLimitDuration');
          if (!spendingLimitDuration) {
            throw new Error('spendingLimitDuration not found in policy parameters');
          }

          spendingLimitDuration = ethers.utils.defaultAbiCoder.decode(['uint256'], spendingLimitDuration.value)[0];
          console.log(`Parsed spendingLimitDuration: ${spendingLimitDuration.toString()}`);
        } else {
          console.warn(`Unexpected parameter type for maxSpendingLimit: ${parameter.paramType}`);
        }
        break;
      case 'allowedTokens':
        // Parameter type 7 = ADDRESS_ARRAY
        if (parameter.paramType === 7) {
          allowedTokens = ethers.utils.defaultAbiCoder.decode(['address[]'], parameter.value)[0];
          console.log(`Parsed allowedTokens: ${allowedTokens.join(', ')}`);
        } else {
          console.warn(`Unexpected parameter type for allowedTokens: ${parameter.paramType}`);
        }
        break;
    }
  }

  const amountInBN = ethers.BigNumber.from(userParams.amountIn);
  const tokenIn = ethers.utils.getAddress(userParams.tokenIn);
  const tokenOut = ethers.utils.getAddress(userParams.tokenOut);

  // Get Uniswap quoter and WETH address for the current chain
  const { UNISWAP_V3_QUOTER, WETH_ADDRESS } = getUniswapQuoterRouter(userParams.chainId);

  // Get token price in WETH from Uniswap
  console.log(`Getting ${amountInBN.toString()} ${tokenIn} price in WETH from Uniswap...`);
  const { bestQuote } = await getBestQuote(
    provider,
    UNISWAP_V3_QUOTER,
    tokenIn,
    WETH_ADDRESS,
    amountInBN,
    18 // WETH decimals
  );
  const amountInWeth = bestQuote;
  console.log(`Amount in WETH: ${ethers.utils.formatUnits(amountInWeth, 18)}`);

  // Get ETH price in USD from Chainlink on Ethereum mainnet
  const ethUsdPrice = await getEthPriceInUsd();
  console.log(`ETH price in USD (8 decimals): ${ethUsdPrice.toString()}`);

  // Calculate USD value (8 decimals precision)
  const CHAINLINK_DECIMALS = 8;
  const TOKEN_DECIMALS = 18; // WETH decimals
  const amountInUsd = amountInWeth.mul(ethUsdPrice).div(ethers.BigNumber.from(10).pow(TOKEN_DECIMALS));
  console.log(`Token amount in USD (8 decimals): $${ethers.utils.formatUnits(amountInUsd, CHAINLINK_DECIMALS)}`);

  // Convert string amount to BigNumber and compare
  console.log(
    `Checking if USD amount $${ethers.utils.formatUnits(amountInUsd, CHAINLINK_DECIMALS).padEnd(10, '0')} exceeds maxAmountPerTx $${ethers.utils.formatUnits(maxAmountPerTx, CHAINLINK_DECIMALS).padEnd(10, '0')}...`
  );

  // 1. Check amount limit
  if (amountInUsd.gt(maxAmountPerTx)) {
    throw new Error(
      `USD amount $${ethers.utils.formatUnits(amountInUsd, CHAINLINK_DECIMALS).padEnd(10, '0')} exceeds the maximum amount $${ethers.utils.formatUnits(maxAmountPerTx, CHAINLINK_DECIMALS).padEnd(10, '0')} allowed for App ID: ${vincentAppId} per transaction`
    );
  }

  // 2. Check spending limit
  console.log(
    `Checking spending limit for PKP: ${userParams.pkpEthAddress} for App ID ${vincentAppId} with request spend amount $${ethers.utils.formatUnits(amountInUsd, CHAINLINK_DECIMALS).padEnd(10, '0')} and max spending limit $${ethers.utils.formatUnits(maxSpendingLimit, CHAINLINK_DECIMALS).padEnd(10, '0')} and spending limit duration ${spendingLimitDuration.toString()}`
  );

  // checkLimit returns false if the limit is exceeded
  const isWithinLimit = await spendingLimitContract.checkLimit(
    userParams.pkpEthAddress,
    vincentAppId,
    amountInUsd,
    maxSpendingLimit,
    spendingLimitDuration
  );

  if (!isWithinLimit) {
    throw new Error(
      `USD amount $${ethers.utils.formatUnits(amountInUsd, CHAINLINK_DECIMALS).padEnd(10, '0')} would exceed App ID: ${vincentAppId} spending limit: $${ethers.utils.formatUnits(maxSpendingLimit, CHAINLINK_DECIMALS).padEnd(10, '0')} for duration: ${spendingLimitDuration}`
    );
  }

  try {
    // Estimate gas
    console.log(`Estimating gas limit for spend function...`);
    let estimatedGas;
    try {
      estimatedGas = await spendingLimitContract.estimateGas.spend(
        vincentAppId,
        amountInUsd,
        maxSpendingLimit,
        spendingLimitDuration,
        { from: userParams.pkpEthAddress }
      );
      // Add 20% buffer to estimated gas
      estimatedGas = estimatedGas.mul(120).div(100);
    } catch (error) {
      console.error('Error estimating gas:', error);
      estimatedGas = ethers.BigNumber.from('300000'); // Fallback gas limit
      console.log(`Failed to estimate gas. Using fallback gas limit: ${estimatedGas.toString()}`);
    }

    // Get current gas data
    const [maxFeePerGas, maxPriorityFeePerGas] = await Promise.all([
      provider.getBlock('latest').then((block: { baseFeePerGas: ethers.BigNumber | null | undefined }) => ethers.BigNumber.from(block.baseFeePerGas || 0).mul(2)),
      provider.getGasPrice().then((price: ethers.BigNumber) => ethers.BigNumber.from(price).div(4))
    ]);
    const nonce = await provider.getTransactionCount(userParams.pkpEthAddress);

    const gasData = {
      maxFeePerGas: maxFeePerGas.toHexString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toHexString(),
      nonce
    };

    const txData = spendingLimitContract.interface.encodeFunctionData('spend', [
      vincentAppId,
      amountInUsd,
      maxSpendingLimit,
      spendingLimitDuration,
    ]);

    const spendTx = {
      to: SPENDING_LIMIT_ADDRESS,
      data: txData,
      value: '0x0',
      gasLimit: estimatedGas.toHexString(),
      maxFeePerGas: gasData.maxFeePerGas,
      maxPriorityFeePerGas: gasData.maxPriorityFeePerGas,
      nonce: gasData.nonce,
      chainId: userParams.chainId,
      type: 2,
    };

    const signedSpendTx = await signTx(userParams.pkpPubKey, spendTx, 'spendingLimitSig');
    const spendHash = await broadcastTransaction(new ethers.providers.JsonRpcProvider(
      await Lit.Actions.getRpcUrl({
        chain: 'yellowstone',
      })
    ), signedSpendTx);
    console.log('Spend transaction hash:', spendHash);
  } catch (error: any) {
    throw new Error(`Error updating spending contract: ${error}`);
  }

  // 3. Check allowed tokens
  if (allowedTokens.length > 0) {
    // Check if tokenIn is allowed
    if (!allowedTokens.includes(tokenIn)) {
      throw new Error(
        `Token ${tokenIn} is not allowed for input. Allowed tokens: ${allowedTokens.join(', ')}`
      );
    }

    // Check if tokenOut is allowed
    if (!allowedTokens.includes(tokenOut)) {
      throw new Error(
        `Token ${tokenOut} is not allowed for output. Allowed tokens: ${allowedTokens.join(', ')}`
      );
    }
  }

  console.log('All policy checks passed');
})();
