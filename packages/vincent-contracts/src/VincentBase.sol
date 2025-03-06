// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "./LibVincentDiamondStorage.sol";

contract VincentBase {
    using VincentAppStorage for VincentAppStorage.AppStorage;
    using EnumerableSet for EnumerableSet.UintSet;

    error AppNotRegistered(uint256 appId);

    modifier onlyRegisteredApp(uint256 appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        if (!as_.registeredApps.contains(appId)) revert AppNotRegistered(appId);
        _;
    }
}
