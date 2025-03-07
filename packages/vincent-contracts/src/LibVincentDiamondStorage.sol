// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "./IPKPNftFacet.sol";

library VincentAppStorage {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    bytes32 internal constant APP_STORAGE_SLOT = keccak256("lit.vincent.app.storage");

    struct App {
        EnumerableSet.Bytes32Set toolIpfsCidHashes;
        EnumerableSet.AddressSet delegatees;
        EnumerableSet.Bytes32Set authorizedDomains;
        EnumerableSet.Bytes32Set authorizedRedirectUris;
        EnumerableSet.UintSet delegatedUserPkps;
        address manager;
        bool enabled;
        string name;
        string description;
    }

    struct AppStorage {
        mapping(uint256 => App) appIdToApp;
        mapping(address => EnumerableSet.UintSet) managerAddressToAppIds;
        mapping(address => uint256) delegateeAddressToAppId;
        mapping(bytes32 => string) authorizedDomainHashToDomain;
        mapping(bytes32 => string) authorizedRedirectUriHashToRedirectUri;
        EnumerableSet.UintSet registeredApps;
        EnumerableSet.AddressSet registeredManagers;
        uint256 appIdCounter;
    }

    function appStorage() internal pure returns (AppStorage storage as_) {
        bytes32 slot = APP_STORAGE_SLOT;
        assembly {
            as_.slot := slot
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

/**
 * @dev Unfortunately, Solidity doesn't support deleting nested mappings, so instead of doing something like this:
 * 
 * User PKP Token ID -> App ID -> Tool IPFS CID Hash -> Policy Parameter Name Hash -> Policy Parameter Value
 * mapping(uint256 => mapping(uint256 => mapping(bytes32 => mapping(bytes32 => string)))) policyValues;
 * 
 * We have to map to individual structs so that we can delete all of AppStorage when a User un-permits an App
 * 
 */
library VincentUserToolPolicyStorage {
    bytes32 internal constant USER_TOOL_POLICY_STORAGE_SLOT = keccak256("lit.vincent.user.tool.policy.storage");

    struct ToolStorage {
        EnumerableSet.Bytes32Set policyParameterNameHashes;
        // Policy Parameter Name Hash -> Policy Parameter Value
        mapping(bytes32 => string) policyParameterNameHashToValue;
    }

    struct AppStorage {
        // Tool IPFS CID Hash -> Tool Storage
        mapping(bytes32 => ToolStorage) toolIpfsCidHashToToolStorage;
    }

    struct User {
        // App ID -> App Storage
        mapping(uint256 => AppStorage) appIdToAppStorage;
    }

    struct UserToolPolicyStorage {
        // Policy Parameter Name Hash -> Policy Parameter Name
        mapping(bytes32 => string) policyParameterNameHashToName;
        // User PKP Token ID -> User
        mapping(uint256 => User) pkpTokenIdToUser;
    }

    function userToolPolicyStorage() internal pure returns (UserToolPolicyStorage storage utps) {
        bytes32 slot = USER_TOOL_POLICY_STORAGE_SLOT;
        assembly {
            utps.slot := slot
        }
    }
}

library VincentUserStorage {
    bytes32 internal constant USER_STORAGE_SLOT = keccak256("lit.vincent.user.storage");

    struct UserStorage {
        EnumerableSet.UintSet registeredUsers;
        mapping(uint256 => EnumerableSet.UintSet) pkpTokenIdToPermittedAppIds;
        IPKPNFTFacet PKP_NFT_FACET;
    }

    function userStorage() internal pure returns (UserStorage storage us) {
        bytes32 slot = USER_STORAGE_SLOT;
        assembly {
            us.slot := slot
        }
    }
}
