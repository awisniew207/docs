---
category: Developers
title: Custom Policies
---

# What is a Vincent Policy?

A Vincent Policy is a function built using [Lit Actions](https://developer.litprotocol.com/sdk/serverless-signing/overview) and are programmable guardrails for Vincent Tool executions. These policies have user-configurable parameters and determine whether a Vincent App can execute specific Vincent Tools on behalf of a Vincent App User, ensuring that autonomous agents and Vincent Apps operate strictly within user-defined boundaries.

## Key Capabilities

Vincent Policies provide a comprehensive framework for building sophisticated guardrails:

**Flexible Data Access**
- Read and write on-chain data (token balances, NFT ownership, smart contract state)
- Read and write off-chain data from any HTTP-accessible API or database

**Stateful Policy Management**
- Persist data across executions to track cumulative metrics
- Implement sophisticated rules like spending limits, rate limiting, and usage quotas
- Maintain policy state independently of individual tool executions

**Type-Safe Development**
- Strongly-typed Zod schemas for all parameters and return values
- Clear interfaces between policies and tools with guaranteed type safety

**Comprehensive Context**
- Access to delegation information (delegator/delegatee addresses and PKP details)
- Helper methods for returning properly formatted allow/deny responses
- Integration with the broader Vincent ecosystem (app metadata, tool context)

## Real-World Policy Examples

Vincent Policies can implement sophisticated business logic and safety measures across multiple domains:

**Financial Controls**
- **Daily Spending Limits**: Track cumulative spending by storing transaction amounts on-chain and deny execution when limits are exceeded
- **Multi-Signature Requirements**: Require additional approvals for high-value transactions by integrating with on or off-chain approval systems
- **Token Allowlists**: Restrict transactions to specific token types or verified contract addresses

**Access Management**
- **NFT Membership Gates**: Verify ownership of specific NFTs (like membership passes) before allowing access to premium features
- **Discord Role Verification**: Check a user's Discord server membership and roles via API calls to grant different permission levels
- **Time-Based Restrictions**: Only allow tool execution during specific hours, days, or based on cooldown periods

**Usage Limits**
- **Rate Limiting**: Track API usage frequency and implement cooldown periods between executions
- **Compliance Monitoring**: Enforce regulatory requirements by checking transaction amounts against legal limits
- **Geographic Restrictions**: Use IP geolocation APIs to restrict access based on user location

**Risk Management**
- **Transaction Pattern Analysis**: Monitor spending patterns and flag suspicious activity that deviates from normal behavior
- **Circuit Breakers**: Automatically disable tools when unusual activity is detected or system-wide limits are reached
- **Emergency Stops**: Implement admin-controlled emergency stops that can pause policy-governed operations

# How a Vincent Policy Works

A Vincent Policy consists of three main lifecycle methods:

1. **Precheck**: Executed first by the Vincent Tool's `precheck` function to provide the Vincent Tool executor with a best-effort check that the policy shouldn't fail when `evaluate` is called
2. **Evaluate**: The validation logic executed in the beginning of the Vincent Tool's `execute` function, used to inform the Vincent Tool whether it can execute the tool logic
3. **Commit**: An optional function executed after all policies have been evaluated and the Vincent Tool has executed, used to commit results and update any state the policy depends on

The Precheck and Evaluate functions receive two arguments:
- First argument: An object containing `toolParams` and `userParams`
  - `toolParams`: Parameters provided by the tool author
  - `userParams`: On-chain policy parameters set by the user
- Second argument: A context object containing:
  - Helper methods for type-safe policy results (`allow()` and `deny()`)
  - The Ethereum address of the Vincent Tool executor
  - Vincent Agent Wallet PKP information such as Ethereum address, public key, and token ID
  - The `appId` and `appVersion` of the Vincent App that the policy is being executed for

The Commit function receives two arguments:
- First argument: Specific parameters matching a `commitParamsSchema` you as the policy author have defined
- Second argument: A context object containing:
  - Helper methods for type-safe policy results (`allow()` and `deny()`)
  - The Ethereum address of the Vincent Tool executor
  - Vincent Agent Wallet PKP information such as Ethereum address, public key, and token ID
  - The `appId` and `appVersion` of the Vincent App that the policy is being executed for

# Defining Your Vincent Policy

Vincent Policies are created by calling the `createVincentPolicy` function from the `@lit-protocol/vincent-tool-sdk` package. This functions take a single object as a parameter that defines your policy's lifecycle methods, parameter schemas, and return value schemas.

The basic structure of a Vincent Policy definition is as follows:

```typescript
export const vincentPolicy = createVincentPolicy({
  packageName: '@my-npm-org/vincent-policy-my-name' as const,

  toolParamsSchema,
  userParamsSchema,
  commitParamsSchema,

  precheckAllowResultSchema,
  precheckDenyResultSchema,

  evalAllowResultSchema,
  evalDenyResultSchema,

  commitAllowResultSchema,
  commitDenyResultSchema,

  precheck: async ({ toolParams, userParams }, policyContext) => { },
  evaluate: async ({ toolParams, userParams }, policyContext) => { },
  commit: async (params, policyContext) => {  },
});
```

## `packageName`

The `packageName` serves as the unique identifier for your policy within the Vincent ecosystem. This **must exactly match** the NPM package name you publish your policy under, as Vincent Tool authors will use this identifier to install and integrate your policy into their tools.

```typescript
const vincentPolicy = createVincentPolicy({
  packageName: '@my-npm-org/vincent-policy-my-name' as const,
  // ... other policy definitions
});
```

## Parameter Schemas

### `toolParamsSchema`

This Zod schema defines the structure of parameters that Vincent Tools will pass to your policy. As the policy author, these should be the parameters you require to make your policy checks and validations.

For example, if you are building a spending limit policy, you might define the `toolParamsSchema` as follows:

```typescript
const vincentPolicy = createVincentPolicy({
  // ... other policy definitions

  toolParamsSchema: z.object({
      tokenAddress: z.string(),
      amount: z.number(),
  }),
});
```

This would allow your policy to check if Vincent Tool executor is attempting to spend more than the spending limit the Vincent App User has set for a given time period.

The Vincent Tool receives these parameters from the Vincent Tool executor and passes them to your policy.

### `userParamsSchema`

This Zod schema defines the structure of the on-chain parameters that Vincent App Users configure for your policy. These parameters are fetched from the Vincent smart contract during execution of a Vincent Policy's `precheck` and `evaluate` functions. They are unique to each Vincent Tool and Vincent App combo, and cannot be altered by the Vincent App or Vincent Tool executor during tool execution.

These parameters are meant to be used to define the guardrails that Vincent App Users will want to place on the Vincent Apps. For example, if you are building a spending limit policy, you might define the `userParamsSchema` as follows:

```typescript
const vincentPolicy = createVincentPolicy({
  // ... other policy definitions

  userParamsSchema: z.object({
      dailySpendingLimit: z.number(),
      allowedTokens: z.array(z.string()).optional(),
  }),
});
```

This would allow the Vincent App User to specify how much of a token they are allowing the Vincent App to spend on their behalf in a day, as well as the specify tokens that are allowed to be spent.

## Precheck Function

The `precheck` function is intended to be executed locally by the Vincent Tool executor to provide a best-effort check that the policy shouldn't fail when the policy's `evaluate` function is called.

Executing a Vincent Tool using the Lit network is an operation that cost both time and money, so your `precheck` function should do whatever validation it can to ensure that the policy won't fail when the `evaluate` function is called.

In the case of our spending limit policy example, this would include a call to the spending limit database/smart contract to check if the amount of tokens the Vincent App is attempting to spend exceeds the spending limit the Vincent App User has set for the Vincent App:

```typescript
const vincentPolicy = createVincentPolicy({
  // ... other policy definitions

  precheck: async ({ toolParams, userParams }, policyContext) => {
    const { amount, tokenAddress } = toolParams;
    const { dailySpendingLimit, allowedTokens } = userParams;

    const isTokenAllowed = allowedTokens.includes(tokenAddress);

    if (!isTokenAllowed) {
      return policyContext.deny({ reason: "Token not allowed" });
    }

    const isSpendingLimitExceeded = await checkSpendingLimit(tokenAddress, amount, dailySpendingLimit);

    if (isSpendingLimitExceeded) {
      return policyContext.deny({ reason: "Spending limit exceeded" });
    }

    return policyContext.allow({ message: "Precheck passed" });
  },
});
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

## Evaluate Function

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

## Commit Function

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
