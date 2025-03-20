// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

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
            toolsAndPoliciesAfter[0].policies.length, 0, "Policies should be removed when all parameters are removed"
        );

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
}
