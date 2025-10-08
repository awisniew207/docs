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

    function getFunctionSelectors(string memory contractName) internal returns (bytes4[] memory) {
        string[] memory inputs = new string[](3);
        inputs[0] = "node";
        inputs[1] = "scripts/getFunctionSelectors.mjs";
        inputs[2] = contractName;
        bytes4[] memory selectors = new bytes4[](0);
        bytes memory output = vm.ffi(inputs);
        selectors = abi.decode(output, (bytes4[]));
        return selectors;
    }

    function contractToFacetCutAdd(string memory contractName, address contractAddress) internal returns (IDiamondCut.FacetCut memory) {
        return IDiamondCut.FacetCut({
            facetAddress: contractAddress,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getFunctionSelectors(contractName)
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

        // Deploy the facets
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](5);

        // core diamond lib facets
        DiamondLoupeFacet diamondLoupeFacet = new DiamondLoupeFacet();
        cuts[0] = contractToFacetCutAdd("DiamondLoupeFacet", address(diamondLoupeFacet));
        OwnershipFacet ownershipFacet = new OwnershipFacet();
        cuts[1] = contractToFacetCutAdd("OwnershipFacet", address(ownershipFacet));

        // fee facets
        FeeViewsFacet feeViewsFacet = new FeeViewsFacet();
        cuts[2] = contractToFacetCutAdd("FeeViewsFacet", address(feeViewsFacet));
        FeeAdminFacet feeAdminFacet = new FeeAdminFacet();
        cuts[3] = contractToFacetCutAdd("FeeAdminFacet", address(feeAdminFacet));
        MorphoPerfFeeFacet morphoPerfFeeFacet = new MorphoPerfFeeFacet();
        cuts[4] = contractToFacetCutAdd("MorphoPerfFeeFacet", address(morphoPerfFeeFacet));

        // Deploy the Diamond with the diamondCut facet and all other facets in one transaction
        Fee diamond = new Fee(
            cuts,
            FeeArgs({
                owner: deployerAddress,
                init: address(0),
                initCalldata: bytes("")
            })
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