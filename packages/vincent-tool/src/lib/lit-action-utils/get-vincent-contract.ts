export const getVincentContract = async (
    vincentAddress: string
) => {
    const VINCENT_ABI = [
        `function validateToolExecutionAndGetPolicies(address delegatee, uint256 pkpTokenId, string calldata toolIpfsCid) external view returns (tuple(bool isPermitted, uint256 appId, uint256 appVersion, tuple(string policyIpfsCid, tuple(string name, uint8 paramType, bytes value)[] parameters)[] policies))`,
    ];
    return new ethers.Contract(
        vincentAddress,
        VINCENT_ABI,
        new ethers.providers.JsonRpcProvider(
            await Lit.Actions.getRpcUrl({
                chain: 'yellowstone',
            })
        )
    );
};