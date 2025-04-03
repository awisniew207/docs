// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../../helpers/VincentTestHelper.sol";
import "../../../src/VincentBase.sol";
import "../../../src/LibVincentDiamondStorage.sol";
import "../../../src/libs/LibVincentAppFacet.sol";

/**
 * @title VincentAppFacetTestUpdateApp
 * @notice Test contract for VincentAppFacet update methods
 * @dev Tests functions related to updating app information
 */
contract VincentAppFacetTestUpdateApp is VincentTestHelper {
    // App ID for tests
    uint256 appId;

    function setUp() public override {
        // Call parent setUp to deploy the diamond and initialize standard test data
        super.setUp();

        // Register a test app for update tests
        vm.startPrank(deployer);
        (appId,) = _registerTestApp();
        vm.stopPrank();
    }

    /**
     * @notice Test updating app name
     * @dev Verifies that app manager can update app name
     */
    function testUpdateAppName() public {
        vm.startPrank(deployer);

        string memory newName = "Updated Test App";

        // Expect the AppNameUpdated event
        vm.expectEmit(true, false, false, false);
        emit LibVincentAppFacet.AppNameUpdated(appId, newName);

        // Update app name
        wrappedAppFacet.updateAppName(appId, newName);

        // Verify app name was updated
        VincentAppViewFacet.App memory app = wrappedAppViewFacet.getAppById(appId);
        assertEq(
            keccak256(abi.encodePacked(app.name)), keccak256(abi.encodePacked(newName)), "App name should be updated"
        );

        vm.stopPrank();
    }

    /**
     * @notice Test updating app description
     * @dev Verifies that app manager can update app description
     */
    function testUpdateAppDescription() public {
        vm.startPrank(deployer);

        string memory newDescription = "Updated test app description";

        // Expect the AppDescriptionUpdated event
        vm.expectEmit(true, false, false, false);
        emit LibVincentAppFacet.AppDescriptionUpdated(appId, newDescription);

        // Update app description
        wrappedAppFacet.updateAppDescription(appId, newDescription);

        // Verify app description was updated
        VincentAppViewFacet.App memory app = wrappedAppViewFacet.getAppById(appId);
        assertEq(
            keccak256(abi.encodePacked(app.description)),
            keccak256(abi.encodePacked(newDescription)),
            "App description should be updated"
        );

        vm.stopPrank();
    }

    /**
     * @notice Test updating app deployment status
     * @dev Verifies that app manager can update app deployment status
     */
    function testUpdateAppDeploymentStatus() public {
        vm.startPrank(deployer);

        VincentAppStorage.DeploymentStatus newStatus = VincentAppStorage.DeploymentStatus.PROD;

        // Expect the AppDeploymentStatusUpdated event
        vm.expectEmit(true, false, false, false);
        emit AppDeploymentStatusUpdated(appId, uint8(newStatus));

        // Update app deployment status
        wrappedAppFacet.updateAppDeploymentStatus(appId, newStatus);

        // Verify app deployment status was updated
        VincentAppViewFacet.App memory app = wrappedAppViewFacet.getAppById(appId);
        assertEq(uint8(app.deploymentStatus), uint8(newStatus), "App deployment status should be updated");

        vm.stopPrank();
    }

    /**
     * @notice Test updating app name with empty name
     * @dev Verifies that empty app name is not allowed
     */
    function testUpdateAppNameEmpty() public {
        vm.startPrank(deployer);

        // Attempt to update with empty name
        vm.expectRevert(LibVincentAppFacet.EmptyAppNameNotAllowed.selector);
        wrappedAppFacet.updateAppName(appId, "");

        vm.stopPrank();
    }

    /**
     * @notice Test updating app description with empty description
     * @dev Verifies that empty app description is not allowed
     */
    function testUpdateAppDescriptionEmpty() public {
        vm.startPrank(deployer);

        // Attempt to update with empty description
        vm.expectRevert(LibVincentAppFacet.EmptyAppDescriptionNotAllowed.selector);
        wrappedAppFacet.updateAppDescription(appId, "");

        vm.stopPrank();
    }

    /**
     * @notice Test updating app deployment status to same status
     * @dev Verifies that updating to same status is not allowed
     */
    function testUpdateAppDeploymentStatusSame() public {
        vm.startPrank(deployer);

        // Get current status
        VincentAppViewFacet.App memory app = wrappedAppViewFacet.getAppById(appId);
        VincentAppStorage.DeploymentStatus currentStatus = app.deploymentStatus;

        // Attempt to update to same status
        vm.expectRevert(
            abi.encodeWithSelector(
                LibVincentAppFacet.AppAlreadyInRequestedDeploymentStatus.selector, appId, uint8(currentStatus)
            )
        );
        wrappedAppFacet.updateAppDeploymentStatus(appId, currentStatus);

        vm.stopPrank();
    }

    /**
     * @notice Test updating app name by non-manager
     * @dev Verifies that only app manager can update app name
     */
    function testUpdateAppNameNonManager() public {
        // Start as a different address
        vm.startPrank(address(0x123));

        // Attempt to update app name
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.NotAppManager.selector, appId, address(0x123)));
        wrappedAppFacet.updateAppName(appId, "New Name");

        vm.stopPrank();
    }

    /**
     * @notice Test updating app description by non-manager
     * @dev Verifies that only app manager can update app description
     */
    function testUpdateAppDescriptionNonManager() public {
        // Start as a different address
        vm.startPrank(address(0x123));

        // Attempt to update app description
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.NotAppManager.selector, appId, address(0x123)));
        wrappedAppFacet.updateAppDescription(appId, "New Description");

        vm.stopPrank();
    }

    /**
     * @notice Test updating app deployment status by non-manager
     * @dev Verifies that only app manager can update app deployment status
     */
    function testUpdateAppDeploymentStatusNonManager() public {
        // Start as a different address
        vm.startPrank(address(0x123));

        // Attempt to update app deployment status
        vm.expectRevert(abi.encodeWithSelector(LibVincentAppFacet.NotAppManager.selector, appId, address(0x123)));
        wrappedAppFacet.updateAppDeploymentStatus(appId, VincentAppStorage.DeploymentStatus.PROD);

        vm.stopPrank();
    }
}
