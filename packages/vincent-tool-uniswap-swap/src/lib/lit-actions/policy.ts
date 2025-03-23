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
        maxAmount = ethers.utils.defaultAbiCoder.decode(['uint256'], parameter.value);
        console.log(`Max amount: ${maxAmount.toString()}`);
        break;
      case 'allowedTokens':
        allowedTokens = ethers.utils.defaultAbiCoder.decode(['address[]'], parameter.value);
        allowedTokens = allowedTokens.map((addr: string) =>
          ethers.utils.getAddress(addr)
        );
        console.log(`Allowed tokens: ${allowedTokens.join(', ')}`);
        break;
    }
  }

  // Convert string amount to BigNumber and compare
  const amountBN = ethers.BigNumber.from(toolParameters.amountIn);
  console.log(
    `Checking if amount ${amountBN.toString()} exceeds maxAmount ${maxAmount.toString()}...`
  );

  if (amountBN.gt(maxAmount)) {
    throw new Error(
      `Amount ${ethers.utils.formatUnits(
        amountBN
      )} exceeds the maximum amount ${ethers.utils.formatUnits(maxAmount)}`
    );
  }

  if (allowedTokens.length > 0) {
    console.log(`Checking if ${toolParameters.tokenIn} is an allowed token...`);
    if (
      !allowedTokens.includes(ethers.utils.getAddress(toolParameters.tokenIn))
    ) {
      throw new Error(
        `Token ${toolParameters.tokenIn
        } not allowed. Allowed tokens: ${allowedTokens.join(', ')}`
      );
    }

    console.log(
      `Checking if ${toolParameters.tokenOut} is an allowed token...`
    );
    if (
      !allowedTokens.includes(ethers.utils.getAddress(toolParameters.tokenOut))
    ) {
      throw new Error(
        `Token ${toolParameters.tokenOut
        } not allowed. Allowed tokens: ${allowedTokens.join(', ')}`
      );
    }
  }

  console.log('Policy parameters validated');
})();
