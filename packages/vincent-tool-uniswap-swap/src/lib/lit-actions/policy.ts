import { getSpendingLimitContract } from "./utils/get-spending-limit-contract";

declare global {
  // Required Inputs
  const vincentAppId: string;
  const vincentAppVersion: string;
  const SPENDING_LIMIT_ADDRESS: string;
  const userParams: {
    pkpEthAddress: string;
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

  // Convert string amount to BigNumber and compare
  console.log(
    `Checking if amount ${amountInBN.toString()} exceeds maxAmountPerTx ${maxAmountPerTx.toString()}...`
  );

  // 1. Check amount limit
  if (amountInBN.gt(maxAmountPerTx)) {
    throw new Error(
      `Amount ${ethers.utils.formatUnits(
        amountInBN
      )} exceeds the maximum amount ${ethers.utils.formatUnits(maxAmountPerTx)}`
    );
  }

  // 2. Check spending limit
  console.log(`Checking spending limit for PKP: ${userParams.pkpEthAddress} for App ID ${vincentAppId} with request spend amount ${amountInBN.toString()} and max spending limit ${maxSpendingLimit.toString()} and spending limit duration ${spendingLimitDuration.toString()}`);

  // checkLimit returns false if the limit is exceeded
  const isWithinLimit = await spendingLimitContract.checkLimit(
    userParams.pkpEthAddress,
    vincentAppId,
    amountInBN,
    maxSpendingLimit,
    spendingLimitDuration
  );

  if (!isWithinLimit) {
    throw new Error(`${amountInBN.toString()} would exceed App ID: ${vincentAppId} spending limit: ${maxSpendingLimit} for duration: ${spendingLimitDuration}`);
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
