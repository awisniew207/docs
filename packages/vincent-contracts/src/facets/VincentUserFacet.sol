// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";
import "../VincentBase.sol";

contract VincentUserFacet is VincentBase {
    using VincentUserStorage for VincentUserStorage.UserStorage;
    using VincentAppStorage for VincentAppStorage.AppStorage;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    event ToolPolicyParametersSet(uint256 indexed appId, uint256 indexed pkpTokenId, bytes32 indexed hashedToolIpfsCid, bytes32 hashedPolicyParameterName);
    event ToolPolicyParametersRemoved(uint256 indexed appId, uint256 indexed pkpTokenId, bytes32 indexed hashedToolIpfsCid, bytes32 hashedPolicyParameterName);

    error NotPkpOwner(uint256 pkpTokenId, address msgSender);
    error AppNotEnabled(uint256 appId);
    error ToolIpfsCidsAndPolicyParameterLengthMismatch();
    error ToolNotRegistered(bytes32 hashedToolIpfsCid);

    modifier onlyPkpOwner(uint256 pkpTokenId) {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        if (us_.PKP_NFT_FACET.ownerOf(pkpTokenId) != msg.sender) revert NotPkpOwner(pkpTokenId, msg.sender);
        _;
    }

    function permitApp(
        uint256 appId,
        uint256 pkpTokenId,
        string[] calldata toolIpfsCids,
        string[] calldata policyParameterNames,
        string[] calldata policyParameterValues
    ) external onlyPkpOwner(pkpTokenId) onlyRegisteredApp(appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        // Check if the App Manager has disabled the App
        if (!as_.appIdToApp[appId].enabled) revert AppNotEnabled(appId);

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        us_.pkpTokenIdToPermittedAppIds[pkpTokenId].add(appId);

        if (!us_.registeredUsers.contains(pkpTokenId)) {
            us_.registeredUsers.add(pkpTokenId);
        }

        // Save some gas by not calling the setToolPolicyParameters function if there are no tool policy parameters to set
        if (toolIpfsCids.length > 0) {
            _setToolPolicyParameters(appId, pkpTokenId, toolIpfsCids, policyParameterNames, policyParameterValues);
        }
    }

    function unPermitApp(uint256 appId, uint256 pkpTokenId) external onlyPkpOwner(pkpTokenId) onlyRegisteredApp(appId) {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        us_.pkpTokenIdToPermittedAppIds[pkpTokenId].remove(appId);

        VincentUserToolPolicyStorage.UserToolPolicyStorage storage utps_ = VincentUserToolPolicyStorage.userToolPolicyStorage();
        // Delete all the tool policy parameters for the App
        delete utps_.pkpTokenIdToUser[pkpTokenId].appIdToAppStorage[appId];
    }

    function setToolPolicyParameters(
        uint256 appId,
        uint256 pkpTokenId,
        string[] calldata toolIpfsCids,
        string[] calldata policyParameterNames,
        string[] calldata policyParameterValues
    ) public onlyPkpOwner(pkpTokenId) onlyRegisteredApp(appId) {
        _setToolPolicyParameters(appId, pkpTokenId, toolIpfsCids, policyParameterNames, policyParameterValues);
    }

    function removeToolPolicyParameters(
        uint256 appId,
        uint256 pkpTokenId,
        string[] calldata toolIpfsCids,
        string[] calldata policyParameterNames
    ) external onlyPkpOwner(pkpTokenId) onlyRegisteredApp(appId) {
        if (toolIpfsCids.length != policyParameterNames.length) revert ToolIpfsCidsAndPolicyParameterLengthMismatch();

        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();
        VincentUserToolPolicyStorage.UserToolPolicyStorage storage utps_ = VincentUserToolPolicyStorage.userToolPolicyStorage();

        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            bytes32 hashedToolIpfsCid = keccak256(abi.encodePacked(toolIpfsCids[i]));

            // Check if the Tool is registered
            if (!ts_.registeredTools.contains(hashedToolIpfsCid)) revert ToolNotRegistered(hashedToolIpfsCid);

            VincentUserToolPolicyStorage.ToolStorage storage toolStorage = utps_.pkpTokenIdToUser[pkpTokenId].appIdToAppStorage[appId].toolIpfsCidHashToToolStorage[hashedToolIpfsCid];

            bytes32 hashedPolicyParameterName = keccak256(abi.encodePacked(policyParameterNames[i]));

            // Remove the Policy Parameter Name hash from the Tool Storage
            toolStorage.policyParameterNameHashes.remove(hashedPolicyParameterName);

            // Delete the Policy Parameter Value
            delete toolStorage.policyParameterNameHashToValue[hashedPolicyParameterName];

            emit ToolPolicyParametersRemoved(appId, pkpTokenId, hashedToolIpfsCid, hashedPolicyParameterName);
        }
    }

    function _setToolPolicyParameters(
        uint256 appId,
        uint256 pkpTokenId,
        string[] calldata toolIpfsCids,
        string[] calldata policyParameterNames,
        string[] calldata policyParameterValues
    ) internal {
        if (toolIpfsCids.length != policyParameterNames.length || toolIpfsCids.length != policyParameterValues.length) revert ToolIpfsCidsAndPolicyParameterLengthMismatch();

        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();
        VincentUserToolPolicyStorage.UserToolPolicyStorage storage utps_ = VincentUserToolPolicyStorage.userToolPolicyStorage();

        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            bytes32 hashedToolIpfsCid = keccak256(abi.encodePacked(toolIpfsCids[i]));

            // Check if the Tool is registered
            if (!ts_.registeredTools.contains(hashedToolIpfsCid)) revert ToolNotRegistered(hashedToolIpfsCid);

            VincentUserToolPolicyStorage.ToolStorage storage toolStorage = utps_.pkpTokenIdToUser[pkpTokenId].appIdToAppStorage[appId].toolIpfsCidHashToToolStorage[hashedToolIpfsCid];

            bytes32 hashedPolicyParameterName = keccak256(abi.encodePacked(policyParameterNames[i]));

            // Check if the Policy Parameter Name is registered globally, if not, register it
            if (bytes(utps_.policyParameterNameHashToName[hashedPolicyParameterName]).length == 0) {
                utps_.policyParameterNameHashToName[hashedPolicyParameterName] = policyParameterNames[i];
            }

            // Add the Policy Parameter Name hash to the User's Tool Policy Storage
            toolStorage.policyParameterNameHashes.add(hashedPolicyParameterName);

            // Set the Policy Parameter Value in the User's Tool Policy Storage
            toolStorage.policyParameterNameHashToValue[hashedPolicyParameterName] = policyParameterValues[i];

            emit ToolPolicyParametersSet(appId, pkpTokenId, hashedToolIpfsCid, hashedPolicyParameterName);
        }
    }
}
