// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/fees/Fee.sol";
import "../contracts/diamond-base/facets/DiamondCutFacet.sol";
import "../contracts/diamond-base/facets/DiamondLoupeFacet.sol";
import "../contracts/diamond-base/facets/OwnershipFacet.sol";
import "../contracts/fees/facets/FeeViewsFacet.sol";
import "../contracts/fees/facets/FeeAdminFacet.sol";
import "../contracts/fees/facets/MorphoPerfFeeFacet.sol";

import "../contracts/diamond-base/interfaces/IDiamondCut.sol";
import "../contracts/diamond-base/interfaces/IDiamondLoupe.sol";
import "../contracts/diamond-base/interfaces/IERC165.sol";
import "../contracts/diamond-base/interfaces/IERC173.sol";

/**
 * @title Vincent Diamond Deployment Script
 * @notice Foundry script for deploying the Vincent Diamond to multiple networks
 * @dev Uses environment variables for private key and PKP NFT contract addresses
 * @custom:env VINCENT_DEPLOYER_PRIVATE_KEY - Private key of the deployer
 */
contract DeployFeeDiamond is Script {
    /** @notice Error thrown when required environment variables are missing */
    error MissingEnvironmentVariable(string name);

    function contractToFacetCutAdd(address contractAddress) internal returns (IDiamondCut.FacetCut memory) {
        return IDiamondCut.FacetCut({
            facetAddress: contractAddress,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getContractSelectors(contractAddress)
        });
    }

    /**
     * @notice Deploy to a specific network
     * @param network Network name for logging
     */
    function deployToNetwork(string memory network) public returns (address) {

        // Get private key from environment variable
        uint256 deployerPrivateKey = vm.envUint("VINCENT_DEPLOYER_PRIVATE_KEY");
        if (deployerPrivateKey == 0) {
            revert MissingEnvironmentVariable("VINCENT_DEPLOYER_PRIVATE_KEY");
        }

        // Get the deployer address
        address deployerAddress = vm.addr(deployerPrivateKey);

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);


        // diamond cut facet is speciial, so we deploy it first
        // and don't include it in the facetAddresses array
        DiamondCutFacet diamondCutFacet = new DiamondCutFacet();

        // Deploy the facets
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](5);

        // core diamond lib facets
        DiamondLoupeFacet diamondLoupeFacet = new DiamondLoupeFacet();
        cuts[0] = contractToFacetCutAdd(address(diamondLoupeFacet));
        OwnershipFacet ownershipFacet = new OwnershipFacet();
        cuts[1] = contractToFacetCutAdd(address(ownershipFacet));

        // fee facets
        FeeViewsFacet feeViewsFacet = new FeeViewsFacet();
        cuts[2] = contractToFacetCutAdd(address(feeViewsFacet));
        FeeAdminFacet feeAdminFacet = new FeeAdminFacet();
        cuts[3] = contractToFacetCutAdd(address(feeAdminFacet));
        MorphoPerfFeeFacet morphoPerfFeeFacet = new MorphoPerfFeeFacet();
        cuts[4] = contractToFacetCutAdd(address(morphoPerfFeeFacet));

        // Deploy the Diamond with the diamondCut facet and all other facets in one transaction
        Fee diamond = new Fee(
            deployerAddress, // contract owner
            address(diamondCutFacet), // diamond cut facet
            cuts
        );

        

        // Stop broadcasting transactions
        vm.stopBroadcast();

        // Log deployment details
        console.log("Fee Diamond deployed for", network, "to:", address(diamond));
        console.log("DiamondLoupeFacet:", address(diamondLoupeFacet));
        console.log("OwnershipFacet:", address(ownershipFacet));
        console.log("FeeViewsFacet:", address(feeViewsFacet));
        console.log("FeeAdminFacet:", address(feeAdminFacet));
        console.log("MorphoPerfFeeFacet:", address(morphoPerfFeeFacet));

        return address(diamond);
    }

    /** @notice Deploy to Datil network */
    function deployToDatil() public returns (address) {
        return deployToNetwork("Datil");
    }

    /** @notice Main deployment function */
    function run() public {
        // Deploy to all networks
        deployToDatil();
    }
}