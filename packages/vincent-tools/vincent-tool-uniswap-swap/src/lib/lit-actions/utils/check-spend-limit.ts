import { ethers } from 'ethers';

import { getAddressesByChainId } from './get-addresses-by-chain-id';

export const checkSpendLimit = async (
    yellowstoneProvider: ethers.providers.JsonRpcProvider,
    appId: string,
    amountInUsd: ethers.BigNumber,
    maxSpendingLimitInUsdCents: ethers.BigNumber,
    spendingLimitDuration: ethers.BigNumber,
    pkpEthAddress: string,
) => {
    const { SPENDING_LIMIT_ADDRESS } = getAddressesByChainId('175188'); // Yellowstone

    const SPENDING_LIMIT_ABI = [
        `function checkLimit(address user, uint256 appId, uint256 amountToSpend, uint256 userMaxSpendLimit, uint256 duration) view returns (bool)`,
        `error SpendLimitExceeded(address user, uint256 appId, uint256 amount, uint256 limit)`,
        `error ZeroAppIdNotAllowed(address user)`,
        `error ZeroDurationQuery(address user)`
    ];

    const spendingLimitContract = new ethers.Contract(
        SPENDING_LIMIT_ADDRESS!,
        SPENDING_LIMIT_ABI,
        yellowstoneProvider
    );

    return spendingLimitContract.checkLimit(
        pkpEthAddress,
        appId,
        amountInUsd,
        maxSpendingLimitInUsdCents,
        spendingLimitDuration
    );
}