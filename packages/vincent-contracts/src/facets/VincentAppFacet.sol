// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";
import "../VincentBase.sol";
import "../libs/LibVincentAppFacet.sol";

/**
 * @title VincentAppFacet
 * @notice A facet of the Vincent Diamond that manages application registration and configuration
 * @dev This contract allows registration of apps, app versions, redirect URIs, and delegatees
 */
contract VincentAppFacet is VincentBase {
    using VincentAppStorage for VincentAppStorage.AppStorage;
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    /**
     * @notice Modifier to restrict function access to the app manager only
     * @param appId ID of the app
     */
    modifier onlyAppManager(uint256 appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        if (as_.appIdToApp[appId].manager != msg.sender) revert LibVincentAppFacet.NotAppManager(appId, msg.sender);
        _;
    }

    /**
     * @notice Register a new application with initial version, tools, and policies
     * @dev This function combines app registration and first version registration in one call
     * @param name Name of the application
     * @param description Description of the application
     * @param authorizedRedirectUris List of authorized redirect URIs for the application
     * @param delegatees List of delegatee addresses for the application
     * @param toolIpfsCids Array of IPFS CIDs representing the tools associated with this app
     * @param toolPolicies 2D array mapping each tool to its associated policies
     * @param toolPolicyParameterNames 3D array mapping each policy to its parameter names
     * @param toolPolicyParameterTypes 3D array mapping each policy parameter to its type
     * @return newAppId The ID of the newly registered app
     * @return newAppVersion The version number of the newly registered app version (always 1 for new apps)
     */
    function registerApp(
        string calldata name,
        string calldata description,
        string[] calldata authorizedRedirectUris,
        address[] calldata delegatees,
        string[] calldata toolIpfsCids,
        string[][] calldata toolPolicies,
        string[][][] calldata toolPolicyParameterNames,
        VincentAppStorage.ParameterType[][][] calldata toolPolicyParameterTypes
    ) external returns (uint256 newAppId, uint256 newAppVersion) {
        newAppId = _registerApp(name, description, authorizedRedirectUris, delegatees);
        emit LibVincentAppFacet.NewAppRegistered(newAppId, msg.sender);

        newAppVersion = _registerNextAppVersion(
            newAppId, toolIpfsCids, toolPolicies, toolPolicyParameterNames, toolPolicyParameterTypes
        );
        emit LibVincentAppFacet.NewAppVersionRegistered(newAppId, newAppVersion, msg.sender);
    }

    /**
     * @notice Register a new version of an existing application
     * @dev Only the app manager can register new versions of an existing app
     * @param appId ID of the app for which to register a new version
     * @param toolIpfsCids Array of IPFS CIDs representing the tools associated with this version
     * @param toolPolicies 2D array mapping each tool to its associated policies
     * @param toolPolicyParameterNames 3D array mapping each policy to its parameter names
     * @param toolPolicyParameterTypes 3D array mapping each policy parameter to its type
     * @return newAppVersion The version number of the newly registered app version
     */
    function registerNextAppVersion(
        uint256 appId,
        string[] calldata toolIpfsCids,
        string[][] calldata toolPolicies,
        string[][][] calldata toolPolicyParameterNames,
        VincentAppStorage.ParameterType[][][] calldata toolPolicyParameterTypes
    ) external onlyAppManager(appId) onlyRegisteredApp(appId) returns (uint256 newAppVersion) {
        newAppVersion = _registerNextAppVersion(
            appId, toolIpfsCids, toolPolicies, toolPolicyParameterNames, toolPolicyParameterTypes
        );

        emit LibVincentAppFacet.NewAppVersionRegistered(appId, newAppVersion, msg.sender);
    }

    /**
     * @notice Enable or disable a specific app version
     * @dev Only the app manager can change the enabled status of an app version
     * @param appId ID of the app
     * @param appVersion Version number of the app to enable/disable
     * @param enabled Whether to enable (true) or disable (false) the app version
     */
    function enableAppVersion(uint256 appId, uint256 appVersion, bool enabled)
        external
        onlyAppManager(appId)
        onlyRegisteredAppVersion(appId, appVersion)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        // Cache the versioned app to avoid duplicate storage reads
        VincentAppStorage.VersionedApp storage versionedApp =
            as_.appIdToApp[appId].versionedApps[getVersionedAppIndex(appVersion)];

        // Revert if trying to set to the same status
        if (versionedApp.enabled == enabled) {
            revert LibVincentAppFacet.AppVersionAlreadyInRequestedState(appId, appVersion, enabled);
        }

        versionedApp.enabled = enabled;
        emit LibVincentAppFacet.AppEnabled(appId, appVersion, enabled);
    }

    /**
     * @notice Add a new authorized redirect URI to an app
     * @dev Only the app manager can add redirect URIs
     * @param appId ID of the app
     * @param redirectUri The redirect URI to add
     */
    function addAuthorizedRedirectUri(uint256 appId, string calldata redirectUri)
        external
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
    {
        // Check that the redirect URI is not empty
        if (bytes(redirectUri).length == 0) {
            revert LibVincentAppFacet.EmptyRedirectUriNotAllowed();
        }

        _addAuthorizedRedirectUri(VincentAppStorage.appStorage(), appId, redirectUri);
    }

    /**
     * @notice Remove an authorized redirect URI from an app
     * @dev Only the app manager can remove redirect URIs
     * @param appId ID of the app
     * @param redirectUri The redirect URI to remove
     */
    function removeAuthorizedRedirectUri(uint256 appId, string calldata redirectUri)
        external
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        bytes32 hashedRedirectUri = keccak256(abi.encodePacked(redirectUri));

        if (!as_.appIdToApp[appId].authorizedRedirectUris.contains(hashedRedirectUri)) {
            revert LibVincentAppFacet.RedirectUriNotRegisteredToApp(appId, redirectUri);
        }

        // Check if this is the last redirect URI
        if (as_.appIdToApp[appId].authorizedRedirectUris.length() == 1) {
            revert LibVincentAppFacet.CannotRemoveLastRedirectUri(appId);
        }

        as_.appIdToApp[appId].authorizedRedirectUris.remove(hashedRedirectUri);

        emit LibVincentAppFacet.AuthorizedRedirectUriRemoved(appId, hashedRedirectUri);
    }

    /**
     * @notice Add a new delegatee to an app
     * @dev Only the app manager can add delegatees. A delegatee can only be associated with one app at a time.
     * @param appId ID of the app
     * @param delegatee Address of the delegatee to add
     */
    function addDelegatee(uint256 appId, address delegatee) external onlyAppManager(appId) onlyRegisteredApp(appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        // Check that the delegatee is not the zero address
        if (delegatee == address(0)) {
            revert LibVincentAppFacet.ZeroAddressDelegateeNotAllowed();
        }

        // Check if the delegatee is already registered to any app
        uint256 delegateeAppId = as_.delegateeAddressToAppId[delegatee];
        if (delegateeAppId != 0) {
            revert LibVincentAppFacet.DelegateeAlreadyRegisteredToApp(delegateeAppId, delegatee);
        }

        as_.appIdToApp[appId].delegatees.add(delegatee);

        as_.delegateeAddressToAppId[delegatee] = appId;

        emit LibVincentAppFacet.DelegateeAdded(appId, delegatee);
    }

    /**
     * @notice Remove a delegatee from an app
     * @dev Only the app manager can remove delegatees
     * @param appId ID of the app
     * @param delegatee Address of the delegatee to remove
     */
    function removeDelegatee(uint256 appId, address delegatee)
        external
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        if (as_.delegateeAddressToAppId[delegatee] != appId) {
            revert LibVincentAppFacet.DelegateeNotRegisteredToApp(appId, delegatee);
        }

        as_.appIdToApp[appId].delegatees.remove(delegatee);
        as_.delegateeAddressToAppId[delegatee] = 0;

        emit LibVincentAppFacet.DelegateeRemoved(appId, delegatee);
    }

    /**
     * @notice Internal function to register a new app
     * @dev Sets up the basic app structure and associates redirect URIs and delegatees
     * @param name Name of the application
     * @param description Description of the application
     * @param authorizedRedirectUris List of authorized redirect URIs for the application
     * @param delegatees List of delegatee addresses for the application
     * @return newAppId The ID of the newly registered app
     */
    function _registerApp(
        string calldata name,
        string calldata description,
        string[] calldata authorizedRedirectUris,
        address[] calldata delegatees
    ) internal returns (uint256 newAppId) {
        // Validate app name and description are not empty
        if (bytes(name).length == 0) {
            revert LibVincentAppFacet.EmptyAppNameNotAllowed();
        }

        if (bytes(description).length == 0) {
            revert LibVincentAppFacet.EmptyAppDescriptionNotAllowed();
        }

        // Require at least one authorized redirect URI
        if (authorizedRedirectUris.length == 0) {
            revert LibVincentAppFacet.NoRedirectUrisProvided();
        }

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        newAppId = ++as_.appIdCounter;

        // Add the app to the manager's list of apps
        as_.managerAddressToAppIds[msg.sender].add(newAppId);

        // Register the app
        VincentAppStorage.App storage app = as_.appIdToApp[newAppId];
        app.manager = msg.sender;
        app.name = name;
        app.description = description;

        for (uint256 i = 0; i < authorizedRedirectUris.length; i++) {
            // Check that the redirect URI is not empty
            if (bytes(authorizedRedirectUris[i]).length == 0) {
                revert LibVincentAppFacet.EmptyRedirectUriNotAllowed();
            }
            _addAuthorizedRedirectUri(as_, newAppId, authorizedRedirectUris[i]);
        }

        // Add the delegatees to the app
        for (uint256 i = 0; i < delegatees.length; i++) {
            // Check that the delegatee is not the zero address
            if (delegatees[i] == address(0)) {
                revert LibVincentAppFacet.ZeroAddressDelegateeNotAllowed();
            }

            uint256 existingAppId = as_.delegateeAddressToAppId[delegatees[i]];
            if (existingAppId != 0) {
                revert LibVincentAppFacet.DelegateeAlreadyRegisteredToApp(existingAppId, delegatees[i]);
            }

            app.delegatees.add(delegatees[i]);

            as_.delegateeAddressToAppId[delegatees[i]] = newAppId;
        }
    }

    /**
     * @dev Registers a new version of an app, associating tools and policies with it.
     * This function ensures that all provided tools, policies, and parameters are correctly stored
     * and linked to the new app version.
     *
     * @notice This function is used internally to register a new app version and its associated tools and policies.
     * @notice App versions are enabled by default when registered.
     *
     * @param appId The ID of the app for which a new version is being registered.
     * @param toolIpfsCids An array of IPFS CIDs representing the tools associated with this version.
     * @param toolPolicies A 2D array mapping each tool to a list of associated policies.
     * @param toolPolicyParameterNames A 3D array mapping each policy to a list of associated parameter names.
     * @param toolPolicyParameterTypes A 3D array mapping each policy parameter to its type.
     * @return newAppVersion The newly created version number for the app.
     */
    function _registerNextAppVersion(
        uint256 appId,
        string[] calldata toolIpfsCids,
        string[][] calldata toolPolicies,
        string[][][] calldata toolPolicyParameterNames,
        VincentAppStorage.ParameterType[][][] calldata toolPolicyParameterTypes
    ) internal returns (uint256 newAppVersion) {
        // Step 1: Check that at least one tool is provided
        if (toolIpfsCids.length == 0) {
            revert LibVincentAppFacet.NoToolsProvided(appId);
        }

        // Check array lengths at top level
        uint256 toolCount = toolIpfsCids.length;
        if (
            toolCount != toolPolicies.length || toolCount != toolPolicyParameterNames.length
                || toolCount != toolPolicyParameterTypes.length
        ) {
            revert LibVincentAppFacet.ToolArrayDimensionMismatch(
                toolCount, toolPolicies.length, toolPolicyParameterNames.length, toolPolicyParameterTypes.length
            );
        }

        // Then check nested arrays for each tool
        for (uint256 i = 0; i < toolCount; i++) {
            string memory toolIpfsCid = toolIpfsCids[i];

            // Validate tool IPFS CID is not empty
            if (bytes(toolIpfsCid).length == 0) {
                revert LibVincentAppFacet.EmptyToolIpfsCidNotAllowed(appId, i);
            }

            // Check nested array lengths
            uint256 policyCount = toolPolicies[i].length;
            if (policyCount != toolPolicyParameterNames[i].length || policyCount != toolPolicyParameterTypes[i].length)
            {
                revert LibVincentAppFacet.PolicyArrayLengthMismatch(
                    i, policyCount, toolPolicyParameterNames[i].length, toolPolicyParameterTypes[i].length
                );
            }

            // Check parameter names and types match for each policy
            for (uint256 j = 0; j < policyCount; j++) {
                if (toolPolicyParameterNames[i][j].length != toolPolicyParameterTypes[i][j].length) {
                    revert LibVincentAppFacet.ParameterArrayLengthMismatch(
                        i, j, toolPolicyParameterNames[i][j].length, toolPolicyParameterTypes[i][j].length
                    );
                }

                string memory policyIpfsCid = toolPolicies[i][j];

                // Validate non-empty policy IPFS CID
                if (bytes(policyIpfsCid).length == 0) {
                    revert LibVincentAppFacet.EmptyPolicyIpfsCidNotAllowed(appId, i);
                }

                // Check for empty parameter names
                uint256 paramCount = toolPolicyParameterNames[i][j].length;
                for (uint256 k = 0; k < paramCount; k++) {
                    string memory paramName = toolPolicyParameterNames[i][j][k];

                    // Check for empty parameter name
                    if (bytes(paramName).length == 0) {
                        revert LibVincentAppFacet.EmptyParameterNameNotAllowed(appId, i, j, k);
                    }
                }
            }
        }

        // Step 4: Fetch necessary storage references.
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppStorage.App storage app = as_.appIdToApp[appId];
        VincentLitActionStorage.LitActionStorage storage ls = VincentLitActionStorage.litActionStorage();

        // Step 5: Create a new app version.
        app.versionedApps.push();
        newAppVersion = app.versionedApps.length;

        VincentAppStorage.VersionedApp storage versionedApp = app.versionedApps[getVersionedAppIndex(newAppVersion)];
        versionedApp.enabled = true; // App versions are enabled by default

        // Store this once outside the loop instead of repeatedly accessing it
        EnumerableSet.Bytes32Set storage toolIpfsCidHashes = versionedApp.toolIpfsCidHashes;

        // Step 6: Iterate through each tool to register it with the new app version.
        for (uint256 i = 0; i < toolCount; i++) {
            string memory toolIpfsCid = toolIpfsCids[i]; // Cache calldata value

            bytes32 hashedToolCid = keccak256(abi.encodePacked(toolIpfsCid));

            // Step 6.1: Register the tool IPFS CID globally if it hasn't been added already.
            toolIpfsCidHashes.add(hashedToolCid);

            // First check if the tool is already registered in global storage
            // before trying to register it again
            if (bytes(ls.ipfsCidHashToIpfsCid[hashedToolCid]).length == 0) {
                ls.ipfsCidHashToIpfsCid[hashedToolCid] = toolIpfsCid;
                emit LibVincentAppFacet.NewLitActionRegistered(hashedToolCid);
            }

            // Step 6.2: Fetch the tool policies storage for this tool.
            VincentAppStorage.ToolPolicies storage toolPoliciesStorage =
                versionedApp.toolIpfsCidHashToToolPolicies[hashedToolCid];

            // Step 7: Iterate through policies linked to this tool.
            uint256 policyCount = toolPolicies[i].length;

            for (uint256 j = 0; j < policyCount; j++) {
                string memory policyIpfsCid = toolPolicies[i][j]; // Cache calldata value

                bytes32 hashedToolPolicy = keccak256(abi.encodePacked(policyIpfsCid));

                // Step 7.1: Add the policy hash to the ToolPolicies
                toolPoliciesStorage.policyIpfsCidHashes.add(hashedToolPolicy);

                // Step 7.2: Store the policy IPFS CID globally if it's not already stored.
                if (bytes(ls.ipfsCidHashToIpfsCid[hashedToolPolicy]).length == 0) {
                    ls.ipfsCidHashToIpfsCid[hashedToolPolicy] = policyIpfsCid;
                }

                // Create a new Policy storage structure for this policy in the current app version
                VincentAppStorage.Policy storage policy =
                    toolPoliciesStorage.policyIpfsCidHashToPolicy[hashedToolPolicy];

                // Step 8: Get the Policy parameter name hashes for this policy
                EnumerableSet.Bytes32Set storage policyParameterNameHashes = policy.policyParameterNameHashes;

                // Step 9: Iterate through policy parameters.
                uint256 paramCount = toolPolicyParameterNames[i][j].length;

                for (uint256 k = 0; k < paramCount; k++) {
                    string memory paramName = toolPolicyParameterNames[i][j][k]; // Cache calldata value

                    bytes32 hashedPolicyParameterName = keccak256(abi.encodePacked(paramName));

                    // Step 9.1: Register the policy parameter.
                    policyParameterNameHashes.add(hashedPolicyParameterName);

                    // Step 9.2: Store the parameter name if not already stored.
                    if (bytes(ls.policyParameterNameHashToName[hashedPolicyParameterName]).length == 0) {
                        ls.policyParameterNameHashToName[hashedPolicyParameterName] = paramName;
                    }

                    // Step 9.3: Store the parameter type
                    VincentAppStorage.ParameterType paramType = toolPolicyParameterTypes[i][j][k];
                    policy.policyParameterNameHashToType[hashedPolicyParameterName] = paramType;
                }
            }
        }
    }

    /**
     * @notice Internal function to add an authorized redirect URI to an app
     * @dev Registers the redirect URI and links it to the app
     * @param appId ID of the app
     * @param redirectUri The redirect URI to add
     */
    function _addAuthorizedRedirectUri(
        VincentAppStorage.AppStorage storage appStorage,
        uint256 appId,
        string calldata redirectUri
    ) internal {
        bytes32 hashedRedirectUri = keccak256(abi.encodePacked(redirectUri));

        // If the redirect URI was not added (already exists), revert
        if (!appStorage.appIdToApp[appId].authorizedRedirectUris.add(hashedRedirectUri)) {
            revert LibVincentAppFacet.RedirectUriAlreadyAuthorizedForApp(appId, redirectUri);
        }

        appStorage.authorizedRedirectUriHashToRedirectUri[hashedRedirectUri] = redirectUri;

        emit LibVincentAppFacet.AuthorizedRedirectUriAdded(appId, hashedRedirectUri);
    }
}
