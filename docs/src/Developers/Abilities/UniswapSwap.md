---
title: Uniswap Swap
---

# Uniswap Swap

The Uniswap Swap Ability enables Vincent Apps to execute token swaps using Uniswap V3 on behalf of Vincent Users. This allows Vincent Apps to utilize decentralized exchanges without requiring Vincent App Users having to manually approve each swap transaction.

This Vincent Ability also supports the [Spending Limit Policy](../Policies/SpendingLimit.md), which allows Vincent Users to restrict how much total value can be spent by the Vincent App.

## Key Features

- **Secure Token Swapping**: Executes Uniswap V3 swaps using Vincent Agent Wallets within Lit Protocol's secure Trusted Execution Environment
- **Comprehensive Pre-swap Validation**: Verifies token balances, allowances, pool existence, and gas fees before execution
- **Spending Limit Integration**: Enforces spending limits through optional Vincent Policy integration to protect Vincent App Users from unintended spending
- **Multi-chain Support**: Works on any EVM-compatible network supported by Uniswap V3

## How It Works

The Uniswap Swap Ability is built using the [Vincent Ability SDK](../Ability-Developers/Creating-Abilities.md) and operates in two phases:

1. **Precheck Phase**: Validates all prerequisites for the swap

   - Verifies the user has a non-zero native token balance for gas fees
   - Validates that the Uniswap router has adequate allowance to spend the input ERC20 token
   - Checks that the user has sufficient balance of the input ERC20 token
   - Confirms that a Uniswap pool exists for the specified token pair
   - Returns success if all validations pass

2. **Execution Phase**: Executes the ERC20 token swap and updates the Spending Limit Policy tracking if enabled by the Vincent App User

   - If the Vincent App User has enabled the Spending Limit Policy:
     - The USD value of the input ERC20 token amount is determined by first converting the token amount to its ETH equivalent, then using Chainlink's ETH/USD price feed to calculate the corresponding USD amount.
     - The calculated USD amount is then provided to the Spending Limit Policy to be committed and update the total amount spent by the Vincent App on behalf of the Vincent App User
     - If the Spending Limit Policy is successfully updated, and the spending limit has not been exceeded, the Swap Ability continues to execute
     - However, if the Spending Limit Policy fails to update, or the spending limit is exceeded, the Swap Ability will return an error and the swap is not executed.
   - The Uniswap V3 swap transaction is created, signed, and broadcasted to the blockchain network
   - Returns both the Uniswap swap transaction hash and spending limit update transaction hash if the Spending Limit Policy is enabled

## Getting Started

Depending on your role in the Vincent Ecosystem, you'll be interacting with this Ability in different ways. Click on the link below that matches your role to see how to get started:

- **Vincent App Developers**: If you're building a Vincent App that needs to execute token swaps, go [here](#adding-the-ability-to-your-vincent-app).
- **Vincent App Delegatees**: If you're executing this ability on behalf of Vincent App Users, go [here](#executing-the-ability-as-a-delegatee).

## Adding the Ability to your Vincent App

If you want to enable your App Delegatees to execute token swaps on behalf of your Vincent App Users, you can add this Ability to your App.

