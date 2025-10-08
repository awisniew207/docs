// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import {DeployFeeDiamond} from "../../script/DeployFeeDiamond.sol";

import {Fee} from "../../contracts/fees/Fee.sol";
import {FeeViewsFacet} from "../../contracts/fees/facets/FeeViewsFacet.sol";
import {FeeAdminFacet} from "../../contracts/fees/facets/FeeAdminFacet.sol";
import {MorphoPerfFeeFacet} from "../../contracts/fees/facets/MorphoPerfFeeFacet.sol";

import {MockERC4626} from "../mocks/MockERC4626.sol";
import {MockERC20} from "../mocks/MockERC20.sol";
import {LibFeeStorage} from "../../contracts/fees/LibFeeStorage.sol";

contract FeeTest is Test {
    address owner;
    address APP_USER_ALICE = makeAddr("Alice");

    Fee public feeDiamond;
    FeeViewsFacet public feeViewsFacet;
    FeeAdminFacet public feeAdminFacet;
    MorphoPerfFeeFacet public morphoPerfFeeFacet;

    MockERC20 public mockERC20;
    MockERC4626 public mockERC4626;

    function setUp() public {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.setEnv("VINCENT_DEPLOYER_PRIVATE_KEY", vm.toString(deployerPrivateKey));
        owner = vm.addr(deployerPrivateKey);

        DeployFeeDiamond deployScript = new DeployFeeDiamond();

        address diamondAddress = deployScript.deployToNetwork("test");
        feeDiamond = Fee(payable(diamondAddress));


        feeViewsFacet = FeeViewsFacet(diamondAddress);
        feeAdminFacet = FeeAdminFacet(diamondAddress);
        morphoPerfFeeFacet = MorphoPerfFeeFacet(diamondAddress);

        // deploy an ERC20 and 4626 (morpho style) vault
        mockERC20 = new MockERC20();
        mockERC4626 = new MockERC4626(address(mockERC20));
    }

    function testSetPerformanceFeePercentage() public {
        vm.startPrank(owner);
        feeAdminFacet.setPerformanceFeePercentage(500);
        assertEq(feeAdminFacet.performanceFeePercentage(), 500);
        vm.stopPrank();
    }

    function testDepositToMorpho() public {
        mockERC20.mint(APP_USER_ALICE, 1000);
        vm.startPrank(APP_USER_ALICE);
        mockERC20.approve(address(mockERC4626), 1000);
        morphoPerfFeeFacet.depositToMorpho(address(mockERC4626), 1000);
        vm.stopPrank();

        LibFeeStorage.Deposit memory d = feeViewsFacet.deposits(APP_USER_ALICE,address(mockERC4626));

        assertEq(d.assetAmount, 1000);
        console.log("d.vaultShares", d.vaultShares);
        console.log("d.timestamp", d.timestamp);
        console.log("d.vaultProvider", d.vaultProvider);
    }
    



 
}