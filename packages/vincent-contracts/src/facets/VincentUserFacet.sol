// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../LibVincentDiamondStorage.sol";
import "../VincentBase.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract VincentUserFacet is VincentBase {
    using VincentUserStorage for VincentUserStorage.UserStorage;
    using EnumerableSet for EnumerableSet.UintSet;

    event AppRolePermitted(
        uint256 indexed pkpTokenId, uint256 indexed appId, uint256 indexed roleId, uint256 roleVersion
    );
    event AppRoleUnpermitted(
        uint256 indexed pkpTokenId, uint256 indexed appId, uint256 indexed roleId, uint256 roleVersion
    );

    error NotPkpOwner(uint256 pkpTokenId, address msgSender);
    error RoleIdAndVersionLengthMismatch(uint256 roleIdsLength, uint256 roleVersionsLength);

    modifier onlyPkpOwner(uint256 pkpTokenId) {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        if (us_.PKP_NFT_FACET.ownerOf(pkpTokenId) != msg.sender) revert NotPkpOwner(pkpTokenId, msg.sender);
        _;
    }

    function permitAppRoles(
        uint256 pkpTokenId,
        uint256 appId,
        uint256[] calldata roleIds,
        uint256[] calldata roleVersions
    ) external onlyPkpOwner(pkpTokenId) onlyRegisteredApp(appId) {
        if (roleIds.length != roleVersions.length) {
            revert RoleIdAndVersionLengthMismatch(roleIds.length, roleVersions.length);
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentUserStorage.User storage user = us_.pkpTokenIdToUser[pkpTokenId];

        for (uint256 i = 0; i < roleIds.length; i++) {
            user.appIdToPermittedRoleIds[appId].add(roleIds[i]);
            user.roleIdToPermittedRoleVersions[roleIds[i]].add(roleVersions[i]);
            emit AppRolePermitted(pkpTokenId, appId, roleIds[i], roleVersions[i]);
        }
    }

    function unpermitAppRoles(
        uint256 pkpTokenId,
        uint256 appId,
        uint256[] calldata roleIds,
        uint256[] calldata roleVersions
    ) external onlyPkpOwner(pkpTokenId) onlyRegisteredApp(appId) {
        if (roleIds.length != roleVersions.length) {
            revert RoleIdAndVersionLengthMismatch(roleIds.length, roleVersions.length);
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentUserStorage.User storage user = us_.pkpTokenIdToUser[pkpTokenId];

        for (uint256 i = 0; i < roleIds.length; i++) {
            user.appIdToPermittedRoleIds[appId].remove(roleIds[i]);
            user.roleIdToPermittedRoleVersions[roleIds[i]].remove(roleVersions[i]);
            emit AppRoleUnpermitted(pkpTokenId, appId, roleIds[i], roleVersions[i]);
        }
    }
}
