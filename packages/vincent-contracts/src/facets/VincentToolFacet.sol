// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";
import "../diamond-base/libraries/LibDiamond.sol";

contract VincentToolFacet {
    using VincentToolStorage for VincentToolStorage.ToolStorage;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    event NewToolRegistered(bytes32 indexed toolIpfsCidHash);
    event ToolApproved(bytes32 indexed toolIpfsCidHash);
    event ToolApprovalRemoved(bytes32 indexed toolIpfsCidHash);
    event ApprovedToolsManagerUpdated(address indexed previousManager, address indexed newManager);

    error ToolNotRegistered(bytes32 toolIpfsCidHash);
    error ToolAlreadyApproved(bytes32 toolIpfsCidHash);
    error ToolNotApproved(bytes32 toolIpfsCidHash);
    error NotApprovedToolsManager(address caller);
    error InvalidApprovedToolsManager(address manager);

    modifier onlyApprovedToolsManager() {
        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();
        if (ts_.approvedToolsManager != msg.sender) revert NotApprovedToolsManager(msg.sender);
        _;
    }

    modifier onlyContractOwner() {
        LibDiamond.enforceIsContractOwner();
        _;
    }

    function registerTool(bytes calldata toolIpfsCid) public {
        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();

        bytes32 hashedIpfsCid = keccak256(abi.encodePacked(toolIpfsCid));

        if (!ts_.registeredTools.contains(hashedIpfsCid)) {
            ts_.registeredTools.add(hashedIpfsCid);
            ts_.ipfsCidHashToIpfsCid[hashedIpfsCid] = toolIpfsCid;
            emit NewToolRegistered(hashedIpfsCid);
        }
    }

    function registerTools(bytes[] calldata toolIpfsCids) external {
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            registerTool(toolIpfsCids[i]);
        }
    }

    /**
     * @notice Add one or more tools to the approved list
     * @dev Only callable by the approved tools manager
     * @param toolIpfsCids Array of IPFS CIDs of the tools to approve (can be a single tool)
     */
    function approveTools(bytes[] calldata toolIpfsCids) external onlyApprovedToolsManager {
        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();

        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            bytes memory toolIpfsCid = toolIpfsCids[i];
            bytes32 hashedIpfsCid = keccak256(abi.encodePacked(toolIpfsCid));

            // Ensure the tool is not already approved
            if (ts_.approvedIpfsCidHashes.contains(hashedIpfsCid)) {
                revert ToolAlreadyApproved(hashedIpfsCid);
            }

            // Ensure the tool is registered
            if (!ts_.registeredTools.contains(hashedIpfsCid)) {
                revert ToolNotRegistered(hashedIpfsCid);
            }

            // Add the tool to the approved list
            ts_.approvedIpfsCidHashes.add(hashedIpfsCid);
            emit ToolApproved(hashedIpfsCid);
        }
    }

    /**
     * @notice Remove one or more tools from the approved list
     * @dev Only callable by the approved tools manager
     * @param toolIpfsCids Array of IPFS CIDs of the tools to remove from the approved list (can be a single tool)
     */
    function removeToolApprovals(bytes[] calldata toolIpfsCids) external onlyApprovedToolsManager {
        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();

        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            bytes memory toolIpfsCid = toolIpfsCids[i];
            bytes32 hashedIpfsCid = keccak256(abi.encodePacked(toolIpfsCid));

            // Ensure the tool is approved
            if (!ts_.approvedIpfsCidHashes.contains(hashedIpfsCid)) {
                revert ToolNotApproved(hashedIpfsCid);
            }

            // Remove the tool from the approved list
            ts_.approvedIpfsCidHashes.remove(hashedIpfsCid);
            emit ToolApprovalRemoved(hashedIpfsCid);
        }
    }

    /**
     * @notice Update the approved tools manager address
     * @dev Only callable by the contract owner
     * @param newManager The new approved tools manager address
     */
    function updateApprovedToolsManager(address newManager) external onlyContractOwner {
        if (newManager == address(0)) {
            revert InvalidApprovedToolsManager(newManager);
        }

        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();
        address previousManager = ts_.approvedToolsManager;
        ts_.approvedToolsManager = newManager;

        emit ApprovedToolsManagerUpdated(previousManager, newManager);
    }
}
