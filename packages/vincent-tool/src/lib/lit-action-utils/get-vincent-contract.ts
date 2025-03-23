export const getVincentContract = async (
  vincentAddress: string
) => {
  // Create contract instance
  const VINCENT_ABI = [
    `function validateToolExecutionAndGetPolicies(
        address delegatee,
        uint256 pkpTokenId,
        string toolIpfsCid
    ) view returns (
        tuple(
            bool isPermitted,
            uint256 appId,
            uint256 appVersion,
            tuple(
                string policyIpfsCid,
                tuple(
                    string name,
                    uint8 paramType,
                    bytes value
                )[] parameters
            )[] policies) validation
        )`,
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