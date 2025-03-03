// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../LibVincentDiamondStorage.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract VincentToolFacet {
    using VincentRoleStorage for VincentRoleStorage.RoleStorage;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    event NewToolRegistered(bytes32 indexed toolIpfsCidHash);

    function registerTools(string[] calldata toolIpfsCids) external {
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            registerTool(toolIpfsCids[i]);
        }
    }

    function registerTool(string calldata toolIpfsCid) public {
        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();

        bytes32 hashedIpfsCid = keccak256(abi.encodePacked(toolIpfsCid));

        if (!ts_.registeredTools.contains(hashedIpfsCid)) {
            ts_.registeredTools.add(hashedIpfsCid);
            ts_.toolIpfsCidHashToIpfsCid[hashedIpfsCid] = toolIpfsCid;
            emit NewToolRegistered(hashedIpfsCid);
        }
    }
}
