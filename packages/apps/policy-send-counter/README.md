# Vincent Policy Send Counter

A policy that can be attached to Vincent tools to avoid them spending more than a user-defined limit in a specific period of time.

## Overview

The Vincent Policy Send Counter is part of the Vincent Tools ecosystem and is built using the Vincent Tool SDK. It allows users to set sending limits for tools that interact with their funds, providing an additional layer of security and control.

## Features

- Set maximum sending limits per period
- Track spending across multiple tools
- Configurable by users through the Vincent Dashboard

## Installation

```bash
npm install @lit-protocol/vincent-policy-send-counter
```

## Usage

This policy can be integrated with Vincent Tools to enforce sending limits:

```typescript
import {
  createVincentToolPolicy,
  createVincentTool,
  supportedPoliciesForTool,
} from '@lit-protocol/vincent-tool-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-send-counter';

const toolParamsSchema = z.object({
  buy: z.boolean(),
});

const sendCounterPolicy = createVincentToolPolicy({
  toolParamsSchema,
  bundledVincentPolicy,
  toolParameterMappings: { buy: 'buyAmount' },
});

export const myTokenSwapTool = createVincentTool({
  toolParamsSchema,
  supportedPolicies: supportedPoliciesForTool([sendCounterPolicy]),
  // ... rest of tool implementation
});
```

## Building

Run `nx build policy-send-counter` to build the library.

## Running unit tests

Run `nx test policy-send-counter` to execute the unit tests via [Jest](https://jestjs.io).

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
