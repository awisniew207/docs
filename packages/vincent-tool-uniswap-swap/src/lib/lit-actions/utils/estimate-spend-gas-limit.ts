import { ethers } from 'ethers';

import { getSpendingLimitContract } from '.';

export const estimateSpendGasLimit = async (
    spendingLimitAddress: string,
    pkpEthAddress: string,
    appId: string,
    amountInUsd: ethers.BigNumber,
    maxSpendingLimit: ethers.BigNumber,
    spendingLimitDuration: ethers.BigNumber,
    provider: ethers.providers.JsonRpcProvider
): Promise<{
    estimatedGas: ethers.BigNumber;
    maxFeePerGas: ethers.BigNumber;
    maxPriorityFeePerGas: ethers.BigNumber;
    nonce: number;
}> => {
    const spendingLimitContract = await getSpendingLimitContract(spendingLimitAddress);

    // Estimate gas
    console.log(`Estimating gas limit for spend function...`);

    console.log('estimateSpendGasLimit INPUTS', spendingLimitAddress,
        pkpEthAddress,
        appId,
        amountInUsd,
        maxSpendingLimit,
        spendingLimitDuration)

    let estimatedGas = await spendingLimitContract.estimateGas.spend(
        appId,
        amountInUsd,
        maxSpendingLimit,
        spendingLimitDuration,
        { from: pkpEthAddress }
    );
    // Add 20% buffer to estimated gas
    estimatedGas = estimatedGas.mul(120).div(100);

    // Get current gas data
    const [maxFeePerGas, maxPriorityFeePerGas] = await Promise.all([
        provider.getBlock('latest').then((block) => ethers.BigNumber.from(block.baseFeePerGas || 0).mul(2)),
        provider.getGasPrice().then((price: ethers.BigNumber) => ethers.BigNumber.from(price).div(4))
    ]);
    const nonce = await provider.getTransactionCount(pkpEthAddress);

    return {
        estimatedGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce
    };
}; 