Adding Abilities to your Vincent App is done using the [Vincent App Dashboard](https://dashboard.heyvincent.ai/). Visit the [Create Vincent App](../App-Agent-Developers/Creating-Apps.md) guide to learn more about how to add Abilities to your App during creation, or check out the [Upgrading Your App](../App-Agent-Developers/Upgrading-Apps.md) guide to learn how to add Abilities to an existing App.

## Executing the Ability as a Vincent App Delegatee

Vincent App Users configure the Policies that govern Ability execution while connecting to the Vincent App.

If the Vincent App you're a Delegatee for has enabled the Spending Limit Policy for this Ability, then the total USD value that can be swapped will be restricted to what the Vincent App User has configured. To learn more about how the Policy works, and how it affects your execution of this Ability, see the [Spending Limit Policy](../Policies/SpendingLimit.md) documentation.

<div class="box info-box">
  <p class="box-title info-box-title">
    <span class="box-icon info-icon">Info</span> Note
  </p>
  <p>To learn more about executing Vincent Abilities, see the <a href="../App-Agent-Developers/Executing-Abilities.md">Executing Abilities</a> guide.</p>
</div>

### Prerequisites

Before executing a Uniswap swap, the following conditions must be met. You can use the Ability's `precheck` function to check if these conditions are met, or you can check them manually.

#### ERC20 Token Approval

The Vincent App User's Agent Wallet must have approved the Uniswap V3 Router to spend the input token.

If your Vincent App has enabled the [ERC20 Approval Ability](./Erc20Approval.md), you can use it to handle submitting the approval transaction using the Vincent Agent Wallet.

#### Token & Gas Balances

The Vincent App User's Agent Wallet must have sufficient balance of the input token to perform the swap, and sufficient native tokens (ETH, MATIC, etc.) to pay for the swap transaction gas fees.

#### Uniswap V3 Pool Existence

A Uniswap V3 pool must exist for the specified token pair on the target network.

### Executing the `precheck` Function

This Ability's `precheck` function validates all prerequisites for executing a Uniswap swap without actually performing the swap. The specific validation checks were covered in the [How It Works](#how-it-works) section.

Before executing the `precheck` function, you'll need to provide the following parameters for the Uniswap swap:

```typescript
{
  /**
   * An Ethereum Mainnet RPC Endpoint.
   * This is used to check USD <> ETH prices via Chainlink.
   */
  ethRpcUrl: string;
  /**
   * An RPC endpoint for any chain that is supported by the @uniswap/sdk-core package.
   * Must work for the chain specified in chainIdForUniswap.
   */
  rpcUrlForUniswap: string;
  /**
   * The chain ID to execute the transaction on.
   * For example: 8453 for Base.
   */
  chainIdForUniswap: number;
  /**
   * ERC20 Token address to sell.
   * For example 0x4200000000000000000000000000000000000006 for WETH on Base.
   */
  tokenInAddress: string;
  /**
   * ERC20 Token to sell decimals.
   * For example 18 for WETH on Base.
   */
  tokenInDecimals: number;
  /**
   * Amount of token to sell.
   * For example 0.00001 for 0.00001 WETH. Must be greater than 0.
   */
  tokenInAmount: number;
  /**
   * ERC20 Token address to buy.
   * For example 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 for USDC on Base.
   */
  tokenOutAddress: string;
  /**
   * ERC20 Token to buy decimals.
   * For example 6 for USDC on Base.
   */
  tokenOutDecimals: number;
}
```

To execute `precheck`, you'll need to:

- Create an instance of the `VincentAbilityClient` using the `getVincentAbilityClient` function (imported from `@lit-protocol/vincent-app-sdk/abilityClient`)
  - Pass in the Ability's `bundledVincentAbility` object (imported from `@lit-protocol/vincent-ability-uniswap-swap`)
  - Pass in the `ethersSigner` you'll be using to sign the request to Lit with your Delegatee private key
- Prepare the required parameters to call the `precheck` function
- Use the `VincentAbilityClient` instance to call the `precheck` function

```typescript
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';
import { bundledVincentAbility } from '@lit-protocol/vincent-ability-uniswap-swap';

// Create ability client
const abilityClient = getVincentAbilityClient({
  bundledVincentAbility: bundledVincentAbility,
  ethersSigner: yourEthersSigner,
});

// Prepare swap parameters
const swapParams = {
  ethRpcUrl: 'https://eth.llamarpc.com', // Ethereum mainnet RPC for price data
  rpcUrlForUniswap: 'https://mainnet.base.org', // Base RPC for swap execution
  chainIdForUniswap: 8453, // Base chain ID
  tokenInAddress: '0x4200000000000000000000000000000000000006', // WETH on Base
  tokenInDecimals: 18,
  tokenInAmount: 0.001, // 0.001 WETH
  tokenOutAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
  tokenOutDecimals: 6,
};

const precheckResult = await abilityClient.precheck(swapParams, {
  delegatorPkpEthAddress: '0x...', // The Vincent App User's Agent Wallet address
});

if (precheckResult.success) {
  console.log('Swap precheck passed, ready to execute');
} else {
  // Handle different types of failures
  if (precheckResult.runtimeError) {
    console.error('Runtime error:', precheckResult.runtimeError);
  }
  if (precheckResult.schemaValidationError) {
    console.error('Schema validation error:', precheckResult.schemaValidationError);
  }
  if (precheckResult.result) {
    console.error('Swap precheck failed:', precheckResult.result.reason);
  }
}
```

#### Precheck Success Response

A successful `precheck` response indicates that all prerequisites for the swap have been validated (there is no return value from this Ability's `precheck` function).

#### Precheck Failure Response

A failure `precheck` response will contain:

```typescript
{
  /**
   * The reason the precheck failed, such as insufficient balance,
   * missing allowance, or non-existent pool.
   */
  reason?: string;
}
```

### Executing the `execute` Function

This Ability's `execute` function performs the actual Uniswap swap and updates the Spending Limit Policy tracking if enabled by the Vincent App User.

The `execute` function expects the same parameters as the `precheck` function, and can be executed using the same `VincentAbilityClient` instance:

```typescript
const executeResult = await abilityClient.execute(swapParams, {
  delegatorPkpEthAddress: '0x...', // The Vincent App User's Agent Wallet address
});

if (executeResult.success) {
  const { swapTxHash, spendTxHash } = executeResult.result;

  console.log('Swap transaction:', swapTxHash);
  if (spendTxHash) {
    console.log('Spending limit tracking transaction:', spendTxHash);
  }
} else {
  // Handle different types of failures
  if (executeResult.runtimeError) {
    console.error('Runtime error:', executeResult.runtimeError);
  }
  if (executeResult.schemaValidationError) {
    console.error('Schema validation error:', executeResult.schemaValidationError);
  }
  if (executeResult.result) {
    console.error('Swap execution failed:', executeResult.result.reason);
    if (executeResult.result.spendingLimitCommitFail) {
      console.error('Spending limit commit failed:', executeResult.result.spendingLimitCommitFail);
    }
  }
}
```

#### Execute Success Response

A successful `execute` response will contain:

```typescript
{
  /**
   * The hash of the Uniswap swap transaction
   */
  swapTxHash: string;
  /**
   * The hash of the transaction recording the amount spent in the Spending Limit Policy.
   * Will be undefined if no spending limit policy is configured.
   */
  spendTxHash?: string;
}
```

#### Execute Failure Response

A failure `execute` response will contain:

```typescript
{
  /**
   * The reason the execution failed, such as insufficient balance,
   * missing allowance, or non-existent pool.
   */
  reason?: string;
  /**
   * Details about spending limit policy commit failures, if applicable.
   */
  spendingLimitCommitFail?: {
    runtimeError?: string;
    schemaValidationError?: any;
    structuredCommitFailureReason?: any;
  };
}
```

## Important Considerations

### Spending Limit Policy Integration

When the Spending Limit Policy is configured for this Ability, the swap amount will be converted to USD and tracked against the Vincent App User's spending limit for your Vincent App. The policy commit occurs before the swap to ensure spending is tracked before the swap transaction is executed, even if the swap transaction fails.

Although this approach can still lead to inconsistencies in Spending Limit tracking (for example, if the spend is recorded but the swap transaction fails and no tokens are swapped), it is safer to record the spend and have the swap fail than to allow a swap to occur without recording the spend. The latter scenario could result in the Vincent App exceeding the user's spending limit.

### Price Impact and Slippage

This Ability uses a fixed `0.5%` slippage tolerance for all swaps. For large swaps, consider the potential price impact on the token pair, as the `0.5%` slippage protection may not be sufficient for trades that significantly move the market.

### Network Support

The Ability works on networks supported by the [@uniswap/sdk-core](https://www.npmjs.com/package/@uniswap/sdk-core) package where Uniswap V3 is deployed. Ensure the `chainIdForUniswap` corresponds to one of the [supported networks](https://github.com/Uniswap/sdks/blob/main/sdks/sdk-core/src/chains.ts).

## Error Handling

Common failure scenarios include:

- **Insufficient ERC20 Token Balance**: The Agent Wallet doesn't have enough of the input token
- **Insufficient Native Token Balance**: The Agent Wallet doesn't have enough native tokens (ETH, MATIC, etc.) to pay for the swap transaction gas fees
- **Missing ERC20 Token Approval**: The Uniswap router doesn't have permission to spend the input token
- **No Uniswap Pool**: No Uniswap pool exists for the specified token pair
- **Spending Limit Exceeded**: The swap would exceed the configured spending limit
