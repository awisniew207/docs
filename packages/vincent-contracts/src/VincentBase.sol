// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./LibVincentDiamondStorage.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract VincentBase {
    using VincentRoleStorage for VincentRoleStorage.RoleStorage;
    using EnumerableSet for EnumerableSet.UintSet;

    error NotAppManager(uint256 appId, address msgSender);
    error AppNotRegistered(uint256 appId);
    error RoleNotRegistered(uint256 appId, uint256 roleId);

    modifier onlyAppManager(uint256 appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        if (as_.appIdToApp[appId].manager != msg.sender) revert NotAppManager(appId, msg.sender);
        _;
    }

    modifier onlyRegisteredApp(uint256 appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        if (!as_.registeredApps.contains(appId)) revert AppNotRegistered(appId);
        _;
    }
}
