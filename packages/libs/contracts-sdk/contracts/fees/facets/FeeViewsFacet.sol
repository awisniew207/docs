// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;


import "../LibFeeStorage.sol";
import { ERC4626 } from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { EnumerableSet } from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title FeeViews
 * @notice A contract that contains the views for the Fee Diamond
 */
contract FeeViews {

    /* ========== VIEWS ========== */

    function deposits(address user, address vaultAddress) external view returns (LibFeeStorage.Deposit memory) {
        return LibFeeStorage.getStorage().deposits[user][vaultAddress];
    }

}