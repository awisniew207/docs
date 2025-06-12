---
category: Developers
title: Creating Vincent Tools
---

# What is a Vincent Tool?

A Vincent Tool is a function built using [Lit Actions](https://developer.litprotocol.com/sdk/serverless-signing/overview) that enables Vincent Apps to perform specific actions on behalf of Vincent App Users. These tools are the core functional units that Vincent Apps use to interact with blockchains, APIs, and other services while being governed by user-configured Vincent Policies.

# How a Vincent Tool Works

**Flexible Data Access**
- Read and write on-chain data (token balances, NFT ownership, smart contract state)
- Read and write off-chain data from any HTTP-accessible API or database

**Policy-Driven Execution**
- Execute tools only when all Vincent App User-registered Vincent Policies allow it
- Access policy evaluation results through `policiesContext`

**Type-Safe Development**
- Strongly-typed Zod schemas for your tool functions' parameters and return values
- Clear interfaces between your tool and Vincent Policies with type safety

## Real-World Tool Examples

<!-- TODO Revisit these examples -->

Vincent Tools can implement a wide variety of blockchain and web2 actions, such as:

**Asset Management**
- **Token Operations**: Execute transfers, swaps, and approvals with built-in slippage protection and recipient validation
- **NFT Interactions**: Mint, transfer, and interact with NFT marketplaces
- **Floor Price Protection**: Monitor collection floor prices and automatically list NFTs for sale when prices hit profit targets

**Protocol Integration**
- **DeFi Interactions**: Seamlessly interact with lending protocols, DEXs, and yield farming platforms through standardized interfaces
- **Cross-Chain Coordination**: Execute transactions across multiple blockchains

**Data Processing**
- **API Integration**: Connect to external APIs for price feeds, social data, or custom business logic with authentication handling
- **Event Monitoring**: Watch for specific on-chain events or conditions and trigger automated responses

**Automation & Scheduling**
- **Time-Based Execution**: Schedule recurring transactions or actions based on time intervals, dates, or blockchain events
- **Conditional Logic**: Execute complex workflows with if/then logic based on market conditions, balances, or external data
- **Multi-Step Workflows**: Chain together multiple operations into a single tool execution

# How a Vincent Tool Works

A Vincent Tool consists of two main lifecycle methods executed in the following order:

1. **Precheck**: Executed locally by the Vincent Tool executor, this function provides a best-effort check that the tool execution shouldn't fail
   - Before the execution of your tool's `precheck` function, the Vincent Tool & Policy SDK will execute the `precheck` functions of the Vincent Policies enabled by the Vincent App User for your tool for a specific Vincent App
   - If all Vincent Policies return `allow` results, the Vincent Tool's `precheck` function will be executed
   - This functions is where you'd perform checks such as validating the Vincent Agent Wallet PKP has enough balance to execute the tool logic, has the appropriate on-chain approvals to make token transfers, or anything else you tool can validate before executing the tool logic

2. **Execute**: Executed within the Lit Action environment, this function performs the actual tool logic and has the ability to sign data using the Vincent App User's Agent Wallet PKP
   - Before the execution of your tool's `execute` function, the Vincent Tool & Policy SDK will execute the `evaluate` functions of the Vincent Policies enabled by the Vincent App User for your tool for a specific Vincent App
   - If all Vincent Policies return `allow` results, the Vincent Tool's `execute` function will be executed
   - This functions is where you'd perform the actual tool logic, such as making token transfers, interacting with smart contracts, or anything else you tool needs to do to fulfill the tool's purpose

# Defining Your Vincent Tool

Vincent Tools are created by calling the `createVincentTool` function from the `@lit-protocol/vincent-tool-sdk` package. This function takes a single object parameter that defines your tool's lifecycle methods, parameter schemas, return value schemas, and supported policies.

The basic structure of a Vincent Tool definition is as follows:

```typescript
export const vincentTool = createVincentTool({
  toolParamsSchema,

  supportedPolicies: supportedPoliciesForTool([ ]),

  precheckSuccessSchema,
  precheckFailSchema,
  precheck: async ({ toolParams }, toolContext) => { },

  executeSuccessSchema,
  executeFailSchema,
  execute: async ({ toolParams }, toolContext) => { },
});
```

## The `toolContext` Argument

The `toolContext` argument is provided and managed by the Vincent Tool & Policy SDK. It's an object containing the following properties and is passed as an argument to your tool's `precheck` and `execute` functions:

```typescript
interface ToolContext {
  toolIpfsCid: string;
  appId: number;
  appVersion: number;
  delegation: {
    delegateeAddress: string;
    delegatorPkpInfo: {
      tokenId: string;
      ethAddress: string;
      publicKey: string;
    };
  };
  succeed: (executeSuccessResult) => void;
  fail: (executeFailResult) => void;
}
```

Where:
- `toolIpfsCid`: The IPFS CID of the Vincent Tool that is being executed
- `appId`: The ID of the Vincent App the Vincent Tool is being executed for
- `appVersion`: The version of the Vincent App the Vincent Tool is being executed for
- `delegation`:
  - `delegateeAddress`: The Ethereum address of the Vincent Tool executor
  - `delegatorPkpInfo`:
    - `tokenId`: The token ID of the Vincent App User's Vincent Agent Wallet PKP
    - `ethAddress`: The Ethereum address of the Vincent App User's Vincent Agent Wallet PKP
    - `publicKey`: The public key of the Vincent App User's Vincent Agent Wallet PKP
- `succeed`: A helper method for returning a `success` result from your tool's `precheck` and `execute` functions
- `fail`: A helper method for returning a `fail` result from your tool's `precheck` and `execute` functions

## Parameter Schemas

### `toolParamsSchema`

This Zod schema defines the structure of parameters that executors of your tool will pass to your tool. These should be the parameters you require to execute your tool's functionality, as well as any parameters required by the Vincent Policies your tool supports.

For example, if you are building a token transfer tool that supports a spending limit policy, you might define the `toolParamsSchema` as follows:

```typescript
import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

const toolParamsSchema = z.object({
  tokenAddress: z.string(),
  amountToSend: z.number(),
  recipientAddress: z.string(),
});

const vincentTool = createVincentTool({
  // ... other tool definitions

  toolParamsSchema,
});
```

These parameters give your tool what it needs to send a transaction transferring `amount` of `tokenAddress` to `recipientAddress`.

The `tokenAddress` and `amount` parameters are also the parameters needed to be given to the Vincent spending limit policy which we'll cover in the next section.

## Defining Supported Policies

To add policy support to your tool, you need to create _VincentToolPolicy_ objects using the `createVincentToolPolicy` function from the `@lit-protocol/vincent-tool-sdk` package for each Vincent Policy you want to support. These _VincentToolPolicy_ objects are then added to your tool's `supportedPolicies` array, which binds the policies to your tool and enables proper parameter mapping between your tool and the policies.

### Creating a `VincentToolPolicy` object

Our example Vincent Tool supports a Vincent spending limit policy that has the following schema for the parameters it's expecting to be given by the executing Vincent Tool:

> **Note** The following code is an excerpt from the [Create a Vincent Policy](./Creating-Policies.md#userparamsschema) guide.

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

const vincentPolicy = createVincentPolicy({
  // ... other policy definitions

  toolParamsSchema: z.object({
      tokenAddress: z.string(),
      amount: z.number(),
  }),
});
```

As the Vincent Tool developer, what this means is that both your `precheck` and `execute` functions need to pass a `tokenAddress` and `amount` parameter to the `precheck` and `execute` functions of the Vincent spending limit policy.

Because the name of the parameters given to your tool, as defined by your tool's `toolParamsSchema`, won't always be named the same as or even refer to the same thing as the Vincent Policies your tool supports, we need a way to map the parameters given to your tool to the parameters expected by the Vincent Policies.

To accomplish this, we create a _VincentToolPolicy_ object using the `createVincentToolPolicy` function:

```typescript
import { createVincentTool, createVincentToolPolicy, supportedPoliciesForTool } from '@lit-protocol/vincent-tool-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-spending-limit';
import { z } from 'zod';

const toolParamsSchema = z.object({
  tokenAddress: z.string(),
  amountToSend: z.number(),
  recipientAddress: z.string(),
});

const SpendingLimitPolicy = createVincentToolPolicy({
  toolParamsSchema,
  bundledVincentPolicy,
  toolParameterMappings: {
    tokenAddress: 'tokenAddress',
    amountToSend: 'amount',
  },
});

const vincentTool = createVincentTool({
  // ... other tool definitions

  toolParamsSchema,

  supportedPolicies: supportedPoliciesForTool([SpendingLimitPolicy]),
});
```

A couple of new things are happening in this code example:

First we're importing `bundledVincentPolicy` from the `@lit-protocol/vincent-policy-spending-limit` package, which is a Vincent Policy object created using the Vincent Tool & Policy SDK and exported by the policy author for our tool to consume

Then we're creating a `VincentToolPolicy` object named `SpendingLimitPolicy` using the `createVincentToolPolicy` function. The `createVincentToolPolicy` function takes a single object parameter with the required properties:

- `toolParamsSchema`: The Zod schema you've defined for the parameters your tool expects to be given by the Vincent Tool executor
- `bundledVincentPolicy`: The Vincent Policy object created by the policy author for our tool to consume, which is imported from the `@lit-protocol/vincent-policy-spending-limit` package
- `toolParameterMappings`: An object that maps the parameters given to your tool, to the parameters expected by the Vincent Policy
  - The keys of this object are the parameter names your tool uses (`tokenAddress` and `amountToSend`), and the values are the parameter names expected by the Vincent Policy (`tokenAddress` and `amount`)

Lastly, we take the `SpendingLimitPolicy` object and add it to an array, which we then wrap in a `supportedPoliciesForTool` function call to our tool's `supportedPolicies` array.

This is how we register the `SpendingLimitPolicy` with our tool, and is all that's needed for your tool to support the Vincent spending limit policy. The execution of the policy's `precheck` and `evaluate` functions will be handled for you by the Vincent Tool & Policy SDK, as well as processing the return values from the policy's `precheck` and `evaluate` functions to check if the tool should be allowed to execute.
