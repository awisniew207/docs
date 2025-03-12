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

    event ToolPolicyParameterSet(
        uint256 indexed pkpTokenId,
        uint256 indexed appId,
        uint256 indexed appVersion,
        bytes32 hashedToolIpfsCid,
        bytes32 hashedPolicyParameterName
    );
    event ToolPolicyParameterRemoved(
        uint256 indexed pkpTokenId,
        uint256 indexed appId,
        uint256 indexed appVersion,
        bytes32 hashedToolIpfsCid,
        bytes32 hashedPolicyParameterName
    );

    error NotPkpOwner(uint256 pkpTokenId, address msgSender);
    error AppVersionAlreadyPermitted(uint256 pkpTokenId, uint256 appId, uint256 appVersion);
    error AppVersionNotPermitted(uint256 pkpTokenId, uint256 appId, uint256 appVersion);
    error AppVersionNotEnabled(uint256 appId, uint256 appVersion);
    error ToolsAndPoliciesLengthMismatch();
    error ToolNotRegisteredForAppVersion(uint256 appId, uint256 appVersion, bytes32 hashedToolIpfsCid);
    error ToolPolicyNotRegisteredForAppVersion(
        uint256 appId, uint256 appVersion, bytes32 hashedToolIpfsCid, bytes32 hashedToolPolicy
    );
    error PolicyParameterNameNotRegisteredForAppVersion(
        uint256 appId, uint256 appVersion, bytes32 hashedToolIpfsCid, bytes32 hashedPolicyParameterName
    );

    modifier onlyPkpOwner(uint256 pkpTokenId) {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        if (us_.PKP_NFT_FACET.ownerOf(pkpTokenId) != msg.sender) revert NotPkpOwner(pkpTokenId, msg.sender);
        _;
    }

    function permitAppVersion(
        uint256 pkpTokenId,
        uint256 appId,
        uint256 appVersion,
        string[] calldata toolIpfsCids,
        string[][] calldata policyIpfsCids,
        string[][][] calldata policyParameterNames,
        string[][][] calldata policyParameterValues
    ) external onlyPkpOwner(pkpTokenId) onlyRegisteredApp(appId) onlyRegisteredAppVersion(appId, appVersion) {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        if (us_.agentPkpTokenIdToPermittedAppVersions[pkpTokenId][appId].contains(appVersion)) {
            revert AppVersionAlreadyPermitted(pkpTokenId, appId, appVersion);
        }

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        // App versions start at 1, but the appVersions array is 0-indexed
        VincentAppStorage.VersionedApp storage versionedApp = as_.appIdToApp[appId].versionedApps[appVersion - 1];

        // Check if the App Manager has disabled the App
        if (!versionedApp.enabled) revert AppVersionNotEnabled(appId, appVersion);

        // Add the PKP Token ID to the app version's delegated agent PKPs
        versionedApp.delegatedAgentPkps.add(pkpTokenId);

        // Add the app version to the User's permitted apps
        us_.agentPkpTokenIdToPermittedAppVersions[pkpTokenId][appId].add(appVersion);

        // Add the PKP Token ID to the global registered agent PKPs if it is not already registered
        if (!us_.registeredAgentPkps.contains(pkpTokenId)) {
            us_.registeredAgentPkps.add(pkpTokenId);
        }

        // Save some gas by not calling the setToolPolicyParameters function if there are no tool policy parameters to set
        if (toolIpfsCids.length > 0) {
            _setToolPolicyParameters(
                appId, pkpTokenId, appVersion, toolIpfsCids, policyIpfsCids, policyParameterNames, policyParameterValues
            );
        }
    }

    function unPermitApp(uint256 pkpTokenId, uint256 appId, uint256 appVersion)
        external
        onlyPkpOwner(pkpTokenId)
        onlyRegisteredApp(appId)
        onlyRegisteredAppVersion(appId, appVersion)
    {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        if (!us_.agentPkpTokenIdToPermittedAppVersions[pkpTokenId][appId].contains(appVersion)) {
            revert AppVersionNotPermitted(pkpTokenId, appId, appVersion);
        }

        // Remove the PKP Token ID from the App's Delegated Agent PKPs
        // App versions start at 1, but the appVersions array is 0-indexed
        VincentAppStorage.appStorage().appIdToApp[appId].versionedApps[appVersion - 1].delegatedAgentPkps.remove(
            pkpTokenId
        );

        // Remove the App Version from the User's Permitted App Versions
        us_.agentPkpTokenIdToPermittedAppVersions[pkpTokenId][appId].remove(appVersion);
    }

    function setToolPolicyParameters(
        uint256 pkpTokenId,
        uint256 appId,
        uint256 appVersion,
        string[] calldata toolIpfsCids,
        string[][] calldata policyIpfsCids,
        string[][][] calldata policyParameterNames,
        string[][][] calldata policyParameterValues
    ) public onlyPkpOwner(pkpTokenId) onlyRegisteredApp(appId) onlyRegisteredAppVersion(appId, appVersion) {
        _setToolPolicyParameters(
            appId, pkpTokenId, appVersion, toolIpfsCids, policyIpfsCids, policyParameterNames, policyParameterValues
        );
    }

    function removeToolPolicyParameters(
        uint256 appId,
        uint256 pkpTokenId,
        uint256 appVersion,
        string[] calldata toolIpfsCids,
        string[][] calldata policyIpfsCids,
        string[][][] calldata policyParameterNames
    ) external onlyPkpOwner(pkpTokenId) onlyRegisteredApp(appId) onlyRegisteredAppVersion(appId, appVersion) {
        // Validate array lengths
        uint256 toolCount = toolIpfsCids.length;
        if (toolCount != policyIpfsCids.length || toolCount != policyParameterNames.length) {
            revert ToolsAndPoliciesLengthMismatch();
        }

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppToolPolicyStorage.AppToolPolicyStorage storage atps_ =
            VincentAppToolPolicyStorage.appToolPolicyStorage();
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        // Iterate through tools
        for (uint256 i = 0; i < toolCount;) {
            string memory toolIpfsCid = toolIpfsCids[i]; // Cache calldata value
            bytes32 hashedToolIpfsCid = keccak256(abi.encodePacked(toolIpfsCid));

            // Validate tool registration for the app version
            VincentAppStorage.VersionedApp storage versionedApp = as_.appIdToApp[appId].versionedApps[appVersion - 1];
            if (!versionedApp.toolIpfsCidHashes.contains(hashedToolIpfsCid)) {
                revert ToolNotRegisteredForAppVersion(appId, appVersion, hashedToolIpfsCid);
            }

            // Get the versioned tool policies to check if policies exist
            VincentAppToolPolicyStorage.VersionedToolPolicies storage versionedToolPolicies =
                atps_.appIdToVersionedToolPolicies[appId][appVersion][hashedToolIpfsCid];

            // Access the tool policy storage directly
            VincentUserStorage.ToolPolicyStorage storage toolStorage =
                us_.agentPkpTokenIdToToolPolicyStorage[pkpTokenId][appId][appVersion][hashedToolIpfsCid];

            uint256 policyCount = policyIpfsCids[i].length;
            for (uint256 j = 0; j < policyCount;) {
                string memory policyIpfsCid = policyIpfsCids[i][j]; // Cache calldata value
                bytes32 hashedPolicyId = keccak256(abi.encodePacked(policyIpfsCid));

                // Verify the policy exists before trying to remove its parameters
                if (!versionedToolPolicies.policyIpfsCidHashes.contains(hashedPolicyId)) {
                    revert ToolPolicyNotRegisteredForAppVersion(appId, appVersion, hashedToolIpfsCid, hashedPolicyId);
                }

                // Get the policy parameters storage for this policy
                VincentUserStorage.PolicyParametersStorage storage policyParams =
                    toolStorage.policyIpfsCidHashToPolicyParametersStorage[hashedPolicyId];

                uint256 paramCount = policyParameterNames[i][j].length;
                for (uint256 k = 0; k < paramCount;) {
                    string memory paramName = policyParameterNames[i][j][k]; // Cache calldata value
                    bytes32 hashedPolicyParameterName = keccak256(abi.encodePacked(paramName));

                    if (policyParams.policyParameterNameHashes.contains(hashedPolicyParameterName)) {
                        // Remove the parameter
                        policyParams.policyParameterNameHashes.remove(hashedPolicyParameterName);
                        delete policyParams.policyParameterNameHashToValue[hashedPolicyParameterName];

                        emit ToolPolicyParameterRemoved(
                            pkpTokenId, appId, appVersion, hashedToolIpfsCid, hashedPolicyParameterName
                        );
                    }
                    unchecked {
                        ++k;
                    }
                }
                unchecked {
                    ++j;
                }
            }
            unchecked {
                ++i;
            }
        }
    }

    function _setToolPolicyParameters(
        uint256 appId,
        uint256 pkpTokenId,
        uint256 appVersion,
        string[] calldata toolIpfsCids,
        string[][] calldata policyIpfsCids,
        string[][][] calldata policyParameterNames,
        string[][][] calldata policyParameterValues
    ) internal {
        // Validate array lengths
        uint256 toolCount = toolIpfsCids.length;
        if (
            toolCount != policyIpfsCids.length || toolCount != policyParameterNames.length
                || toolCount != policyParameterValues.length
        ) {
            revert ToolsAndPoliciesLengthMismatch();
        }

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppToolPolicyStorage.AppToolPolicyStorage storage atps_ =
            VincentAppToolPolicyStorage.appToolPolicyStorage();
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        // Loop over each Tool so we can add the Policy parameter for each Policy
        for (uint256 i = 0; i < toolCount;) {
            string memory toolIpfsCid = toolIpfsCids[i]; // Cache calldata value
            bytes32 hashedToolIpfsCid = keccak256(abi.encodePacked(toolIpfsCid));

            // Validate tool registration for the app version
            VincentAppStorage.VersionedApp storage versionedApp = as_.appIdToApp[appId].versionedApps[appVersion - 1];
            if (!versionedApp.toolIpfsCidHashes.contains(hashedToolIpfsCid)) {
                revert ToolNotRegisteredForAppVersion(appId, appVersion, hashedToolIpfsCid);
            }

            VincentAppToolPolicyStorage.VersionedToolPolicies storage versionedToolPolicies =
                atps_.appIdToVersionedToolPolicies[appId][appVersion][hashedToolIpfsCid];

            VincentUserStorage.ToolPolicyStorage storage userToolPolicyStorage =
                us_.agentPkpTokenIdToToolPolicyStorage[pkpTokenId][appId][appVersion][hashedToolIpfsCid];

            uint256 policyCount = policyIpfsCids[i].length;
            for (uint256 j = 0; j < policyCount;) {
                string memory policyIpfsCid = policyIpfsCids[i][j]; // Cache calldata value
                bytes32 hashedToolPolicy = keccak256(abi.encodePacked(policyIpfsCid));

                if (!versionedToolPolicies.policyIpfsCidHashes.contains(hashedToolPolicy)) {
                    revert ToolPolicyNotRegisteredForAppVersion(appId, appVersion, hashedToolIpfsCid, hashedToolPolicy);
                }

                VincentUserStorage.PolicyParametersStorage storage policyParametersStorage =
                    userToolPolicyStorage.policyIpfsCidHashToPolicyParametersStorage[hashedToolPolicy];

                uint256 paramCount = policyParameterNames[i][j].length;
                for (uint256 k = 0; k < paramCount;) {
                    string memory paramName = policyParameterNames[i][j][k]; // Cache calldata value
                    bytes32 hashedPolicyParameterName = keccak256(abi.encodePacked(paramName));

                    if (
                        !versionedToolPolicies.policyIpfsCidHashToParameterNameHashes[hashedToolPolicy].contains(
                            hashedPolicyParameterName
                        )
                    ) {
                        revert PolicyParameterNameNotRegisteredForAppVersion(
                            appId, appVersion, hashedToolIpfsCid, hashedPolicyParameterName
                        );
                    }

                    // If parameter name is already set, .add will not add it again or revert.
                    policyParametersStorage.policyParameterNameHashes.add(hashedPolicyParameterName);

                    // Store parameter value
                    policyParametersStorage.policyParameterNameHashToValue[hashedPolicyParameterName] =
                        policyParameterValues[i][j][k];

                    emit ToolPolicyParameterSet(
                        pkpTokenId, appId, appVersion, hashedToolIpfsCid, hashedPolicyParameterName
                    );

                    unchecked {
                        ++k;
                    }
                }
                unchecked {
                    ++j;
                }
            }
            unchecked {
                ++i;
            }
        }
    }
}
