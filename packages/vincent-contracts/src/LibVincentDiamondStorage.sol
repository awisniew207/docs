// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./IPKPNftFacet.sol";

library VincentAppStorage {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    bytes32 internal constant APP_STORAGE_SLOT = keccak256("lit.vincent.app.storage");

    struct App {
        address manager;
        bool enabled;
        EnumerableSet.UintSet roles;
        EnumerableSet.AddressSet delegatees;
    }

    struct AppStorage {
        uint256 appIdCounter;
        EnumerableSet.UintSet registeredApps;
        EnumerableSet.AddressSet managersWithRegisteredApps;
        mapping(uint256 => App) appIdToApp;
        mapping(address => EnumerableSet.UintSet) managerAddressToAppIds;
        mapping(uint256 => address) appIdToManagerAddress;
        mapping(address => EnumerableSet.UintSet) delegateeAddressToAppIds;
    }

    function appStorage() internal pure returns (AppStorage storage as_) {
        bytes32 slot = APP_STORAGE_SLOT;
        assembly {
            as_.slot := slot
        }
    }
}

library VincentRoleStorage {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    bytes32 internal constant ROLE_STORAGE_SLOT = keccak256("lit.vincent.role.storage");

    struct Role {
        uint256 version;
        bool enabled;
        string name;
        string description;
        EnumerableSet.Bytes32Set toolIpfsCidHashes;
    }

    struct RoleStorage {
        uint256 roleIdCounter;
        EnumerableSet.UintSet registeredRoles;
        mapping(uint256 => Role) roleIdToRole;
        mapping(uint256 => EnumerableSet.UintSet) roleIdToRoleVersions;
        mapping(uint256 => uint256) roleIdToLatestRoleVersion;
    }

    function roleStorage() internal pure returns (RoleStorage storage rs) {
        bytes32 slot = ROLE_STORAGE_SLOT;
        assembly {
            rs.slot := slot
        }
    }
}

library VincentToolStorage {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    bytes32 internal constant TOOL_STORAGE_SLOT = keccak256("lit.vincent.tool.storage");

    struct ToolStorage {
        EnumerableSet.Bytes32Set registeredTools;
        mapping(bytes32 => string) toolIpfsCidHashToIpfsCid;
    }

    function toolStorage() internal pure returns (ToolStorage storage ts) {
        bytes32 slot = TOOL_STORAGE_SLOT;
        assembly {
            ts.slot := slot
        }
    }
}

library VincentUserStorage {
    bytes32 internal constant USER_STORAGE_SLOT = keccak256("lit.vincent.user.storage");

    struct User {
        mapping(uint256 => EnumerableSet.UintSet) appIdToPermittedRoleIds;
        mapping(uint256 => EnumerableSet.UintSet) roleIdToPermittedRoleVersions;
    }

    struct UserStorage {
        IPKPNFTFacet PKP_NFT_FACET;
        EnumerableSet.UintSet registeredUsers;
        mapping(uint256 => User) pkpTokenIdToUser;
    }

    function userStorage() internal pure returns (UserStorage storage us) {
        bytes32 slot = USER_STORAGE_SLOT;
        assembly {
            us.slot := slot
        }
    }
}
