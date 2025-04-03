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
     * @title AppInfo
     * @notice Structure containing basic information about an application
     * @dev Used when registering a new application
     * @param name The name of the application
     * @param description A description of the application's purpose and functionality
     * @param deploymentStatus The current deployment status (DEV, TEST, PROD)
     * @param authorizedRedirectUris List of authorized redirect URIs for OAuth flows
     * @param delegatees List of addresses authorized to act on behalf of the app
     */
    struct AppInfo {
        string name;
        string description;
        VincentAppStorage.DeploymentStatus deploymentStatus;
        string[] authorizedRedirectUris;
        address[] delegatees;
    }

    /**
     * @title AppVersionTools
     * @notice Structure containing tools, policies, and parameters for an app version
     * @dev Used when registering a new app version
     * @param toolIpfsCids Array of IPFS CIDs pointing to tool metadata
     * @param toolPolicies 2D array of policy identifiers for each tool
     * @param toolPolicyParameterNames 3D array of parameter names for each policy of each tool
     * @param toolPolicyParameterTypes 3D array of parameter types for each policy of each tool
     */
    struct AppVersionTools {
        string[] toolIpfsCids;
        string[][] toolPolicies;
        string[][][] toolPolicyParameterNames;
        VincentAppStorage.ParameterType[][][] toolPolicyParameterTypes;
    }

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
     * @param appInfo Basic information about the application
     * @param versionTools Tools and policies for the app version
     * @return newAppId The ID of the newly registered app
     * @return newAppVersion The version number of the newly registered app version (always 1 for new apps)
     */
    function registerApp(AppInfo calldata appInfo, AppVersionTools calldata versionTools)
        external
        returns (uint256 newAppId, uint256 newAppVersion)
    {
        newAppId = _registerApp(appInfo);
        emit LibVincentAppFacet.NewAppRegistered(newAppId, msg.sender);

        newAppVersion = _registerNextAppVersion(newAppId, versionTools);
        emit LibVincentAppFacet.NewAppVersionRegistered(newAppId, newAppVersion, msg.sender);
    }

    /**
     * @notice Register a new version of an existing application
     * @dev Only the app manager can register new versions of an existing app
     * @param appId ID of the app for which to register a new version
     * @param versionTools Tools and policies for the app version
     * @return newAppVersion The version number of the newly registered app version
     */
    function registerNextAppVersion(uint256 appId, AppVersionTools calldata versionTools)
        external
        appNotDeleted(appId)
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
        returns (uint256 newAppVersion)
    {
        newAppVersion = _registerNextAppVersion(appId, versionTools);

        emit LibVincentAppFacet.NewAppVersionRegistered(appId, newAppVersion, msg.sender);
    }

    /**
     * @notice Update the deployment status of an application
     * @dev Only the app manager can update the deployment status
     * @param appId ID of the app
     * @param deploymentStatus New deployment status for the app
     */
    function updateAppDeploymentStatus(uint256 appId, VincentAppStorage.DeploymentStatus deploymentStatus)
        external
        appNotDeleted(appId)
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppStorage.App storage app = as_.appIdToApp[appId];

        // Revert if trying to set the same status
        if (app.deploymentStatus == deploymentStatus) {
            revert LibVincentAppFacet.AppAlreadyInRequestedDeploymentStatus(appId, uint8(deploymentStatus));
        }

        app.deploymentStatus = deploymentStatus;
        emit LibVincentAppFacet.AppDeploymentStatusUpdated(appId, uint8(deploymentStatus));
    }

    /**
     * @notice Update the name of an application
     * @dev Only the app manager can update the name
     * @param appId ID of the app
     * @param newName New name for the app
     */
    function updateAppName(uint256 appId, string calldata newName)
        external
        appNotDeleted(appId)
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
    {
        // Validate new name is not empty
        if (bytes(newName).length == 0) {
            revert LibVincentAppFacet.EmptyAppNameNotAllowed();
        }

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppStorage.App storage app = as_.appIdToApp[appId];

        app.name = newName;
        emit LibVincentAppFacet.AppNameUpdated(appId, newName);
    }

    /**
     * @notice Update the description of an application
     * @dev Only the app manager can update the description
     * @param appId ID of the app
     * @param newDescription New description for the app
     */
    function updateAppDescription(uint256 appId, string calldata newDescription)
        external
        appNotDeleted(appId)
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
    {
        // Validate new description is not empty
        if (bytes(newDescription).length == 0) {
            revert LibVincentAppFacet.EmptyAppDescriptionNotAllowed();
        }

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppStorage.App storage app = as_.appIdToApp[appId];

        app.description = newDescription;
        emit LibVincentAppFacet.AppDescriptionUpdated(appId, newDescription);
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
        appNotDeleted(appId)
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
        appNotDeleted(appId)
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
        appNotDeleted(appId)
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
    function addDelegatee(uint256 appId, address delegatee)
        external
        appNotDeleted(appId)
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
    {
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
        appNotDeleted(appId)
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
     * @notice Delete an application by setting its isDeleted flag to true
     * @dev Only the app manager can delete an app
     * @param appId ID of the app to delete
     */
    function deleteApp(uint256 appId) external appNotDeleted(appId) onlyAppManager(appId) onlyRegisteredApp(appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppStorage.App storage app = as_.appIdToApp[appId];

        // Check that no app versions have delegated agent PKPs
        for (uint256 i = 0; i < app.versionedApps.length; i++) {
            if (app.versionedApps[i].delegatedAgentPkps.length() > 0) {
                revert LibVincentAppFacet.AppVersionHasDelegatedAgents(appId, i + 1);
            }
        }

        app.isDeleted = true;
        emit LibVincentAppFacet.AppDeleted(appId);
    }

    /**
     * @notice Internal function to register a new app
     * @dev Sets up the basic app structure and associates redirect URIs and delegatees
     * @param appInfo An AppInfo struct containing the app name, description, authorized redirect URIs, and delegatees
     * @return newAppId The ID of the newly registered app
     */
    function _registerApp(AppInfo calldata appInfo) internal returns (uint256 newAppId) {
        // Validate app name and description are not empty
        if (bytes(appInfo.name).length == 0) {
            revert LibVincentAppFacet.EmptyAppNameNotAllowed();
        }

        if (bytes(appInfo.description).length == 0) {
            revert LibVincentAppFacet.EmptyAppDescriptionNotAllowed();
        }

        // Require at least one authorized redirect URI
        if (appInfo.authorizedRedirectUris.length == 0) {
            revert LibVincentAppFacet.NoRedirectUrisProvided();
        }

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        newAppId = ++as_.appIdCounter;

        // Add the app to the manager's list of apps
        as_.managerAddressToAppIds[msg.sender].add(newAppId);

        // Register the app
        VincentAppStorage.App storage app = as_.appIdToApp[newAppId];
        app.manager = msg.sender;
        app.name = appInfo.name;
        app.description = appInfo.description;
        app.deploymentStatus = appInfo.deploymentStatus;

        for (uint256 i = 0; i < appInfo.authorizedRedirectUris.length; i++) {
            // Check that the redirect URI is not empty
            if (bytes(appInfo.authorizedRedirectUris[i]).length == 0) {
                revert LibVincentAppFacet.EmptyRedirectUriNotAllowed();
            }
            _addAuthorizedRedirectUri(as_, newAppId, appInfo.authorizedRedirectUris[i]);
        }

        // Add the delegatees to the app
        for (uint256 i = 0; i < appInfo.delegatees.length; i++) {
            // Check that the delegatee is not the zero address
            if (appInfo.delegatees[i] == address(0)) {
                revert LibVincentAppFacet.ZeroAddressDelegateeNotAllowed();
            }

            uint256 existingAppId = as_.delegateeAddressToAppId[appInfo.delegatees[i]];
            if (existingAppId != 0) {
                revert LibVincentAppFacet.DelegateeAlreadyRegisteredToApp(existingAppId, appInfo.delegatees[i]);
            }

            app.delegatees.add(appInfo.delegatees[i]);

            as_.delegateeAddressToAppId[appInfo.delegatees[i]] = newAppId;
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
     * @param versionTools An AppVersionTools struct containing the tools, policies, and parameters for the new app version.
     * @return newAppVersion The newly created version number for the app.
     */
    function _registerNextAppVersion(uint256 appId, AppVersionTools calldata versionTools)
        internal
        returns (uint256 newAppVersion)
    {
        // Step 1: Check that at least one tool is provided
        if (versionTools.toolIpfsCids.length == 0) {
            revert LibVincentAppFacet.NoToolsProvided(appId);
        }

        // Check array lengths at top level
        uint256 toolCount = versionTools.toolIpfsCids.length;
        if (
            toolCount != versionTools.toolPolicies.length || toolCount != versionTools.toolPolicyParameterNames.length
                || toolCount != versionTools.toolPolicyParameterTypes.length
        ) {
            revert LibVincentAppFacet.ToolArrayDimensionMismatch(
                toolCount,
                versionTools.toolPolicies.length,
                versionTools.toolPolicyParameterNames.length,
                versionTools.toolPolicyParameterTypes.length
            );
        }

        // Then check nested arrays for each tool
        for (uint256 i = 0; i < toolCount; i++) {
            string memory toolIpfsCid = versionTools.toolIpfsCids[i];

            // Validate tool IPFS CID is not empty
            if (bytes(toolIpfsCid).length == 0) {
                revert LibVincentAppFacet.EmptyToolIpfsCidNotAllowed(appId, i);
            }

            // Check nested array lengths
            uint256 policyCount = versionTools.toolPolicies[i].length;
            if (
                policyCount != versionTools.toolPolicyParameterNames[i].length
                    || policyCount != versionTools.toolPolicyParameterTypes[i].length
            ) {
                revert LibVincentAppFacet.PolicyArrayLengthMismatch(
                    i,
                    policyCount,
                    versionTools.toolPolicyParameterNames[i].length,
                    versionTools.toolPolicyParameterTypes[i].length
                );
            }

            // Check parameter names and types match for each policy
            for (uint256 j = 0; j < policyCount; j++) {
                if (
                    versionTools.toolPolicyParameterNames[i][j].length
                        != versionTools.toolPolicyParameterTypes[i][j].length
                ) {
                    revert LibVincentAppFacet.ParameterArrayLengthMismatch(
                        i,
                        j,
                        versionTools.toolPolicyParameterNames[i][j].length,
                        versionTools.toolPolicyParameterTypes[i][j].length
                    );
                }

                string memory policyIpfsCid = versionTools.toolPolicies[i][j];

                // Validate non-empty policy IPFS CID
                if (bytes(policyIpfsCid).length == 0) {
                    revert LibVincentAppFacet.EmptyPolicyIpfsCidNotAllowed(appId, i);
                }

                // Check for empty parameter names
                uint256 paramCount = versionTools.toolPolicyParameterNames[i][j].length;
                for (uint256 k = 0; k < paramCount; k++) {
                    string memory paramName = versionTools.toolPolicyParameterNames[i][j][k];

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
            string memory toolIpfsCid = versionTools.toolIpfsCids[i]; // Cache calldata value

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
            uint256 policyCount = versionTools.toolPolicies[i].length;

            for (uint256 j = 0; j < policyCount; j++) {
                string memory policyIpfsCid = versionTools.toolPolicies[i][j]; // Cache calldata value

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
                uint256 paramCount = versionTools.toolPolicyParameterNames[i][j].length;

                for (uint256 k = 0; k < paramCount; k++) {
                    string memory paramName = versionTools.toolPolicyParameterNames[i][j][k]; // Cache calldata value

                    bytes32 hashedPolicyParameterName = keccak256(abi.encodePacked(paramName));

                    // Step 9.1: Register the policy parameter.
                    policyParameterNameHashes.add(hashedPolicyParameterName);

                    // Step 9.2: Store the parameter name if not already stored.
                    if (bytes(ls.policyParameterNameHashToName[hashedPolicyParameterName]).length == 0) {
                        ls.policyParameterNameHashToName[hashedPolicyParameterName] = paramName;
                    }

                    // Step 9.3: Store the parameter type
                    VincentAppStorage.ParameterType paramType = versionTools.toolPolicyParameterTypes[i][j][k];
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
