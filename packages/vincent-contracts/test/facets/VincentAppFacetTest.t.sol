// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../helpers/DiamondTestHelper.sol";
import "../../src/facets/VincentAppFacet.sol";
import "../../src/facets/VincentAppViewFacet.sol";
import "../../src/facets/VincentToolFacet.sol";

/**
 * @title VincentAppFacetTest
 * @dev Tests for the VincentAppFacet and VincentAppViewFacet contracts
 */
contract VincentAppFacetTest is DiamondTestHelper {
    // Vincent facets
    VincentAppFacet appFacet;
    VincentAppViewFacet appViewFacet;
    VincentToolFacet toolFacet;

    // Wrapped facets (to call through the diamond)
    VincentAppFacet wrappedAppFacet;
    VincentAppViewFacet wrappedAppViewFacet;
    VincentToolFacet wrappedToolFacet;

    // Test data
    string constant TEST_APP_NAME = "Test App";
    string constant TEST_APP_DESCRIPTION = "Test App Description";
    string constant TEST_DOMAIN_1 = "test.com";
    string constant TEST_DOMAIN_2 = "example.com";
    string constant TEST_REDIRECT_URI_1 = "https://test.com/callback";
    string constant TEST_REDIRECT_URI_2 = "https://example.com/callback";
    address constant TEST_DELEGATEE_1 = address(0x1);
    address constant TEST_DELEGATEE_2 = address(0x2);
    string constant TEST_TOOL_IPFS_CID_1 = "QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB";
    string constant TEST_TOOL_IPFS_CID_2 = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";

    // For policy testing
    string constant TEST_POLICY_1 = "QmTestPolicy1";
    string constant TEST_POLICY_2 = "QmTestPolicy2";
    string constant TEST_POLICY_PARAM_1 = "param1";
    string constant TEST_POLICY_PARAM_2 = "param2";

    // Event definitions
    event NewManagerRegistered(address indexed manager);
    event NewAppRegistered(uint256 indexed appId, address indexed manager);
    event NewAppVersionRegistered(uint256 indexed appId, uint256 indexed appVersion, address indexed manager);
    event AppEnabled(uint256 indexed appId, uint256 indexed appVersion, bool indexed enabled);
    event AuthorizedDomainAdded(uint256 indexed appId, string indexed domain);
    event AuthorizedRedirectUriAdded(uint256 indexed appId, string indexed redirectUri);
    event AuthorizedDomainRemoved(uint256 indexed appId, string indexed domain);
    event AuthorizedRedirectUriRemoved(uint256 indexed appId, string indexed redirectUri);
    event NewToolRegistered(bytes32 indexed toolIpfsCidHash);

    function setUp() public {
        // Set up the base diamond with core facets
        setUpBaseDiamond();

        // Deploy the facets
        appFacet = new VincentAppFacet();
        appViewFacet = new VincentAppViewFacet();
        toolFacet = new VincentToolFacet();

        // Add ToolFacet first (required for app facet)
        bytes4[] memory toolSelectors = new bytes4[](2);
        toolSelectors[0] = VincentToolFacet.registerTool.selector;
        toolSelectors[1] = VincentToolFacet.registerTools.selector;
        addFacet(address(toolFacet), toolSelectors);

        // Add AppFacet
        bytes4[] memory appSelectors = new bytes4[](9);
        appSelectors[0] = VincentAppFacet.registerApp.selector;
        appSelectors[1] = VincentAppFacet.registerAppWithVersion.selector;
        appSelectors[2] = VincentAppFacet.registerNextAppVersion.selector;
        appSelectors[3] = VincentAppFacet.enableAppVersion.selector;
        appSelectors[4] = VincentAppFacet.addAuthorizedDomain.selector;
        appSelectors[5] = VincentAppFacet.removeAuthorizedDomain.selector;
        appSelectors[6] = VincentAppFacet.addAuthorizedRedirectUri.selector;
        appSelectors[7] = VincentAppFacet.removeAuthorizedRedirectUri.selector;
        appSelectors[8] = VincentAppFacet.addDelegatee.selector;
        addFacet(address(appFacet), appSelectors);

        // Add AppViewFacet
        bytes4[] memory appViewSelectors = new bytes4[](20); // Adjust based on actual count
        appViewSelectors[0] = VincentAppViewFacet.getTotalAppCount.selector;
        appViewSelectors[1] = VincentAppViewFacet.getAllRegisteredApps.selector;
        appViewSelectors[2] = VincentAppViewFacet.getRegisteredManagers.selector;
        appViewSelectors[3] = VincentAppViewFacet.getAppById.selector;
        appViewSelectors[4] = VincentAppViewFacet.getAppByVersion.selector;
        appViewSelectors[5] = VincentAppViewFacet.getAppLatestVersion.selector;
        appViewSelectors[6] = VincentAppViewFacet.getAppManager.selector;
        appViewSelectors[7] = VincentAppViewFacet.getAppsByManager.selector;
        appViewSelectors[8] = VincentAppViewFacet.isAppManager.selector;
        appViewSelectors[9] = VincentAppViewFacet.getAppByDelegatee.selector;
        appViewSelectors[10] = VincentAppViewFacet.getAppDelegatees.selector;
        appViewSelectors[11] = VincentAppViewFacet.getAppIdByDelegatee.selector;
        appViewSelectors[12] = VincentAppViewFacet.isAppDelegatee.selector;
        appViewSelectors[13] = VincentAppViewFacet.getAuthorizedDomainsByAppId.selector;
        appViewSelectors[14] = VincentAppViewFacet.getAuthorizedRedirectUrisByAppId.selector;
        appViewSelectors[15] = VincentAppViewFacet.isDomainAuthorizedForApp.selector;
        appViewSelectors[16] = VincentAppViewFacet.isRedirectUriAuthorizedForApp.selector;
        appViewSelectors[17] = VincentAppViewFacet.isAppVersionEnabled.selector;
        appViewSelectors[18] = VincentAppViewFacet.getAppVersionTools.selector;
        appViewSelectors[19] = VincentAppViewFacet.getToolCidFromHash.selector;
        addFacet(address(appViewFacet), appViewSelectors);

        // Create wrapped instances to call through the diamond
        wrappedAppFacet = VincentAppFacet(address(diamond));
        wrappedAppViewFacet = VincentAppViewFacet(address(diamond));
        wrappedToolFacet = VincentToolFacet(address(diamond));
    }

    /**
     * Test registering a basic app without versions
     */
    function testRegisterApp() public {
        // Set up test data
        string[] memory domains = new string[](2);
        domains[0] = TEST_DOMAIN_1;
        domains[1] = TEST_DOMAIN_2;

        string[] memory redirectUris = new string[](2);
        redirectUris[0] = TEST_REDIRECT_URI_1;
        redirectUris[1] = TEST_REDIRECT_URI_2;

        address[] memory delegatees = new address[](2);
        delegatees[0] = TEST_DELEGATEE_1;
        delegatees[1] = TEST_DELEGATEE_2;

        // Set up event expectations
        vm.expectEmit(true, true, false, false);
        emit NewManagerRegistered(address(this));

        vm.expectEmit(true, true, false, false);
        emit NewAppRegistered(0, address(this));

        // Register app
        uint256 newAppId =
            wrappedAppFacet.registerApp(TEST_APP_NAME, TEST_APP_DESCRIPTION, domains, redirectUris, delegatees);

        // Verify app was registered
        assertEq(newAppId, 0, "App ID should be 0 for first app");
        assertEq(wrappedAppViewFacet.getTotalAppCount(), 1, "App count should be 1");

        // Verify app details
        VincentAppViewFacet.AppView memory app = wrappedAppViewFacet.getAppById(newAppId);
        assertEq(app.name, TEST_APP_NAME, "App name doesn't match");
        assertEq(app.description, TEST_APP_DESCRIPTION, "App description doesn't match");
        assertEq(app.manager, address(this), "App manager doesn't match");
        assertEq(app.latestVersion, 0, "App latest version should be 0 (no versions yet)");

        // Verify domains
        string[] memory appDomains = wrappedAppViewFacet.getAuthorizedDomainsByAppId(newAppId);
        assertEq(appDomains.length, 2, "App should have 2 domains");

        // Verify domains content (order might vary)
        bool foundDomain1 = false;
        bool foundDomain2 = false;
        for (uint256 i = 0; i < appDomains.length; i++) {
            if (keccak256(abi.encodePacked(appDomains[i])) == keccak256(abi.encodePacked(TEST_DOMAIN_1))) {
                foundDomain1 = true;
            } else if (keccak256(abi.encodePacked(appDomains[i])) == keccak256(abi.encodePacked(TEST_DOMAIN_2))) {
                foundDomain2 = true;
            }
        }
        assertTrue(foundDomain1, "Domain 1 not found");
        assertTrue(foundDomain2, "Domain 2 not found");

        // Verify redirect URIs
        string[] memory appRedirectUris = wrappedAppViewFacet.getAuthorizedRedirectUrisByAppId(newAppId);
        assertEq(appRedirectUris.length, 2, "App should have 2 redirect URIs");

        // Verify delegatees
        address[] memory appDelegatees = wrappedAppViewFacet.getAppDelegatees(newAppId);
        assertEq(appDelegatees.length, 2, "App should have 2 delegatees");

        // Verify delegatees content (order might vary)
        bool foundDelegatee1 = false;
        bool foundDelegatee2 = false;
        for (uint256 i = 0; i < appDelegatees.length; i++) {
            if (appDelegatees[i] == TEST_DELEGATEE_1) {
                foundDelegatee1 = true;
            } else if (appDelegatees[i] == TEST_DELEGATEE_2) {
                foundDelegatee2 = true;
            }
        }
        assertTrue(foundDelegatee1, "Delegatee 1 not found");
        assertTrue(foundDelegatee2, "Delegatee 2 not found");

        // Verify delegatee to app ID mapping
        assertEq(
            wrappedAppViewFacet.getAppIdByDelegatee(TEST_DELEGATEE_1), newAppId, "Delegatee 1 should map to app ID"
        );
        assertEq(
            wrappedAppViewFacet.getAppIdByDelegatee(TEST_DELEGATEE_2), newAppId, "Delegatee 2 should map to app ID"
        );
    }

    /**
     * Test registering an app with version
     */
    function testRegisterAppWithVersion() public {
        // Set up test data
        string[] memory domains = new string[](1);
        domains[0] = TEST_DOMAIN_1;

        string[] memory redirectUris = new string[](1);
        redirectUris[0] = TEST_REDIRECT_URI_1;

        address[] memory delegatees = new address[](1);
        delegatees[0] = TEST_DELEGATEE_1;

        string[] memory toolIpfsCids = new string[](2);
        toolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;
        toolIpfsCids[1] = TEST_TOOL_IPFS_CID_2;

        // Register tools first (so they exist)
        wrappedToolFacet.registerTools(toolIpfsCids);

        // Set up tool policies
        string[][] memory toolPolicies = new string[][](2);
        toolPolicies[0] = new string[](1);
        toolPolicies[0][0] = TEST_POLICY_1;
        toolPolicies[1] = new string[](1);
        toolPolicies[1][0] = TEST_POLICY_2;

        string[][][] memory toolPolicyParameterNames = new string[][][](2);
        toolPolicyParameterNames[0] = new string[][](1);
        toolPolicyParameterNames[0][0] = new string[](2);
        toolPolicyParameterNames[0][0][0] = TEST_POLICY_PARAM_1;
        toolPolicyParameterNames[0][0][1] = TEST_POLICY_PARAM_2;
        toolPolicyParameterNames[1] = new string[][](1);
        toolPolicyParameterNames[1][0] = new string[](1);
        toolPolicyParameterNames[1][0][0] = TEST_POLICY_PARAM_1;

        // Set up event expectations
        vm.expectEmit(true, true, false, false);
        emit NewManagerRegistered(address(this));

        vm.expectEmit(true, true, false, false);
        emit NewAppRegistered(0, address(this));

        vm.expectEmit(true, true, true, false);
        emit NewAppVersionRegistered(0, 1, address(this));

        // Register app with version
        (uint256 newAppId, uint256 newAppVersion) = wrappedAppFacet.registerAppWithVersion(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            domains,
            redirectUris,
            delegatees,
            toolIpfsCids,
            toolPolicies,
            toolPolicyParameterNames
        );

        // Verify app and version were registered
        assertEq(newAppId, 0, "App ID should be 0 for first app");
        assertEq(newAppVersion, 1, "App version should be 1");
        assertEq(wrappedAppViewFacet.getAppLatestVersion(newAppId), 1, "App latest version should be 1");

        // Verify app version details
        VincentAppViewFacet.VersionedAppView memory versionedApp = wrappedAppViewFacet.getAppByVersion(newAppId, 1);
        assertEq(versionedApp.name, TEST_APP_NAME, "App name doesn't match");
        assertEq(versionedApp.description, TEST_APP_DESCRIPTION, "App description doesn't match");
        assertEq(versionedApp.manager, address(this), "App manager doesn't match");
        assertEq(versionedApp.version, 1, "App version should be 1");
        assertEq(versionedApp.enabled, true, "App version should be enabled by default");

        // Verify tools
        string[] memory appTools = wrappedAppViewFacet.getAppVersionTools(newAppId, 1);
        assertEq(appTools.length, 2, "App version should have 2 tools");

        // Verify tools content (order might vary)
        bool foundTool1 = false;
        bool foundTool2 = false;
        for (uint256 i = 0; i < appTools.length; i++) {
            if (keccak256(abi.encodePacked(appTools[i])) == keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_1))) {
                foundTool1 = true;
            } else if (keccak256(abi.encodePacked(appTools[i])) == keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_2))) {
                foundTool2 = true;
            }
        }
        assertTrue(foundTool1, "Tool 1 not found");
        assertTrue(foundTool2, "Tool 2 not found");
    }

    /**
     * Test enabling and disabling app versions
     */
    function testEnableAppVersion() public {
        // First register an app with version
        (uint256 appId, uint256 appVersion) = _registerTestAppWithVersion();

        // Verify app version is enabled by default
        assertTrue(
            wrappedAppViewFacet.isAppVersionEnabled(appId, appVersion), "App version should be enabled by default"
        );

        // Set up event expectation
        vm.expectEmit(true, true, true, false);
        emit AppEnabled(appId, appVersion, false);

        // Disable app version
        wrappedAppFacet.enableAppVersion(appId, appVersion, false);

        // Verify app version is now disabled
        assertFalse(wrappedAppViewFacet.isAppVersionEnabled(appId, appVersion), "App version should be disabled");

        // Set up event expectation
        vm.expectEmit(true, true, true, false);
        emit AppEnabled(appId, appVersion, true);

        // Re-enable app version
        wrappedAppFacet.enableAppVersion(appId, appVersion, true);

        // Verify app version is now enabled again
        assertTrue(wrappedAppViewFacet.isAppVersionEnabled(appId, appVersion), "App version should be enabled");
    }

    /**
     * Test adding and removing domains
     */
    function testAddRemoveDomain() public {
        // First register a basic app
        string[] memory domains = new string[](1);
        domains[0] = TEST_DOMAIN_1;

        string[] memory redirectUris = new string[](1);
        redirectUris[0] = TEST_REDIRECT_URI_1;

        address[] memory delegatees = new address[](1);
        delegatees[0] = TEST_DELEGATEE_1;

        uint256 appId =
            wrappedAppFacet.registerApp(TEST_APP_NAME, TEST_APP_DESCRIPTION, domains, redirectUris, delegatees);

        // Verify initial domain count
        string[] memory initialDomains = wrappedAppViewFacet.getAuthorizedDomainsByAppId(appId);
        assertEq(initialDomains.length, 1, "App should have 1 domain initially");

        // Set up event expectation
        vm.expectEmit(true, false, false, false);
        emit AuthorizedDomainAdded(appId, TEST_DOMAIN_2);

        // Add another domain
        wrappedAppFacet.addAuthorizedDomain(appId, TEST_DOMAIN_2);

        // Verify domain was added
        string[] memory updatedDomains = wrappedAppViewFacet.getAuthorizedDomainsByAppId(appId);
        assertEq(updatedDomains.length, 2, "App should have 2 domains after adding one");

        // Verify domain authorization check
        assertTrue(
            wrappedAppViewFacet.isDomainAuthorizedForApp(appId, TEST_DOMAIN_2), "Added domain should be authorized"
        );

        // Set up event expectation
        vm.expectEmit(true, false, false, false);
        emit AuthorizedDomainRemoved(appId, TEST_DOMAIN_2);

        // Remove the domain
        wrappedAppFacet.removeAuthorizedDomain(appId, TEST_DOMAIN_2);

        // Verify domain was removed
        string[] memory finalDomains = wrappedAppViewFacet.getAuthorizedDomainsByAppId(appId);
        assertEq(finalDomains.length, 1, "App should have 1 domain after removing one");

        // Verify domain authorization check
        assertFalse(
            wrappedAppViewFacet.isDomainAuthorizedForApp(appId, TEST_DOMAIN_2),
            "Removed domain should not be authorized"
        );
    }

    /**
     * Helper function to register a test app with version
     */
    function _registerTestAppWithVersion() internal returns (uint256 appId, uint256 appVersion) {
        string[] memory domains = new string[](1);
        domains[0] = TEST_DOMAIN_1;

        string[] memory redirectUris = new string[](1);
        redirectUris[0] = TEST_REDIRECT_URI_1;

        address[] memory delegatees = new address[](1);
        delegatees[0] = TEST_DELEGATEE_1;

        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;

        // Register tool first
        wrappedToolFacet.registerTool(TEST_TOOL_IPFS_CID_1);

        // Set up tool policies
        string[][] memory toolPolicies = new string[][](1);
        toolPolicies[0] = new string[](1);
        toolPolicies[0][0] = TEST_POLICY_1;

        string[][][] memory toolPolicyParameterNames = new string[][][](1);
        toolPolicyParameterNames[0] = new string[][](1);
        toolPolicyParameterNames[0][0] = new string[](1);
        toolPolicyParameterNames[0][0][0] = TEST_POLICY_PARAM_1;

        // Register app with version
        return wrappedAppFacet.registerAppWithVersion(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            domains,
            redirectUris,
            delegatees,
            toolIpfsCids,
            toolPolicies,
            toolPolicyParameterNames
        );
    }
}
