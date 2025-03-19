// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../helpers/VincentTestHelper.sol";
import "../../src/VincentBase.sol";
import "../../src/LibVincentDiamondStorage.sol";

/**
 * @title VincentAppFacetTest
 * @notice Test contract for VincentAppFacet
 * @dev Tests functions related to app registration and management
 */
contract VincentAppFacetTest is VincentTestHelper {
    function setUp() public override {
        // Call parent setUp to deploy the diamond and initialize standard test data
        super.setUp();
    }

    /**
     * @notice Test registering a new app
     * @dev Verifies that an app can be registered with all required details
     */
    function testRegisterApp() public {
        // Start as deployer (diamond owner)
        vm.startPrank(deployer);

        // Expect the NewAppRegistered and NewAppVersionRegistered events
        vm.expectEmit(true, true, false, false);
        emit NewAppRegistered(1, deployer);

        vm.expectEmit(true, true, true, false);
        emit NewAppVersionRegistered(1, 1, deployer);

        // Call registerApp through the diamond with the test data from the test helper
        (uint256 appId, uint256 versionNumber) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicySchemaIpfsCids,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        // Verify returned values
        assertEq(appId, 1, "App ID should be 1");
        assertEq(versionNumber, 1, "App version should be 1");

        // Verify app data was stored correctly by checking view functions
        VincentAppViewFacet.App memory app = wrappedAppViewFacet.getAppById(appId);
        assertEq(keccak256(app.name), keccak256(TEST_APP_NAME), "App name should match");
        assertEq(keccak256(app.description), keccak256(TEST_APP_DESCRIPTION), "App description should match");
        assertEq(app.manager, deployer, "App manager should be deployer");

        // Verify app version is enabled
        (VincentAppViewFacet.App memory appData, VincentAppViewFacet.AppVersion memory versionData) =
            wrappedAppViewFacet.getAppVersion(appId, versionNumber);
        assertTrue(versionData.enabled, "App version should be enabled");

        // Verify delegatee was added
        assertEq(app.delegatees.length, 1, "Should have 1 delegatee");
        assertEq(app.delegatees[0], TEST_DELEGATEE_1, "Delegatee should match");

        // Verify redirect URI was added
        bytes[] memory appRedirectUris = wrappedAppViewFacet.getAuthorizedRedirectUrisByAppId(appId);
        assertEq(appRedirectUris.length, 1, "Should have 1 redirect URI");
        assertEq(
            keccak256(abi.encodePacked(appRedirectUris[0])), keccak256(TEST_REDIRECT_URI_1), "Redirect URI should match"
        );

        // Verify tools were correctly registered
        assertEq(versionData.tools.length, 1, "App version should have 1 tool");

        vm.stopPrank();
    }

    /**
     * @notice Test registering multiple apps sequentially
     * @dev Verifies that multiple apps can be registered and have sequential IDs
     */
    function testRegisterMultipleApps() public {
        vm.startPrank(deployer);

        // Register first app
        (uint256 firstAppId, uint256 firstAppVersion) = _registerTestApp();
        assertEq(firstAppId, 1, "First app ID should be 1");
        assertEq(firstAppVersion, 1, "First app version should be 1");

        // Create different data for second app
        bytes memory secondAppName = bytes("Second App");
        bytes memory secondAppDesc = bytes("Second App Description");

        // Use different delegatee for second app to avoid conflict
        address[] memory secondAppDelegatees = new address[](1);
        secondAppDelegatees[0] = TEST_DELEGATEE_2;

        // Register second app
        vm.expectEmit(true, true, false, false);
        emit NewAppRegistered(2, deployer);

        vm.expectEmit(true, true, true, false);
        emit NewAppVersionRegistered(2, 1, deployer);

        (uint256 secondAppId, uint256 secondAppVersion) = wrappedAppFacet.registerApp(
            secondAppName,
            secondAppDesc,
            testRedirectUris,
            secondAppDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicySchemaIpfsCids,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        // Verify second app ID and version
        assertEq(secondAppId, 2, "Second app ID should be 2");
        assertEq(secondAppVersion, 1, "Second app version should be 1");

        // Verify both apps exist with correct data
        VincentAppViewFacet.App memory app1 = wrappedAppViewFacet.getAppById(firstAppId);
        VincentAppViewFacet.App memory app2 = wrappedAppViewFacet.getAppById(secondAppId);

        assertEq(keccak256(app1.name), keccak256(TEST_APP_NAME), "First app name should match");
        assertEq(keccak256(app2.name), keccak256(secondAppName), "Second app name should match");

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with multiple tools and policies
     * @dev Verifies that an app can be registered with multiple tools, each with multiple policies
     */
    function testRegisterAppWithMultipleToolsAndPolicies() public {
        vm.startPrank(deployer);

        // Create app with multiple tools and policies
        bytes[] memory multiToolIpfsCids = new bytes[](2);
        multiToolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;
        multiToolIpfsCids[1] = TEST_TOOL_IPFS_CID_2;

        // Each tool has 2 policies
        bytes[][] memory multiToolPolicies = new bytes[][](2);
        multiToolPolicies[0] = new bytes[](2);
        multiToolPolicies[0][0] = TEST_POLICY_1;
        multiToolPolicies[0][1] = TEST_POLICY_2;
        multiToolPolicies[1] = new bytes[](2);
        multiToolPolicies[1][0] = TEST_POLICY_1;
        multiToolPolicies[1][1] = TEST_POLICY_2;

        // Policy schemas for each policy
        bytes[][] memory multiToolPolicySchemas = new bytes[][](2);
        multiToolPolicySchemas[0] = new bytes[](2);
        multiToolPolicySchemas[0][0] = TEST_POLICY_SCHEMA_1;
        multiToolPolicySchemas[0][1] = TEST_POLICY_SCHEMA_2;
        multiToolPolicySchemas[1] = new bytes[](2);
        multiToolPolicySchemas[1][0] = TEST_POLICY_SCHEMA_1;
        multiToolPolicySchemas[1][1] = TEST_POLICY_SCHEMA_2;

        // Parameter names for each policy
        bytes[][][] memory multiToolParamNames = new bytes[][][](2);
        // First tool's policies
        multiToolParamNames[0] = new bytes[][](2);
        multiToolParamNames[0][0] = new bytes[](1);
        multiToolParamNames[0][0][0] = TEST_POLICY_PARAM_1;
        multiToolParamNames[0][1] = new bytes[](1);
        multiToolParamNames[0][1][0] = TEST_POLICY_PARAM_2;
        // Second tool's policies
        multiToolParamNames[1] = new bytes[][](2);
        multiToolParamNames[1][0] = new bytes[](1);
        multiToolParamNames[1][0][0] = TEST_POLICY_PARAM_1;
        multiToolParamNames[1][1] = new bytes[](1);
        multiToolParamNames[1][1][0] = TEST_POLICY_PARAM_2;

        // Parameter types for each parameter
        VincentAppStorage.ParameterType[][][] memory multiToolParamTypes = new VincentAppStorage.ParameterType[][][](2);
        // First tool's policies
        multiToolParamTypes[0] = new VincentAppStorage.ParameterType[][](2);
        multiToolParamTypes[0][0] = new VincentAppStorage.ParameterType[](1);
        multiToolParamTypes[0][0][0] = VincentAppStorage.ParameterType.STRING;
        multiToolParamTypes[0][1] = new VincentAppStorage.ParameterType[](1);
        multiToolParamTypes[0][1][0] = VincentAppStorage.ParameterType.BOOL;
        // Second tool's policies
        multiToolParamTypes[1] = new VincentAppStorage.ParameterType[][](2);
        multiToolParamTypes[1][0] = new VincentAppStorage.ParameterType[](1);
        multiToolParamTypes[1][0][0] = VincentAppStorage.ParameterType.STRING;
        multiToolParamTypes[1][1] = new VincentAppStorage.ParameterType[](1);
        multiToolParamTypes[1][1][0] = VincentAppStorage.ParameterType.UINT256;

        // Register app with multiple tools and policies
        (uint256 appId, uint256 appVersion) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            multiToolIpfsCids,
            multiToolPolicies,
            multiToolPolicySchemas,
            multiToolParamNames,
            multiToolParamTypes
        );

        // Verify app ID and version
        assertEq(appId, 1, "App ID should be 1");
        assertEq(appVersion, 1, "App version should be 1");

        // Verify app version data to check tool count
        (VincentAppViewFacet.App memory app, VincentAppViewFacet.AppVersion memory versionData) =
            wrappedAppViewFacet.getAppVersion(appId, appVersion);

        // Verify tools were correctly registered
        assertEq(versionData.tools.length, 2, "App version should have 2 tools");

        // Verify each tool has 2 policies
        assertEq(versionData.tools[0].policies.length, 2, "First tool should have 2 policies");
        assertEq(versionData.tools[1].policies.length, 2, "Second tool should have 2 policies");

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with empty redirect URIs
     * @dev Verifies that app registration fails when no redirect URIs are provided
     */
    function testRegisterAppWithNoRedirectUris() public {
        vm.startPrank(deployer);

        // Create empty redirect URIs array
        bytes[] memory emptyRedirectUris = new bytes[](0);

        // Expect the call to revert with NoRedirectUrisProvided error
        vm.expectRevert(abi.encodeWithSignature("NoRedirectUrisProvided()"));

        // Call registerApp with empty redirect URIs
        wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            emptyRedirectUris,
            testDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicySchemaIpfsCids,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with mismatched tool and policy array lengths
     * @dev Verifies that app registration fails when array lengths don't match
     */
    function testRegisterAppWithMismatchedArrays() public {
        vm.startPrank(deployer);

        // Create mismatched arrays (more tools than policies)
        bytes[] memory extraTools = new bytes[](2);
        extraTools[0] = TEST_TOOL_IPFS_CID_1;
        extraTools[1] = TEST_TOOL_IPFS_CID_2;

        // Expect the call to revert with ToolsAndPoliciesLengthMismatch error
        vm.expectRevert(abi.encodeWithSignature("ToolsAndPoliciesLengthMismatch()"));

        // Call registerApp with mismatched arrays
        wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            extraTools, // 2 tools
            testToolPolicies, // 1 policy array
            testToolPolicySchemaIpfsCids,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with a delegatee already registered to another app
     * @dev Verifies that app registration fails with DelegateeAlreadyRegisteredToApp error
     */
    function testRegisterAppWithAlreadyRegisteredDelegatee() public {
        vm.startPrank(deployer);

        // First register an app with a delegatee
        (uint256 firstAppId,) = _registerTestApp();

        // Try to register a second app with the same delegatee
        vm.expectRevert(
            abi.encodeWithSignature("DelegateeAlreadyRegisteredToApp(uint256,address)", firstAppId, TEST_DELEGATEE_1)
        );

        // Create a new app using the same delegatee
        wrappedAppFacet.registerApp(
            bytes("Second App"),
            bytes("Second app description"),
            testRedirectUris,
            testDelegatees, // Contains TEST_DELEGATEE_1 which is already registered
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicySchemaIpfsCids,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with an empty tool IPFS CID
     * @dev Verifies that app registration fails with EmptyToolIpfsCidNotAllowed error
     */
    function testRegisterAppWithEmptyToolIpfsCid() public {
        vm.startPrank(deployer);

        // Create tool array with an empty IPFS CID
        bytes[] memory emptyToolCids = new bytes[](1);
        emptyToolCids[0] = bytes("");

        // Create matching policy arrays
        bytes[][] memory policies = new bytes[][](1);
        policies[0] = new bytes[](1);
        policies[0][0] = TEST_POLICY_1;

        vm.expectRevert(abi.encodeWithSignature("EmptyToolIpfsCidNotAllowed(uint256,uint256)", 1, 0));

        wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            emptyToolCids,
            policies,
            testToolPolicySchemaIpfsCids,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with an empty policy IPFS CID
     * @dev Verifies that app registration fails with EmptyPolicyIpfsCidNotAllowed error
     */
    function testRegisterAppWithEmptyPolicyIpfsCid() public {
        vm.startPrank(deployer);

        // Create policy array with an empty IPFS CID
        bytes[][] memory emptyPolicies = new bytes[][](1);
        emptyPolicies[0] = new bytes[](1);
        emptyPolicies[0][0] = bytes("");

        vm.expectRevert(abi.encodeWithSignature("EmptyPolicyIpfsCidNotAllowed(uint256,uint256)", 1, 0));

        wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            testToolIpfsCids,
            emptyPolicies,
            testToolPolicySchemaIpfsCids,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with a missing policy schema
     * @dev Verifies that app registration fails with PolicySchemaMissing error
     */
    function testRegisterAppWithMissingPolicySchema() public {
        vm.startPrank(deployer);

        // Create policy schema array with an empty schema
        bytes[][] memory missingSchemas = new bytes[][](1);
        missingSchemas[0] = new bytes[](1);
        missingSchemas[0][0] = bytes("");

        vm.expectRevert(abi.encodeWithSignature("PolicySchemaMissing(uint256,bytes)", 1, testToolPolicies[0][0]));

        wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            missingSchemas,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test that attempting to register an app with duplicate redirect URIs fails
     * @dev Verifies that registration fails with RedirectUriAlreadyAuthorizedForApp error
     */
    function testRegisterAppWithDuplicateRedirectURIs() public {
        vm.startPrank(deployer);

        // Create redirect URIs array with duplicates
        bytes[] memory duplicateRedirectUris = new bytes[](2);
        duplicateRedirectUris[0] = TEST_REDIRECT_URI_1;
        duplicateRedirectUris[1] = TEST_REDIRECT_URI_1; // Same as first one

        // Expect the call to revert with RedirectUriAlreadyAuthorizedForApp error
        // The first URI will be added, but when trying to add the duplicate,
        // it should revert with this error
        vm.expectRevert(
            abi.encodeWithSignature("RedirectUriAlreadyAuthorizedForApp(uint256,bytes)", 1, TEST_REDIRECT_URI_1)
        );

        // Attempt to register app with duplicate URIs - this should fail
        wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            duplicateRedirectUris,
            testDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicySchemaIpfsCids,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering an app with multiple redirect URIs
     * @dev Verifies that all unique redirect URIs are properly stored
     */
    function testRegisterAppWithMultipleRedirectURIs() public {
        vm.startPrank(deployer);

        // Create redirect URIs array with multiple URIs
        bytes[] memory multipleRedirectUris = new bytes[](2);
        multipleRedirectUris[0] = TEST_REDIRECT_URI_1;
        multipleRedirectUris[1] = TEST_REDIRECT_URI_2; // Different URI

        // Register app with multiple redirect URIs
        (uint256 appId, uint256 versionNumber) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            multipleRedirectUris,
            testDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicySchemaIpfsCids,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        // Verify both redirect URIs were stored
        bytes[] memory appRedirectUris = wrappedAppViewFacet.getAuthorizedRedirectUrisByAppId(appId);
        assertEq(appRedirectUris.length, 2, "Should have stored 2 redirect URIs");

        // Sort order is not guaranteed, so check that both URIs exist
        bool foundURI1 = false;
        bool foundURI2 = false;

        for (uint256 i = 0; i < appRedirectUris.length; i++) {
            bytes32 uriHash = keccak256(abi.encodePacked(appRedirectUris[i]));
            if (uriHash == keccak256(TEST_REDIRECT_URI_1)) {
                foundURI1 = true;
            } else if (uriHash == keccak256(TEST_REDIRECT_URI_2)) {
                foundURI2 = true;
            }
        }

        assertTrue(foundURI1, "Should have found first redirect URI");
        assertTrue(foundURI2, "Should have found second redirect URI");

        vm.stopPrank();
    }
}
