import { ethers } from 'ethers';

import { getSpendingLimitContract } from '.';

export const checkSpendingLimits = async (
    spendingLimitAddress: string,
    pkpEthAddress: string,
    appId: string,
    amountInUsd: ethers.BigNumber,
    maxAmountPerTx: ethers.BigNumber,
    maxSpendingLimit: ethers.BigNumber,
    spendingLimitDuration: ethers.BigNumber
): Promise<void> => {
    const spendingLimitContract = await getSpendingLimitContract(spendingLimitAddress);
    const CHAINLINK_DECIMALS = 8;

    // Check amount limit
    console.log(
        `Checking if USD amount $${ethers.utils.formatUnits(amountInUsd, CHAINLINK_DECIMALS).padEnd(10, '0')} exceeds maxAmountPerTx $${ethers.utils.formatUnits(maxAmountPerTx, CHAINLINK_DECIMALS).padEnd(10, '0')}...`
    );

    if (amountInUsd.gt(maxAmountPerTx)) {
        throw new Error(
            `USD amount $${ethers.utils.formatUnits(amountInUsd, CHAINLINK_DECIMALS).padEnd(10, '0')} exceeds the maximum amount $${ethers.utils.formatUnits(maxAmountPerTx, CHAINLINK_DECIMALS).padEnd(10, '0')} allowed for App ID: ${appId} per transaction`
        );
    }

    // Check spending limit
    console.log(
        `Checking spending limit for PKP: ${pkpEthAddress} for App ID ${appId} with request spend amount $${ethers.utils.formatUnits(amountInUsd, CHAINLINK_DECIMALS).padEnd(10, '0')} and max spending limit $${ethers.utils.formatUnits(maxSpendingLimit, CHAINLINK_DECIMALS).padEnd(10, '0')} and spending limit duration ${spendingLimitDuration.toString()}`
    );

    // checkLimit returns false if the limit is exceeded
    const isWithinLimit = await spendingLimitContract.checkLimit(
        pkpEthAddress,
        appId,
        amountInUsd,
        maxSpendingLimit,
        spendingLimitDuration
    );

    if (!isWithinLimit) {
        throw new Error(
            `USD amount $${ethers.utils.formatUnits(amountInUsd, CHAINLINK_DECIMALS).padEnd(10, '0')} would exceed App ID: ${appId} spending limit: $${ethers.utils.formatUnits(maxSpendingLimit, CHAINLINK_DECIMALS).padEnd(10, '0')} for duration: ${spendingLimitDuration}`
        );
    }
}; 