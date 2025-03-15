// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/diamond-base/interfaces/IDiamondCut.sol";
import "../src/diamond-base/interfaces/IDiamondLoupe.sol";
import "../src/diamond-base/interfaces/IERC165.sol";
import "../src/diamond-base/interfaces/IERC173.sol";

import "../src/facets/VincentAppFacet.sol";
import "../src/facets/VincentAppViewFacet.sol";
import "../src/facets/VincentToolFacet.sol";
import "../src/facets/VincentToolViewFacet.sol";
import "../src/facets/VincentUserFacet.sol";
import "../src/facets/VincentUserViewFacet.sol";

/**
 * @title VincentSelectors
 * @dev Library containing function selectors for all facets in the Vincent Diamond
 * Used by both deployment and upgrade scripts to ensure consistent selectors
 */
library VincentSelectors {
    /**
     * @dev Get function selectors for DiamondCutFacet
     */
    function getDiamondCutFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = IDiamondCut.diamondCut.selector;
        return selectors;
    }

    /**
     * @dev Get function selectors for DiamondLoupeFacet
     */
    function getDiamondLoupeFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](5);
        selectors[0] = IDiamondLoupe.facets.selector;
        selectors[1] = IDiamondLoupe.facetFunctionSelectors.selector;
        selectors[2] = IDiamondLoupe.facetAddresses.selector;
        selectors[3] = IDiamondLoupe.facetAddress.selector;
        selectors[4] = IERC165.supportsInterface.selector;
        return selectors;
    }

    /**
     * @dev Get function selectors for OwnershipFacet
     */
    function getOwnershipFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = IERC173.owner.selector;
        selectors[1] = IERC173.transferOwnership.selector;
        return selectors;
    }

    /**
     * @dev Get function selectors for VincentAppFacet
     */
    function getVincentAppFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](9);
        selectors[0] = VincentAppFacet.registerApp.selector;
        selectors[1] = VincentAppFacet.registerNextAppVersion.selector;
        selectors[2] = VincentAppFacet.enableAppVersion.selector;
        selectors[3] = VincentAppFacet.addAuthorizedDomain.selector;
        selectors[4] = VincentAppFacet.removeAuthorizedDomain.selector;
        selectors[5] = VincentAppFacet.addAuthorizedRedirectUri.selector;
        selectors[6] = VincentAppFacet.removeAuthorizedRedirectUri.selector;
        selectors[7] = VincentAppFacet.addDelegatee.selector;
        selectors[8] = VincentAppFacet.removeDelegatee.selector;
        return selectors;
    }

    /**
     * @dev Get function selectors for VincentAppViewFacet
     */
    function getVincentAppViewFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](8);
        selectors[0] = VincentAppViewFacet.getTotalAppCount.selector;
        selectors[1] = VincentAppViewFacet.getAppById.selector;
        selectors[2] = VincentAppViewFacet.getAppVersion.selector;
        selectors[3] = VincentAppViewFacet.getAppsByManager.selector;
        selectors[4] = VincentAppViewFacet.getAppByDelegatee.selector;
        selectors[5] = VincentAppViewFacet.getAuthorizedDomainByHash.selector;
        selectors[6] = VincentAppViewFacet.getAuthorizedRedirectUriByHash.selector;
        selectors[7] = VincentAppViewFacet.getAuthorizedDomainsAndRedirectUrisByAppId.selector;
        return selectors;
    }

    /**
     * @dev Get function selectors for VincentToolFacet
     */
    function getVincentToolFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = VincentToolFacet.registerTool.selector;
        selectors[1] = VincentToolFacet.registerTools.selector;
        return selectors;
    }

    /**
     * @dev Get function selectors for VincentToolViewFacet
     */
    function getVincentToolViewFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = VincentToolViewFacet.getToolIpfsCidByHash.selector;
        selectors[1] = VincentToolViewFacet.getAllRegisteredTools.selector;
        return selectors;
    }

    /**
     * @dev Get function selectors for VincentUserFacet
     */
    function getVincentUserFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](4);
        selectors[0] = VincentUserFacet.permitAppVersion.selector;
        selectors[1] = VincentUserFacet.unPermitAppVersion.selector;
        selectors[2] = VincentUserFacet.setToolPolicyParameters.selector;
        selectors[3] = VincentUserFacet.removeToolPolicyParameters.selector;
        return selectors;
    }

    /**
     * @dev Get function selectors for VincentUserViewFacet
     */
    function getVincentUserViewFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](5);
        selectors[0] = VincentUserViewFacet.getAllRegisteredAgentPkps.selector;
        selectors[1] = VincentUserViewFacet.getPermittedAppVersionForPkp.selector;
        selectors[2] = VincentUserViewFacet.getAllPermittedAppIdsForPkp.selector;
        selectors[3] = VincentUserViewFacet.validateToolExecutionAndGetPolicies.selector;
        selectors[4] = VincentUserViewFacet.getAllToolsAndPoliciesForApp.selector;
        return selectors;
    }
}
