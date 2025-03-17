// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";

contract VincentToolViewFacet {
    using VincentToolStorage for VincentToolStorage.ToolStorage;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    function getToolIpfsCidByHash(bytes32 toolIpfsCidHash) external view returns (string memory) {
        return VincentToolStorage.toolStorage().toolIpfsCidHashToIpfsCid[toolIpfsCidHash];
    }

    function getAllRegisteredTools() external view returns (string[] memory toolIpfsCids) {
        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();

        uint256 toolCount = ts_.registeredTools.length();
        toolIpfsCids = new string[](toolCount);
        for (uint256 i = 0; i < toolCount; i++) {
            toolIpfsCids[i] = ts_.toolIpfsCidHashToIpfsCid[ts_.registeredTools.at(i)];
        }
    }

    /**
     * @notice Get all approved tools
     * @return toolIpfsCids Array of approved tool IPFS CIDs
     */
    function getAllApprovedTools() external view returns (string[] memory toolIpfsCids) {
        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();

        uint256 toolCount = ts_.approvedIpfsCidHashes.length();
        toolIpfsCids = new string[](toolCount);
        for (uint256 i = 0; i < toolCount; i++) {
            bytes32 hashedIpfsCid = ts_.approvedIpfsCidHashes.at(i);
            toolIpfsCids[i] = ts_.toolIpfsCidHashToIpfsCid[hashedIpfsCid];
        }
    }

    /**
     * @notice Check if a tool is approved
     * @param toolIpfsCid The IPFS CID of the tool to check
     * @return isApproved Whether the tool is approved
     */
    function isToolApproved(string calldata toolIpfsCid) external view returns (bool isApproved) {
        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();
        bytes32 hashedIpfsCid = keccak256(abi.encodePacked(toolIpfsCid));
        return ts_.approvedIpfsCidHashes.contains(hashedIpfsCid);
    }

    /**
     * @notice Get the current approved tools manager
     * @return manager The address of the current approved tools manager
     */
    function getApprovedToolsManager() external view returns (address manager) {
        return VincentToolStorage.toolStorage().approvedToolsManager;
    }
}
