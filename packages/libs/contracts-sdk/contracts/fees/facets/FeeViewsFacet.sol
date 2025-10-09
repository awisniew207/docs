// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../LibFeeStorage.sol";
import { ERC4626 } from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { EnumerableSet } from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title FeeViewsFacet
 * @notice A contract that contains the views for the Fee Diamond
 */
contract FeeViewsFacet {

    /* ========== VIEWS ========== */

    /**
     * @notice Gets the deposit for a user and vault
     * @param user the user to get the deposit for
     * @param vaultAddress the vault to get the deposit for
     * @return the deposit for the user and vault
     */
    function deposits(address user, address vaultAddress) external view returns (LibFeeStorage.Deposit memory) {
        return LibFeeStorage.getStorage().deposits[user][vaultAddress];
    }

}