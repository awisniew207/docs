---
category: Developers
title: Custom Policies
---

# What is a Vincent Policy?

A Vincent Policy is a [Lit Action](https://developer.litprotocol.com/sdk/serverless-signing/overview) that determines whether a given Vincent App can execute a Vincent Tool for a Vincent App User. These Policies serve as guardrails that Vincent App Users configure to ensure Vincent Apps can only perform actions within the Vincent App User's intended boundaries and set parameters.

Some examples of what a Vincent Policy can do:

- Permitting a Vincent App to execute a Vincent Tool only when the Vincent App User holds a certain status in a Vincent App's off-chain database
- Enforcing a daily spending limit from the Vincent App User's wallet
- Requiring a Vincent App User to hold a specific ERC721 NFT in order to use a Vincent App

Because Vincent Policies are powered by Lit Actions, they can use both on and off chain data to determine whether a Vincent Tool should execute. Vincent Policies can also write data to on and off chain sources to track state such as:

- Vincent Tool execution frequency
- Spending amounts over time periods
- Any other relevant Vincent Policy data

# How a Vincent Policy Works

- How policies are executed: `precheck` is executed first as a best-effort check that the policy shouldn't fail, then `evaluate` when the Vincent App Delegatee executes a Vincent Tool that uses the policy
- How the `toolParams` and `userParams` are provided as function arguments to the `precheck` and `evaluate` functions
- How the `precheck` function is used by Vincent App Delegatees to check whether a policy might fail given the `toolParams` and `userParams`
- That the `evaluate` function is used to do the actual validation of whether a policy allows the Vincent Tool to execute
- That the `commit` function is executed after all the policies have been evaluated and the Vincent Tool has executed
  - How this function is used to commit results/update an state the policy is dependent on
- What the Policy context object is and what it contains based on the function being executed (e.g. `precheck`, `evaluate`, `commit`)

# What is a Vincent Policy Definition?

Vincent Policies are defined as JSON objects that contain several properties of the policy including the _precheck_, _evaluate_, and _commit_ functions, and the schemas for their expected input parameters and output values.

## Defining a `packageName`

Description

```typescript
// code example
```

## Defining the Parameter Schemas

### `toolParamsSchema`

Description

```typescript
// code example
```

### `userParamsSchema`

Description

```typescript
// code example
```

## Defining the Precheck Function

Description

```typescript
// code example
```

### `precheckAllowResultSchema`

Description

```typescript
// code example
```

### `precheckDenyResultSchema`

Description

```typescript
// code example
```

## Defining the Evaluate Function

Description

```typescript
// code example
```

### `evalAllowResultSchema`

Description

```typescript
// code example
```

### `evalDenyResultSchema`

Description

```typescript
// code example
```

## Defining the Commit Function

Description

```typescript
// code example
```

### `commitAllowResultSchema`

Description

```typescript
// code example
```

### `commitDenyResultSchema`

Description

```typescript
// code example
```
