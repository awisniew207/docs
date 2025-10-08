// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import {DeployFeeDiamond} from "../../script/DeployFeeDiamond.sol";

import {Fee} from "../../contracts/fees/Fee.sol";
import {FeeViewsFacet} from "../../contracts/fees/facets/FeeViewsFacet.sol";
import {FeeAdminFacet} from "../../contracts/fees/facets/FeeAdminFacet.sol";
import {MorphoPerfFeeFacet} from "../../contracts/fees/facets/MorphoPerfFeeFacet.sol";

contract FeeTest is Test {
    Fee public feeDiamond;
    FeeViewsFacet public feeViewsFacet;
    FeeAdminFacet public feeAdminFacet;
    MorphoPerfFeeFacet public morphoPerfFeeFacet;

    function setUp() public {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.setEnv("VINCENT_DEPLOYER_PRIVATE_KEY", vm.toString(deployerPrivateKey));

        DeployFeeDiamond deployScript = new DeployFeeDiamond();

        address diamondAddress = deployScript.deployToNetwork("test");
        feeDiamond = Fee(payable(diamondAddress));


        feeViewsFacet = FeeViewsFacet(diamondAddress);
        feeAdminFacet = FeeAdminFacet(diamondAddress);
        morphoPerfFeeFacet = MorphoPerfFeeFacet(diamondAddress);
    }

    function testSetPerformanceFeePercentage() public {
        feeAdminFacet.setPerformanceFeePercentage(1000);
        assertEq(feeAdminFacet.performanceFeePercentage(), 1000);
    }

 
}