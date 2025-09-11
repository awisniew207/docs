---
title: Uniswap Swap
---

# Uniswap Swap

The Uniswap Swap Ability enables Vincent Apps to execute token swaps using Uniswap V3 on behalf of Vincent Users. This allows Vincent Apps to utilize decentralized exchanges without requiring Vincent App Users having to manually approve each swap transaction.

## Key Features

- **Secure Token Swapping**: Executes Uniswap V3 swaps using Vincent Wallets within Lit Protocol's secure Trusted Execution Environment
- **Multi-hop Route Optimization**: Uses Uniswap's Alpha Router to find optimal swap paths through multiple pools
- **Comprehensive Pre-swap Validation**: Verifies token balances, allowances, pool existence, and gas fees before execution
- **Multi-chain Support**: Works on any EVM-compatible network supported by Uniswap V3

## How It Works

The Uniswap Swap Ability is built using the [Vincent Ability SDK](../Ability-Developers/Creating-Abilities.md) and operates in three phases:

1. **Quote Generation Phase**: Creates a signed swap quote using a dedicated PKP

- Uses Uniswap's Alpha Router to find the optimal swap route through multiple pools
- Calculates expected output amounts, gas costs, and price impact
- Signs the quote with a dedicated [Lit Protocol PKP](https://developer.litprotocol.com/user-wallets/pkps/overview)
- Returns the tamper-proof signed quote containing all swap parameters

2. **Precheck Phase**: Validates all prerequisites for the swap using the signed quote

- Verifies the signed quote's authenticity using the dedicated PKP's signature
- Validates the user has a non-zero native token balance for gas fees
- Checks that the user has sufficient balance of the input ERC20 token
- Confirms that the Uniswap router has adequate allowance to spend the input ERC20 token
- Returns success if all validations pass

3. **Execution Phase**: Executes the ERC20 token swap using the verified signed quote

- Verifies the signed quote's authenticity using the dedicated PKP's signature
- A transaction is created with the route from the signed quote, then signed using the Vincent App User's Agent Wallet
- The signed Uniswap V3 swap transaction is broadcasted to the network
- The Uniswap swap transaction hash is returned

## Getting Started

Depending on your role in the Vincent Ecosystem, you'll be interacting with this Ability in different ways. Click on the link below that matches your role to see how to get started:

- **Vincent App Developers**: If you're building a Vincent App that needs to execute token swaps, go [here](#adding-the-ability-to-your-vincent-app).
- **Vincent App Delegatees**: If you're executing this ability on behalf of Vincent App Users, go [here](#executing-the-ability-as-a-delegatee).

## Adding the Ability to your Vincent App

If you want to enable your App Delegatees to execute token swaps on behalf of your Vincent App Users, you can add this Ability to your App.

Adding Abilities to your Vincent App is done using the [Vincent App Dashboard](https://dashboard.heyvincent.ai/). Visit the [Create Vincent App](../App-Agent-Developers/Creating-Apps.md) guide to learn more about how to add Abilities to your App during creation, or check out the [Upgrading Your App](../App-Agent-Developers/Upgrading-Apps.md) guide to learn how to add Abilities to an existing App.

## Executing the Ability as a Vincent App Delegatee

### Prerequisites

### Step 1: Generate a Signed Swap Quote

Before executing the `precheck` or `execute` functions, you must first generate a signed swap quote using the `getSignedUniswapQuote` function. This function uses Uniswap's Alpha Router to find the optimal swap path and signs it with a dedicated PKP to prevent tampering.

```typescript
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { getSignedUniswapQuote } from '@lit-protocol/vincent-ability-uniswap-swap';
import { ethers } from 'ethers';

// Initialize Lit Node Client
const litNodeClient = new LitNodeClient({
  litNetwork: 'datil',
  debug: true,
});
await litNodeClient.connect();

// Your delegatee signer (one of the delegatee signers for the Vincent App)
const delegateeSigner = new ethers.Wallet('YOUR_DELEGATEE_PRIVATE_KEY', provider);

// Generate the signed quote
const signedUniswapQuote = await getSignedUniswapQuote({
  quoteParams: {
    rpcUrl: 'https://mainnet.base.org',
    tokenInAddress: '0x4200000000000000000000000000000000000006', // WETH on Base
    tokenInAmount: '0.001',
    tokenOutAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    recipient: delegatorPkpEthAddress, // The Vincent App User's Vincent Wallet address
    slippageTolerance: 100, // Optional: 100 basis points = 1% (defaults to 50 basis points = 0.5%)
  },
  ethersSigner: delegateeSigner,
  litNodeClient,
});
```

The signed quote contains:

- **quote**: The Uniswap route with transaction parameters, expected outputs, and gas estimates
- **signature**: A signature of the quote data from the dedicated PKP ensuring the quote hasn't been tampered with
- **dataSigned**: The message hash that was signed by the PKP
- **signerPublicKey**: The public key of the PKP that signed the quote
- **signerEthAddress**: The Ethereum address of the PKP that signed the quote

### Step 2: Execute the `precheck` Function

Before executing a Uniswap swap, the following conditions must be met. You can use the Ability's `precheck` function to check if these conditions are met, or you can check them manually.

#### ERC20 Token Approval

The Vincent App User's Vincent Wallet must have approved the Uniswap V3 Router to spend sufficient amount of the input token.

If your Vincent App has enabled the [ERC20 Approval Ability](./Erc20Approval.md), you can use it to handle submitting the approval transaction using the App User's Vincent Wallet.

#### Token & Gas Balances

The Vincent App User's Vincent Wallet must have sufficient balance of the input token to perform the swap, and sufficient native tokens (ETH, MATIC, etc.) to pay for the swap transaction gas fees.

#### Uniswap V3 Pool Existence

A valid signed Uniswap quote created by this Ability's `getSignedUniswapQuote` function which will have a valid route with a valid Uniswap V3 pool for the specified token pair on the target network.

This Ability's `precheck` function validates all prerequisites for executing a Uniswap swap using the signed quote, without actually performing the swap.

The `precheck` function requires the following parameters:

```typescript
{
  /**
   * An RPC endpoint for the chain where the swap will be executed.
   */
  rpcUrlForUniswap: string;
  /**
   * The signed Uniswap quote generated from Step 1.
   */
  signedUniswapQuote: {
    quote: UniswapQuote;
    signature: string;
  }
}
```

To execute `precheck`:

```typescript
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';
import { bundledVincentAbility } from '@lit-protocol/vincent-ability-uniswap-swap';

// Create ability client
const abilityClient = getVincentAbilityClient({
  bundledVincentAbility,
  ethersSigner: delegateeSigner,
});

// Run precheck with the signed quote
const precheckResult = await abilityClient.precheck(
  {
    rpcUrlForUniswap: 'https://mainnet.base.org',
    signedUniswapQuote: {
      quote: signedUniswapQuote.quote,
      signature: signedUniswapQuote.signature,
    },
  },
  {
    delegatorPkpEthAddress: '0x...', // The Vincent App User's Vincent Wallet address
  },
);

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

### Step 3: Execute the `execute` Function

This Ability's `execute` function performs the actual Uniswap swap using the signed quote.

The `execute` function expects the same parameters as the `precheck` function, and can be executed using the same `VincentAbilityClient` instance:

```typescript
const executeResult = await abilityClient.execute(
  {
    rpcUrlForUniswap: 'https://mainnet.base.org',
    signedUniswapQuote: {
      quote: signedUniswapQuote.quote,
      signature: signedUniswapQuote.signature,
    },
  },
  {
    delegatorPkpEthAddress: '0x...', // The Vincent App User's Vincent Wallet address
  },
);

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
}
```

## Important Considerations

### Price Impact and Slippage

The Ability uses a default slippage tolerance of 0.5% (50 basis points). The delegatee can override this by passing the optional `slippageTolerance` parameter when calling `getSignedUniswapQuote`. The slippage is specified in basis points (e.g., 50 for 0.5%, 100 for 1%, 500 for 5%). The signed quote includes slippage protection built into the route calculation. For large swaps, the Alpha Router will automatically account for price impact across multiple pools to find the best execution path.

### Network Support

The Ability works on networks supported by the [@uniswap/sdk-core](https://www.npmjs.com/package/@uniswap/sdk-core) package where Uniswap V3 is deployed. Ensure that the `rpcUrl` provided to `getSignedUniswapQuote` corresponds to one of the [supported networks](https://github.com/Uniswap/sdks/blob/main/sdks/sdk-core/src/chains.ts).

## Error Handling

Common failure scenarios include:

- **Invalid Signed Quote**: The provided quote signature is invalid or the quote has been tampered with
- **Expired Quote**: The signed quote is too old and the market conditions have changed significantly
- **Insufficient ERC20 Token Balance**: The Vincent Wallet doesn't have enough of the input token
- **Insufficient Native Token Balance**: The Vincent Wallet doesn't have enough native tokens (ETH, MATIC, etc.) to pay for the swap transaction gas fees
- **Missing ERC20 Token Approval**: The Uniswap router doesn't have permission to spend the input token

## Complete Example

For a complete working example showing the full workflow from quote generation to swap execution, including ERC20 approvals, see the [swap.spec.ts](https://github.com/LIT-Protocol/Vincent/blob/main/packages/apps/abilities-e2e/test-e2e/swap.spec.ts) end-to-end test in the abilities-e2e package.
