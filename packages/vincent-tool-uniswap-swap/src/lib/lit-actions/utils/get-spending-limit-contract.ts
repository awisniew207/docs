export const getSpendingLimitContract = async (
    spendingLimitAddress: string
) => {
    const SPENDING_LIMIT_ABI = [
        `function checkLimit(address user, uint256 appId, uint256 amountToSpend, uint256 userMaxSpendLimit, uint256 duration) view returns (bool)`,
        `function spend(uint256 appId, uint256 amount, uint256 userMaxSpendLimit, uint256 duration)`,
        `error SpendLimitExceeded(address user, uint256 appId, uint256 amount, uint256 limit)`,
        `error ZeroAppIdNotAllowed(address user)`,
        `error ZeroDurationQuery(address user)`
    ]

    return new ethers.Contract(
        spendingLimitAddress,
        SPENDING_LIMIT_ABI,
        new ethers.providers.JsonRpcProvider(
            await Lit.Actions.getRpcUrl({
                chain: 'yellowstone',
            })
        )
    )
}
