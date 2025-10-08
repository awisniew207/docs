// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;


import "../LibFeeStorage.sol";
import { LibDiamond } from "../../diamond-base/libraries/LibDiamond.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { FeeUtils } from "../FeeUtils.sol";
import { EnumerableSet } from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title MorphoPerfFeeFacet
 * @notice A facet of the Fee Diamond that manages Morpho performance fees
 * @dev This contract simply tracks morpho deposits and takes a performance fee from the withdrawals
 */
contract FeeAdminFacet {
    using EnumerableSet for EnumerableSet.AddressSet;

    /* ========== Modifiers ========== */
    modifier onlyOwner() {
        if (msg.sender != LibDiamond.contractOwner())
            revert FeeUtils.CallerNotOwner();
        _;
    }

    /* ========== VIEWS ========== */

    // @notice Gets the performance fee percentage
    // @return the performance fee percentage in basis points
    // so 1000 = 10%.  multiply percentage by 100 to get basis points
    function performanceFeePercentage() external view returns (uint256) {
        return LibFeeStorage.getStorage().performanceFeePercentage;
    }

    // @notice Gets the entire list of tokens that have collected fees
    // if this list gets too long and the view call is timing out,
    // you can use the "one at a time" functions below
    // @return the list of tokens that have collected fees
    function tokensWithCollectedFees() external view returns (address[] memory) {
        return LibFeeStorage.getStorage().tokensWithCollectedFees.values();
    }

    // @notice Gets the length of the tokensWithCollectedFees set
    // @return the length of the tokensWithCollectedFees set
    function tokensWithCollectedFeesLength() external view returns (uint256) {
        return LibFeeStorage.getStorage().tokensWithCollectedFees.length();
    }

    // @notice Gets the token at the given index in the tokensWithCollectedFees set
    // @param index the index of the token to get
    // @return the token at the given index
    function tokensWithCollectedFeesAtIndex(uint256 index) external view returns (address) {
        return LibFeeStorage.getStorage().tokensWithCollectedFees.at(index);
    }


    /* ========== MUTATIVE FUNCTIONS ========== */

    // @notice Withdraws a token from the fee contract.
    // Can only remove the full balance of the token
    // @param tokenAddress the address of the token to withdraw
    // @dev this can only be called by the owner
    function withdrawTokens(address tokenAddress) onlyOwner external {
        // remove the token from the set of tokens that have collected fees
        // since we're withdrawing the full balance of the token
        LibFeeStorage.getStorage().tokensWithCollectedFees.remove(tokenAddress);

        // get the token
        IERC20 token = IERC20(tokenAddress);
        uint256 amount = token.balanceOf(address(this));

        // transfer the token to the owner
        token.transfer(msg.sender, amount);
    }

    // @notice Sets the performance fee percentage
    // @param newPerformanceFeePercentage the new performance fee percentage
    // in basis points
    // so 1000 = 10%.  multiply percentage by 100 to get basis points
    // @dev this can only be called by the owner
    function setPerformanceFeePercentage(uint256 newPerformanceFeePercentage) onlyOwner external {
        LibFeeStorage.getStorage().performanceFeePercentage = newPerformanceFeePercentage;
    }



}