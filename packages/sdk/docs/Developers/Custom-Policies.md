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

A Vincent Policy consists of three main lifecycle methods executed in the following order:

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
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';

const vincentPolicy = createVincentPolicy({
  packageName: '@my-npm-org/vincent-policy-my-name' as const,
  // ... other policy definitions
});
```

## The `policyContext` Argument

The `policyContext` argument is provided and managed by the Vincent Tool SDK. It's an object containing the following properties and is passed as an argument to your policy's `precheck`, `evaluate`, and `commit` functions:

```typescript
interface PolicyContext {
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
  allow: (result: commitAllowResultSchema) => void;
  deny: (result: commitDenyResultSchema) => void;
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
- `allow`: A helper method for returning an `allow` result from your policy's `commit` function
- `deny`: A helper method for returning a `deny` result from your policy's `commit` function

## Parameter Schemas

### `toolParamsSchema`

This Zod schema defines the structure of parameters that Vincent Tools will pass to your policy. As the policy author, these should be the parameters you require to make your policy checks and validations.

For example, if you are building a spending limit policy, you might define the `toolParamsSchema` as follows:

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

This would allow your policy to check if Vincent Tool executor is attempting to spend more than the spending limit the Vincent App User has set for a given time period.

The Vincent Tool receives these parameters from the Vincent Tool executor and passes them to your policy.

### `userParamsSchema`

This Zod schema defines the structure of the on-chain parameters that Vincent App Users configure for your policy. These parameters are fetched from the Vincent smart contract during execution of a Vincent Policy's `precheck` and `evaluate` functions. They are unique to each Vincent Tool and Vincent App combo, and cannot be altered by the Vincent App or Vincent Tool executor during tool execution.

These parameters are meant to be used to define the guardrails that Vincent App Users will want to place on the Vincent Apps. For example, if you are building a spending limit policy, you might define the `userParamsSchema` as follows:

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

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
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

import { checkSpendingLimit } from './my-policy-code';

const vincentPolicy = createVincentPolicy({
  // ... other policy definitions

  precheck: async ({ toolParams, userParams }, policyContext) => {
    const { amount, tokenAddress } = toolParams;
    const { dailySpendingLimit, allowedTokens } = userParams;

    const isTokenAllowed = allowedTokens.includes(tokenAddress);
    const { isSpendingLimitExceeded, currentDailySpending } = await checkSpendingLimit(tokenAddress, amount, dailySpendingLimit);

    if (!isTokenAllowed) {
      return policyContext.deny({
        reason: "Token not allowed",
        maxDailySpendingLimit: dailySpendingLimit,
        currentDailySpending,
        allowedTokens: allowedTokens,
      });
    }

    if (isSpendingLimitExceeded) {
      return policyContext.deny({
        reason: "Spending limit exceeded",
        maxDailySpendingLimit: dailySpendingLimit,
        currentDailySpending,
        allowedTokens: allowedTokens,
      });
    }

    return policyContext.allow({
      maxDailySpendingLimit: dailySpendingLimit,
      currentDailySpending,
      allowedTokens: allowedTokens,
    });
  },
});
```

Two arguments are passed to your policy's `precheck` function by the Vincent Tool SDK. The first is an object containing the `toolParams` and `userParams` the adhere to the `toolParamsSchema` and `userParamsSchema` you have defined for your policy. The second is the [`policyContext`](#the-policycontext-argument) managed by the Vincent Tool SDK that contains helper methods for returning `allow` and `deny` results, as well as some metadata about the Vincent App that the policy is being executed for.

### `precheckAllowResultSchema`

This Zod schema defines the structure of successful `precheck` results. What's included in the returned object is up to you, but ideally it includes details about why the `precheck` passed.

The following schema returns useful information to the Vincent Tool executor about the current policy state for the Vincent App User and Vincent App combo:

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

const vincentPolicy = createVincentPolicy({
  // ... other policy definitions

  precheckAllowResultSchema: z.object({
    maxDailySpendingLimit: z.number(),
    currentDailySpending: z.number(),
    allowedTokens: z.array(z.string()),
  }),
});
```

Specifying `maxDailySpendingLimit` allows the Vincent Tool executor to adapt to the Vincent App User modifying their spending limit for the Vincent App. `currentDailySpending` is useful to know so that Vincent App can understand how much of the spending limit has been used, and `allowedTokens` is useful to know so that Vincent App doesn't try to spend tokens that will cause the policy to fail.

### `precheckDenyResultSchema`

This Zod schema defines the structure of a failed `precheck` result. What's included in the returned object is up to you, but ideally it includes details about why the `precheck` failed.

The following schema returns additional information to the Vincent Tool executor that would allow the Vincent Tool executor to adapt their execution request so that the policy's `precheck` validation checks doesn't fail:

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

const vincentPolicy = createVincentPolicy({
  // ... other policy definitions

  precheckDenyResultSchema: z.object({
    reason: z.string(),
    maxDailySpendingLimit: z.number(),
    currentDailySpending: z.number(),
    allowedTokens: z.array(z.string()),
  }),
});
```

For the above schema, the `reason` string allows the `precheck` function to return a specific error message stating something like `"Attempted buy amount exceeds daily limit"` or `"Token not on allow list"`.

## Evaluate Function

The `evaluate` function is the validation logic executed in the beginning of the Vincent Tool's `execute` function, used to inform the Vincent Tool whether it can execute the tool logic.

It's may be similar in logic to the `precheck` function, but this is the function that has the ability to deny Vincent Tool execution if the function returns the `deny` result. Additionally, while the `precheck` function is executed locally by the Vincent Tool executor, the `evaluate` function is executed in the Lit Action environment during the execution of the Vincent Tool, and has access to the full Lit Action environment (for more information on what's available to you within the Lit Action environment see the Lit Protocol [Lit Action](https://developer.litprotocol.com/sdk/serverless-signing/overview) docs).

In the case of our spending limit policy example, the `evaluate` function is going to be identical to the `precheck` function:

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

import { checkSpendingLimit } from './my-policy-code';

const vincentPolicy = createVincentPolicy({
  // ... other policy definitions

  evaluate: async ({ toolParams, userParams }, policyContext) => {
    const { amount, tokenAddress } = toolParams;
    const { dailySpendingLimit, allowedTokens } = userParams;

    const isTokenAllowed = allowedTokens.includes(tokenAddress);
    const { isSpendingLimitExceeded, currentDailySpending } = await checkSpendingLimit(tokenAddress, amount, dailySpendingLimit);

    if (!isTokenAllowed) {
      return policyContext.deny({
        reason: "Token not allowed",
        maxDailySpendingLimit: dailySpendingLimit,
        currentDailySpending,
        allowedTokens: allowedTokens,
      });
    }

    if (isSpendingLimitExceeded) {
      return policyContext.deny({
        reason: "Spending limit exceeded",
        maxDailySpendingLimit: dailySpendingLimit,
        currentDailySpending,
        allowedTokens: allowedTokens,
      });
    }

    return policyContext.allow({
      maxDailySpendingLimit: dailySpendingLimit,
      currentDailySpending,
      allowedTokens: allowedTokens,
    });
  },
});
```

Two arguments are passed to your policy's `evaluate` function by the Vincent Tool SDK. The first is an object containing the `toolParams` and `userParams` the adhere to the `toolParamsSchema` and `userParamsSchema` you have defined for your policy. The second is the [`policyContext`](#the-policycontext-argument) managed by the Vincent Tool SDK that contains helper methods for returning `allow` and `deny` results, as well as some metadata about the Vincent App that the policy is being executed for.

### `evalAllowResultSchema`

This Zod schema defines the structure of successful `evaluate` results. What's included in the returned object is up to you, but ideally it includes details about why the `evaluate` function is allowing the Vincent Tool execution.

The following schema returns useful information to the Vincent Tool executor about the current policy state for the Vincent App User and Vincent App combo:

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

const vincentPolicy = createVincentPolicy({
  // ... other policy definitions

  evalAllowResultSchema: z.object({
    maxDailySpendingLimit: z.number(),
    currentDailySpending: z.number(),
    allowedTokens: z.array(z.string()),
  }),
});
```

### `evalDenyResultSchema`

This Zod schema defines the structure of a denied `evaluate` result. What's included in the returned object is up to you, but ideally it includes details about why the `evaluate` function is denying the Vincent Tool execution.

The following schema returns additional information to the Vincent Tool executor that would allow the Vincent Tool executor to adapt their execution request so that the policy's `evaluate` validation checks don't fail:

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

const vincentPolicy = createVincentPolicy({
  // ... other policy definitions

  evalDenyResultSchema: z.object({
    reason: z.string(),
    maxDailySpendingLimit: z.number(),
    currentDailySpending: z.number(),
    allowedTokens: z.array(z.string()),
  }),
});
```

## Commit Function

The `commit` function is called from within the Vincent Tool's `execute` method after all registered Vincent Policies have been evaluated are returned `allow` results, and the Vincent Tool's execution logic has been successfully executed.

This functions is intended to be used by our policy to update any state that the policy depends on.

For the spending limit policy example, the `commit` function would be used to update the spending limit database/smart contract with the amount of tokens the Vincent App has spent on behalf of the Vincent App User:

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

import { updateSpentAmount } from './my-policy-code';

const vincentPolicy = createVincentPolicy({
  // ... other policy definitions

  commit: async (params, policyContext) => {
    const { spentAmount, tokenAddress } = params;

    try {
        const { updatedDailySpending, remainingDailyLimit } = await updateSpentAmount({
            vincentAppId: policyContext.appId,
            spenderAddress: policyContext.delegation.delegatorPkpInfo.ethAddress,
            spentAmount,
            spentTokenAddress: tokenAddress,
        });

        return policyContext.allow({
            updatedDailySpending,
            remainingDailyLimit,
        });
    } catch (error) {
        return policyContext.deny({
            reason: "Failed to update spending limit",
            vincentAppId: policyContext.appId,
            spenderAddress: policyContext.delegation.delegatorPkpInfo.ethAddress,
            spentAmount,
            spentTokenAddress: tokenAddress,
        });
    }
  },
});
```

Two arguments are passed to your policy's `commit` function by the Vincent Tool SDK. The first is an object adhering to the `commitParamsSchema` you have defined for your policy. The second is the [`policyContext`](#the-policycontext-argument) managed by the Vincent Tool SDK that contains helper methods for returning `allow` and `deny` results, as well as some metadata about the Vincent App that the policy is being executed for.

### `commitParamsSchema`

The `params` argument provided to your `commit` function will follow the structure of the `commitParamsSchema` you will have defined for your policy. What's provided in the `params` object is up to you, but it should include the specific parameters that your policy needs to update the state your policy depends on for it's validation checks.

For the spending limit policy example, the `spentAmount` and `tokenAddress` are required in order to update the amount of tokens that have been spent by the Vincent App on behalf of the Vincent App User. The following would be the `commitParamsSchema` for the `commit` function defined in the [Commit Function](#commit-function) section:

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

import { updateSpentAmount } from './my-policy-code';

const vincentPolicy = createVincentPolicy({
  // ... other policy definitions

  commitParamsSchema: z.object({
    spentAmount: z.number(),
    tokenAddress: z.string(),
  }),
});
```

### `commitAllowResultSchema`

This Zod schema defines the structure of an `allow` result from your policy's `commit` function. What's included in the returned object is up to you, but ideally it includes details about what state was successfully updated by your policy's `commit` function.

For the spending limit policy example, the following schema returns useful information about the state updates that were committed:

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

const vincentPolicy = createVincentPolicy({
  // ... other policy definitions

  commitAllowResultSchema: z.object({
    updatedDailySpending: z.number(),
    remainingDailyLimit: z.number(),
  }),
});
```

These details provide transparency about what was updated during the commit phase, allowing the Vincent Tool executor to understand the current state after the successful execution.

### `commitDenyResultSchema`

This Zod schema defines the structure of a failed `commit` result. What's included in the returned object is up to you, but ideally it includes details about why the `commit` function failed to update the policy's state.

The following schema returns information that would help the Vincent Tool executor understand why the `commit` function failed to update the policy's state, as well as the data the `commit` function was attempting to update it's state with:

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

const vincentPolicy = createVincentPolicy({
  // ... other policy definitions

  commitDenyResultSchema: z.object({
    reason: z.string(),
    vincentAppId: z.number(),
    spenderAddress: z.string(),
    spentAmount: z.number(),
    spentTokenAddress: z.string(),
  }),
});
```

# Wrapping Up

This guide has covered the basics of creating a Vincent Policy to be consumed by Vincent Tools. You've learned how to define the policy's `precheck`, `evaluate`, and `commit` functions, as well as the schemas for the parameters required by the policy's `precheck`, `evaluate`, and `commit` functions.

For the spending limit policy example we've been building throughout this guide, the final policy definition would look like the following:

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

const vincentPolicy = createVincentPolicy({
  packageName: '@my-npm-org/vincent-policy-my-name' as const,

  toolParamsSchema: z.object({
      tokenAddress: z.string(),
      amount: z.number(),
  }),
  userParamsSchema: z.object({
      dailySpendingLimit: z.number(),
      allowedTokens: z.array(z.string()).optional(),
  }),

  precheckAllowResultSchema: z.object({
    maxDailySpendingLimit: z.number(),
    currentDailySpending: z.number(),
    allowedTokens: z.array(z.string()),
  }),
  precheckDenyResultSchema: z.object({
    reason: z.string(),
    maxDailySpendingLimit: z.number(),
    currentDailySpending: z.number(),
    allowedTokens: z.array(z.string()),
  }),
  precheck: async ({ toolParams, userParams }, policyContext) => {
    const { amount, tokenAddress } = toolParams;
    const { dailySpendingLimit, allowedTokens } = userParams;

    const isTokenAllowed = allowedTokens.includes(tokenAddress);
    const { isSpendingLimitExceeded, currentDailySpending } = await checkSpendingLimit(tokenAddress, amount, dailySpendingLimit);

    if (!isTokenAllowed) {
      return policyContext.deny({
        reason: "Token not allowed",
        maxDailySpendingLimit: dailySpendingLimit,
        currentDailySpending,
        allowedTokens: allowedTokens,
      });
    }

    if (isSpendingLimitExceeded) {
      return policyContext.deny({
        reason: "Spending limit exceeded",
        maxDailySpendingLimit: dailySpendingLimit,
        currentDailySpending,
        allowedTokens: allowedTokens,
      });
    }

    return policyContext.allow({
      maxDailySpendingLimit: dailySpendingLimit,
      currentDailySpending,
      allowedTokens: allowedTokens,
    });
  },

  evalAllowResultSchema: z.object({
    maxDailySpendingLimit: z.number(),
    currentDailySpending: z.number(),
    allowedTokens: z.array(z.string()),
  }),
  evalDenyResultSchema: z.object({
    reason: z.string(),
    maxDailySpendingLimit: z.number(),
    currentDailySpending: z.number(),
    allowedTokens: z.array(z.string()),
  }),
  evaluate: async ({ toolParams, userParams }, policyContext) => {
    const { amount, tokenAddress } = toolParams;
    const { dailySpendingLimit, allowedTokens } = userParams;

    const isTokenAllowed = allowedTokens.includes(tokenAddress);
    const { isSpendingLimitExceeded, currentDailySpending } = await checkSpendingLimit(tokenAddress, amount, dailySpendingLimit);

    if (!isTokenAllowed) {
      return policyContext.deny({
        reason: "Token not allowed",
        maxDailySpendingLimit: dailySpendingLimit,
        currentDailySpending,
        allowedTokens: allowedTokens,
      });
    }

    if (isSpendingLimitExceeded) {
      return policyContext.deny({
        reason: "Spending limit exceeded",
        maxDailySpendingLimit: dailySpendingLimit,
        currentDailySpending,
        allowedTokens: allowedTokens,
      });
    }

    return policyContext.allow({
      maxDailySpendingLimit: dailySpendingLimit,
      currentDailySpending,
      allowedTokens: allowedTokens,
    });
  },

  commitParamsSchema: z.object({
    spentAmount: z.number(),
    tokenAddress: z.string(),
  }),
  commitAllowResultSchema: z.object({
    updatedDailySpending: z.number(),
    remainingDailyLimit: z.number(),
  }),
  commitDenyResultSchema: z.object({
    reason: z.string(),
    vincentAppId: z.number(),
    spenderAddress: z.string(),
    spentAmount: z.number(),
    spentTokenAddress: z.string(),
  }),
  commit: async (params, policyContext) => {
    const { spentAmount, tokenAddress } = params;

    try {
        const { updatedDailySpending, remainingDailyLimit } = await updateSpentAmount({
            vincentAppId: policyContext.appId,
            spenderAddress: policyContext.delegation.delegatorPkpInfo.ethAddress,
            spentAmount,
            spentTokenAddress: tokenAddress,
        });

        return policyContext.allow({
            updatedDailySpending,
            remainingDailyLimit,
        });
    } catch (error) {
        return policyContext.deny({
            reason: "Failed to update spending limit",
            vincentAppId: policyContext.appId,
            spenderAddress: policyContext.delegation.delegatorPkpInfo.ethAddress,
            spentAmount,
            spentTokenAddress: tokenAddress,
        });
    }
  },
});
```
