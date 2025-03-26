export interface PolicyParameters {
    // @ts-expect-error ethers is not defined in the global scope
    maxAmountPerTx: ethers.BigNumber | null;
    // @ts-expect-error ethers is not defined in the global scope
    maxSpendingLimit: ethers.BigNumber | null;
    // @ts-expect-error ethers is not defined in the global scope
    spendingLimitDuration: ethers.BigNumber | null;
    allowedTokens: string[];
}

export const parsePolicyParameters = (parameters: { name: string; paramType: number; value: string; }[]): PolicyParameters => {
    // @ts-expect-error ethers is not defined in the global scope
    let maxAmountPerTx: ethers.BigNumber | null = null;
    // @ts-expect-error ethers is not defined in the global scope
    let maxSpendingLimit: ethers.BigNumber | null = null;
    // @ts-expect-error ethers is not defined in the global scope
    let spendingLimitDuration: ethers.BigNumber | null = null;
    let allowedTokens: string[] = [];

    for (const parameter of parameters) {
        console.log(`Policy Parameter: ${JSON.stringify(parameter, null, 2)}`);

        switch (parameter.name) {
            case 'maxAmountPerTx':
                // Parameter type 2 = UINT256
                if (parameter.paramType === 2) {
                    maxAmountPerTx = ethers.utils.defaultAbiCoder.decode(['uint256'], parameter.value)[0];
                    console.log(`Parsed maxAmountPerTx: ${maxAmountPerTx!.toString()}`);
                } else {
                    console.warn(`Unexpected parameter type for maxAmountPerTx: ${parameter.paramType}`);
                }
                break;
            case 'maxSpendingLimit':
                // Parameter type 2 = UINT256
                if (parameter.paramType === 2) {
                    maxSpendingLimit = ethers.utils.defaultAbiCoder.decode(['uint256'], parameter.value)[0];
                    console.log(`Parsed maxSpendingLimit: ${maxSpendingLimit!.toString()}`);

                    // Find the corresponding duration parameter
                    const durationParam = parameters.find(p => p.name === 'spendingLimitDuration');
                    if (!durationParam) {
                        throw new Error('spendingLimitDuration not found in policy parameters');
                    }

                    spendingLimitDuration = ethers.utils.defaultAbiCoder.decode(['uint256'], durationParam.value)[0];
                    console.log(`Parsed spendingLimitDuration: ${spendingLimitDuration!.toString()}`);
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

    return {
        maxAmountPerTx,
        maxSpendingLimit,
        spendingLimitDuration,
        allowedTokens
    };
}; 