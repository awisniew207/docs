export const getSpendingLimitContract = async (
    spendingLimitAddress: string
) => {
    const SPENDING_LIMIT_ABI = [
        `function checkLimit(address user, uint256 appId, uint256 amountToSpend, uint256 userMaxSpendLimit, uint256 duration) view returns (bool)`,
        `function getAppSpendHistory(address user, uint256 appId, uint256 duration) view returns (tuple(uint256 timestamp, uint256 runningSpend)[] history)`,
        `function getAppsSpentInDuration(address user, uint256[] appIds, uint256 duration) view returns (uint256)`,
        `function getTotalSpent(address user, uint256 duration) view returns (uint256)`,
        `function spend(uint256 appId, uint256 amount, uint256 userMaxSpendLimit, uint256 duration)`,

        `event Spent(address indexed spender, uint256 indexed appId, uint256 amount, uint256 timestamp)`,

        `error EmptyAppIdsArray(address user)`,
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
