export { };

declare global {
  // Required Inputs
  const parentToolIpfsCid: string;
  const vincentContractAddress: string;
  const pkpTokenId: string;
  const delegateeAddress: string;
  const toolParameters: {
    pkpEthAddress: string;
    rpcUrl: string;
    chainId: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
  };
  const policyObject: {
    policyIpfsCid: string;
    parameters: {
      name: string;
      paramType: number;
      value: string;
    }[];
  };
}

(async () => {
  console.log(`Executing policy ${policyObject.policyIpfsCid}`);
  console.log(`Policy parameters: ${JSON.stringify(policyObject.parameters, null, 2)}`);

  let maxAmount: any;
  let allowedTokens: string[] = [];

  for (const parameter of policyObject.parameters) {
    console.log(`Policy Parameter: ${JSON.stringify(parameter, null, 2)}`);

    switch (parameter.name) {
      case 'maxAmount':
        // Parameter type 2 = UINT256
        if (parameter.paramType === 2) {
          maxAmount = ethers.utils.defaultAbiCoder.decode(['uint256'], parameter.value);
          console.log(`Parsed maxAmount: ${maxAmount.toString()}`);
        } else {
          console.warn(`Unexpected parameter type for maxAmount: ${parameter.paramType}`);
        }
        break;
      case 'allowedTokens':
        // Parameter type 7 = ADDRESS_ARRAY
        if (parameter.paramType === 7) {
          // Decode the bytes value to an array of addresses
          const decodedValue = ethers.utils.defaultAbiCoder.decode(['address[]'], parameter.value)[0];
          allowedTokens = decodedValue.map((addr: string) => ethers.utils.getAddress(addr));
          console.log(`Parsed allowedTokens: ${allowedTokens.join(', ')}`);
        } else {
          console.warn(`Unexpected parameter type for allowedTokens: ${parameter.paramType}`);
        }
        break;
    }
  }

  const amountInBN = ethers.BigNumber.from(toolParameters.amountIn);
  const tokenIn = ethers.utils.getAddress(toolParameters.tokenIn);
  const tokenOut = ethers.utils.getAddress(toolParameters.tokenOut);

  // Convert string amount to BigNumber and compare
  console.log(
    `Checking if amount ${amountInBN.toString()} exceeds maxAmount ${maxAmount.toString()}...`
  );

  // 1. Check amount limit
  if (amountInBN.gt(maxAmount)) {
    throw new Error(
      `Amount ${ethers.utils.formatUnits(
        amountInBN
      )} exceeds the maximum amount ${ethers.utils.formatUnits(maxAmount)}`
    );
  }

  // 2. Check allowed tokens
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
