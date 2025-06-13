---
category: Developers
title: Tool Client SDK
---

# What is the Tool Client SDK?

As a Vincent App developer, the Tool Client SDK is the core interface that you use to execute Vincent Tools on behalf of your Vincent Users. It provides a type-safe wrapper that orchestrates the complete Tool execution lifecycle - from running precheck validations for both the Tool and any Vincent Policies the Vincent User has configured for your Vincent App, to executing the Vincent Tool to perform the programmed action on behalf of the Vincent User.

# How the Tool Client SDK Works

An instance of the Tool Client is created by calling the `createVincentToolClient` function from the `@lit-protocol/vincent-sdk` package. This function takes a Vincent Tool definition and an ethers signer, returning a client with `precheck` and `execute` methods:

1. **Precheck**: Executes the Vincent Tool's `precheck` function to provide quick and cost-free feedback on whether the Tool execution is likely to succeed. This function:

   - Validates the parameters you pass against the Vincent Tool's `toolParamsSchema`
   - Evaluates the `precheck` function for both the Vincent Tool and any Vincent Policies the Vincent User has configured for your Vincent App
     - **Note** Execution of the Tool's `precheck` logic will **not** happen unless all of the registered Vincent Policies pass their prechecks
   - Returns the results of the Vincent Tool and Policy `precheck` functions, providing context on why the precheck logic has determined Tool execution is likely to succeed or fail

2. **Execute**: Executes the Vincent Tool using the Lit Protocol network to perform the programmed Vincent Tool actions on behalf of the Vincent User. This function:
   - Validates Tool parameters and evaluates Vincent Policies registered by the Vincent User for your Vincent App
     - **Note** Execution of the Tool's logic will **not** happen unless all of the registered Vincent Policies permit execution
   - Executes the Tool's logic within a secure Lit Action environment
   - Returns the execution results of both the Vincent Tool and any registered Vincent Policies registered by the Vincent User for your Vincent App

# Creating a Tool Client

Vincent Tool Clients are created using the `createVincentToolClient` function from the `@lit-protocol/vincent-sdk` package. This function takes a Vincent Tool definition (installed from NPM and imported into your code from a Vincent Tool packages) and an ethers signer, returning a client with `precheck` and `execute` methods.

The following code uses an example Vincent Tool package for reference:

```typescript
import { ethers } from 'ethers';
import { createVincentToolClient } from '@lit-protocol/vincent-sdk';
import { vincentTool } from '@my-npm-org/vincent-tool-my-tool';

const ethersSigner = new ethers.Wallet(process.env.VINCENT_APP_DELEGATEE_PRIVATE_KEY);

const vincentToolClient = createVincentToolClient({
  vincentTool,
  ethersSigner,
});
```

The two required parameters for the `createVincentToolClient` function are:

1. `vincentTool`: The Vincent Tool definition you want to execute on behalf of the Vincent User, imported from a Vincent Tool package
2. `ethersSigner`: An Ethers.js signer that will be used to sign the request to the Lit Protocol network to execute the Tool on behalf of the Vincent User
   - The corresponding Ethereum address of the signer **must** be added as a _Vincent App Delegatee_ for the Vincent App you are executing the Vincent Tool for. You can see how to add a delegatee to your Vincent App [here](./Quick-Start.md#2-registering-an-app-using-the-app-dashboard)

# Executing the Tool Client's `precheck` function

After creating a Tool Client for a Vincent Tool, you can execute the `precheck` to get a response on whether of not executing the Vincent Tool's `execute` function is likely to succeed.

The `precheck` function takes two arguments:

1. `toolParams`: The parameters you want to pass to the Vincent Tool's `precheck` function, it will need to satisfy the Tool's `toolParamsSchema`
2. `context`: An object that provides additional context to the Vincent Tool and Policy `precheck` functions

The interface for the `context` object is as follows:

```typescript
interface PrecheckContext {
  rpcUrl?: string;
  delegator: string;
  toolIpfsCid: string;
  appId: number;
  appVersion: number;
}
```

Where:

- `rpcUrl`: An RPC URL to be passed
- `delegator`: The Ethereum address of the Vincent User
- `toolIpfsCid`: The IPFS CID of the Tool
- `appId`: The ID of the Vincent App
- `appVersion`: The version of the Vincent App

```typescript
// Previous code left out for brevity

const precheckResult = await vincentToolClient.precheck(toolParams);
```
