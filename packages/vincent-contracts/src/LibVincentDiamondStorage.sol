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

library VincentAppToolPolicyStorage {
    bytes32 internal constant APP_TOOL_POLICY_STORAGE_SLOT = keccak256("lit.vincent.app.tool.policy.storage");

    struct ToolPolicy {
        EnumerableSet.Bytes32Set policyParameterNameHashes;
        bytes32 policyIpfsCidHash;
    }

    struct AppToolPolicies {
        EnumerableSet.Bytes32Set toolPolicyIpfsCidHashes;
        // Tool IPFS CID Hash => Tool Policy
        mapping(bytes32 => ToolPolicy) toolIpfsCidHashToToolPolicy;
    }

    struct AppToolPolicyStorage {
        // App ID => App Version => AppToolPolicies
        mapping(uint256 => mapping(uint256 => AppToolPolicies)) appIdToToolPolicies;
        // Policy IPFS CID Hash => Policy IPFS CID
        mapping(bytes32 => string) policyIpfsCidHashToIpfsCid;
        // Policy Parameter Name Hash => Policy Parameter Name
        mapping(bytes32 => string) policyParameterNameHashToName;
    }

    function appToolPolicyStorage() internal pure returns (AppToolPolicyStorage storage atps) {
        bytes32 slot = APP_TOOL_POLICY_STORAGE_SLOT;
        assembly {
            atps.slot := slot
        }
    }
}

library VincentUserStorage {
    bytes32 internal constant USER_STORAGE_SLOT = keccak256("lit.vincent.user.storage");

    struct PolicyParametersStorage {
        // Not every Policy parameter is required, so we keep track
        // of the ones the User has set
        EnumerableSet.Bytes32Set policyParameterNameHashes;
        // Policy Parameter Name Hash -> Policy Parameter Value
        mapping(bytes32 => string) policyParameterNameHashToValue;
    }

    struct UserStorage {
        EnumerableSet.UintSet registeredUsers;
        mapping(uint256 => EnumerableSet.UintSet) pkpTokenIdToPermittedAppIds;
        // User PKP Token ID -> App ID -> Tool IPFS CID Hash -> Policy Parameters Storage
        mapping(uint256 => mapping(uint256 => mapping(bytes32 => PolicyParametersStorage)))
            userPkpTokenIdToPolicyParametersStorage;
        IPKPNFTFacet PKP_NFT_FACET;
    }

    function userStorage() internal pure returns (UserStorage storage us) {
        bytes32 slot = USER_STORAGE_SLOT;
        assembly {
            us.slot := slot
        }
    }
}
