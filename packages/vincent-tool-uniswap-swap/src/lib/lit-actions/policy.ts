export { };

declare global {
  // Required Inputs
  const parentToolIpfsCid: string;
  const vincentContractAddress: string;
  const pkpTokenId: string;
  const delegateeAddress: string;
  const policyParams: {
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

  let maxAmount: any;
  let allowedTokens: string[] = [];

  for (const parameter of policy.parameters) {
    console.log(`Policy Parameter: ${JSON.stringify(parameter, null, 2)}`);

    switch (parameter.name) {
      case 'maxAmount':
        // Parameter type 2 = UINT256
        if (parameter.paramType === 2) {
          maxAmount = decodeDoubleEncodedHex(parameter.value);
          console.log(`Parsed maxAmount: ${maxAmount.toString()}`);
        } else {
          console.warn(`Unexpected parameter type for maxAmount: ${parameter.paramType}`);
        }
        break;
      case 'maxSpendingLimit':
        const spendingLimitDuration = policy.parameters.find(p => p.name === 'spendingLimitDuration');
        if (spendingLimitDuration) {
          const spendingLimitDurationValue = decodeDoubleEncodedHex(spendingLimitDuration.value);
          console.log(`Parsed spendingLimitDuration: ${spendingLimitDurationValue.toString()}`);
        } else {
          throw new Error(`spendingLimitDuration not found in policy parameters`);
        }
        break;
      case 'allowedTokens':
        // Parameter type 7 = ADDRESS_ARRAY
        if (parameter.paramType === 7) {
          // Decode the bytes value to an array of addresses
          const decodedValue = decodeDoubleEncodedHexArray(parameter.value);
          allowedTokens = decodedValue.map((addr: string) => ethers.utils.getAddress(addr));
          console.log(`Parsed allowedTokens: ${allowedTokens.join(', ')}`);
        } else {
          console.warn(`Unexpected parameter type for allowedTokens: ${parameter.paramType}`);
        }
        break;
    }
  }

  const amountInBN = decodeDoubleEncodedHex(policyParams.amountIn);
  const tokenIn = ethers.utils.getAddress(policyParams.tokenIn);
  const tokenOut = ethers.utils.getAddress(policyParams.tokenOut);

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

/**
 * Decodes a potentially double-encoded hex string
 * @param value The potentially double-encoded hex value
 * @returns A BigNumber representing the actual value
 */
// @ts-ignore
function decodeDoubleEncodedHex(value: string): ethers.BigNumber {
  if (value.startsWith('0x')) {
    // Check if it's double-encoded (hex representation of "0x" is "3078")
    if (value.startsWith('0x3078')) {
      // This is a double-encoded hex value
      // First, decode the outer hex to get the string
      const hexString = value.slice(2); // Remove 0x prefix
      const bytes = new Uint8Array(hexString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) ?? []);
      const stringValue = new TextDecoder().decode(bytes);

      // Now we have the inner hex string (like "0x0000..."), convert to BigNumber
      return ethers.BigNumber.from(stringValue);
    } else {
      // Regular hex value
      return ethers.BigNumber.from(value);
    }
  } else {
    // Direct value
    return ethers.BigNumber.from(value);
  }
}

// For arrays (like address arrays)
function decodeDoubleEncodedHexArray(value: string): string[] {
  if (value.startsWith('0x')) {
    // Check if it's double-encoded hex of a JSON string
    if (value.startsWith('0x5b') || value.startsWith('0x3078')) { // '[' in hex is 5b, '0x' is 3078
      // Decode the outer hex
      const hexString = value.slice(2);
      const bytes = new Uint8Array(hexString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) ?? []);
      const stringValue = new TextDecoder().decode(bytes);

      try {
        // If it starts with '[', it's a JSON array
        if (stringValue.startsWith('[')) {
          return JSON.parse(stringValue);
        }
        // If it starts with '0x', it might be a hex-encoded array in ethers format
        else if (stringValue.startsWith('0x')) {
          return ethers.utils.defaultAbiCoder.decode(['address[]'], stringValue)[0];
        }
      } catch (error) {
        console.error('Failed to parse decoded value', error);
        throw new Error('Invalid format after decoding hex');
      }
    } else {
      // Direct ABI-encoded array
      return ethers.utils.defaultAbiCoder.decode(['address[]'], value)[0];
    }
  } else if (value.startsWith('[')) {
    // Direct JSON string
    return JSON.parse(value);
  }

  throw new Error(`Cannot decode value: ${value}`);
}
