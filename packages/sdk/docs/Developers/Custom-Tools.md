---
category: Developers
title: Custom Tools
---

# What is a Vincent Tool?

A Vincent Tool is an **immutable** serverless function that the User permits a Vincent App to perform specific actions on their behalf.

Vincent Tools can serve specific use cases, such as minting a reward token based on off-chain data, or they can serve general purposes, such as enabling ERC20 token swaps using the best price across multiple DEXs.

Vincent Tools leverage Lit Protocol's [Lit Actions](https://developer.litprotocol.com/sdk/serverless-signing/overview) to execute immutable and decentralized serverless functions that can read and write data to both on and off-chain sources, perform arbitrary computations, and sign blockchain transactions.

**On-chain example:** Uses AI to buy the hottest ERC20 token on Uniswap.
	
**Off-chain example:** Trade stocks with your broker API key.

# How a Vincent Tool Works

- How tools are executed: `precheck` is executed first as a best-effort check that the tool shouldn't fail, then `execute` when the Vincent App Delegatee wants to execute a Vincent Tool on behalf of the Vincent App User
- How the `toolParams` are provided as function arguments to the `precheck` and `execute` functions
- How the `precheck` function is used by Vincent App Delegatees to check whether a tool might fail given the `toolParams`
- That the `execute` function is used to do the actual execution of the tool
- What the Tool context object is and what it contains based on the function being executed (e.g. `precheck`, `execute`)

# What is a Vincent Tool Definition?

Vincent Tools are defined as JSON objects that contain several properties of the tool including the _precheck_ and _execute_ functions, and the schemas for their expected input parameters and output values.

- How a `VincentToolPolicy` is created using the `createVincentToolPolicy` function, and what it's used for
  - What the `toolParameterMappings` property is and how it maps the tool's parameters to the policy's parameters
- What the `supportedPolicies` property is and how it defines the policies that are supported by the tool

## Defining the Tool Parameter Schema

Description

```typescript
// code example
```

## Creating Vincent Tool Policies

Description

```typescript
// code example
```

### `toolParameterMappings`

Description

```typescript
// code example
```

## Defining the Supported Policies

Description

```typescript
// code example
```

## Defining the Precheck Function

Description

```typescript
// code example
```

### `precheckSuccessSchema`

Description

```typescript
// code example
```

### `precheckFailSchema`

Description

## Defining the Execute Function

Description

```typescript
// code example
```

### `executeSuccessSchema`

Description

```typescript
// code example
```

### `executeFailSchema`

Description

```typescript
// code example
```

