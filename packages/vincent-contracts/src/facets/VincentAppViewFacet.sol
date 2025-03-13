// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";

/**
 * @title VincentAppViewFacet
 * @notice Provides view functions for accessing app-related data
 * @dev Read-only facet for the Vincent Diamond contract
 */
contract VincentAppViewFacet {
    using VincentAppStorage for VincentAppStorage.AppStorage;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    // ==================================================================================
    // Data Structures
    // ==================================================================================

    /**
     * @notice Represents basic app information including metadata and relationships
     * @dev Used for returning app data in view functions
     */
    struct AppView {
        string name;
        string description;
        address manager;
        uint256 latestVersion;
        address[] delegatees;
        string[] authorizedDomains;
        string[] authorizedRedirectUris;
    }

    /**
     * @notice Represents a specific version of an app with all associated data
     * @dev Extends AppView with version-specific information
     */
    struct VersionedAppView {
        string name;
        string description;
        address manager;
        uint256 version;
        bool enabled;
        string[] authorizedDomains;
        string[] authorizedRedirectUris;
        string[] toolIpfsCidHashes;
        uint256[] delegatedAgentPkpTokenIds;
    }

    // ==================================================================================
    // App Registry and Enumeration Functions
    // ==================================================================================

    /**
     * @notice Returns the total count of registered apps
     * @return The current app ID counter value
     */
    function getTotalAppCount() external view returns (uint256) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        return as_.appIdCounter;
    }

    /**
     * @notice Retrieves all registered apps
     * @return appViews Array of all registered apps with their details
     */
    function getAllRegisteredApps() external view returns (AppView[] memory appViews) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        uint256 appCount = as_.registeredApps.length();
        appViews = new AppView[](appCount);

        for (uint256 i = 0; i < appCount; i++) {
            uint256 appId = as_.registeredApps.at(i);
            appViews[i] = getAppById(appId);
        }
    }

    /**
     * @notice Returns all registered manager addresses
     * @return managers Array of all registered app manager addresses
     */
    function getRegisteredManagers() external view returns (address[] memory managers) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        managers = as_.registeredManagers.values();
    }

    // ==================================================================================
    // App Data Retrieval Functions
    // ==================================================================================

    /**
     * @notice Retrieves detailed information about an app
     * @param appId ID of the app to retrieve
     * @return appView Detailed view of the app
     */
    function getAppById(uint256 appId) public view returns (AppView memory appView) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppStorage.App storage app = as_.appIdToApp[appId];

        appView.name = app.name;
        appView.description = app.description;
        appView.manager = app.manager;
        appView.latestVersion = app.versionedApps.length;
        appView.delegatees = app.delegatees.values();

        // Convert authorized domains from bytes32 hashes to strings
        uint256 domainCount = app.authorizedDomains.length();
        appView.authorizedDomains = new string[](domainCount);
        for (uint256 i = 0; i < domainCount; i++) {
            bytes32 domainHash = app.authorizedDomains.at(i);
            appView.authorizedDomains[i] = as_.authorizedDomainHashToDomain[domainHash];
        }

        // Convert authorized redirect URIs from bytes32 hashes to strings
        uint256 redirectUriCount = app.authorizedRedirectUris.length();
        appView.authorizedRedirectUris = new string[](redirectUriCount);
        for (uint256 i = 0; i < redirectUriCount; i++) {
            bytes32 redirectUriHash = app.authorizedRedirectUris.at(i);
            appView.authorizedRedirectUris[i] = as_.authorizedRedirectUriHashToRedirectUri[redirectUriHash];
        }
    }

    /**
     * @notice Retrieves detailed information about a specific version of an app
     * @param appId ID of the app to retrieve
     * @param version Version number of the app to retrieve
     * @return versionedAppView Detailed view of the app version
     */
    function getAppByVersion(uint256 appId, uint256 version)
        external
        view
        returns (VersionedAppView memory versionedAppView)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        VincentAppStorage.App storage app = as_.appIdToApp[appId];

        AppView memory appView = getAppById(appId);

        versionedAppView.name = appView.name;
        versionedAppView.description = appView.description;
        versionedAppView.manager = appView.manager;
        versionedAppView.authorizedDomains = appView.authorizedDomains;
        versionedAppView.authorizedRedirectUris = appView.authorizedRedirectUris;

        // App versions start at 1, but the appVersions array is 0-indexed
        VincentAppStorage.VersionedApp storage versionedApp = app.versionedApps[version - 1];

        versionedAppView.version = versionedApp.version;
        versionedAppView.enabled = versionedApp.enabled;
        versionedAppView.delegatedAgentPkpTokenIds = versionedApp.delegatedAgentPkps.values();

        VincentToolStorage.ToolStorage storage ts = VincentToolStorage.toolStorage();

        uint256 toolIpfsCidHashesLength = versionedApp.toolIpfsCidHashes.length();
        versionedAppView.toolIpfsCidHashes = new string[](toolIpfsCidHashesLength);
        for (uint256 i = 0; i < toolIpfsCidHashesLength; i++) {
            versionedAppView.toolIpfsCidHashes[i] = ts.toolIpfsCidHashToIpfsCid[versionedApp.toolIpfsCidHashes.at(i)];
        }
    }

    /**
     * @notice Returns the latest version number of an app
     * @param appId ID of the app
     * @return Latest version number
     */
    function getAppLatestVersion(uint256 appId) external view returns (uint256) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        return as_.appIdToApp[appId].versionedApps.length;
    }

    /**
     * @notice Retrieves the manager address of an app
     * @param appId ID of the app
     * @return Manager address
     */
    function getAppManager(uint256 appId) external view returns (address) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        return as_.appIdToApp[appId].manager;
    }

    // ==================================================================================
    // Manager-Related Functions
    // ==================================================================================

    /**
     * @notice Retrieves all apps managed by a specific address
     * @param manager Address of the manager
     * @return appViews Array of apps managed by the specified address
     */
    function getAppsByManager(address manager) external view returns (AppView[] memory appViews) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        uint256 appCount = as_.managerAddressToAppIds[manager].length();
        appViews = new AppView[](appCount);

        for (uint256 i = 0; i < appCount; i++) {
            appViews[i] = getAppById(as_.managerAddressToAppIds[manager].at(i));
        }
    }

    /**
     * @notice Checks if an address is the manager of a specific app
     * @param appId ID of the app
     * @param manager Address to check
     * @return True if the address is the manager of the app
     */
    function isAppManager(uint256 appId, address manager) external view returns (bool) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        return as_.appIdToApp[appId].manager == manager;
    }

    // ==================================================================================
    // Delegatee-Related Functions
    // ==================================================================================

    /**
     * @notice Retrieves the app by a delegatee address
     * @param delegatee Address of the delegatee
     * @return appView Detailed view of the app
     */
    function getAppByDelegatee(address delegatee) external view returns (AppView memory appView) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        uint256 appId = as_.delegateeAddressToAppId[delegatee];
        appView = getAppById(appId);
    }

    /**
     * @notice Retrieves all delegatees for a specific app
     * @param appId ID of the app
     * @return delegatees Array of delegatee addresses
     */
    function getAppDelegatees(uint256 appId) external view returns (address[] memory delegatees) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        delegatees = as_.appIdToApp[appId].delegatees.values();
    }

    /**
     * @notice Retrieves the app ID associated with a delegatee
     * @param delegatee Address of the delegatee
     * @return App ID
     */
    function getAppIdByDelegatee(address delegatee) external view returns (uint256) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        return as_.delegateeAddressToAppId[delegatee];
    }

    /**
     * @notice Checks if an address is a delegatee for a specific app
     * @param appId ID of the app
     * @param delegatee Address to check
     * @return True if the address is a delegatee for the app
     */
    function isAppDelegatee(uint256 appId, address delegatee) external view returns (bool) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        return as_.appIdToApp[appId].delegatees.contains(delegatee);
    }

    // ==================================================================================
    // Domain and Redirect URI Functions
    // ==================================================================================

    /**
     * @notice Retrieves a domain from its hash
     * @param domainHash Hash of the domain
     * @return domain Domain string
     */
    function getAuthorizedDomainByHash(bytes32 domainHash) external view returns (string memory domain) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        return as_.authorizedDomainHashToDomain[domainHash];
    }

    /**
     * @notice Retrieves a redirect URI from its hash
     * @param redirectUriHash Hash of the redirect URI
     * @return redirectUri Redirect URI string
     */
    function getAuthorizedRedirectUriByHash(bytes32 redirectUriHash)
        external
        view
        returns (string memory redirectUri)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        return as_.authorizedRedirectUriHashToRedirectUri[redirectUriHash];
    }

    /**
     * @notice Retrieves all authorized domains for a specific app
     * @param appId ID of the app
     * @return domains Array of authorized domain strings
     */
    function getAuthorizedDomainsByAppId(uint256 appId) public view returns (string[] memory domains) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        uint256 domainCount = as_.appIdToApp[appId].authorizedDomains.length();
        domains = new string[](domainCount);
        for (uint256 i = 0; i < domainCount; i++) {
            domains[i] = as_.authorizedDomainHashToDomain[as_.appIdToApp[appId].authorizedDomains.at(i)];
        }
    }

    /**
     * @notice Retrieves all authorized redirect URIs for a specific app
     * @param appId ID of the app
     * @return redirectUris Array of authorized redirect URI strings
     */
    function getAuthorizedRedirectUrisByAppId(uint256 appId) public view returns (string[] memory redirectUris) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        uint256 redirectUriCount = as_.appIdToApp[appId].authorizedRedirectUris.length();
        redirectUris = new string[](redirectUriCount);
        for (uint256 i = 0; i < redirectUriCount; i++) {
            redirectUris[i] =
                as_.authorizedRedirectUriHashToRedirectUri[as_.appIdToApp[appId].authorizedRedirectUris.at(i)];
        }
    }

    /**
     * @notice Retrieves both authorized domains and redirect URIs for a specific app
     * @param appId ID of the app
     * @return domains Array of authorized domain strings
     * @return redirectUris Array of authorized redirect URI strings
     */
    function getAuthorizedDomainsAndRedirectUrisByAppId(uint256 appId)
        external
        view
        returns (string[] memory domains, string[] memory redirectUris)
    {
        domains = getAuthorizedDomainsByAppId(appId);
        redirectUris = getAuthorizedRedirectUrisByAppId(appId);
    }

    /**
     * @notice Checks if a domain is authorized for a specific app
     * @param appId ID of the app
     * @param domain Domain to check
     * @return True if the domain is authorized for the app
     */
    function isDomainAuthorizedForApp(uint256 appId, string memory domain) external view returns (bool) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        return as_.appIdToApp[appId].authorizedDomains.contains(keccak256(abi.encodePacked(domain)));
    }

    /**
     * @notice Checks if a redirect URI is authorized for a specific app
     * @param appId ID of the app
     * @param redirectUri Redirect URI to check
     * @return True if the redirect URI is authorized for the app
     */
    function isRedirectUriAuthorizedForApp(uint256 appId, string memory redirectUri) external view returns (bool) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        return as_.appIdToApp[appId].authorizedRedirectUris.contains(keccak256(abi.encodePacked(redirectUri)));
    }

    // ==================================================================================
    // App Version, Tool, and PKP Functions
    // ==================================================================================

    // ==================================================================================
    // App Version Functions
    // ==================================================================================

    /**
     * @notice Checks if a specific app version is enabled
     * @param appId ID of the app
     * @param version Version of the app
     * @return True if the app version is enabled
     */
    function isAppVersionEnabled(uint256 appId, uint256 version) external view returns (bool) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        // App versions start at 1, but the appVersions array is 0-indexed
        return as_.appIdToApp[appId].versionedApps[version - 1].enabled;
    }

    /**
     * @notice Retrieves all delegated agent PKP token IDs for a specific app version
     * @param appId ID of the app
     * @param version Version of the app
     * @return delegatedAgentPkpTokenIds Array of delegated agent PKP token IDs
     */
    function getAppVersionDelegatedAgentPkpTokenIds(uint256 appId, uint256 version)
        external
        view
        returns (uint256[] memory delegatedAgentPkpTokenIds)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        // App versions start at 1, but the appVersions array is 0-indexed
        return as_.appIdToApp[appId].versionedApps[version - 1].delegatedAgentPkps.values();
    }

    // ==================================================================================
    // Tool-related Functions
    // ==================================================================================

    /**
     * @notice Retrieves all tools for a specific app version
     * @param appId ID of the app
     * @param version Version of the app
     * @return tools Array of tool IPFS CIDs
     */
    function getAppVersionTools(uint256 appId, uint256 version) external view returns (string[] memory tools) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentToolStorage.ToolStorage storage ts = VincentToolStorage.toolStorage();

        // App versions start at 1, but the appVersions array is 0-indexed
        VincentAppStorage.VersionedApp storage versionedApp = as_.appIdToApp[appId].versionedApps[version - 1];

        tools = new string[](versionedApp.toolIpfsCidHashes.length());
        for (uint256 i = 0; i < versionedApp.toolIpfsCidHashes.length(); i++) {
            tools[i] = ts.toolIpfsCidHashToIpfsCid[versionedApp.toolIpfsCidHashes.at(i)];
        }
    }

    /**
     * @notice Retrieves the IPFS CID of a tool from its hash
     * @param toolIpfsCidHash The hash of the tool IPFS CID
     * @return The original IPFS CID as a string
     */
    function getToolCidFromHash(bytes32 toolIpfsCidHash) external view returns (string memory) {
        VincentToolStorage.ToolStorage storage ts = VincentToolStorage.toolStorage();
        return ts.toolIpfsCidHashToIpfsCid[toolIpfsCidHash];
    }

    // ==================================================================================
    // PKP Authorization Functions
    // ==================================================================================

    /**
     * @notice Checks if a tool is authorized for use with a PKP by a delegatee
     * @dev Performs a one-step authorization check
     * @param delegatee Address of the delegatee requesting tool execution
     * @param pkpTokenId Token ID of the PKP that would execute the tool
     * @param toolIpfsCid The tool's IPFS CID as a string
     * @return True if the tool is authorized for use with the PKP
     */
    function isToolAuthorizedForPkp(address delegatee, uint256 pkpTokenId, string memory toolIpfsCid)
        external
        view
        returns (bool)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        // Convert tool IPFS CID to hash
        bytes32 toolIpfsCidHash = keccak256(abi.encodePacked(toolIpfsCid));

        // Get app ID for the delegatee
        uint256 appId = as_.delegateeAddressToAppId[delegatee];
        if (appId == 0) return false; // Delegatee not registered to any app

        // Get permitted app versions for this PKP and app
        EnumerableSet.UintSet storage permittedVersions = us_.agentPkpTokenIdToPermittedAppVersions[pkpTokenId][appId];
        uint256 versionCount = permittedVersions.length();
        if (versionCount == 0) return false; // No versions permitted

        // Check if the tool is in any of the permitted versions
        VincentAppStorage.App storage app = as_.appIdToApp[appId];
        for (uint256 i = 0; i < versionCount; i++) {
            uint256 version = permittedVersions.at(i);
            // Skip invalid or disabled versions
            if (version >= app.versionedApps.length) continue;
            // App versions start at 1, but the appVersions array is 0-indexed
            if (!app.versionedApps[version - 1].enabled) continue;

            // Check if this version contains the tool
            if (app.versionedApps[version - 1].toolIpfsCidHashes.contains(toolIpfsCidHash)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @notice Retrieves all tools a delegatee can execute for a specific PKP
     * @param delegatee Address of the delegatee
     * @param pkpTokenId Token ID of the PKP
     * @return toolIpfsCidHashes Array of all authorized tool IPFS CID hashes
     */
    function getAuthorizedToolsForPkpByDelegatee(address delegatee, uint256 pkpTokenId)
        external
        view
        returns (bytes32[] memory toolIpfsCidHashes)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        // Get app ID for the delegatee
        uint256 appId = as_.delegateeAddressToAppId[delegatee];
        if (appId == 0) return new bytes32[](0); // Delegatee not registered to any app

        // Get permitted app versions for this PKP and app
        EnumerableSet.UintSet storage permittedVersions = us_.agentPkpTokenIdToPermittedAppVersions[pkpTokenId][appId];
        uint256 versionCount = permittedVersions.length();
        if (versionCount == 0) return new bytes32[](0); // No versions permitted

        // First, count total tools across all permitted versions (with potential duplicates)
        VincentAppStorage.App storage app = as_.appIdToApp[appId];
        uint256 totalToolsCount = 0;

        for (uint256 i = 0; i < versionCount; i++) {
            uint256 version = permittedVersions.at(i);
            // Skip invalid or disabled versions
            if (version >= app.versionedApps.length || !app.versionedApps[version - 1].enabled) continue;

            totalToolsCount += app.versionedApps[version - 1].toolIpfsCidHashes.length();
        }

        if (totalToolsCount == 0) return new bytes32[](0);

        // Collect all tool hashes (with potential duplicates)
        bytes32[] memory allToolHashes = new bytes32[](totalToolsCount);
        uint256 toolIndex = 0;

        for (uint256 i = 0; i < versionCount; i++) {
            uint256 version = permittedVersions.at(i);
            // Skip invalid or disabled versions
            if (version >= app.versionedApps.length || !app.versionedApps[version - 1].enabled) continue;

            uint256 versionToolCount = app.versionedApps[version - 1].toolIpfsCidHashes.length();
            for (uint256 j = 0; j < versionToolCount; j++) {
                allToolHashes[toolIndex] = app.versionedApps[version - 1].toolIpfsCidHashes.at(j);
                toolIndex++;
            }
        }

        // Deduplicate tools - this is inefficient but necessary in Solidity
        // First count unique tools
        uint256 uniqueCount = 0;
        bool[] memory seen = new bool[](totalToolsCount);

        for (uint256 i = 0; i < totalToolsCount; i++) {
            bool isDuplicate = false;
            for (uint256 j = 0; j < i; j++) {
                if (allToolHashes[i] == allToolHashes[j]) {
                    isDuplicate = true;
                    break;
                }
            }
            if (!isDuplicate) {
                seen[i] = true;
                uniqueCount++;
            }
        }

        // Create final array with deduplicated tools
        toolIpfsCidHashes = new bytes32[](uniqueCount);
        uint256 resultIndex = 0;

        for (uint256 i = 0; i < totalToolsCount; i++) {
            if (seen[i]) {
                toolIpfsCidHashes[resultIndex] = allToolHashes[i];
                resultIndex++;
            }
        }
    }

    /**
     * @notice Retrieves all app versions a PKP has authorized for a specific app
     * @param pkpTokenId Token ID of the PKP
     * @param appId ID of the app
     * @return permittedVersions Array of app versions the PKP has authorized
     */
    function getPermittedAppVersionsForPkp(uint256 pkpTokenId, uint256 appId)
        external
        view
        returns (uint256[] memory permittedVersions)
    {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        EnumerableSet.UintSet storage versions = us_.agentPkpTokenIdToPermittedAppVersions[pkpTokenId][appId];
        uint256 versionCount = versions.length();

        permittedVersions = new uint256[](versionCount);
        for (uint256 i = 0; i < versionCount; i++) {
            permittedVersions[i] = versions.at(i);
        }
    }
}
