// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/VincentDiamond.sol";
import "../src/diamond-base/facets/DiamondCutFacet.sol";
import "../src/diamond-base/facets/DiamondLoupeFacet.sol";
import "../src/diamond-base/facets/OwnershipFacet.sol";
import "../src/facets/VincentToolFacet.sol";
import "../src/facets/VincentToolViewFacet.sol";
import "../src/facets/VincentAppFacet.sol";
import "../src/facets/VincentAppViewFacet.sol";
import "../src/facets/VincentUserFacet.sol";
import "../src/facets/VincentUserViewFacet.sol";
import "../src/VincentBase.sol";
import "../src/diamond-base/interfaces/IDiamondCut.sol";
import "../src/diamond-base/interfaces/IDiamondLoupe.sol";
import "../src/diamond-base/interfaces/IERC165.sol";
import "../src/diamond-base/interfaces/IERC173.sol";

// Import the selectors library
import "./VincentSelectors.sol";

/// @title Vincent Diamond Deployment Script
/// @notice Foundry script for deploying the Vincent Diamond to multiple networks
/// @dev Uses environment variables for private key and PKP NFT contract addresses
/// @custom:env VINCENT_DEPLOYER_PRIVATE_KEY - Private key of the deployer
/// @custom:env DATIL_DEV_PKP_NFT_CONTRACT_ADDRESS - PKP NFT contract address on Datil Dev
/// @custom:env DATIL_TEST_PKP_NFT_CONTRACT_ADDRESS - PKP NFT contract address on Datil Test
/// @custom:env DATIL_PKP_NFT_CONTRACT_ADDRESS - PKP NFT contract address on Datil
contract DeployVincentDiamond is Script {
    /// @notice Error thrown when required environment variables are missing
    error MissingEnvironmentVariable(string name);

    /// @notice Deploy facets for the diamond
    /// @return facets Array of deployed facet addresses and their cut data
    /// @return diamondCutFacetAddress Address of the DiamondCutFacet
    function deployFacets() internal returns (IDiamondCut.FacetCut[] memory, address) {
        // Deploy facets
        DiamondCutFacet diamondCutFacet = new DiamondCutFacet();
        DiamondLoupeFacet diamondLoupeFacet = new DiamondLoupeFacet();
        OwnershipFacet ownershipFacet = new OwnershipFacet();
        VincentToolFacet toolFacet = new VincentToolFacet();
        VincentToolViewFacet toolViewFacet = new VincentToolViewFacet();
        VincentAppFacet appFacet = new VincentAppFacet();
        VincentAppViewFacet appViewFacet = new VincentAppViewFacet();
        VincentUserFacet userFacet = new VincentUserFacet();
        VincentUserViewFacet userViewFacet = new VincentUserViewFacet();

        // Build cut struct for adding facets
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](8);

        // Add DiamondLoupeFacet
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: address(diamondLoupeFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: VincentSelectors.getDiamondLoupeFacetSelectors()
        });

        // Add OwnershipFacet
        cut[1] = IDiamondCut.FacetCut({
            facetAddress: address(ownershipFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: VincentSelectors.getOwnershipFacetSelectors()
        });

        // Add ToolFacet
        cut[2] = IDiamondCut.FacetCut({
            facetAddress: address(toolFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: VincentSelectors.getVincentToolFacetSelectors()
        });

        // Add ToolViewFacet
        cut[3] = IDiamondCut.FacetCut({
            facetAddress: address(toolViewFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: VincentSelectors.getVincentToolViewFacetSelectors()
        });

        // Add AppFacet
        cut[4] = IDiamondCut.FacetCut({
            facetAddress: address(appFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: VincentSelectors.getVincentAppFacetSelectors()
        });

        // Add AppViewFacet
        cut[5] = IDiamondCut.FacetCut({
            facetAddress: address(appViewFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: VincentSelectors.getVincentAppViewFacetSelectors()
        });

        // Add UserFacet
        cut[6] = IDiamondCut.FacetCut({
            facetAddress: address(userFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: VincentSelectors.getVincentUserFacetSelectors()
        });

        // Add UserViewFacet
        cut[7] = IDiamondCut.FacetCut({
            facetAddress: address(userViewFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: VincentSelectors.getVincentUserViewFacetSelectors()
        });

        return (cut, address(diamondCutFacet));
    }

    /// @notice Log deployment details
    /// @param network Network name
    /// @param diamond Diamond contract address
    /// @param pkpNFTAddress PKP NFT contract address
    /// @param facets Array of deployed facet addresses
    function logDeployment(
        string memory network,
        address diamond,
        address pkpNFTAddress,
        IDiamondCut.FacetCut[] memory facets
    ) internal view {
        console.log("Vincent Diamond deployed for", network, "to:", address(diamond));
        console.log("Using PKP NFT contract:", pkpNFTAddress);
        for (uint256 i = 0; i < facets.length;) {
            console.log(string.concat("Facet ", vm.toString(i), ":"), facets[i].facetAddress);
            unchecked {
                ++i;
            }
        }
    }

    /// @notice Deploy to a specific network
    /// @param network Network name for logging
    /// @param pkpNFTAddress PKP NFT contract address
    /// @return address The address of the deployed registry
    function deployToNetwork(string memory network, address pkpNFTAddress) public returns (address) {
        // Validate PKP NFT address
        if (pkpNFTAddress == address(0)) {
            revert MissingEnvironmentVariable(string.concat(network, " PKP NFT contract address"));
        }

        // Get private key from environment variable
        uint256 deployerPrivateKey = vm.envUint("VINCENT_DEPLOYER_PRIVATE_KEY");
        if (deployerPrivateKey == 0) {
            revert MissingEnvironmentVariable("VINCENT_DEPLOYER_PRIVATE_KEY");
        }

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy facets and get cut data
        (IDiamondCut.FacetCut[] memory cut, address diamondCutFacetAddress) = deployFacets();

        // Deploy the Diamond with the diamondCut facet and owner
        VincentDiamond diamond = new VincentDiamond(
            vm.addr(deployerPrivateKey), // contract owner
            diamondCutFacetAddress,
            pkpNFTAddress // PKP NFT contract address - set immutably
        );

        // Execute diamond cut to add facets without initialization
        // All initialization is now handled in the VincentDiamond constructor
        IDiamondCut(address(diamond)).diamondCut(cut, address(0), new bytes(0));

        // Stop broadcasting transactions
        vm.stopBroadcast();

        // Log deployment details
        logDeployment(network, address(diamond), pkpNFTAddress, cut);

        return address(diamond);
    }

    /// @notice Deploy to Datil Dev network
    function deployToDatilDev() public returns (address) {
        address pkpNFTAddress = vm.envAddress("DATIL_DEV_PKP_NFT_CONTRACT_ADDRESS");
        return deployToNetwork("Datil Dev", pkpNFTAddress);
    }

    /// @notice Deploy to Datil Test network
    function deployToDatilTest() public returns (address) {
        address pkpNFTAddress = vm.envAddress("DATIL_TEST_PKP_NFT_CONTRACT_ADDRESS");
        return deployToNetwork("Datil Test", pkpNFTAddress);
    }

    /// @notice Deploy to Datil network
    function deployToDatil() public returns (address) {
        address pkpNFTAddress = vm.envAddress("DATIL_PKP_NFT_CONTRACT_ADDRESS");
        return deployToNetwork("Datil", pkpNFTAddress);
    }

    /// @notice Main deployment function
    function run() public {
        // Deploy to all networks
        deployToDatilDev();
        deployToDatilTest();
        deployToDatil();
    }
}
