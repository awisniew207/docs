// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../script/DeployVincentDiamond.sol";
import "../../src/VincentDiamond.sol";
import "../../src/facets/VincentAppFacet.sol";
import "../../src/facets/VincentAppViewFacet.sol";
import "../../src/facets/VincentToolFacet.sol";
import "../../src/facets/VincentToolViewFacet.sol";
import "../../src/facets/VincentUserFacet.sol";
import "../../src/facets/VincentUserViewFacet.sol";
import "../../src/diamond-base/facets/DiamondCutFacet.sol";
import "../../src/diamond-base/facets/DiamondLoupeFacet.sol";
import "../../src/diamond-base/facets/OwnershipFacet.sol";
import "../../src/diamond-base/interfaces/IDiamondCut.sol";
import "../../src/diamond-base/interfaces/IDiamondLoupe.sol";
import "../../src/diamond-base/interfaces/IERC165.sol";
import "../../src/diamond-base/interfaces/IERC173.sol";
import "../mocks/MockPKPNftFacet.sol";

/**
 * @title VincentTestHelper
 * @notice Base contract that all Vincent test contracts should inherit from
 * @dev Handles setting up the Diamond pattern contracts and common test variables
 */
abstract contract VincentTestHelper is Test {
    // Common test accounts
    address public deployer;
    address public nonOwner;

    // Mock contracts
    MockPKPNftFacet public mockPkpNft;

    // Diamond and facets
    VincentDiamond public diamond;
    DeployVincentDiamond public deployScript;
    DiamondCutFacet public diamondCutFacet;
    DiamondLoupeFacet public diamondLoupeFacet;
    OwnershipFacet public ownershipFacet;

    // Wrapped facets (for calling through the diamond)
    VincentAppFacet public wrappedAppFacet;
    VincentAppViewFacet public wrappedAppViewFacet;
    VincentToolFacet public wrappedToolFacet;
    VincentToolViewFacet public wrappedToolViewFacet;
    VincentUserFacet public wrappedUserFacet;
    VincentUserViewFacet public wrappedUserViewFacet;

    // Test constants
    // App-related constants
    string constant TEST_APP_NAME = "Test App";
    string constant TEST_APP_DESCRIPTION = "Test App Description";
    string constant TEST_DOMAIN_1 = "test.com";
    string constant TEST_DOMAIN_2 = "example.com";
    string constant TEST_REDIRECT_URI_1 = "https://test.com/callback";
    string constant TEST_REDIRECT_URI_2 = "https://example.com/callback";
    address constant TEST_DELEGATEE_1 = address(0x1);
    address constant TEST_DELEGATEE_2 = address(0x2);

    // Tool-related constants
    string constant TEST_TOOL_IPFS_CID_1 = "QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB";
    string constant TEST_TOOL_IPFS_CID_2 = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";

    // Policy-related constants
    string constant TEST_POLICY_1 = "QmTestPolicy1";
    string constant TEST_POLICY_2 = "QmTestPolicy2";
    string constant TEST_POLICY_PARAM_1 = "param1";
    string constant TEST_POLICY_PARAM_2 = "param2";

    // PKP-related constants
    uint256 constant TEST_PKP_TOKEN_ID_1 = 100;
    uint256 constant TEST_PKP_TOKEN_ID_2 = 200;

    // Event definitions
    event NewAppRegistered(uint256 indexed appId, address indexed manager);
    event NewAppVersionRegistered(uint256 indexed appId, uint256 indexed appVersion, address indexed manager);
    event AppEnabled(uint256 indexed appId, uint256 indexed appVersion, bool indexed enabled);
    event AuthorizedDomainAdded(uint256 indexed appId, string indexed domain);
    event AuthorizedRedirectUriAdded(uint256 indexed appId, string indexed redirectUri);
    event AuthorizedDomainRemoved(uint256 indexed appId, string indexed domain);
    event AuthorizedRedirectUriRemoved(uint256 indexed appId, string indexed redirectUri);
    event NewToolRegistered(bytes32 indexed toolIpfsCidHash);

    function setUp() public virtual {
        // Setup deployer account using default anvil account
        deployer = vm.addr(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80);

        // Create non-owner account
        nonOwner = makeAddr("non-owner");

        // Set environment variables for deployment
        vm.setEnv("VINCENT_DEPLOYER_PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");

        // Option 1: Deploy using the deployment script
        // This is the default method used by the original VincentTestHelper
        deployScript = new DeployVincentDiamond();
        vm.startPrank(deployer);
        mockPkpNft = new MockPKPNftFacet();
        vm.stopPrank();
        address diamondAddress = deployScript.deployToNetwork("test", address(mockPkpNft));
        diamond = VincentDiamond(payable(diamondAddress));

        // Create wrapped facet instances to call through the diamond
        wrappedAppFacet = VincentAppFacet(address(diamond));
        wrappedAppViewFacet = VincentAppViewFacet(address(diamond));
        wrappedToolFacet = VincentToolFacet(address(diamond));
        wrappedToolViewFacet = VincentToolViewFacet(address(diamond));
        wrappedUserFacet = VincentUserFacet(address(diamond));
        wrappedUserViewFacet = VincentUserViewFacet(address(diamond));

        // Set up mock PKP NFT for tests
        vm.startPrank(deployer);
        mockPkpNft.setOwner(TEST_PKP_TOKEN_ID_1, deployer);
        mockPkpNft.setOwner(TEST_PKP_TOKEN_ID_2, nonOwner);
        vm.stopPrank();
    }

    /**
     * @dev Alternative setup method from DiamondTestHelper
     * Sets up the basic Diamond infrastructure with core facets
     * Does not add any Vincent-specific facets - those should be added by the caller
     */
    function setUpBaseDiamond() internal {
        // Deploy core facets
        diamondCutFacet = new DiamondCutFacet();
        diamondLoupeFacet = new DiamondLoupeFacet();
        ownershipFacet = new OwnershipFacet();

        // Deploy mock PKP NFT contract if not already deployed
        if (address(mockPkpNft) == address(0)) {
            mockPkpNft = new MockPKPNftFacet();
        }

        // Deploy Diamond with cut facet
        diamond = new VincentDiamond(address(this), address(diamondCutFacet), address(mockPkpNft));

        // Create facet cuts array for core facets
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](2);

        // DiamondLoupeFacet
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(diamondLoupeFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getDiamondLoupeFacetSelectors()
        });

        // OwnershipFacet
        cuts[1] = IDiamondCut.FacetCut({
            facetAddress: address(ownershipFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getOwnershipFacetSelectors()
        });

        // Execute diamond cut to add core facets
        IDiamondCut(address(diamond)).diamondCut(cuts, address(0), new bytes(0));

        // Setup the wrapped facets for convenience
        wrappedAppFacet = VincentAppFacet(address(diamond));
        wrappedAppViewFacet = VincentAppViewFacet(address(diamond));
        wrappedToolFacet = VincentToolFacet(address(diamond));
        wrappedToolViewFacet = VincentToolViewFacet(address(diamond));
        wrappedUserFacet = VincentUserFacet(address(diamond));
        wrappedUserViewFacet = VincentUserViewFacet(address(diamond));
    }

    /**
     * @dev Add a single facet to the diamond
     * @param facetAddress Address of the facet contract
     * @param selectors Array of function selectors to add
     */
    function addFacet(address facetAddress, bytes4[] memory selectors) internal {
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);

        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: facetAddress,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: selectors
        });

        IDiamondCut(address(diamond)).diamondCut(cuts, address(0), new bytes(0));
    }

    /**
     * @dev Get Diamond Loupe facet selectors
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
     * @dev Get Ownership facet selectors
     */
    function getOwnershipFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = IERC173.owner.selector;
        selectors[1] = IERC173.transferOwnership.selector;
        return selectors;
    }

    /**
     * Helper function to register a test app
     */
    function _registerTestApp() internal returns (uint256 appId, uint256 appVersion) {
        string[] memory domains = new string[](1);
        domains[0] = TEST_DOMAIN_1;

        string[] memory redirectUris = new string[](1);
        redirectUris[0] = TEST_REDIRECT_URI_1;

        address[] memory delegatees = new address[](1);
        delegatees[0] = TEST_DELEGATEE_1;

        // Set up empty tool arrays
        string[] memory toolIpfsCids = new string[](0);
        string[][] memory toolPolicies = new string[][](0);
        string[][][] memory toolPolicyParameterNames = new string[][][](0);

        return wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            domains,
            redirectUris,
            delegatees,
            toolIpfsCids,
            toolPolicies,
            toolPolicyParameterNames
        );
    }

    /**
     * Helper function to register a test app with version
     */
    function _registerTestAppWithVersion() internal returns (uint256 appId, uint256 appVersion) {
        string[] memory domains = new string[](1);
        domains[0] = TEST_DOMAIN_1;

        string[] memory redirectUris = new string[](1);
        redirectUris[0] = TEST_REDIRECT_URI_1;

        address[] memory delegatees = new address[](1);
        delegatees[0] = TEST_DELEGATEE_1;

        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;

        // Register tool first
        wrappedToolFacet.registerTool(TEST_TOOL_IPFS_CID_1);

        // Set up tool policies
        string[][] memory toolPolicies = new string[][](1);
        toolPolicies[0] = new string[](1);
        toolPolicies[0][0] = TEST_POLICY_1;

        string[][][] memory toolPolicyParameterNames = new string[][][](1);
        toolPolicyParameterNames[0] = new string[][](1);
        toolPolicyParameterNames[0][0] = new string[](1);
        toolPolicyParameterNames[0][0][0] = TEST_POLICY_PARAM_1;

        // Register app with version
        return wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            domains,
            redirectUris,
            delegatees,
            toolIpfsCids,
            toolPolicies,
            toolPolicyParameterNames
        );
    }

    /**
     * Helper function to register a test tool
     */
    function _registerTestTool(string memory toolIpfsCid) internal returns (bytes32 toolHash) {
        wrappedToolFacet.registerTool(toolIpfsCid);
        toolHash = keccak256(abi.encodePacked(toolIpfsCid));
    }
}
