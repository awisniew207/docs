// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../../helpers/VincentTestHelper.sol";
import "../../../src/VincentBase.sol";
import "../../../src/LibVincentDiamondStorage.sol";

/**
 * @title VincentUserFacetTest
 * @notice Test contract for VincentUserFacet and VincentUserViewFacet
 * @dev Tests functions related to user registration and management
 */
contract VincentUserFacetTest is VincentTestHelper {
    // App ID and version for tests
    uint256 appId;
    uint256 appVersion;

    // Tool hash for tests
    bytes32 toolHash;

    function setUp() public override {
        // Call parent setUp to deploy the diamond and initialize standard test data
        super.setUp();

        // Register a test app for user tests
        vm.startPrank(deployer);
        (appId, appVersion) = _registerTestApp();
        vm.stopPrank();

        // Calculate tool hash for tests
        toolHash = keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_1));
    }

    /**
     * @notice Test permitting an app version for a PKP
     * @dev Verifies that a PKP owner can permit an app version
     */
    function testPermitAppVersion() public {
        // Start as deployer (owner of TEST_PKP_TOKEN_ID_1)
        vm.startPrank(deployer);

        // Permit app version
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterValues
        );

        // Verify the app version was permitted
        uint256 permittedVersion = wrappedUserViewFacet.getPermittedAppVersionForPkp(TEST_PKP_TOKEN_ID_1, appId);
        assertEq(permittedVersion, appVersion, "App version should be permitted");

        vm.stopPrank();
    }

    /**
     * @notice Test permitting an app version for a PKP that the caller doesn't own
     * @dev Verifies that only the PKP owner can permit an app version
     */
    function testPermitAppVersionNotOwner() public {
        // Start as non-owner (not the owner of TEST_PKP_TOKEN_ID_1)
        vm.startPrank(nonOwner);

        // Expect the operation to revert
        vm.expectRevert(abi.encodeWithSelector(NotPkpOwner.selector, TEST_PKP_TOKEN_ID_1, nonOwner));

        // Try to permit app version
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterValues
        );

        vm.stopPrank();
    }

    /**
     * @notice Test permitting a non-existent app version
     * @dev Verifies that only valid app versions can be permitted
     */
    function testPermitNonExistentAppVersion() public {
        // Start as deployer (owner of TEST_PKP_TOKEN_ID_1)
        vm.startPrank(deployer);

        // Try to permit a non-existent app version
        uint256 invalidVersion = 999;

        // Expect the operation to revert
        vm.expectRevert(abi.encodeWithSelector(AppVersionNotRegistered.selector, appId, invalidVersion));

        // Try to permit invalid app version
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            invalidVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterValues
        );

        vm.stopPrank();
    }

    /**
     * @notice Test unpermitting an app version for a PKP
     * @dev Verifies that a PKP owner can unpermit a previously permitted app version
     */
    function testUnpermitAppVersion() public {
        // Start as deployer (owner of TEST_PKP_TOKEN_ID_1)
        vm.startPrank(deployer);

        // First permit app version
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterValues
        );

        // Then unpermit it
        wrappedUserFacet.unPermitAppVersion(TEST_PKP_TOKEN_ID_1, appId, appVersion);

        // Verify the app version was unpermitted
        uint256 permittedVersion = wrappedUserViewFacet.getPermittedAppVersionForPkp(TEST_PKP_TOKEN_ID_1, appId);
        assertEq(permittedVersion, 0, "App version should be unpermitted");

        vm.stopPrank();
    }

    /**
     * @notice Test unpermitting an app version for a PKP that the caller doesn't own
     * @dev Verifies that only the PKP owner can unpermit an app version
     */
    function testUnpermitAppVersionNotOwner() public {
        // Start as deployer to permit the app version first
        vm.startPrank(deployer);
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterValues
        );
        vm.stopPrank();

        // Switch to non-owner
        vm.startPrank(nonOwner);

        // Expect the operation to revert
        vm.expectRevert(abi.encodeWithSelector(NotPkpOwner.selector, TEST_PKP_TOKEN_ID_1, nonOwner));

        // Try to unpermit app version
        wrappedUserFacet.unPermitAppVersion(TEST_PKP_TOKEN_ID_1, appId, appVersion);

        vm.stopPrank();
    }

    /**
     * @notice Test removing a policy parameter
     * @dev Verifies that a PKP owner can remove a previously set policy parameter
     */
    function testRemovePolicyParameter() public {
        // Start as deployer (owner of TEST_PKP_TOKEN_ID_1)
        vm.startPrank(deployer);

        // First permit app version
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterValues
        );

        // Set multiple policy parameters first
        wrappedUserFacet.setToolPolicyParameters(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterValues
        );

        // Verify parameters were set
        VincentUserViewFacet.ToolWithPolicies[] memory toolsAndPoliciesBefore =
            wrappedUserViewFacet.getAllToolsAndPoliciesForApp(TEST_PKP_TOKEN_ID_1, appId);

        // Ensure we have parameters before removal
        assertGt(toolsAndPoliciesBefore.length, 0, "Should have tools with policies before removal");
        assertGt(toolsAndPoliciesBefore[0].policies.length, 0, "Should have policies before removal");
        assertGt(toolsAndPoliciesBefore[0].policies[0].parameters.length, 0, "Should have parameters before removal");

        // Then remove all parameters for the policy
        wrappedUserFacet.removeToolPolicyParameters(
            appId, TEST_PKP_TOKEN_ID_1, appVersion, testToolIpfsCids, testToolPolicies, testToolPolicyParameterNames
        );

        // Verify parameters were removed
        VincentUserViewFacet.ToolWithPolicies[] memory toolsAndPoliciesAfter =
            wrappedUserViewFacet.getAllToolsAndPoliciesForApp(TEST_PKP_TOKEN_ID_1, appId);

        // The tools should still exist, but policies should be removed when all parameters are removed
        assertGt(toolsAndPoliciesAfter.length, 0, "Should still have tools after parameter removal");
        assertEq(
            toolsAndPoliciesAfter[0].policies.length, 1, "Policies should remain even when all parameters are removed"
        );
        assertEq(toolsAndPoliciesAfter[0].policies[0].parameters.length, 0, "The policy should have no parameters");

        vm.stopPrank();
    }

    /**
     * @notice Test validateToolExecutionAndGetPolicies
     * @dev Verifies the tool execution validation with policies
     */
    function testValidateToolExecutionAndGetPolicies() public {
        // Start as deployer (owner of TEST_PKP_TOKEN_ID_1)
        vm.startPrank(deployer);

        // First permit app version
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterValues
        );

        // Validate tool execution for the delegatee
        VincentUserViewFacet.ToolExecutionValidation memory validation = wrappedUserViewFacet
            .validateToolExecutionAndGetPolicies(TEST_DELEGATEE_1, TEST_PKP_TOKEN_ID_1, TEST_TOOL_IPFS_CID_1);

        // Verify validation results
        assertTrue(validation.isPermitted, "Tool execution should be permitted");
        assertEq(validation.appId, appId, "App ID should match");
        assertEq(validation.appVersion, appVersion, "App version should match");
        assertEq(validation.policies.length, 1, "Should have one policy");

        vm.stopPrank();
    }

    /**
     * @notice Test validateToolExecutionAndGetPolicies with non-permitted tool
     * @dev Verifies that validation fails for non-permitted tools
     */
    function testValidateToolExecutionNonPermitted() public {
        // Start as deployer (owner of TEST_PKP_TOKEN_ID_1)
        vm.startPrank(deployer);

        // Do not permit app version - validation should fail

        // Validate tool execution for the delegatee
        VincentUserViewFacet.ToolExecutionValidation memory validation = wrappedUserViewFacet
            .validateToolExecutionAndGetPolicies(TEST_DELEGATEE_1, TEST_PKP_TOKEN_ID_1, TEST_TOOL_IPFS_CID_1);

        // Verify validation results - should not be permitted
        assertFalse(validation.isPermitted, "Tool execution should not be permitted");

        vm.stopPrank();
    }

    /**
     * @notice Test validateToolExecutionAndGetPolicies with unauthorized delegatee
     * @dev Verifies that validation fails for delegatees not authorized for the app
     */
    function testValidateToolExecutionUnauthorizedDelegatee() public {
        // Start as deployer (owner of TEST_PKP_TOKEN_ID_1)
        vm.startPrank(deployer);

        // First permit app version
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterValues
        );

        // Expect revert with DelegateeNotAssociatedWithApp error
        vm.expectRevert(abi.encodeWithSelector(DelegateeNotAssociatedWithApp.selector, TEST_DELEGATEE_2));

        // Validate tool execution with an unauthorized delegatee (TEST_DELEGATEE_2)
        wrappedUserViewFacet.validateToolExecutionAndGetPolicies(
            TEST_DELEGATEE_2, TEST_PKP_TOKEN_ID_1, TEST_TOOL_IPFS_CID_1
        );

        vm.stopPrank();
    }

    /**
     * @notice Test retrieving all registered agent PKPs for a user
     * @dev Verifies that getAllRegisteredAgentPkps returns the correct PKPs
     */
    function testGetAllRegisteredAgentPkps() public {
        // Start as deployer (owner of TEST_PKP_TOKEN_ID_1)
        vm.startPrank(deployer);

        // First permit app version to register the PKP as an agent
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterValues
        );

        // Get all registered agent PKPs for the deployer
        uint256[] memory pkps = wrappedUserViewFacet.getAllRegisteredAgentPkps(deployer);

        // Verify that the PKP is registered
        assertEq(pkps.length, 1, "Should have one registered PKP");
        assertEq(pkps[0], TEST_PKP_TOKEN_ID_1, "Registered PKP should match TEST_PKP_TOKEN_ID_1");

        vm.stopPrank();
    }

    /**
     * @notice Test retrieving all registered agent PKPs for a user with no PKPs
     * @dev Verifies that getAllRegisteredAgentPkps reverts when no PKPs are found
     */
    function testGetAllRegisteredAgentPkpsNoRegisteredPkps() public {
        // Expect revert with NoRegisteredPkpsFound error
        vm.expectRevert(abi.encodeWithSelector(NoRegisteredPkpsFound.selector, nonOwner));

        // Try to get registered PKPs for an address with no registrations
        wrappedUserViewFacet.getAllRegisteredAgentPkps(nonOwner);
    }

    /**
     * @notice Test retrieving all permitted app IDs for a PKP
     * @dev Verifies that getAllPermittedAppIdsForPkp returns the correct app IDs
     */
    function testGetAllPermittedAppIdsForPkp() public {
        // Start as deployer (owner of TEST_PKP_TOKEN_ID_1)
        vm.startPrank(deployer);

        // First permit app version
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterValues
        );

        // Get all permitted app IDs for the PKP
        uint256[] memory permittedAppIds = wrappedUserViewFacet.getAllPermittedAppIdsForPkp(TEST_PKP_TOKEN_ID_1);

        // Verify that the app ID is permitted
        assertEq(permittedAppIds.length, 1, "Should have one permitted app ID");
        assertEq(permittedAppIds[0], appId, "Permitted app ID should match the test app ID");

        vm.stopPrank();
    }

    /**
     * @notice Test retrieving all permitted app IDs for an invalid PKP
     * @dev Verifies that getAllPermittedAppIdsForPkp reverts with invalid input
     */
    function testGetAllPermittedAppIdsForPkpInvalidPkp() public {
        // Expect revert with InvalidPkpTokenId error
        vm.expectRevert(InvalidPkpTokenId.selector);

        // Try to get permitted app IDs for an invalid PKP (0)
        wrappedUserViewFacet.getAllPermittedAppIdsForPkp(0);
    }

    /**
     * @notice Test that setToolPolicyParameters reverts with EmptyToolIpfsCid when an empty tool IPFS CID is provided
     * @dev Verifies that empty tool IPFS CIDs are rejected
     */
    function testSetToolPolicyParametersEmptyToolIpfsCid() public {
        // Start as deployer (owner of TEST_PKP_TOKEN_ID_1)
        vm.startPrank(deployer);

        // First permit app version
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterValues
        );

        // Create arrays with an empty tool IPFS CID
        string[] memory toolIpfsCidsWithEmpty = new string[](1);
        toolIpfsCidsWithEmpty[0] = ""; // Empty tool IPFS CID

        // Create matching arrays for policies and parameters
        string[][] memory testPolicies = new string[][](1);
        testPolicies[0] = new string[](1);
        testPolicies[0][0] = TEST_POLICY_1;

        string[][][] memory testParamNames = new string[][][](1);
        testParamNames[0] = new string[][](1);
        testParamNames[0][0] = new string[](1);
        testParamNames[0][0][0] = TEST_POLICY_PARAM_1;

        bytes[][][] memory testParamValues = new bytes[][][](1);
        testParamValues[0] = new bytes[][](1);
        testParamValues[0][0] = new bytes[](1);
        testParamValues[0][0][0] = abi.encode(TEST_POLICY_PARAM_STRING_VALUE);

        // Expect revert with EmptyToolIpfsCid error
        vm.expectRevert(EmptyToolIpfsCid.selector);

        // Try to set tool policy parameters with empty tool IPFS CID
        wrappedUserFacet.setToolPolicyParameters(
            TEST_PKP_TOKEN_ID_1, appId, appVersion, toolIpfsCidsWithEmpty, testPolicies, testParamNames, testParamValues
        );

        vm.stopPrank();
    }

    /**
     * @notice Test that setToolPolicyParameters reverts with EmptyPolicyIpfsCid when an empty policy IPFS CID is provided
     * @dev Verifies that empty policy IPFS CIDs are rejected
     */
    function testSetToolPolicyParametersEmptyPolicyIpfsCid() public {
        // Start as deployer (owner of TEST_PKP_TOKEN_ID_1)
        vm.startPrank(deployer);

        // First permit app version
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterValues
        );

        // Create arrays with valid tool but empty policy IPFS CID
        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;

        string[][] memory policiesWithEmpty = new string[][](1);
        policiesWithEmpty[0] = new string[](1);
        policiesWithEmpty[0][0] = ""; // Empty policy IPFS CID

        string[][][] memory testParamNames = new string[][][](1);
        testParamNames[0] = new string[][](1);
        testParamNames[0][0] = new string[](1);
        testParamNames[0][0][0] = TEST_POLICY_PARAM_1;

        bytes[][][] memory testParamValues = new bytes[][][](1);
        testParamValues[0] = new bytes[][](1);
        testParamValues[0][0] = new bytes[](1);
        testParamValues[0][0][0] = abi.encode(TEST_POLICY_PARAM_STRING_VALUE);

        // Expect revert with EmptyPolicyIpfsCid error
        vm.expectRevert(EmptyPolicyIpfsCid.selector);

        // Try to set tool policy parameters with empty policy IPFS CID
        wrappedUserFacet.setToolPolicyParameters(
            TEST_PKP_TOKEN_ID_1, appId, appVersion, toolIpfsCids, policiesWithEmpty, testParamNames, testParamValues
        );

        vm.stopPrank();
    }

    /**
     * @notice Test that setToolPolicyParameters reverts with EmptyParameterName when an empty parameter name is provided
     * @dev Verifies that empty parameter names are rejected
     */
    function testSetToolPolicyParametersEmptyParameterName() public {
        // Start as deployer (owner of TEST_PKP_TOKEN_ID_1)
        vm.startPrank(deployer);

        // First permit app version
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterValues
        );

        // Create arrays with valid tool and policy but empty parameter name
        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;

        string[][] memory policies = new string[][](1);
        policies[0] = new string[](1);
        policies[0][0] = TEST_POLICY_1;

        string[][][] memory paramNamesWithEmpty = new string[][][](1);
        paramNamesWithEmpty[0] = new string[][](1);
        paramNamesWithEmpty[0][0] = new string[](1);
        paramNamesWithEmpty[0][0][0] = ""; // Empty parameter name

        bytes[][][] memory testParamValues = new bytes[][][](1);
        testParamValues[0] = new bytes[][](1);
        testParamValues[0][0] = new bytes[](1);
        testParamValues[0][0][0] = abi.encode(TEST_POLICY_PARAM_STRING_VALUE);

        // Expect revert with EmptyParameterName error
        vm.expectRevert(EmptyParameterName.selector);

        // Try to set tool policy parameters with empty parameter name
        wrappedUserFacet.setToolPolicyParameters(
            TEST_PKP_TOKEN_ID_1, appId, appVersion, toolIpfsCids, policies, paramNamesWithEmpty, testParamValues
        );

        vm.stopPrank();
    }

    /**
     * @notice Test that removeToolPolicyParameters reverts with EmptyToolIpfsCid when an empty tool IPFS CID is provided
     * @dev Verifies that empty tool IPFS CIDs are rejected in removal
     */
    function testRemoveToolPolicyParametersEmptyToolIpfsCid() public {
        // Start as deployer (owner of TEST_PKP_TOKEN_ID_1)
        vm.startPrank(deployer);

        // First permit app version
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterValues
        );

        // Create arrays with an empty tool IPFS CID
        string[] memory toolIpfsCidsWithEmpty = new string[](1);
        toolIpfsCidsWithEmpty[0] = ""; // Empty tool IPFS CID

        // Create matching arrays for policies and parameters
        string[][] memory testPolicies = new string[][](1);
        testPolicies[0] = new string[](1);
        testPolicies[0][0] = TEST_POLICY_1;

        string[][][] memory testParamNames = new string[][][](1);
        testParamNames[0] = new string[][](1);
        testParamNames[0][0] = new string[](1);
        testParamNames[0][0][0] = TEST_POLICY_PARAM_1;

        // Expect revert with EmptyToolIpfsCid error
        vm.expectRevert(EmptyToolIpfsCid.selector);

        // Try to remove tool policy parameters with empty tool IPFS CID
        wrappedUserFacet.removeToolPolicyParameters(
            appId, TEST_PKP_TOKEN_ID_1, appVersion, toolIpfsCidsWithEmpty, testPolicies, testParamNames
        );

        vm.stopPrank();
    }

    /**
     * @notice Test that removeToolPolicyParameters reverts with EmptyPolicyIpfsCid when an empty policy IPFS CID is provided
     * @dev Verifies that empty policy IPFS CIDs are rejected in removal
     */
    function testRemoveToolPolicyParametersEmptyPolicyIpfsCid() public {
        // Start as deployer (owner of TEST_PKP_TOKEN_ID_1)
        vm.startPrank(deployer);

        // First permit app version
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterValues
        );

        // Create arrays with valid tool but empty policy IPFS CID
        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;

        string[][] memory policiesWithEmpty = new string[][](1);
        policiesWithEmpty[0] = new string[](1);
        policiesWithEmpty[0][0] = ""; // Empty policy IPFS CID

        string[][][] memory testParamNames = new string[][][](1);
        testParamNames[0] = new string[][](1);
        testParamNames[0][0] = new string[](1);
        testParamNames[0][0][0] = TEST_POLICY_PARAM_1;

        // Expect revert with EmptyPolicyIpfsCid error
        vm.expectRevert(EmptyPolicyIpfsCid.selector);

        // Try to remove tool policy parameters with empty policy IPFS CID
        wrappedUserFacet.removeToolPolicyParameters(
            appId, TEST_PKP_TOKEN_ID_1, appVersion, toolIpfsCids, policiesWithEmpty, testParamNames
        );

        vm.stopPrank();
    }

    /**
     * @notice Test that removeToolPolicyParameters reverts with EmptyParameterName when an empty parameter name is provided
     * @dev Verifies that empty parameter names are rejected in removal
     */
    function testRemoveToolPolicyParametersEmptyParameterName() public {
        // Start as deployer (owner of TEST_PKP_TOKEN_ID_1)
        vm.startPrank(deployer);

        // First permit app version
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            testToolIpfsCids,
            testToolPolicies,
            testToolPolicyParameterNames,
            testToolPolicyParameterValues
        );

        // Create arrays with valid tool and policy but empty parameter name
        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;

        string[][] memory policies = new string[][](1);
        policies[0] = new string[](1);
        policies[0][0] = TEST_POLICY_1;

        string[][][] memory paramNamesWithEmpty = new string[][][](1);
        paramNamesWithEmpty[0] = new string[][](1);
        paramNamesWithEmpty[0][0] = new string[](1);
        paramNamesWithEmpty[0][0][0] = ""; // Empty parameter name

        // Expect revert with EmptyParameterName error
        vm.expectRevert(EmptyParameterName.selector);

        // Try to remove tool policy parameters with empty parameter name
        wrappedUserFacet.removeToolPolicyParameters(
            appId, TEST_PKP_TOKEN_ID_1, appVersion, toolIpfsCids, policies, paramNamesWithEmpty
        );

        vm.stopPrank();
    }

    /**
     * @notice Test to demonstrate bug where policy parameters from previous app versions are incorrectly included
     * @dev This test shows that when a user permits a new app version, policy parameters from previous versions
     *      are incorrectly included in the validateToolExecutionAndGetPolicies response
     */
    function testBugPolicyParametersFromPreviousVersions() public {
        vm.startPrank(deployer);

        // Create test data for first app version
        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;

        string[][] memory toolPolicies = new string[][](1);
        toolPolicies[0] = new string[](1);
        toolPolicies[0][0] = TEST_POLICY_1;

        string[][][] memory toolPolicyParameterNames = new string[][][](1);
        toolPolicyParameterNames[0] = new string[][](1);
        toolPolicyParameterNames[0][0] = new string[](1);
        toolPolicyParameterNames[0][0][0] = "param1";

        VincentAppStorage.ParameterType[][][] memory toolPolicyParameterTypes =
            new VincentAppStorage.ParameterType[][][](1);
        toolPolicyParameterTypes[0] = new VincentAppStorage.ParameterType[][](1);
        toolPolicyParameterTypes[0][0] = new VincentAppStorage.ParameterType[](1);
        toolPolicyParameterTypes[0][0][0] = VincentAppStorage.ParameterType.UINT256;

        // Create array with a different delegatee for the new app
        address[] memory newAppDelegatees = new address[](1);
        newAppDelegatees[0] = TEST_DELEGATEE_2;

        // Register first app version
        (uint256 testAppId, uint256 versionNumber) = _registerAppLegacy(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            newAppDelegatees,
            toolIpfsCids,
            toolPolicies,
            toolPolicyParameterNames,
            toolPolicyParameterTypes
        );

        // Set policy parameters for first version
        bytes[][][] memory policyParameterValues = new bytes[][][](1);
        policyParameterValues[0] = new bytes[][](1);
        policyParameterValues[0][0] = new bytes[](1);
        policyParameterValues[0][0][0] = abi.encode(uint256(100));

        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            testAppId,
            versionNumber,
            toolIpfsCids,
            toolPolicies,
            toolPolicyParameterNames,
            policyParameterValues
        );

        // Create test data for second app version with different policy
        string[] memory toolIpfsCids2 = new string[](1);
        toolIpfsCids2[0] = TEST_TOOL_IPFS_CID_1;

        string[][] memory toolPolicies2 = new string[][](1);
        toolPolicies2[0] = new string[](1);
        toolPolicies2[0][0] = TEST_POLICY_2;

        string[][][] memory toolPolicyParameterNames2 = new string[][][](1);
        toolPolicyParameterNames2[0] = new string[][](1);
        toolPolicyParameterNames2[0][0] = new string[](1);
        toolPolicyParameterNames2[0][0][0] = "param2";

        VincentAppStorage.ParameterType[][][] memory toolPolicyParameterTypes2 =
            new VincentAppStorage.ParameterType[][][](1);
        toolPolicyParameterTypes2[0] = new VincentAppStorage.ParameterType[][](1);
        toolPolicyParameterTypes2[0][0] = new VincentAppStorage.ParameterType[](1);
        toolPolicyParameterTypes2[0][0][0] = VincentAppStorage.ParameterType.STRING;

        // Register second app version
        uint256 versionNumber2 = _registerNextAppVersionLegacy(
            testAppId, toolIpfsCids2, toolPolicies2, toolPolicyParameterNames2, toolPolicyParameterTypes2
        );

        // Set policy parameters for second version
        bytes[][][] memory policyParameterValues2 = new bytes[][][](1);
        policyParameterValues2[0] = new bytes[][](1);
        policyParameterValues2[0][0] = new bytes[](1);
        policyParameterValues2[0][0][0] = abi.encode("test");

        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            testAppId,
            versionNumber2,
            toolIpfsCids2,
            toolPolicies2,
            toolPolicyParameterNames2,
            policyParameterValues2
        );

        // Validate tool execution for second version
        VincentUserViewFacet.ToolExecutionValidation memory result = wrappedUserViewFacet
            .validateToolExecutionAndGetPolicies(TEST_DELEGATEE_2, TEST_PKP_TOKEN_ID_1, TEST_TOOL_IPFS_CID_1);

        // Verify that only the second version's policy is included
        assertEq(result.policies.length, 1, "Should only have one policy");
        assertEq(result.policies[0].policyIpfsCid, TEST_POLICY_2, "Should have correct policy IPFS CID");
        assertEq(result.policies[0].parameters.length, 1, "Should have one parameter");
        assertEq(result.policies[0].parameters[0].name, "param2", "Should have correct parameter name");
        assertEq(
            uint256(result.policies[0].parameters[0].paramType),
            uint256(VincentAppStorage.ParameterType.STRING),
            "Should have correct parameter type"
        );
        assertEq(
            keccak256(result.policies[0].parameters[0].value),
            keccak256(abi.encode("test")),
            "Should have correct parameter value"
        );

        vm.stopPrank();
    }

    /**
     * @notice Test validateToolExecutionAndGetPolicies returns policies with no parameters
     * @dev Verifies that policies without parameters are included in the validation results
     */
    function testValidateToolExecutionWithPolicyNoParameters() public {
        // Start as deployer for app registration
        vm.startPrank(deployer);

        // Register a new app version with a tool having a policy with no parameters
        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;

        string[][] memory policyIpfsCids = new string[][](1);
        policyIpfsCids[0] = new string[](2); // Two policies: one with parameters, one without
        policyIpfsCids[0][0] = TEST_POLICY_1;
        policyIpfsCids[0][1] = TEST_POLICY_2; // This policy will have no parameters

        string[][][] memory policyParameterNames = new string[][][](1);
        policyParameterNames[0] = new string[][](2);
        policyParameterNames[0][0] = new string[](1); // First policy has a parameter
        policyParameterNames[0][0][0] = TEST_POLICY_PARAM_1;
        policyParameterNames[0][1] = new string[](0); // Second policy has no parameters

        VincentAppStorage.ParameterType[][][] memory policyParameterTypes = new VincentAppStorage.ParameterType[][][](1);
        policyParameterTypes[0] = new VincentAppStorage.ParameterType[][](2);
        policyParameterTypes[0][0] = new VincentAppStorage.ParameterType[](1);
        policyParameterTypes[0][0][0] = VincentAppStorage.ParameterType.STRING;
        policyParameterTypes[0][1] = new VincentAppStorage.ParameterType[](0); // No parameters for second policy

        // Create array with a different delegatee for the new app
        address[] memory newAppDelegatees = new address[](1);
        newAppDelegatees[0] = TEST_DELEGATEE_2;

        // Register the new app with policy having no parameters
        (uint256 noParamAppId, uint256 noParamAppVersion) = _registerAppLegacy(
            "App With No Param Policy",
            "Test app with a policy having no parameters",
            testRedirectUris,
            newAppDelegatees,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterNames,
            policyParameterTypes
        );

        // Prepare parameter values for permit (only for the first policy)
        string[][][] memory permitPolicyParamNames = new string[][][](1);
        permitPolicyParamNames[0] = new string[][](2);
        permitPolicyParamNames[0][0] = new string[](1);
        permitPolicyParamNames[0][0][0] = TEST_POLICY_PARAM_1;
        permitPolicyParamNames[0][1] = new string[](0); // No parameters for second policy

        bytes[][][] memory permitPolicyParamValues = new bytes[][][](1);
        permitPolicyParamValues[0] = new bytes[][](2);
        permitPolicyParamValues[0][0] = new bytes[](1);
        permitPolicyParamValues[0][0][0] = bytes(TEST_POLICY_PARAM_STRING_VALUE);
        permitPolicyParamValues[0][1] = new bytes[](0); // No parameter values for second policy

        // Permit the app version
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            noParamAppId,
            noParamAppVersion,
            toolIpfsCids,
            policyIpfsCids,
            permitPolicyParamNames,
            permitPolicyParamValues
        );

        // Validate tool execution
        VincentUserViewFacet.ToolExecutionValidation memory validation = wrappedUserViewFacet
            .validateToolExecutionAndGetPolicies(TEST_DELEGATEE_2, TEST_PKP_TOKEN_ID_1, TEST_TOOL_IPFS_CID_1);

        // Verify that both policies are included in the result
        assertEq(validation.isPermitted, true, "Tool execution should be permitted");
        assertEq(validation.appId, noParamAppId, "App ID should match");
        assertEq(validation.appVersion, noParamAppVersion, "App version should match");

        // There should be two policies returned: one with parameters and one without
        assertEq(validation.policies.length, 2, "Should return two policies (one with parameters, one without)");

        // Verify the policy with parameters
        assertEq(validation.policies[0].policyIpfsCid, TEST_POLICY_1, "First policy should be TEST_POLICY_1");
        assertEq(validation.policies[0].parameters.length, 1, "First policy should have 1 parameter");

        // Verify the policy without parameters
        assertEq(validation.policies[1].policyIpfsCid, TEST_POLICY_2, "Second policy should be TEST_POLICY_2");
        assertEq(validation.policies[1].parameters.length, 0, "Second policy should have 0 parameters");

        vm.stopPrank();
    }

    /**
     * @notice Test getAllToolsAndPoliciesForApp returns policies with no parameters
     * @dev Verifies that policies without parameters are included when getting all tools and policies
     */
    function testGetAllToolsAndPoliciesWithPolicyNoParameters() public {
        // Start as deployer for app registration
        vm.startPrank(deployer);

        // Register a new app version with a tool having a policy with no parameters
        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;

        string[][] memory policyIpfsCids = new string[][](1);
        policyIpfsCids[0] = new string[](2); // Two policies: one with parameters, one without
        policyIpfsCids[0][0] = TEST_POLICY_1;
        policyIpfsCids[0][1] = TEST_POLICY_2; // This policy will have no parameters

        string[][][] memory policyParameterNames = new string[][][](1);
        policyParameterNames[0] = new string[][](2);
        policyParameterNames[0][0] = new string[](1); // First policy has a parameter
        policyParameterNames[0][0][0] = TEST_POLICY_PARAM_1;
        policyParameterNames[0][1] = new string[](0); // Second policy has no parameters

        VincentAppStorage.ParameterType[][][] memory policyParameterTypes = new VincentAppStorage.ParameterType[][][](1);
        policyParameterTypes[0] = new VincentAppStorage.ParameterType[][](2);
        policyParameterTypes[0][0] = new VincentAppStorage.ParameterType[](1);
        policyParameterTypes[0][0][0] = VincentAppStorage.ParameterType.STRING;
        policyParameterTypes[0][1] = new VincentAppStorage.ParameterType[](0); // No parameters for second policy

        // Create array with a different delegatee for the new app
        address[] memory newAppDelegatees = new address[](1);
        newAppDelegatees[0] = TEST_DELEGATEE_2;

        // Register the new app with policy having no parameters
        (uint256 noParamAppId, uint256 noParamAppVersion) = _registerAppLegacy(
            "App With No Param Policy 2",
            "Test app with a policy having no parameters",
            testRedirectUris,
            newAppDelegatees,
            toolIpfsCids,
            policyIpfsCids,
            policyParameterNames,
            policyParameterTypes
        );

        // Prepare parameter values for permit (only for the first policy)
        string[][][] memory permitPolicyParamNames = new string[][][](1);
        permitPolicyParamNames[0] = new string[][](2);
        permitPolicyParamNames[0][0] = new string[](1);
        permitPolicyParamNames[0][0][0] = TEST_POLICY_PARAM_1;
        permitPolicyParamNames[0][1] = new string[](0); // No parameters for second policy

        bytes[][][] memory permitPolicyParamValues = new bytes[][][](1);
        permitPolicyParamValues[0] = new bytes[][](2);
        permitPolicyParamValues[0][0] = new bytes[](1);
        permitPolicyParamValues[0][0][0] = bytes(TEST_POLICY_PARAM_STRING_VALUE);
        permitPolicyParamValues[0][1] = new bytes[](0); // No parameter values for second policy

        // Permit the app version
        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            noParamAppId,
            noParamAppVersion,
            toolIpfsCids,
            policyIpfsCids,
            permitPolicyParamNames,
            permitPolicyParamValues
        );

        // Get all tools and policies
        VincentUserViewFacet.ToolWithPolicies[] memory tools =
            wrappedUserViewFacet.getAllToolsAndPoliciesForApp(TEST_PKP_TOKEN_ID_1, noParamAppId);

        // Verify the results
        assertEq(tools.length, 1, "Should have one tool");
        assertEq(tools[0].toolIpfsCid, TEST_TOOL_IPFS_CID_1, "Tool should be TEST_TOOL_IPFS_CID_1");

        // There should be two policies returned: one with parameters and one without
        assertEq(tools[0].policies.length, 2, "Should return two policies (one with parameters, one without)");

        // Verify the policy with parameters
        assertEq(tools[0].policies[0].policyIpfsCid, TEST_POLICY_1, "First policy should be TEST_POLICY_1");
        assertEq(tools[0].policies[0].parameters.length, 1, "First policy should have 1 parameter");

        // Verify the policy without parameters
        assertEq(tools[0].policies[1].policyIpfsCid, TEST_POLICY_2, "Second policy should be TEST_POLICY_2");
        assertEq(tools[0].policies[1].parameters.length, 0, "Second policy should have 0 parameters");

        vm.stopPrank();
    }
}
