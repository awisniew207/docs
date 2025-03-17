// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../helpers/VincentTestHelper.sol";

/**
 * @title VincentToolFacetTest
 * @dev Tests for the VincentToolFacet and VincentToolViewFacet contracts
 */
contract VincentToolFacetTest is VincentTestHelper {
    // Test variables
    address public approvedToolsManager;

    function setUp() public override {
        // Call parent setup
        super.setUp();

        // Create a new address for the approved tools manager
        approvedToolsManager = makeAddr("approved-tools-manager");

        // Set up the test as the deployer
        vm.startPrank(deployer);
    }

    function testRegisterSingleTool() public {
        // Set up event expectation
        vm.expectEmit(true, false, false, false);
        emit NewToolRegistered(keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_1)));

        // Register a tool
        wrappedToolFacet.registerTool(TEST_TOOL_IPFS_CID_1);

        // Verify it was registered correctly
        string memory retrievedCid =
            wrappedToolViewFacet.getToolIpfsCidByHash(keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_1)));
        assertEq(retrievedCid, TEST_TOOL_IPFS_CID_1, "Retrieved tool IPFS CID doesn't match registered one");

        // Check all tools list
        string[] memory allTools = wrappedToolViewFacet.getAllRegisteredTools();
        assertEq(allTools.length, 1, "Should have exactly 1 tool registered");
        assertEq(allTools[0], TEST_TOOL_IPFS_CID_1, "Tool in list doesn't match registered one");
    }

    function testRegisterSameToolTwice() public {
        // Register the tool first time
        wrappedToolFacet.registerTool(TEST_TOOL_IPFS_CID_1);

        // When registering the same tool again, no event should be emitted
        // This verifies the duplicate prevention logic
        wrappedToolFacet.registerTool(TEST_TOOL_IPFS_CID_1);

        // Check all tools list - should still have only one entry
        string[] memory allTools = wrappedToolViewFacet.getAllRegisteredTools();
        assertEq(allTools.length, 1, "Should still have exactly 1 tool registered");
    }

    function testRegisterMultipleTools() public {
        // Set up string array for multiple tools
        string[] memory tools = new string[](2);
        tools[0] = TEST_TOOL_IPFS_CID_1;
        tools[1] = TEST_TOOL_IPFS_CID_2;

        // Register multiple tools at once
        wrappedToolFacet.registerTools(tools);

        // Verify they were registered correctly
        string memory retrievedCid1 =
            wrappedToolViewFacet.getToolIpfsCidByHash(keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_1)));
        string memory retrievedCid2 =
            wrappedToolViewFacet.getToolIpfsCidByHash(keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_2)));

        assertEq(retrievedCid1, TEST_TOOL_IPFS_CID_1, "Retrieved tool 1 IPFS CID doesn't match registered one");
        assertEq(retrievedCid2, TEST_TOOL_IPFS_CID_2, "Retrieved tool 2 IPFS CID doesn't match registered one");

        // Check all tools list
        string[] memory allTools = wrappedToolViewFacet.getAllRegisteredTools();
        assertEq(allTools.length, 2, "Should have exactly 2 tools registered");

        // Check the contents of allTools list (order might vary)
        bool foundTool1 = false;
        bool foundTool2 = false;

        for (uint256 i = 0; i < allTools.length; i++) {
            if (keccak256(abi.encodePacked(allTools[i])) == keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_1))) {
                foundTool1 = true;
            } else if (keccak256(abi.encodePacked(allTools[i])) == keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_2))) {
                foundTool2 = true;
            }
        }

        assertTrue(foundTool1, "Tool 1 not found in the list of all tools");
        assertTrue(foundTool2, "Tool 2 not found in the list of all tools");
    }

    function testRegisterDuplicateToolsInBatch() public {
        // Create array with duplicate entries
        string[] memory tools = new string[](3);
        tools[0] = TEST_TOOL_IPFS_CID_1;
        tools[1] = TEST_TOOL_IPFS_CID_2;
        tools[2] = TEST_TOOL_IPFS_CID_1; // Duplicate

        // Register tools
        wrappedToolFacet.registerTools(tools);

        // Check all tools list - should have 2 entries (no duplicates)
        string[] memory allTools = wrappedToolViewFacet.getAllRegisteredTools();
        assertEq(allTools.length, 2, "Should have exactly 2 tools registered (no duplicates)");
    }

    function testEmptyStringTool() public {
        // Register an empty string
        wrappedToolFacet.registerTool("");

        // Calculate the hash of empty string
        bytes32 emptyStringHash = keccak256(abi.encodePacked(""));

        // Verify it was registered correctly
        string memory retrievedCid = wrappedToolViewFacet.getToolIpfsCidByHash(emptyStringHash);
        assertEq(retrievedCid, "", "Empty string tool not registered correctly");
    }

    function testGetNonExistentTool() public {
        // Calculate a random hash
        bytes32 nonExistentHash = keccak256(abi.encodePacked("non-existent-tool"));

        // Trying to get a non-existent tool should return an empty string
        string memory retrievedCid = wrappedToolViewFacet.getToolIpfsCidByHash(nonExistentHash);
        assertEq(retrievedCid, "", "Non-existent tool should return empty string");
    }

    // Tests for the new approved tools functionality

    function testUpdateApprovedToolsManager() public {
        // Check the initial approved tools manager (should be the contract deployer)
        address initialManager = wrappedToolViewFacet.getApprovedToolsManager();
        assertEq(initialManager, deployer, "Initial approved tools manager should be the deployer");

        // Set up event expectation for updating the manager
        vm.expectEmit(true, true, false, false);
        emit ApprovedToolsManagerUpdated(deployer, approvedToolsManager);

        // Update the approved tools manager
        wrappedToolFacet.updateApprovedToolsManager(approvedToolsManager);

        // Verify the manager was updated
        address newManager = wrappedToolViewFacet.getApprovedToolsManager();
        assertEq(newManager, approvedToolsManager, "Approved tools manager should be updated");
    }

    function testFailUpdateApprovedToolsManagerToZeroAddress() public {
        // Try to update to zero address, should revert
        wrappedToolFacet.updateApprovedToolsManager(address(0));
    }

    function testFailUpdateApprovedToolsManagerAsNonOwner() public {
        // Stop being the deployer
        vm.stopPrank();

        // Start being a non-owner
        vm.startPrank(nonOwner);

        // Should revert when called by non-owner
        wrappedToolFacet.updateApprovedToolsManager(approvedToolsManager);
    }

    function testApproveToolsAsManager() public {
        // Register tools first
        wrappedToolFacet.registerTool(TEST_TOOL_IPFS_CID_1);
        wrappedToolFacet.registerTool(TEST_TOOL_IPFS_CID_2);

        // Set the approved tools manager (initially it's the deployer)
        wrappedToolFacet.updateApprovedToolsManager(approvedToolsManager);

        // Switch to the approved tools manager
        vm.stopPrank();
        vm.startPrank(approvedToolsManager);

        // Set up array with tools to approve
        string[] memory tools = new string[](2);
        tools[0] = TEST_TOOL_IPFS_CID_1;
        tools[1] = TEST_TOOL_IPFS_CID_2;

        // Set up event expectations for approving tools
        vm.expectEmit(true, false, false, false);
        emit ToolApproved(keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_1)));
        vm.expectEmit(true, false, false, false);
        emit ToolApproved(keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_2)));

        // Approve the tools
        wrappedToolFacet.approveTools(tools);

        // Verify the tools were approved
        string[] memory approvedTools = wrappedToolViewFacet.getAllApprovedTools();
        assertEq(approvedTools.length, 2, "Should have exactly 2 approved tools");

        // Check that the tools are in the approved list (order might vary)
        bool foundTool1 = false;
        bool foundTool2 = false;

        for (uint256 i = 0; i < approvedTools.length; i++) {
            if (keccak256(abi.encodePacked(approvedTools[i])) == keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_1))) {
                foundTool1 = true;
            } else if (
                keccak256(abi.encodePacked(approvedTools[i])) == keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_2))
            ) {
                foundTool2 = true;
            }
        }

        assertTrue(foundTool1, "Tool 1 not found in the list of approved tools");
        assertTrue(foundTool2, "Tool 2 not found in the list of approved tools");

        // Verify with isToolApproved function
        bool isApproved1 = wrappedToolViewFacet.isToolApproved(TEST_TOOL_IPFS_CID_1);
        bool isApproved2 = wrappedToolViewFacet.isToolApproved(TEST_TOOL_IPFS_CID_2);

        assertTrue(isApproved1, "Tool 1 should be approved");
        assertTrue(isApproved2, "Tool 2 should be approved");
    }

    function testFailApproveToolThatDoesNotExist() public {
        // Set the approved tools manager (initially it's the deployer)
        wrappedToolFacet.updateApprovedToolsManager(approvedToolsManager);

        // Switch to the approved tools manager
        vm.stopPrank();
        vm.startPrank(approvedToolsManager);

        // Set up array with a tool that doesn't exist
        string[] memory tools = new string[](1);
        tools[0] = "non-existent-tool";

        // Should revert when trying to approve a tool that isn't registered
        wrappedToolFacet.approveTools(tools);
    }

    function testFailApproveToolAsNonManager() public {
        // Register a tool
        wrappedToolFacet.registerTool(TEST_TOOL_IPFS_CID_1);

        // Set the approved tools manager to someone else
        wrappedToolFacet.updateApprovedToolsManager(approvedToolsManager);

        // Try to approve as the deployer (no longer the manager)
        string[] memory tools = new string[](1);
        tools[0] = TEST_TOOL_IPFS_CID_1;

        // Should revert when called by non-manager
        wrappedToolFacet.approveTools(tools);
    }

    function testRemoveToolApprovals() public {
        // Register tools first
        wrappedToolFacet.registerTool(TEST_TOOL_IPFS_CID_1);
        wrappedToolFacet.registerTool(TEST_TOOL_IPFS_CID_2);

        // Approve the tools (as the deployer, who is initially the manager)
        string[] memory tools = new string[](2);
        tools[0] = TEST_TOOL_IPFS_CID_1;
        tools[1] = TEST_TOOL_IPFS_CID_2;
        wrappedToolFacet.approveTools(tools);

        // Set up array with tools to remove
        string[] memory toolsToRemove = new string[](1);
        toolsToRemove[0] = TEST_TOOL_IPFS_CID_1;

        // Set up event expectation for removing approval
        vm.expectEmit(true, false, false, false);
        emit ToolApprovalRemoved(keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_1)));

        // Remove approval for one tool
        wrappedToolFacet.removeToolApprovals(toolsToRemove);

        // Verify the tool was removed from the approved list
        string[] memory approvedTools = wrappedToolViewFacet.getAllApprovedTools();
        assertEq(approvedTools.length, 1, "Should have exactly 1 approved tool left");
        assertEq(approvedTools[0], TEST_TOOL_IPFS_CID_2, "Remaining tool should be TEST_TOOL_IPFS_CID_2");

        // Verify with isToolApproved function
        bool isApproved1 = wrappedToolViewFacet.isToolApproved(TEST_TOOL_IPFS_CID_1);
        bool isApproved2 = wrappedToolViewFacet.isToolApproved(TEST_TOOL_IPFS_CID_2);

        assertFalse(isApproved1, "Tool 1 should no longer be approved");
        assertTrue(isApproved2, "Tool 2 should still be approved");
    }

    function testFailRemoveToolApprovalThatIsNotApproved() public {
        // Register a tool but don't approve it
        wrappedToolFacet.registerTool(TEST_TOOL_IPFS_CID_1);

        // Set up array with tools to remove
        string[] memory toolsToRemove = new string[](1);
        toolsToRemove[0] = TEST_TOOL_IPFS_CID_1;

        // Should revert when trying to remove approval for a tool that isn't approved
        wrappedToolFacet.removeToolApprovals(toolsToRemove);
    }

    function testFailRemoveToolApprovalAsNonManager() public {
        // Register and approve a tool
        wrappedToolFacet.registerTool(TEST_TOOL_IPFS_CID_1);
        string[] memory tools = new string[](1);
        tools[0] = TEST_TOOL_IPFS_CID_1;
        wrappedToolFacet.approveTools(tools);

        // Set the approved tools manager to someone else
        wrappedToolFacet.updateApprovedToolsManager(approvedToolsManager);

        // Try to remove approval as the deployer (no longer the manager)
        string[] memory toolsToRemove = new string[](1);
        toolsToRemove[0] = TEST_TOOL_IPFS_CID_1;

        // Should revert when called by non-manager
        wrappedToolFacet.removeToolApprovals(toolsToRemove);
    }
}
