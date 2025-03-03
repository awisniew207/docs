// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../VincentDiamondStorage.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract VincentRoleFacet {
    using VincentRoleStorage for VincentRoleStorage.RoleStorage;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    event NewToolRegistered(uint256 indexed appId, uint256 indexed roleId, bytes32 indexed toolIpfsCidHash);
    event NewRoleRegistered(uint256 indexed appId, uint256 indexed roleId);
    event RoleEnabled(uint256 indexed appId, uint256 indexed roleId, bool indexed enabled);
    event RoleMetadataUpdated(uint256 indexed appId, uint256 indexed roleId);
    event RoleUpdated(uint256 indexed appId, uint256 indexed roleId, uint256 indexed newRoleVersion);
    event ToolsAddedToRole(
        uint256 indexed appId, uint256 indexed roleId, uint256 indexed newRoleVersion, uint256 numberOfToolsAdded
    );
    event ToolsRemovedFromRole(
        uint256 indexed appId, uint256 indexed roleId, uint256 indexed newRoleVersion, uint256 numberOfToolsRemoved
    );

    error NotAppManager(uint256 appId, address caller);
    error AppNotRegistered(uint256 appId);
    error RoleNotRegistered(uint256 appId, uint256 roleId);

    modifier onlyAppManager(uint256 appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        if (as_.appIdToApp[appId].manager != msg.sender) revert NotAppManager(appId, msg.sender);
        _;
    }

    modifier onlyRegisteredApp(uint256 appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        if (!as_.registeredApps.contains(appId)) revert AppNotRegistered(appId);
        _;
    }

    modifier onlyRegisteredRole(uint256 appId, uint256 roleId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        if (!as_.appIdToApp[appId].roles.contains(roleId)) revert RoleNotRegistered(appId, roleId);
        _;
    }

    function registerRole(
        uint256 appId,
        string calldata name,
        string calldata description,
        string[] calldata toolIpfsCids
    ) external onlyAppManager(appId) onlyRegisteredApp(appId) returns (uint256 roleId) {
        VincentRoleStorage.RoleStorage storage rs_ = VincentRoleStorage.roleStorage();

        roleId = rs_.roleIdCounter++;

        VincentRoleStorage.Role storage role = rs_.roleIdToRole[roleId];
        role.version = 1;
        role.enabled = true;
        role.name = name;
        role.description = description;

        rs_.registeredRoles.add(roleId);
        rs_.roleIdToRoleVersions[roleId].add(role.version);
        rs_.roleIdToLatestRoleVersion[roleId] = role.version;

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppStorage.App storage app = as_.appIdToApp[appId];
        app.roles.add(roleId);

        _addToolsToRole(role, appId, roleId, toolIpfsCids);

        emit NewRoleRegistered(appId, roleId);
    }

    function enableRole(uint256 appId, uint256 roleId, bool enabled)
        external
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
        onlyRegisteredRole(appId, roleId)
    {
        VincentRoleStorage.RoleStorage storage rs_ = VincentRoleStorage.roleStorage();
        VincentRoleStorage.Role storage role = rs_.roleIdToRole[roleId];
        role.enabled = enabled;

        emit RoleEnabled(appId, roleId, enabled);
    }

    function updateRoleMetadata(uint256 appId, uint256 roleId, string calldata name, string calldata description)
        external
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
        onlyRegisteredRole(appId, roleId)
        returns (uint256 newRoleVersion)
    {
        VincentRoleStorage.RoleStorage storage rs_ = VincentRoleStorage.roleStorage();
        VincentRoleStorage.Role storage role = rs_.roleIdToRole[roleId];
        role.name = name;
        role.description = description;

        rs_.roleIdToRoleVersions[roleId].add(newRoleVersion);
        rs_.roleIdToLatestRoleVersion[roleId] = newRoleVersion;

        emit RoleMetadataUpdated(appId, roleId);
    }

    function addToolsToRole(uint256 appId, uint256 roleId, string[] calldata toolIpfsCids)
        external
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
        onlyRegisteredRole(appId, roleId)
    {
        VincentRoleStorage.RoleStorage storage rs_ = VincentRoleStorage.roleStorage();
        VincentRoleStorage.Role storage role = rs_.roleIdToRole[roleId];

        uint256 numberOfToolsAdded = _addToolsToRole(role, appId, roleId, toolIpfsCids);

        if (numberOfToolsAdded > 0) {
            role.version++;
            rs_.roleIdToRoleVersions[roleId].add(role.version);
            rs_.roleIdToLatestRoleVersion[roleId] = role.version;

            emit ToolsAddedToRole(appId, roleId, role.version, numberOfToolsAdded);
        }
    }

    function removeToolsFromRole(uint256 appId, uint256 roleId, string[] calldata toolIpfsCids)
        external
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
        onlyRegisteredRole(appId, roleId)
    {
        VincentRoleStorage.RoleStorage storage rs_ = VincentRoleStorage.roleStorage();
        VincentRoleStorage.Role storage role = rs_.roleIdToRole[roleId];

        uint256 numberOfToolsRemoved;
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            bytes32 hashedIpfsCid = keccak256(abi.encodePacked(toolIpfsCids[i]));

            if (role.toolIpfsCidHashes.contains(hashedIpfsCid)) {
                role.toolIpfsCidHashes.remove(hashedIpfsCid);
                numberOfToolsRemoved++;
            }
        }

        if (numberOfToolsRemoved > 0) {
            role.version++;
            rs_.roleIdToRoleVersions[roleId].add(role.version);
            rs_.roleIdToLatestRoleVersion[roleId] = role.version;

            emit ToolsRemovedFromRole(appId, roleId, role.version, numberOfToolsRemoved);
        }
    }

    function _addToolsToRole(
        VincentRoleStorage.Role storage role,
        uint256 appId,
        uint256 roleId,
        string[] calldata toolIpfsCids
    ) internal returns (uint256 numberOfToolsAdded) {
        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();

        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            bytes32 hashedIpfsCid = keccak256(abi.encodePacked(toolIpfsCids[i]));

            if (!role.toolIpfsCidHashes.contains(hashedIpfsCid)) {
                role.toolIpfsCidHashes.add(hashedIpfsCid);
                numberOfToolsAdded++;

                if (!ts_.registeredTools.contains(hashedIpfsCid)) {
                    ts_.registeredTools.add(hashedIpfsCid);
                    ts_.toolIpfsCidHashToIpfsCid[hashedIpfsCid] = toolIpfsCids[i];

                    emit NewToolRegistered(appId, roleId, hashedIpfsCid);
                }
            }
        }
    }
}
