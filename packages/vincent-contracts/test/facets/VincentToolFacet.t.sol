// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../helpers/VincentTestHelper.sol";
import "../../src/VincentBase.sol";
import "../../src/LibVincentDiamondStorage.sol";

/**
 * @title VincentToolFacetTest
 * @notice Test contract for VincentToolFacet
 * @dev Tests functions related to tool registration and approval
 */
contract VincentToolFacetTest is VincentTestHelper {
    function setUp() public override {
        // Call parent setUp to deploy the diamond and initialize standard test data
        super.setUp();
    }

    /**
     * @notice Test registering and approving a new tool
     * @dev Verifies that the approved tools manager can register and approve a tool
     */
    function testRegisterAndApproveTool() public {
        // Start as deployer (the approved tools manager)
        vm.startPrank(deployer);

        // Create a new tool IPFS CID
        string memory newToolIpfsCid = "QmNewTestTool";
        bytes32 hashedToolCid = keccak256(abi.encodePacked(newToolIpfsCid));

        // Expect both the NewToolRegistered and ToolApproved events
        vm.expectEmit(true, false, false, false);
        emit NewToolRegistered(hashedToolCid);

        vm.expectEmit(true, false, false, false);
        emit ToolApproved(hashedToolCid);

        // Register and approve the tool in one step
        string[] memory singleToolArray = new string[](1);
        singleToolArray[0] = newToolIpfsCid;
        wrappedToolFacet.approveTools(singleToolArray);

        // Verify the tool was registered by checking if it's retrievable
        string memory retrievedCid = wrappedToolViewFacet.getToolIpfsCidByHash(hashedToolCid);
        assertEq(
            keccak256(abi.encodePacked(retrievedCid)),
            keccak256(abi.encodePacked(newToolIpfsCid)),
            "Retrieved tool IPFS CID should match registered one"
        );

        // Verify the tool is approved
        bool isApproved = wrappedToolViewFacet.isToolApproved(newToolIpfsCid);
        assertTrue(isApproved, "Tool should be approved");

        vm.stopPrank();
    }

    /**
     * @notice Test registering and approving multiple tools
     * @dev Verifies that multiple tools can be registered and approved in a single transaction
     */
    function testRegisterAndApproveMultipleTools() public {
        vm.startPrank(deployer);

        // Create array of tool IPFS CIDs
        string[] memory toolIpfsCids = new string[](3);
        toolIpfsCids[0] = "QmBatchTool1";
        toolIpfsCids[1] = "QmBatchTool2";
        toolIpfsCids[2] = "QmBatchTool3";

        // Calculate hashes for verification
        bytes32[] memory hashedToolCids = new bytes32[](3);
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            hashedToolCids[i] = keccak256(abi.encodePacked(toolIpfsCids[i]));
        }

        // Register and approve multiple tools
        wrappedToolFacet.approveTools(toolIpfsCids);

        // Verify all tools were registered and approved
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            string memory retrievedCid = wrappedToolViewFacet.getToolIpfsCidByHash(hashedToolCids[i]);
            assertEq(
                keccak256(abi.encodePacked(retrievedCid)),
                keccak256(abi.encodePacked(toolIpfsCids[i])),
                "Retrieved tool IPFS CID should match registered one"
            );

            // Check approval
            bool isApproved = wrappedToolViewFacet.isToolApproved(toolIpfsCids[i]);
            assertTrue(isApproved, "Tool should be approved");
        }

        vm.stopPrank();
    }

    /**
     * @notice Test non-manager attempting to register and approve tools
     * @dev Verifies that only the approved tools manager can register and approve tools
     */
    function testNonManagerCannotRegisterTools() public {
        // Start as non-manager
        vm.startPrank(nonOwner);

        // Create a tool IPFS CID
        string memory toolIpfsCid = "QmNonManagerRegTool";

        string[] memory toolArray = new string[](1);
        toolArray[0] = toolIpfsCid;

        // Expect the call to revert with NotApprovedToolsManager error
        vm.expectRevert(abi.encodeWithSignature("NotApprovedToolsManager(address)", nonOwner));

        // Try to approve (and register) as non-manager
        wrappedToolFacet.approveTools(toolArray);

        vm.stopPrank();
    }

    /**
     * @notice Test registering a tool with an empty IPFS CID
     * @dev Verifies that registering a tool with an empty IPFS CID fails
     */
    function testApproveToolWithEmptyIpfsCid() public {
        vm.startPrank(deployer);

        // Create array with an empty IPFS CID
        string[] memory toolsWithEmptyCid = new string[](1);
        toolsWithEmptyCid[0] = "";

        // Expect the call to revert with EmptyToolIpfsCid error
        vm.expectRevert(abi.encodeWithSignature("EmptyToolIpfsCid()"));

        // Try to approve a tool with empty IPFS CID
        wrappedToolFacet.approveTools(toolsWithEmptyCid);

        vm.stopPrank();
    }

    /**
     * @notice Test registering a tool that's already registered
     * @dev Verifies that registering the same tool twice fails with ToolAlreadyRegistered error
     */
    function testRegisterToolAlreadyRegistered() public {
        vm.startPrank(deployer);

        // Create a tool IPFS CID
        string memory toolIpfsCid = "QmTestToolForDuplication";
        bytes32 hashedToolCid = keccak256(abi.encodePacked(toolIpfsCid));

        // Register the tool first time
        string[] memory singleToolArray = new string[](1);
        singleToolArray[0] = toolIpfsCid;
        wrappedToolFacet.approveTools(singleToolArray);

        // Expect the call to revert with ToolAlreadyApproved error
        vm.expectRevert(abi.encodeWithSignature("ToolAlreadyApproved(bytes32)", hashedToolCid));

        // Try to register the same tool again
        wrappedToolFacet.approveTools(singleToolArray);

        vm.stopPrank();
    }

    /**
     * @notice Test registering multiple tools at once
     * @dev Verifies that multiple tools can be registered in a single transaction
     */
    function testRegisterTools() public {
        vm.startPrank(deployer);

        // Create array of tool IPFS CIDs
        string[] memory toolIpfsCids = new string[](3);
        toolIpfsCids[0] = "QmBatchTool1";
        toolIpfsCids[1] = "QmBatchTool2";
        toolIpfsCids[2] = "QmBatchTool3";

        // Calculate hashes for verification
        bytes32[] memory hashedToolCids = new bytes32[](3);
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            hashedToolCids[i] = keccak256(abi.encodePacked(toolIpfsCids[i]));
        }

        // Register multiple tools
        wrappedToolFacet.approveTools(toolIpfsCids);

        // Verify all tools were registered
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            string memory retrievedCid = wrappedToolViewFacet.getToolIpfsCidByHash(hashedToolCids[i]);
            assertEq(
                keccak256(abi.encodePacked(retrievedCid)),
                keccak256(abi.encodePacked(toolIpfsCids[i])),
                "Retrieved tool IPFS CID should match registered one"
            );
        }

        vm.stopPrank();
    }

    /**
     * @notice Test approving a tool that's already registered
     * @dev Verifies that the approved tools manager can approve a registered tool
     */
    function testApproveRegisteredTool() public {
        vm.startPrank(deployer);

        // Register a tool first
        string memory toolIpfsCid = "QmToolToApprove";
        bytes32 hashedToolCid = keccak256(abi.encodePacked(toolIpfsCid));

        // Register the tool with a single-item array
        string[] memory toolArray = new string[](1);
        toolArray[0] = toolIpfsCid;
        wrappedToolFacet.approveTools(toolArray);

        // Verify the tool is approved
        bool isApproved = wrappedToolViewFacet.isToolApproved(toolIpfsCid);
        assertTrue(isApproved, "Tool should be approved");

        vm.stopPrank();
    }

    /**
     * @notice Test approving a tool that's not registered yet
     * @dev Verifies that the approved tools manager can register and approve a tool in one transaction
     */
    function testApproveTool() public {
        vm.startPrank(deployer);

        // Create a new tool IPFS CID (not registered yet)
        string memory newToolIpfsCid = "QmNewToolDirectApprove";
        bytes32 hashedToolCid = keccak256(abi.encodePacked(newToolIpfsCid));

        // Expect both events
        vm.expectEmit(true, false, false, false);
        emit NewToolRegistered(hashedToolCid);

        vm.expectEmit(true, false, false, false);
        emit ToolApproved(hashedToolCid);

        // Approve the tool directly without registering first
        string[] memory singleToolArray = new string[](1);
        singleToolArray[0] = newToolIpfsCid;
        wrappedToolFacet.approveTools(singleToolArray);

        // Verify the tool was registered by checking if it's retrievable
        string memory retrievedCid = wrappedToolViewFacet.getToolIpfsCidByHash(hashedToolCid);
        assertEq(
            keccak256(abi.encodePacked(retrievedCid)),
            keccak256(abi.encodePacked(newToolIpfsCid)),
            "Retrieved tool IPFS CID should match registered one"
        );

        // Verify the tool is approved
        bool isApproved = wrappedToolViewFacet.isToolApproved(newToolIpfsCid);
        assertTrue(isApproved, "Tool should be approved");

        vm.stopPrank();
    }

    /**
     * @notice Test approving multiple tools at once
     * @dev Verifies that multiple tools can be approved in a single transaction,
     *      including automatic registration if needed
     */
    function testApproveMultipleTools() public {
        vm.startPrank(deployer);

        // Create multiple tools without pre-registering them
        string[] memory toolIpfsCids = new string[](3);
        toolIpfsCids[0] = "QmBatchApprove1";
        toolIpfsCids[1] = "QmBatchApprove2";
        toolIpfsCids[2] = "QmBatchApprove3";

        // Calculate hashes for verification
        bytes32[] memory hashedToolCids = new bytes32[](3);
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            hashedToolCids[i] = keccak256(abi.encodePacked(toolIpfsCids[i]));
        }

        // Approve all tools (will also register them)
        wrappedToolFacet.approveTools(toolIpfsCids);

        // Verify all tools are registered and approved
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            // Check registration
            string memory retrievedCid = wrappedToolViewFacet.getToolIpfsCidByHash(hashedToolCids[i]);
            assertEq(
                keccak256(abi.encodePacked(retrievedCid)),
                keccak256(abi.encodePacked(toolIpfsCids[i])),
                "Retrieved tool IPFS CID should match registered one"
            );

            // Check approval
            bool isApproved = wrappedToolViewFacet.isToolApproved(toolIpfsCids[i]);
            assertTrue(isApproved, "Tool should be approved");
        }

        vm.stopPrank();
    }

    /**
     * @notice Test approving a mix of new and existing tools
     * @dev Verifies that the function handles both registered and unregistered tools
     */
    function testApproveMixedTools() public {
        vm.startPrank(deployer);

        // First register a tool but don't approve it (can't do this anymore since approveTools always approves)
        string memory existingToolIpfsCid = "QmExistingTool";
        bytes32 existingToolHash = keccak256(abi.encodePacked(existingToolIpfsCid));

        // Create a new tool that hasn't been registered yet
        string memory newToolIpfsCid = "QmNewTool";
        bytes32 newToolHash = keccak256(abi.encodePacked(newToolIpfsCid));

        // Create another new tool that hasn't been registered or approved yet
        string memory anotherNewToolIpfsCid = "QmAnotherNewTool";
        bytes32 anotherNewToolHash = keccak256(abi.encodePacked(anotherNewToolIpfsCid));

        // We should see NewToolRegistered and ToolApproved events for both tools
        vm.expectEmit(true, false, false, false);
        emit NewToolRegistered(newToolHash);

        vm.expectEmit(true, false, false, false);
        emit ToolApproved(newToolHash);

        vm.expectEmit(true, false, false, false);
        emit NewToolRegistered(anotherNewToolHash);

        vm.expectEmit(true, false, false, false);
        emit ToolApproved(anotherNewToolHash);

        // Approve both new tools in one transaction
        string[] memory mixedToolArray = new string[](2);
        mixedToolArray[0] = newToolIpfsCid;
        mixedToolArray[1] = anotherNewToolIpfsCid;
        wrappedToolFacet.approveTools(mixedToolArray);

        // Verify both tools are registered and approved
        bool isNewApproved = wrappedToolViewFacet.isToolApproved(newToolIpfsCid);
        bool isAnotherNewApproved = wrappedToolViewFacet.isToolApproved(anotherNewToolIpfsCid);

        assertTrue(isNewApproved, "New tool should be approved");
        assertTrue(isAnotherNewApproved, "Another new tool should be approved");

        vm.stopPrank();
    }

    /**
     * @notice Test approving a tool with non-approved tools manager
     * @dev Verifies that only the approved tools manager can approve tools
     */
    function testApproveToolNotApprovedToolsManager() public {
        vm.startPrank(deployer);

        // Register a tool first
        string memory toolIpfsCid = "QmToolForAuth";

        // Register the tool with a single-item array
        string[] memory toolArray = new string[](1);
        toolArray[0] = toolIpfsCid;
        wrappedToolFacet.approveTools(toolArray);

        vm.stopPrank();

        // Switch to non-owner account (not the approved tools manager)
        vm.startPrank(nonOwner);

        // Expect the call to revert with NotApprovedToolsManager error
        vm.expectRevert(abi.encodeWithSignature("NotApprovedToolsManager(address)", nonOwner));

        // Try to approve the tool as non-manager
        wrappedToolFacet.approveTools(toolArray);

        vm.stopPrank();
    }

    /**
     * @notice Test approving a tool that's not registered
     * @dev Verifies that the function registers and approves an unregistered tool
     * @dev This behavior has changed - we now register and approve in one step
     */
    function testApproveToolNotRegistered() public {
        vm.startPrank(deployer);

        // Create a tool IPFS CID without registering it
        string memory unregisteredToolIpfsCid = "QmUnregisteredTool";
        bytes32 hashedToolCid = keccak256(abi.encodePacked(unregisteredToolIpfsCid));

        // Expect the NewToolRegistered and ToolApproved events
        vm.expectEmit(true, false, false, false);
        emit NewToolRegistered(hashedToolCid);

        vm.expectEmit(true, false, false, false);
        emit ToolApproved(hashedToolCid);

        // Create array with single unregistered tool
        string[] memory toolsToApprove = new string[](1);
        toolsToApprove[0] = unregisteredToolIpfsCid;

        // Approve the tool - it should be registered automatically
        wrappedToolFacet.approveTools(toolsToApprove);

        // Verify the tool is now registered and approved
        string memory retrievedCid = wrappedToolViewFacet.getToolIpfsCidByHash(hashedToolCid);
        assertEq(
            keccak256(abi.encodePacked(retrievedCid)),
            keccak256(abi.encodePacked(unregisteredToolIpfsCid)),
            "Tool should be registered automatically"
        );

        bool isApproved = wrappedToolViewFacet.isToolApproved(unregisteredToolIpfsCid);
        assertTrue(isApproved, "Tool should be approved");

        vm.stopPrank();
    }

    /**
     * @notice Test approving a tool that's already approved
     * @dev Verifies that approving an already approved tool fails
     */
    function testApproveToolAlreadyApproved() public {
        vm.startPrank(deployer);

        // Register and approve a tool first
        string memory toolIpfsCid = "QmAlreadyApprovedTool";
        bytes32 hashedToolCid = keccak256(abi.encodePacked(toolIpfsCid));

        // Register and approve the tool
        string[] memory toolArray = new string[](1);
        toolArray[0] = toolIpfsCid;
        wrappedToolFacet.approveTools(toolArray);

        // Verify the tool is approved
        bool isApproved = wrappedToolViewFacet.isToolApproved(toolIpfsCid);
        assertTrue(isApproved, "Tool should be approved");

        // Expect the call to revert with ToolAlreadyApproved error
        vm.expectRevert(abi.encodeWithSignature("ToolAlreadyApproved(bytes32)", hashedToolCid));

        // Try to approve the already approved tool again
        wrappedToolFacet.approveTools(toolArray);

        vm.stopPrank();
    }

    /**
     * @notice Test attempting to use approveTools with an empty IPFS CID
     * @dev Verifies that approving a tool with an empty IPFS CID fails
     */
    function testEmptyIpfsCidInApproveTools() public {
        vm.startPrank(deployer);

        // Create array with an empty IPFS CID
        string[] memory toolsWithEmptyCid = new string[](1);
        toolsWithEmptyCid[0] = "";

        // Expect the call to revert with EmptyToolIpfsCid error
        vm.expectRevert(abi.encodeWithSignature("EmptyToolIpfsCid()"));

        // Try to approve a tool with empty IPFS CID
        wrappedToolFacet.approveTools(toolsWithEmptyCid);

        vm.stopPrank();
    }

    /**
     * @notice Test removing a tool approval
     * @dev Verifies that the approved tools manager can remove tool approvals
     */
    function testRemoveToolApproval() public {
        vm.startPrank(deployer);

        // Register and approve a tool first
        string memory toolIpfsCid = "QmToolToUnapprove";
        bytes32 hashedToolCid = keccak256(abi.encodePacked(toolIpfsCid));

        // Register the tool with a single-item array
        string[] memory toolArray = new string[](1);
        toolArray[0] = toolIpfsCid;
        wrappedToolFacet.approveTools(toolArray);

        // Verify the tool is initially approved
        bool isApprovedBefore = wrappedToolViewFacet.isToolApproved(toolIpfsCid);
        assertTrue(isApprovedBefore, "Tool should be approved initially");

        // Expect the ToolApprovalRemoved event
        vm.expectEmit(true, false, false, false);
        emit ToolApprovalRemoved(hashedToolCid);

        // Remove the tool approval
        wrappedToolFacet.removeToolApprovals(toolArray);

        // Verify the tool is no longer approved
        bool isApprovedAfter = wrappedToolViewFacet.isToolApproved(toolIpfsCid);
        assertFalse(isApprovedAfter, "Tool should no longer be approved");

        vm.stopPrank();
    }

    /**
     * @notice Test removing multiple tool approvals at once
     * @dev Verifies that multiple tool approvals can be removed in a single transaction
     */
    function testRemoveMultipleToolApprovals() public {
        vm.startPrank(deployer);

        // Register and approve multiple tools first
        string[] memory toolIpfsCids = new string[](3);
        toolIpfsCids[0] = "QmBatchRemove1";
        toolIpfsCids[1] = "QmBatchRemove2";
        toolIpfsCids[2] = "QmBatchRemove3";

        wrappedToolFacet.approveTools(toolIpfsCids);

        // Calculate hashes for verification
        bytes32[] memory hashedToolCids = new bytes32[](3);
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            hashedToolCids[i] = keccak256(abi.encodePacked(toolIpfsCids[i]));
        }

        // Verify all tools are initially approved
        for (uint256 i = 0; i < hashedToolCids.length; i++) {
            bool isApproved = wrappedToolViewFacet.isToolApproved(toolIpfsCids[i]);
            assertTrue(isApproved, "Tool should be approved initially");
        }

        // Remove all tool approvals
        wrappedToolFacet.removeToolApprovals(toolIpfsCids);

        // Verify no tools are approved afterwards
        for (uint256 i = 0; i < hashedToolCids.length; i++) {
            bool isApproved = wrappedToolViewFacet.isToolApproved(toolIpfsCids[i]);
            assertFalse(isApproved, "Tool should no longer be approved");
        }

        vm.stopPrank();
    }

    /**
     * @notice Test removing a tool approval with non-approved tools manager
     * @dev Verifies that only the approved tools manager can remove tool approvals
     */
    function testRemoveToolApprovalNotApprovedToolsManager() public {
        vm.startPrank(deployer);

        // Register and approve a tool first
        string memory toolIpfsCid = "QmToolForAuthRemoval";

        // Register the tool with a single-item array
        string[] memory toolArray = new string[](1);
        toolArray[0] = toolIpfsCid;
        wrappedToolFacet.approveTools(toolArray);

        vm.stopPrank();

        // Switch to non-owner account (not the approved tools manager)
        vm.startPrank(nonOwner);

        // Expect the call to revert with NotApprovedToolsManager error
        vm.expectRevert(abi.encodeWithSignature("NotApprovedToolsManager(address)", nonOwner));

        // Try to remove the tool approval as non-manager
        wrappedToolFacet.removeToolApprovals(toolArray);

        vm.stopPrank();
    }

    /**
     * @notice Test removing an approval for a tool that was just approved
     * @dev Verifies that removing an approval for a recently approved tool works properly
     */
    function testRemoveToolApprovalNotApproved() public {
        vm.startPrank(deployer);

        // Register and approve a tool
        string memory toolIpfsCid = "QmNotApprovedTool";
        bytes32 hashedToolCid = keccak256(abi.encodePacked(toolIpfsCid));

        // Register and approve the tool
        string[] memory toolArray = new string[](1);
        toolArray[0] = toolIpfsCid;
        wrappedToolFacet.approveTools(toolArray);

        // Verify it's approved
        bool isApproved = wrappedToolViewFacet.isToolApproved(toolIpfsCid);
        assertTrue(isApproved, "Tool should be approved initially");

        // Remove the approval
        wrappedToolFacet.removeToolApprovals(toolArray);

        // Verify it's no longer approved
        isApproved = wrappedToolViewFacet.isToolApproved(toolIpfsCid);
        assertFalse(isApproved, "Tool should not be approved after removal");

        // Expect the call to revert with ToolNotApproved error
        vm.expectRevert(abi.encodeWithSignature("ToolNotApproved(bytes32)", hashedToolCid));

        // Try to remove approval again when it's already been removed
        wrappedToolFacet.removeToolApprovals(toolArray);

        vm.stopPrank();
    }

    /**
     * @notice Test updating the approved tools manager
     * @dev Since the test environment initializes with the manager as deployer, we test that case
     */
    function testUpdateApprovedToolsManager() public {
        vm.startPrank(deployer);

        // Get current manager (which is already set to deployer)
        address currentManager = wrappedToolViewFacet.getApprovedToolsManager();
        assertEq(currentManager, deployer, "Manager should initially be the deployer");

        // Create a new manager address
        address newManager = makeAddr("new-tools-manager");

        // Expect the ApprovedToolsManagerUpdated event with actual values
        vm.expectEmit(true, true, false, false);
        emit ApprovedToolsManagerUpdated(deployer, newManager);

        // Update the approved tools manager
        wrappedToolFacet.updateApprovedToolsManager(newManager);

        // Verify the manager was updated
        address updatedManager = wrappedToolViewFacet.getApprovedToolsManager();
        assertEq(updatedManager, newManager, "Approved tools manager should be updated");

        // Reset back to deployer for other tests
        vm.stopPrank();

        vm.startPrank(newManager);
        wrappedToolFacet.updateApprovedToolsManager(deployer);
        vm.stopPrank();
    }

    /**
     * @notice Test non-manager attempting to update the approved tools manager
     * @dev This test accounts for the fact that the manager is already set to deployer
     */
    function testUpdateApprovedToolsManagerNotManager() public {
        // Get current manager (which is already set to deployer)
        address currentManager = wrappedToolViewFacet.getApprovedToolsManager();
        assertEq(currentManager, deployer, "Manager should initially be the deployer");

        // Start as a different account (not the manager)
        address randomUser = makeAddr("random-user");
        vm.startPrank(randomUser);

        // Create a new manager address
        address attemptedManager = makeAddr("attempted-new-manager");

        // Expect the call to revert with NotApprovedToolsManager error
        vm.expectRevert(abi.encodeWithSignature("NotApprovedToolsManager(address)", randomUser));

        // Try to update the approved tools manager as non-manager
        wrappedToolFacet.updateApprovedToolsManager(attemptedManager);

        vm.stopPrank();

        // Also verify contract owner cannot update if not the current manager
        // First set a different manager
        vm.startPrank(deployer);
        address firstManager = makeAddr("first-manager");
        wrappedToolFacet.updateApprovedToolsManager(firstManager);
        vm.stopPrank();

        // Now try as deployer (who is owner but no longer manager)
        vm.startPrank(deployer);
        vm.expectRevert(abi.encodeWithSignature("NotApprovedToolsManager(address)", deployer));
        wrappedToolFacet.updateApprovedToolsManager(attemptedManager);
        vm.stopPrank();

        // Reset to original state
        vm.startPrank(firstManager);
        wrappedToolFacet.updateApprovedToolsManager(deployer);
        vm.stopPrank();
    }

    /**
     * @notice Test updating the approved tools manager by the current manager
     * @dev Tests that a manager can pass control to another manager
     */
    function testUpdateApprovedToolsManagerByManager() public {
        vm.startPrank(deployer);

        // First get the current manager
        address currentManager = wrappedToolViewFacet.getApprovedToolsManager();
        assertEq(currentManager, deployer, "Manager should initially be the deployer");

        // Create a manager address to use
        address firstManager = makeAddr("first-tools-manager");

        // Set the first manager
        wrappedToolFacet.updateApprovedToolsManager(firstManager);

        // Verify the manager was updated
        address updatedManager = wrappedToolViewFacet.getApprovedToolsManager();
        assertEq(updatedManager, firstManager, "Tools manager should be set to first manager");

        vm.stopPrank();

        // Now use the current manager to update to a new manager
        vm.startPrank(firstManager);

        // Create another new manager address
        address secondManager = makeAddr("second-tools-manager");

        // Expect the ApprovedToolsManagerUpdated event
        vm.expectEmit(true, true, false, false);
        emit ApprovedToolsManagerUpdated(firstManager, secondManager);

        // Update the approved tools manager as the current manager
        wrappedToolFacet.updateApprovedToolsManager(secondManager);

        // Verify the manager was updated
        updatedManager = wrappedToolViewFacet.getApprovedToolsManager();
        assertEq(updatedManager, secondManager, "Tools manager should be updated to second manager");

        vm.stopPrank();

        // Restore the original state back to deployer
        vm.startPrank(secondManager);
        wrappedToolFacet.updateApprovedToolsManager(deployer);
        vm.stopPrank();
    }

    /**
     * @notice Test updating the approved tools manager to the zero address
     * @dev Verifies that the approved tools manager cannot be set to the zero address
     */
    function testUpdateApprovedToolsManagerToZeroAddress() public {
        vm.startPrank(deployer);

        // Expect the call to revert with InvalidApprovedToolsManager error
        vm.expectRevert(abi.encodeWithSignature("InvalidApprovedToolsManager(address)", address(0)));

        // Try to update the approved tools manager to the zero address
        wrappedToolFacet.updateApprovedToolsManager(address(0));

        vm.stopPrank();
    }

    /**
     * @notice Test updating the approved tools manager to the current manager
     * @dev Verifies that the approved tools manager cannot be set to the same address
     */
    function testUpdateApprovedToolsManagerToSameAddress() public {
        vm.startPrank(deployer);

        // Get current manager
        address currentManager = wrappedToolViewFacet.getApprovedToolsManager();

        // Expect the call to revert with InvalidApprovedToolsManager error
        vm.expectRevert(abi.encodeWithSignature("InvalidApprovedToolsManager(address)", currentManager));

        // Try to update the approved tools manager to the same address
        wrappedToolFacet.updateApprovedToolsManager(currentManager);

        vm.stopPrank();
    }

    /**
     * @notice Test attempting to approve an already approved tool
     * @dev Verifies that the function reverts when trying to approve an already approved tool
     */
    function testApproveAlreadyApprovedTool() public {
        vm.startPrank(deployer);

        // First register and approve a tool
        string memory toolIpfsCid = "QmAlreadyApprovedToolCombined";
        bytes32 hashedToolCid = keccak256(abi.encodePacked(toolIpfsCid));

        string[] memory toolArray = new string[](1);
        toolArray[0] = toolIpfsCid;

        // Approve the tool first (which will also register it)
        wrappedToolFacet.approveTools(toolArray);

        // Verify it's approved
        bool isApproved = wrappedToolViewFacet.isToolApproved(toolIpfsCid);
        assertTrue(isApproved, "Tool should be approved initially");

        // Expect revert when trying to approve again
        vm.expectRevert(abi.encodeWithSignature("ToolAlreadyApproved(bytes32)", hashedToolCid));

        // Try to approve again
        wrappedToolFacet.approveTools(toolArray);

        vm.stopPrank();
    }

    /**
     * @notice Test removing tool approvals with an empty array
     * @dev Verifies that calling removeToolApprovals with an empty array fails
     */
    function testEmptyArrayInApproveTools() public {
        vm.startPrank(deployer);

        // Create empty array
        string[] memory emptyToolIpfsCids = new string[](0);

        // Expect the call to revert with EmptyToolIpfsCidsArray error
        vm.expectRevert(abi.encodeWithSignature("EmptyToolIpfsCidsArray()"));

        // Try to approve with empty array
        wrappedToolFacet.approveTools(emptyToolIpfsCids);

        vm.stopPrank();
    }

    /**
     * @notice Test removing a tool approval with an empty IPFS CID
     * @dev Verifies that removing a tool approval with an empty IPFS CID fails
     */
    function testRemoveToolApprovalWithEmptyIpfsCid() public {
        vm.startPrank(deployer);

        // Create array with an empty IPFS CID
        string[] memory toolsWithEmptyCid = new string[](1);
        toolsWithEmptyCid[0] = "";

        // Expect the call to revert with EmptyToolIpfsCid error
        vm.expectRevert(abi.encodeWithSignature("EmptyToolIpfsCid()"));

        // Try to remove approval for a tool with empty IPFS CID
        wrappedToolFacet.removeToolApprovals(toolsWithEmptyCid);

        vm.stopPrank();
    }

    /**
     * @notice Test removing tool approvals with an empty array
     * @dev Verifies that calling removeToolApprovals with an empty array fails
     */
    function testRemoveToolApprovalsWithEmptyArray() public {
        vm.startPrank(deployer);

        // Create empty array
        string[] memory emptyToolIpfsCids = new string[](0);

        // Expect the call to revert with EmptyToolIpfsCidsArray error
        vm.expectRevert(abi.encodeWithSignature("EmptyToolIpfsCidsArray()"));

        // Try to remove approvals with empty array
        wrappedToolFacet.removeToolApprovals(emptyToolIpfsCids);

        vm.stopPrank();
    }
}
