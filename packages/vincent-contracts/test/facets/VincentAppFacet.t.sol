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

    /**
     * @notice Test registering a new version of an existing app
     * @dev Verifies that a new app version can be registered with updated tools/policies
     */
    function testRegisterNextAppVersion() public {
        vm.startPrank(deployer);

        // First register an app
        (uint256 appId, uint256 firstVersionNumber) = _registerTestApp();

        // Create updated data for the second version
        bytes[] memory updatedToolIpfsCids = new bytes[](1);
        updatedToolIpfsCids[0] = TEST_TOOL_IPFS_CID_2; // Use a different tool

        // Prepare matching policy arrays for the new tool
        bytes[][] memory updatedPolicies = new bytes[][](1);
        updatedPolicies[0] = new bytes[](1);
        updatedPolicies[0][0] = TEST_POLICY_2;

        bytes[][] memory updatedPolicySchemas = new bytes[][](1);
        updatedPolicySchemas[0] = new bytes[](1);
        updatedPolicySchemas[0][0] = TEST_POLICY_SCHEMA_2;

        bytes[][][] memory updatedParameterNames = new bytes[][][](1);
        updatedParameterNames[0] = new bytes[][](1);
        updatedParameterNames[0][0] = new bytes[](1);
        updatedParameterNames[0][0][0] = TEST_POLICY_PARAM_2;

        VincentAppStorage.ParameterType[][][] memory updatedParameterTypes =
            new VincentAppStorage.ParameterType[][][](1);
        updatedParameterTypes[0] = new VincentAppStorage.ParameterType[][](1);
        updatedParameterTypes[0][0] = new VincentAppStorage.ParameterType[](1);
        updatedParameterTypes[0][0][0] = VincentAppStorage.ParameterType.BOOL;

        // Expect the NewAppVersionRegistered event
        vm.expectEmit(true, true, true, false);
        emit NewAppVersionRegistered(appId, 2, deployer);

        // Register a new version of the app
        uint256 newVersionNumber = wrappedAppFacet.registerNextAppVersion(
            appId,
            updatedToolIpfsCids,
            updatedPolicies,
            updatedPolicySchemas,
            updatedParameterNames,
            updatedParameterTypes
        );

        // Verify new version number
        assertEq(newVersionNumber, 2, "New version number should be 2");

        // Verify app version is created and enabled
        (VincentAppViewFacet.App memory app, VincentAppViewFacet.AppVersion memory versionData) =
            wrappedAppViewFacet.getAppVersion(appId, newVersionNumber);
        assertTrue(versionData.enabled, "New app version should be enabled");

        // Verify tools were correctly registered in the new version
        assertEq(versionData.tools.length, 1, "App version should have 1 tool");
        assertEq(
            keccak256(versionData.tools[0].toolIpfsCid), keccak256(TEST_TOOL_IPFS_CID_2), "Tool IPFS CID should match"
        );

        // Verify policies were correctly registered for the new tool
        assertEq(versionData.tools[0].policies.length, 1, "Tool should have 1 policy");
        assertEq(
            keccak256(versionData.tools[0].policies[0].policyIpfsCid),
            keccak256(TEST_POLICY_2),
            "Policy IPFS CID should match"
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering a new app version with multiple tools
     * @dev Verifies that a complex app version with multiple tools and policies can be registered
     */
    function testRegisterNextAppVersionWithMultipleTools() public {
        vm.startPrank(deployer);

        // First register an app
        (uint256 appId, uint256 firstVersionNumber) = _registerTestApp();

        // Create data for a more complex second version with multiple tools
        bytes[] memory multiToolIpfsCids = new bytes[](2);
        multiToolIpfsCids[0] = TEST_TOOL_IPFS_CID_1; // Reuse the first tool
        multiToolIpfsCids[1] = TEST_TOOL_IPFS_CID_2; // Add a second tool

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

        // Register a new version of the app with multiple tools
        uint256 newVersionNumber = wrappedAppFacet.registerNextAppVersion(
            appId,
            multiToolIpfsCids,
            multiToolPolicies,
            multiToolPolicySchemas,
            multiToolParamNames,
            multiToolParamTypes
        );

        // Verify new version number
        assertEq(newVersionNumber, 2, "New version number should be 2");

        // Verify app version data to check tool count
        (VincentAppViewFacet.App memory app, VincentAppViewFacet.AppVersion memory versionData) =
            wrappedAppViewFacet.getAppVersion(appId, newVersionNumber);

        // Verify tools were correctly registered
        assertEq(versionData.tools.length, 2, "App version should have 2 tools");

        // Verify each tool has 2 policies
        assertEq(versionData.tools[0].policies.length, 2, "First tool should have 2 policies");
        assertEq(versionData.tools[1].policies.length, 2, "Second tool should have 2 policies");

        vm.stopPrank();
    }

    /**
     * @notice Test that only the app manager can register a new app version
     * @dev Verifies the onlyAppManager modifier works correctly
     */
    function testRegisterNextAppVersionNotAppManager() public {
        vm.startPrank(deployer);

        // First register an app
        (uint256 appId, uint256 firstVersionNumber) = _registerTestApp();

        vm.stopPrank();

        // Switch to a different address (not the app manager)
        vm.startPrank(address(0xBEEF));

        // Expect the call to revert with NotAppManager error
        vm.expectRevert(abi.encodeWithSignature("NotAppManager(uint256,address)", appId, address(0xBEEF)));

        // Try to register a new version of the app as non-manager
        wrappedAppFacet.registerNextAppVersion(
            appId,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicySchemaIpfsCids,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering a new app version with mismatched tool and policy array lengths
     * @dev Verifies that version registration fails when array lengths don't match
     */
    function testRegisterNextAppVersionWithMismatchedArrays() public {
        vm.startPrank(deployer);

        // First register an app
        (uint256 appId, uint256 firstVersionNumber) = _registerTestApp();

        // Create mismatched arrays (more tools than policies)
        bytes[] memory extraTools = new bytes[](2);
        extraTools[0] = TEST_TOOL_IPFS_CID_1;
        extraTools[1] = TEST_TOOL_IPFS_CID_2;

        // Expect the call to revert with ToolsAndPoliciesLengthMismatch error
        vm.expectRevert(abi.encodeWithSignature("ToolsAndPoliciesLengthMismatch()"));

        // Try to register a new app version with mismatched arrays
        wrappedAppFacet.registerNextAppVersion(
            appId,
            extraTools, // 2 tools
            testToolPolicies, // 1 policy array
            testToolPolicySchemaIpfsCids,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering a new app version with an empty tool IPFS CID
     * @dev Verifies that registration fails with EmptyToolIpfsCidNotAllowed error
     */
    function testRegisterNextAppVersionWithEmptyToolIpfsCid() public {
        vm.startPrank(deployer);

        // First register an app
        (uint256 appId, uint256 firstVersionNumber) = _registerTestApp();

        // Create tool array with an empty IPFS CID
        bytes[] memory emptyToolCids = new bytes[](1);
        emptyToolCids[0] = bytes("");

        // Create matching policy arrays
        bytes[][] memory policies = new bytes[][](1);
        policies[0] = new bytes[](1);
        policies[0][0] = TEST_POLICY_1;

        vm.expectRevert(abi.encodeWithSignature("EmptyToolIpfsCidNotAllowed(uint256,uint256)", appId, 0));

        // Try to register a new app version with an empty tool IPFS CID
        wrappedAppFacet.registerNextAppVersion(
            appId,
            emptyToolCids,
            policies,
            testToolPolicySchemaIpfsCids,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering a new app version with an empty policy IPFS CID
     * @dev Verifies that registration fails with EmptyPolicyIpfsCidNotAllowed error
     */
    function testRegisterNextAppVersionWithEmptyPolicyIpfsCid() public {
        vm.startPrank(deployer);

        // First register an app
        (uint256 appId, uint256 firstVersionNumber) = _registerTestApp();

        // Create policy array with an empty IPFS CID
        bytes[][] memory emptyPolicies = new bytes[][](1);
        emptyPolicies[0] = new bytes[](1);
        emptyPolicies[0][0] = bytes("");

        vm.expectRevert(abi.encodeWithSignature("EmptyPolicyIpfsCidNotAllowed(uint256,uint256)", appId, 0));

        // Try to register a new app version with an empty policy IPFS CID
        wrappedAppFacet.registerNextAppVersion(
            appId,
            testToolIpfsCids,
            emptyPolicies,
            testToolPolicySchemaIpfsCids,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering multiple versions of the same app sequentially
     * @dev Verifies that version numbers increment correctly
     */
    function testRegisterMultipleAppVersionsSequentially() public {
        vm.startPrank(deployer);

        // First register an app
        (uint256 appId, uint256 firstVersionNumber) = _registerTestApp();
        assertEq(firstVersionNumber, 1, "First version number should be 1");

        // Create different tools for each version
        bytes[] memory secondVersionTool = new bytes[](1);
        secondVersionTool[0] = TEST_TOOL_IPFS_CID_2;

        // Register second version
        uint256 secondVersionNumber = wrappedAppFacet.registerNextAppVersion(
            appId,
            secondVersionTool,
            testToolPolicies,
            testToolPolicySchemaIpfsCids,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        assertEq(secondVersionNumber, 2, "Second version number should be 2");

        // Create a third version with a different tool
        bytes[] memory thirdVersionTool = new bytes[](1);
        thirdVersionTool[0] = bytes("QmThirdToolIpfsCid");

        // Register third version
        uint256 thirdVersionNumber = wrappedAppFacet.registerNextAppVersion(
            appId,
            thirdVersionTool,
            testToolPolicies,
            testToolPolicySchemaIpfsCids,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        assertEq(thirdVersionNumber, 3, "Third version number should be 3");

        // Verify all versions exist and are enabled
        (VincentAppViewFacet.App memory appV1, VincentAppViewFacet.AppVersion memory versionDataV1) =
            wrappedAppViewFacet.getAppVersion(appId, 1);
        assertTrue(versionDataV1.enabled, "First version should be enabled");

        (VincentAppViewFacet.App memory appV2, VincentAppViewFacet.AppVersion memory versionDataV2) =
            wrappedAppViewFacet.getAppVersion(appId, 2);
        assertTrue(versionDataV2.enabled, "Second version should be enabled");

        (VincentAppViewFacet.App memory appV3, VincentAppViewFacet.AppVersion memory versionDataV3) =
            wrappedAppViewFacet.getAppVersion(appId, 3);
        assertTrue(versionDataV3.enabled, "Third version should be enabled");

        vm.stopPrank();
    }

    /**
     * @notice Test enabling and disabling an app version
     * @dev Verifies that app versions can be enabled and disabled by the app manager
     */
    function testEnableAppVersion() public {
        vm.startPrank(deployer);

        // Register an app
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // Verify app version is enabled by default
        (VincentAppViewFacet.App memory app, VincentAppViewFacet.AppVersion memory versionData) =
            wrappedAppViewFacet.getAppVersion(appId, versionNumber);
        assertTrue(versionData.enabled, "App version should be enabled by default");

        // Expect the AppEnabled event with enabled = false
        vm.expectEmit(true, true, true, false);
        emit AppEnabled(appId, versionNumber, false);

        // Disable the app version
        wrappedAppFacet.enableAppVersion(appId, versionNumber, false);

        // Verify app version is now disabled
        (app, versionData) = wrappedAppViewFacet.getAppVersion(appId, versionNumber);
        assertFalse(versionData.enabled, "App version should be disabled");

        // Expect the AppEnabled event with enabled = true
        vm.expectEmit(true, true, true, false);
        emit AppEnabled(appId, versionNumber, true);

        // Re-enable the app version
        wrappedAppFacet.enableAppVersion(appId, versionNumber, true);

        // Verify app version is enabled again
        (app, versionData) = wrappedAppViewFacet.getAppVersion(appId, versionNumber);
        assertTrue(versionData.enabled, "App version should be enabled again");

        vm.stopPrank();
    }

    /**
     * @notice Test that enabling an app version to its current state fails
     * @dev Verifies the AppVersionAlreadyInRequestedState error is thrown
     */
    function testEnableAppVersionAlreadyInRequestedState() public {
        vm.startPrank(deployer);

        // Register an app
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // App version is enabled by default, try to enable it again
        vm.expectRevert(
            abi.encodeWithSignature(
                "AppVersionAlreadyInRequestedState(uint256,uint256,bool)", appId, versionNumber, true
            )
        );

        wrappedAppFacet.enableAppVersion(appId, versionNumber, true);

        // Disable the app version
        wrappedAppFacet.enableAppVersion(appId, versionNumber, false);

        // Try to disable it again
        vm.expectRevert(
            abi.encodeWithSignature(
                "AppVersionAlreadyInRequestedState(uint256,uint256,bool)", appId, versionNumber, false
            )
        );

        wrappedAppFacet.enableAppVersion(appId, versionNumber, false);

        vm.stopPrank();
    }

    /**
     * @notice Test that only the app manager can enable/disable an app version
     * @dev Verifies the NotAppManager error is thrown for non-managers
     */
    function testEnableAppVersionNotAppManager() public {
        vm.startPrank(deployer);

        // Register an app
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        vm.stopPrank();

        // Switch to a different address (not the app manager)
        vm.startPrank(address(0xBEEF));

        // Expect the call to revert with NotAppManager error
        vm.expectRevert(abi.encodeWithSignature("NotAppManager(uint256,address)", appId, address(0xBEEF)));

        // Try to enable the app version as non-manager
        wrappedAppFacet.enableAppVersion(appId, versionNumber, false);

        vm.stopPrank();
    }

    /**
     * @notice Test adding a new authorized redirect URI to an app
     * @dev Verifies that new redirect URIs can be added by the app manager
     */
    function testAddAuthorizedRedirectUri() public {
        vm.startPrank(deployer);

        // Register an app with one redirect URI
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // Verify initial redirect URI count
        bytes[] memory initialRedirectUris = wrappedAppViewFacet.getAuthorizedRedirectUrisByAppId(appId);
        assertEq(initialRedirectUris.length, 1, "Should have 1 redirect URI initially");

        // Create a new redirect URI to add
        bytes memory newRedirectUri = TEST_REDIRECT_URI_2;
        bytes32 hashedNewRedirectUri = keccak256(abi.encodePacked(newRedirectUri));

        // Expect the AuthorizedRedirectUriAdded event
        vm.expectEmit(true, true, false, false);
        emit AuthorizedRedirectUriAdded(appId, hashedNewRedirectUri);

        // Add a new redirect URI
        wrappedAppFacet.addAuthorizedRedirectUri(appId, newRedirectUri);

        // Verify redirect URI was added
        bytes[] memory updatedRedirectUris = wrappedAppViewFacet.getAuthorizedRedirectUrisByAppId(appId);
        assertEq(updatedRedirectUris.length, 2, "Should have 2 redirect URIs after adding");

        // Verify both URIs exist
        bool foundOriginalUri = false;
        bool foundNewUri = false;

        for (uint256 i = 0; i < updatedRedirectUris.length; i++) {
            bytes32 uriHash = keccak256(abi.encodePacked(updatedRedirectUris[i]));
            if (uriHash == keccak256(TEST_REDIRECT_URI_1)) {
                foundOriginalUri = true;
            } else if (uriHash == keccak256(TEST_REDIRECT_URI_2)) {
                foundNewUri = true;
            }
        }

        assertTrue(foundOriginalUri, "Original URI should still exist");
        assertTrue(foundNewUri, "New URI should be added");

        vm.stopPrank();
    }

    /**
     * @notice Test adding a duplicate redirect URI
     * @dev Verifies the RedirectUriAlreadyAuthorizedForApp error is thrown
     */
    function testAddDuplicateAuthorizedRedirectUri() public {
        vm.startPrank(deployer);

        // Register an app with one redirect URI
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // Try to add the same redirect URI again
        vm.expectRevert(
            abi.encodeWithSignature("RedirectUriAlreadyAuthorizedForApp(uint256,bytes)", appId, TEST_REDIRECT_URI_1)
        );

        wrappedAppFacet.addAuthorizedRedirectUri(appId, TEST_REDIRECT_URI_1);

        vm.stopPrank();
    }

    /**
     * @notice Test that only the app manager can add redirect URIs
     * @dev Verifies the NotAppManager error is thrown for non-managers
     */
    function testAddAuthorizedRedirectUriNotAppManager() public {
        vm.startPrank(deployer);

        // Register an app
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        vm.stopPrank();

        // Switch to a different address (not the app manager)
        vm.startPrank(address(0xBEEF));

        // Expect the call to revert with NotAppManager error
        vm.expectRevert(abi.encodeWithSignature("NotAppManager(uint256,address)", appId, address(0xBEEF)));

        // Try to add a redirect URI as non-manager
        wrappedAppFacet.addAuthorizedRedirectUri(appId, TEST_REDIRECT_URI_2);

        vm.stopPrank();
    }

    /**
     * @notice Test removing an authorized redirect URI from an app
     * @dev Verifies that redirect URIs can be removed by the app manager
     */
    function testRemoveAuthorizedRedirectUri() public {
        vm.startPrank(deployer);

        // Register an app with two redirect URIs
        bytes[] memory twoRedirectUris = new bytes[](2);
        twoRedirectUris[0] = TEST_REDIRECT_URI_1;
        twoRedirectUris[1] = TEST_REDIRECT_URI_2;

        // Register app with two redirect URIs
        (uint256 appId, uint256 versionNumber) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            twoRedirectUris,
            testDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicySchemaIpfsCids,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        // Verify initial redirect URI count
        bytes[] memory initialRedirectUris = wrappedAppViewFacet.getAuthorizedRedirectUrisByAppId(appId);
        assertEq(initialRedirectUris.length, 2, "Should have 2 redirect URIs initially");

        // Get the hash of the redirect URI we'll remove
        bytes32 hashedRedirectUri = keccak256(abi.encodePacked(TEST_REDIRECT_URI_1));

        // Expect the AuthorizedRedirectUriRemoved event
        vm.expectEmit(true, true, false, false);
        emit AuthorizedRedirectUriRemoved(appId, hashedRedirectUri);

        // Remove a redirect URI
        wrappedAppFacet.removeAuthorizedRedirectUri(appId, TEST_REDIRECT_URI_1);

        // Verify redirect URI was removed
        bytes[] memory updatedRedirectUris = wrappedAppViewFacet.getAuthorizedRedirectUrisByAppId(appId);
        assertEq(updatedRedirectUris.length, 1, "Should have 1 redirect URI after removal");

        // Verify the remaining URI is the correct one
        assertEq(
            keccak256(abi.encodePacked(updatedRedirectUris[0])),
            keccak256(TEST_REDIRECT_URI_2),
            "The remaining URI should be the second one"
        );

        vm.stopPrank();
    }

    /**
     * @notice Test that removing a non-existent redirect URI fails
     * @dev Verifies the RedirectUriNotRegisteredToApp error is thrown
     */
    function testRemoveNonExistentRedirectUri() public {
        vm.startPrank(deployer);

        // Register an app with one redirect URI
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // Try to remove a redirect URI that doesn't exist
        bytes memory nonExistentUri = bytes("https://non-existent.com/callback");

        vm.expectRevert(abi.encodeWithSignature("RedirectUriNotRegisteredToApp(uint256,bytes)", appId, nonExistentUri));

        wrappedAppFacet.removeAuthorizedRedirectUri(appId, nonExistentUri);

        vm.stopPrank();
    }

    /**
     * @notice Test that removing the last redirect URI fails
     * @dev Verifies the CannotRemoveLastRedirectUri error is thrown
     */
    function testRemoveLastRedirectUri() public {
        vm.startPrank(deployer);

        // Register an app with one redirect URI
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // Try to remove the only redirect URI
        vm.expectRevert(abi.encodeWithSignature("CannotRemoveLastRedirectUri(uint256)", appId));

        wrappedAppFacet.removeAuthorizedRedirectUri(appId, TEST_REDIRECT_URI_1);

        vm.stopPrank();
    }

    /**
     * @notice Test that only the app manager can remove redirect URIs
     * @dev Verifies the NotAppManager error is thrown for non-managers
     */
    function testRemoveAuthorizedRedirectUriNotAppManager() public {
        vm.startPrank(deployer);

        // Register an app with two redirect URIs
        bytes[] memory twoRedirectUris = new bytes[](2);
        twoRedirectUris[0] = TEST_REDIRECT_URI_1;
        twoRedirectUris[1] = TEST_REDIRECT_URI_2;

        (uint256 appId, uint256 versionNumber) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            twoRedirectUris,
            testDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicySchemaIpfsCids,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        vm.stopPrank();

        // Switch to a different address (not the app manager)
        vm.startPrank(address(0xBEEF));

        // Expect the call to revert with NotAppManager error
        vm.expectRevert(abi.encodeWithSignature("NotAppManager(uint256,address)", appId, address(0xBEEF)));

        // Try to remove a redirect URI as non-manager
        wrappedAppFacet.removeAuthorizedRedirectUri(appId, TEST_REDIRECT_URI_1);

        vm.stopPrank();
    }

    /**
     * @notice Test adding a delegatee to an app
     * @dev Verifies that delegatees can be added by the app manager
     */
    function testAddDelegatee() public {
        vm.startPrank(deployer);

        // Register an app with one delegatee
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // Verify initial delegatee count
        VincentAppViewFacet.App memory app = wrappedAppViewFacet.getAppById(appId);
        assertEq(app.delegatees.length, 1, "Should have 1 delegatee initially");
        assertEq(app.delegatees[0], TEST_DELEGATEE_1, "Initial delegatee should match");

        // Create a new delegatee to add
        address newDelegatee = address(0xCAFE);

        // Expect the DelegateeAdded event
        vm.expectEmit(true, true, false, false);
        emit DelegateeAdded(appId, newDelegatee);

        // Add a new delegatee
        wrappedAppFacet.addDelegatee(appId, newDelegatee);

        // Verify delegatee was added
        app = wrappedAppViewFacet.getAppById(appId);
        assertEq(app.delegatees.length, 2, "Should have 2 delegatees after adding");

        // Verify both delegatees exist
        bool foundOriginalDelegatee = false;
        bool foundNewDelegatee = false;

        for (uint256 i = 0; i < app.delegatees.length; i++) {
            if (app.delegatees[i] == TEST_DELEGATEE_1) {
                foundOriginalDelegatee = true;
            } else if (app.delegatees[i] == newDelegatee) {
                foundNewDelegatee = true;
            }
        }

        assertTrue(foundOriginalDelegatee, "Original delegatee should still exist");
        assertTrue(foundNewDelegatee, "New delegatee should be added");

        vm.stopPrank();
    }

    /**
     * @notice Test adding a delegatee already registered to another app
     * @dev Verifies the DelegateeAlreadyRegisteredToApp error is thrown
     */
    function testAddDelegateeAlreadyRegistered() public {
        vm.startPrank(deployer);

        // Register first app with a delegatee
        (uint256 firstAppId, uint256 firstVersionNumber) = _registerTestApp();

        // Register a second app with a different delegatee
        address[] memory secondAppDelegatees = new address[](1);
        secondAppDelegatees[0] = TEST_DELEGATEE_2;

        (uint256 secondAppId, uint256 secondVersionNumber) = wrappedAppFacet.registerApp(
            bytes("Second App"),
            bytes("Second App Description"),
            testRedirectUris,
            secondAppDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicySchemaIpfsCids,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        // Try to add the delegatee from the first app to the second app
        vm.expectRevert(
            abi.encodeWithSignature("DelegateeAlreadyRegisteredToApp(uint256,address)", firstAppId, TEST_DELEGATEE_1)
        );

        wrappedAppFacet.addDelegatee(secondAppId, TEST_DELEGATEE_1);

        vm.stopPrank();
    }

    /**
     * @notice Test that only the app manager can add delegatees
     * @dev Verifies the NotAppManager error is thrown for non-managers
     */
    function testAddDelegateeNotAppManager() public {
        vm.startPrank(deployer);

        // Register an app
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        vm.stopPrank();

        // Switch to a different address (not the app manager)
        vm.startPrank(address(0xBEEF));

        // Expect the call to revert with NotAppManager error
        vm.expectRevert(abi.encodeWithSignature("NotAppManager(uint256,address)", appId, address(0xBEEF)));

        // Try to add a delegatee as non-manager
        wrappedAppFacet.addDelegatee(appId, address(0xCAFE));

        vm.stopPrank();
    }

    /**
     * @notice Test removing a delegatee from an app
     * @dev Verifies that delegatees can be removed by the app manager
     */
    function testRemoveDelegatee() public {
        vm.startPrank(deployer);

        // Register an app with two delegatees
        address[] memory twoDelegatees = new address[](2);
        twoDelegatees[0] = TEST_DELEGATEE_1;
        twoDelegatees[1] = TEST_DELEGATEE_2;

        (uint256 appId, uint256 versionNumber) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            twoDelegatees,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicySchemaIpfsCids,
            testToolPolicyParameterNames,
            testToolPolicyParameterTypes
        );

        // Verify initial delegatee count
        VincentAppViewFacet.App memory app = wrappedAppViewFacet.getAppById(appId);
        assertEq(app.delegatees.length, 2, "Should have 2 delegatees initially");

        // Expect the DelegateeRemoved event
        vm.expectEmit(true, true, false, false);
        emit DelegateeRemoved(appId, TEST_DELEGATEE_1);

        // Remove a delegatee
        wrappedAppFacet.removeDelegatee(appId, TEST_DELEGATEE_1);

        // Verify delegatee was removed
        app = wrappedAppViewFacet.getAppById(appId);
        assertEq(app.delegatees.length, 1, "Should have 1 delegatee after removal");

        // Verify the remaining delegatee is the correct one
        assertEq(app.delegatees[0], TEST_DELEGATEE_2, "The remaining delegatee should be the second one");

        // Verify the removed delegatee can now be added to another app
        bytes memory secondAppName = bytes("Second App");
        bytes memory secondAppDesc = bytes("Second App Description");

        address[] memory secondAppDelegatees = new address[](1);
        secondAppDelegatees[0] = TEST_DELEGATEE_1; // Use the previously removed delegatee

        // Should be able to register a new app with the removed delegatee
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

        // Verify the delegatee was added to the second app
        VincentAppViewFacet.App memory secondApp = wrappedAppViewFacet.getAppById(secondAppId);
        assertEq(secondApp.delegatees.length, 1, "Second app should have 1 delegatee");
        assertEq(secondApp.delegatees[0], TEST_DELEGATEE_1, "Second app delegatee should match");

        vm.stopPrank();
    }

    /**
     * @notice Test removing a delegatee not registered to the app
     * @dev Verifies the DelegateeNotRegisteredToApp error is thrown
     */
    function testRemoveDelegateeNotRegistered() public {
        vm.startPrank(deployer);

        // Register an app with one delegatee
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        // Try to remove a delegatee that's not registered to the app
        address nonRegisteredDelegatee = address(0xCAFE);

        vm.expectRevert(
            abi.encodeWithSignature("DelegateeNotRegisteredToApp(uint256,address)", appId, nonRegisteredDelegatee)
        );

        wrappedAppFacet.removeDelegatee(appId, nonRegisteredDelegatee);

        vm.stopPrank();
    }

    /**
     * @notice Test that only the app manager can remove delegatees
     * @dev Verifies the NotAppManager error is thrown for non-managers
     */
    function testRemoveDelegateeNotAppManager() public {
        vm.startPrank(deployer);

        // Register an app with one delegatee
        (uint256 appId, uint256 versionNumber) = _registerTestApp();

        vm.stopPrank();

        // Switch to a different address (not the app manager)
        vm.startPrank(address(0xBEEF));

        // Expect the call to revert with NotAppManager error
        vm.expectRevert(abi.encodeWithSignature("NotAppManager(uint256,address)", appId, address(0xBEEF)));

        // Try to remove a delegatee as non-manager
        wrappedAppFacet.removeDelegatee(appId, TEST_DELEGATEE_1);

        vm.stopPrank();
    }
}
