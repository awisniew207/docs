---
category: Official Abilities
title: EVM Transaction Signer
---

# EVM Transaction Signer

The EVM Transaction Signer Ability enables Vincent Apps to sign Ethereum Virtual Machine (EVM) transactions on behalf of Vincent Users using their Vincent Agent Wallets. This enables Vincent Apps to interact with contracts even if there isn't an explicit Vincent Ability made for interacting with that contract.

This Vincent Ability also supports the [Contract Whitelist Policy](../Policies/ContractWhitelist.md), which allows Vincent Users to restrict which contracts and functions can be called before this Ability signs transactions on their behalf.

## Key Features

- **Secure Transaction Signing**: Signs transactions using Vincent Agent Wallets within Lit Protocol's secure Trusted Execution Environment
- **Full Transaction Support**: Handles all EVM transaction types including legacy, EIP-2930, and EIP-1559
- **Policy Integration**: Supports the Contract Whitelist Policy for restricting what transactions can be signed

## How It Works

The EVM Transaction Signer Ability is built using the [Vincent Ability SDK](../Ability-Developers/Creating-Abilities.md) and operates in two phases:

1. **Precheck Phase**: Validates the transaction structure and runs policy checks

   - Deserializes the provided serialized transaction using ethers.js
   - Validates all required fields are present (nonce, gasPrice, gasLimit, etc.)
   - Returns the deserialized unsigned transaction for as confirmation

2. **Execution Phase**: If permitted by the evaluated Policies, signs the serialized transaction
   - Signs the transaction using the Vincent App User's Agent Wallet
   - Returns both the signed transaction hex string and the deserialized signed transaction object

## Getting Started

Depending on your role in the Vincent Ecosystem, you'll be interacting with this Ability in different ways. Click on the link below that matches your role to see how to get started:

- **Vincent App Developers**: If you're building a Vincent App that needs to sign transactions, go [here](#adding-the-policy-to-your-vincent-app).
- **Vincent App Delegatees**: If you're executing this ability on behalf of users, go [here](#executing-the-ability-as-a-delegatee).

## Adding the Policy to your Vincent App

When defining your Vincent App, you select which Abilities you want to be able to execute on behalf of your users. If you want to enable your App Delegatees to be able to sign transactions on behalf of your Vincent App Users, allowing them to interact with contracts that don't have an explicit Vincent Ability made for interacting with them, you can add this Ability to your App.

Adding Abilities to your Vincent App is done using the Vincent App management interface, or while creating the App. Visit the [Creating Vincent Apps](../App-Agent-Developers/Creating-Apps.md) guide to learn more about how to add Abilities to your App during creation, or check out the [Upgrading Vincent Apps](../App-Agent-Developers/Upgrading-Apps.md) guide to learn how to add Abilities to an existing App.

## Executing the Ability as a Vincent App Delegatee

Vincent App Users configure the Policies that govern Ability execution while consenting to the Vincent App. If the Vincent App you're a Delegatee for has enabled the Contract Whitelist Policy for this Ability, then what contracts and functions that can be called will be restricted to what the Vincent App User has whitelisted. To learn more about how the Policy works, and how it affects your execution of this Ability, see the [Contract Whitelist Policy](../Policies/ContractWhitelist.md) documentation.

### Executing the `precheck` Function

To execute this Ability on behalf of a Vincent App User, you'll need to create the complete EVM transaction object (which must contain all required properties such as `to`, `value`, `data`, `chainId`, `nonce`, `gasLimit`, and gas pricing) you want the user's Agent Wallet to sign, and serialize it into a hex string. The Ability expects this serialized transaction as the only parameter, and is required to execute the `precheck` function.

To execute the Ability's `precheck` function, you'll need to:

- Create an instance of the `VincentAbilityClient` using the `getVincentAbilityClient` function (imported from `@lit-protocol/vincent-app-sdk/abilityClient`)
  - Pass in the Ability's `bundledVincentAbility` object (imported from `@lit-protocol/vincent-ability-evm-transaction-signer`)
  - Pass in the `ethersSigner` you'll be using to sign the request to Lit with your Delegatee private key
- Create the transaction object you want the Vincent App User's Agent Wallet to sign
- Serialize the transaction object into a hex string using `ethers.utils.serializeTransaction`
- Call the `precheck` function on the `VincentAbilityClient` instance, passing in the serialized transaction and the Vincent App User's Agent Wallet address

```typescript
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';
import { bundledVincentAbility } from '@lit-protocol/vincent-ability-evm-transaction-signer';

// Create ability client
const abilityClient = getVincentAbilityClient({
  bundledVincentAbility: bundledVincentAbility,
  ethersSigner: yourEthersSigner,
});

// Create a transaction
const transaction = {
  to: '0x4200000000000000000000000000000000000006', // Base WETH
  value: '0x00',
  data: '0xa9059cbb...', // ERC20 transfer function call
  chainId: 8453,
  nonce: 0,
  gasPrice: '0x...',
  gasLimit: '0x...',
};

// Serialize the transaction
const serializedTx = ethers.utils.serializeTransaction(transaction);

const precheckResult = await abilityClient.precheck(
  {
    serializedTransaction: serializedTx,
  },
  {
    delegatorPkpEthAddress: '0x...', // The Vincent App User's Agent Wallet address that will sign the transaction
  },
);

if (precheckResult.success) {
  const { deserializedUnsignedTransaction } = precheckResult.result;
  // Use the deserialized transaction
} else {
  // Inspect the precheckResult to see why the transaction signature was denied
}
```

A successful `precheck` response will contain the deserialized unsigned transaction object, which you can use to inspect the validated transaction details before signing:

```typescript
{
  deserializedUnsignedTransaction: {
    to?: string;
    nonce?: number;
    gasLimit: string;
    gasPrice?: string;
    data: string;
    value: string;
    chainId: number;
    type?: number;
    accessList?: any[];
    maxPriorityFeePerGas?: string;
    maxFeePerGas?: string;
  }
}
```

### Executing the `execute` Function

This Ability's `execute` function signs the serialized transaction if permitted by the evaluated Policies.

The `execute` function expects a single parameter which is the serialized unsigned transaction created above, and you can use the same Vincent Ability Client to execute the functions like so:

```typescript
const executeResult = await abilityClient.execute(
  {
    serializedTransaction: serializedTx,
  },
  {
    delegatorPkpEthAddress: '0x...', // The Vincent App User's Agent Wallet address that will sign the transaction
  },
);

if (executeResult.success) {
  const { signedTransaction, deserializedSignedTransaction } = executeResult.result;
  // Use the signed transaction
} else {
  // Inspect the executeResult to see why the transaction signature was denied
}
```

A successful `execute` response will contain the signed transaction hex and the deserialized signed transaction object, which you can use to inspect the signed transaction details before broadcasting the signed transaction:

```typescript
{
  signedTransaction: string; // The signed transaction ready for broadcast
  deserializedSignedTransaction: {
    hash?: string;
    to: string;
    from: string;
    nonce: number;
    gasLimit: string;
    gasPrice?: string;
    data: string;
    value: string;
    chainId: number;
    v: number;
    r: string;
    s: string;
    type?: number;
    accessList?: any[];
    maxPriorityFeePerGas?: string;
    maxFeePerGas?: string;
  }
}
```
