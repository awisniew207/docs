// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../VincentDiamondStorage.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract VincentAppFacet {
    using VincentAppStorage for VincentAppStorage.AppStorage;
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;

    event NewManagerRegistered(address indexed manager);
    event NewAppRegistered(uint256 indexed appId, address indexed manager);
    event AppEnabled(uint256 indexed appId, bool indexed enabled);

    error NotAppManager(uint256 appId, address caller);
    error AppNotRegistered(uint256 appId);

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

    function registerApp() external returns (uint256 newAppId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        newAppId = as_.appIdCounter++;

        // Add the manager to the list of registered managerToApps
        // if they are not already in the list
        if (!as_.managersWithRegisteredApps.contains(msg.sender)) {
            as_.managersWithRegisteredApps.add(msg.sender);
            emit NewManagerRegistered(msg.sender);
        }

        // Add the app to the list of registered apps
        as_.registeredApps.add(newAppId);

        // Add the app to the manager's list of apps
        as_.managerAddressToAppIds[msg.sender].add(newAppId);

        // Register the app
        VincentAppStorage.App storage app = as_.appIdToApp[newAppId];
        app.manager = msg.sender;
        app.enabled = true;

        emit NewAppRegistered(newAppId, msg.sender);
    }

    function enableApp(uint256 appId, bool enabled) external onlyAppManager(appId) onlyRegisteredApp(appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        as_.appIdToApp[appId].enabled = enabled;
        emit AppEnabled(appId, enabled);
    }

    function addDelegatee(uint256 appId, address delegatee) external onlyAppManager(appId) onlyRegisteredApp(appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        as_.appIdToApp[appId].delegatees.add(delegatee);
        as_.delegateeAddressToAppIds[delegatee].add(appId);
    }

    function removeDelegatee(uint256 appId, address delegatee)
        external
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        as_.appIdToApp[appId].delegatees.remove(delegatee);
        as_.delegateeAddressToAppIds[delegatee].remove(appId);
    }
}
