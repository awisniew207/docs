---
title: Quick Start
---

# Quick Start

The [Vincent Starter Kit](https://github.com/LIT-Protocol/vincent-starter-kit/tree/main) is a complete example repository for Vincent Ability and Policy authors. This monorepo template provides a complete development environment with pre-built examples, an end-to-end testing framework, and development workflows for creating, deploying, and testing Vincent Abilities.

This guide will walk you through setting up the Vincent Starter Kit, understanding its structure, and writing your first Vincent Ability.

## Prerequisites

- **Node.js**: `^20.19.4` or higher
- **Corepack**: (included in Node.js `16.9+`) which will be used to install pnpm
  - Optionally, if you have pnpm `10.7.0` installed, you can use it directly instead of Corepack

### Setting up Corepack for pnpm

The Vincent Starter Kit enforces the use of pnpm as its package manager. The easiest way to ensure you have the correct version is through Corepack, which is included with Node.js version `16.9+`:

```bash
# Verify your corepack version (should be > 0.31.0)
corepack -v

# If needed, update corepack to the latest version
npm install -g corepack@latest

# Enable Corepack globally
corepack enable

# Enable pnpm specifically
corepack enable pnpm
```

Once enabled, Corepack will automatically provision pnpm version `10.7.0` as specified in the Starter Kit's `package.json`.

## Setup

### 1. Clone the Vincent Starter Kit

```bash
git clone git@github.com:LIT-Protocol/vincent-starter-kit.git
cd vincent-starter-kit
```

### 2. Run the Bootstrap Process

The bootstrap script guides you through configuring the repository for first-time use:

```bash
pnpm bootstrap
```

This interactive process will:

1. **Configure the Pinata JWT**

   Vincent Abilities are stored in a distributed storage system so they can be retrieved and executed by Vincent Apps. This Starter Kit uses [Pinata](https://pinata.cloud/) to store your Ability code on IPFS, so it can be retrieved and executed by Vincent Apps.

   The first step of the bootstrap process will prompt you to provide a Pinata JWT, which can be obtained from [Pinata](https://app.pinata.cloud/developers/api-keys) after creating an account. This JWT will be used to by the included deployment scripts to upload your Ability code to IPFS.

   The bootstrap script saves your provided JWT to an `.env` file in the root of the repository to be used later by the deployment script.

   <div class="box info-box">
        <p class="box-title info-box-title">
            <span class="box-icon info-icon">Info</span> Note
        </p>
        <p>If a <code>.env</code> file already exists in the root of the repository, the bootstrap script will skip this step.</p>
    </div>

2. **Set up the E2E Test Funder**

   Included in this Starter Kit are end-to-end tests that run the example Vincent Ability and Policy using the same environment used by Vincent Apps to execute published Abilities.

   In order to interact with this environment, you'll need to provide a test wallet funded with Lit test tokens on the Lit testnet, Chronicle Yellowstone. This wallet will be used to fund additional test wallets used by the end-to-end tests.

   Create a test wallet using your preferred wallet provider, then go to the [Lit token faucet](https://chronicle-yellowstone-faucet.getlit.dev/) to request test tokens.

   Afterwards, provide the bootstrap script with the private key of your funded wallet, and it will generate the additional test wallets required by the end-to-end tests.

   The bootstrap script saves the provided private key and all generated private keys to `packages/test-e2e/.env.test-e2e`.

   <div class="box info-box">
        <p class="box-title info-box-title">
            <span class="box-icon info-icon">Info</span> Note
        </p>
        <p>
            If a <code>packages/test-e2e/.env.test-e2e</code> file already exists, the bootstrap script will abort to avoid overwriting the existing private key.
        </p>
        <p>
            If you need to generate new test wallets, you can run <code>pnpm reset-e2e</code> to backup the existing file and re-run the bootstrap process.
        </p>
    </div>

## Running the End-to-End Tests

After completing the bootstrap process, you can immediately run the end-to-end tests to verify your setup:

```bash
pnpm test-e2e
```

This script will:

1. Build the example Ability and Policy
2. Deploy their code to IPFS via Pinata
3. Ensure the Ability and Policy were built correctly and successfully deployed to IPFS
4. Run the end-to-end tests that execute the Ability and Policy using the Vincent system

After running this script, if you see the following output, then you know your copy of the Starter Kit is properly configured and ready for you to start developing your own Vincent Abilities:

```bash
pnpm test-e2e
> nx run-many -t test-e2e
> nx run example-e2e:ensure-ability-policy-built-and-deployed-to-ipfs
   ✔  nx run policy-counter:action:build
   ✔  nx run policy-counter:build
   ✔  nx run policy-counter:action:deploy
   ✔  nx run ability-native-send:action:build
   ✔  nx run ability-native-send:build
   ✔  nx run ability-native-send:action:deploy
   ◼  nx run example-e2e:ensure-ability-policy-built-and-deployed-to-ipfs
   ✔  nx run example-e2e:test-e2e

 NX   Successfully ran target test-e2e for project example-e2e and 7 tasks it depends on (36s)
```

<div class="box info-box">
    <p class="box-title info-box-title">
        <span class="box-icon info-icon">Info</span> Getting Help
    </p>
    <p>
        If you're having trouble setting up the Vincent Starter Kit, or you've ran into errors while executing the above steps, reach out to us on <a href="https://t.me/+aa73FAF9Vp82ZjJh">Telegram</a> for help.
    </p>
</div>

## Creating Your Own Ability

Now that you have the Vincent Starter Kit running, you can start creating your own Vincent Ability.

Before getting started, it's helpful to understand what's included in the Starter Kit and how to use the included scripts to build, deploy, and test your Ability.

### Example Packages

The `packages` directory is where you'll find the example Ability and Policy, as well as the end-to-end tests:

| Package                 | Description                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| **ability-native-send** | Example Vincent Ability that sends native currency of a blockchain to provided recipient address. |
| **policy-counter**      | Example Vincent Policy that counts and restricts the number of times an Ability is executed.      |
| **test-e2e**            | The end-to-end tests that execute the example Ability and Policy using the Vincent system.        |

### Creating the Ability Package

To get started with developing your Ability, you can copy the `ability-native-send` package as a template.

From the root of the repository, run the following command to copy the `ability-native-send` package to a new package (change `my-ability` to your desired package name):

<div class="box info-box">
    <p class="box-title info-box-title">
        <span class="box-icon info-icon">Info</span> Note
    </p>
    <p>
        The following uses `rsync` to copy the `ability-native-send` package to a new package, but excludes the `node_modules` and `dist` directories.
    </p>
    <p>
        If you don't have `rsync` installed, you can simply manually copy the `ability-native-send` package to a new package, and delete the `node_modules` and `dist` directories.
    </p>
</div>

```bash
# Create the destination dir (if it doesn't exist)
mkdir -p packages/my-ability

# Copy everything except node_modules and dist
rsync -a \
  --exclude='node_modules/' \
  --exclude='dist/' \
  packages/ability-native-send/ \
  packages/my-ability/
```

### Configuring Your New Ability Package

After copying the example ability, you'll need to update several configuration files to make your new package function correctly.

Here's what needs to be changed:

#### 1. Update `package.json`

**File:** `packages/my-ability/package.json`

Update the following fields:

- Change the package name from `@lit-protocol/vincent-example-ability-native-send` to your package name (e.g., `@your-org/my-ability`)
- Update the description to describe what your ability does
- Remove or update the policy dependency if you're not using the counter policy

```js
{
  "name": "@your-org/my-ability",
  "version": "0.0.1",
  "description": "Your ability description here",
  "dependencies": {
    // Remove this dependency if your Ability will not support the counter Policy
    "@lit-protocol/vincent-example-policy-counter": "workspace:*",
    ...other dependencies
  },
  ...
}
```

#### 2. Update `project.json`

**File:** `packages/my-ability/project.json`

Update all references to the package name:

- Change `"name": "ability-native-send"` to `"name": "my-ability"`
- Update source root: `"sourceRoot": "packages/my-ability/src"`
- Remove the policy dependency in `dependsOn` if not using the counter Policy
- Update all references to the working directory: `"cwd": "packages/my-ability"`
- Update input path: `"input": "packages/my-ability/src/generated"`
- Update output path: `"outputPath": "packages/my-ability/dist"`
- Update main file: `"main": "packages/my-ability/src/index.ts"`
- Update tsConfig: `"tsConfig": "packages/my-ability/tsconfig.lib.json"`
- Update asset paths to reference `packages/my-ability`

#### 3. Update TypeScript Configuration

**File:** `packages/my-ability/tsconfig.lib.json`

- Remove or update the reference to policy-counter if not using it:

```js
{
  "references": [
    // Remove this reference if not using the counter Policy
    {
      "path": "../policy-counter/tsconfig.lib.json"
    }
  ]
}
```

#### 4. Run `pnpm install`

After updating the `package.json` and `project.json` files, run:

```bash
pnpm install
```

This ensures your new package is properly linked in the monorepo, and all dependencies are installed.

#### 5. Update Schema Definitions

**File:** `packages/my-ability/src/lib/schemas.ts`

This file contains the Zod schemas that define:

- Any known error constants
- Input parameters for your Ability's `precheck` and `execute` functions (`abilityParamsSchema`)
- Success/failure schemas for `precheck` and `execute` functions

Update these schemas to match your Ability's implementation.

<div class="box info-box">
  <p class="box-title info-box-title">
    <span class="box-icon info-icon">Info</span> Note
  </p>
  <p>
    While <code>abilityParamsSchema</code> is used to define the input parameters for both the <code>precheck</code> and <code>execute</code> functions, these functions are not inherently required to use the same parameters.
  </p>
  <p>
    You can mark a parameter as <code>.optional()</code> in your schema and check for its presence in either function, throwing an error if it's not present when required.
  </p>
</div>

#### 6. Update the Vincent Ability Implementation

**File:** `packages/my-ability/src/lib/vincent-ability.ts`

This is where you define your Ability's core logic.

A Vincent Ability has a simple structure with two main functions:

- **`precheck`**: Runs locally to provide a best-effort check that your Ability can execute successfully (e.g., check token balances, permissions)
- **`execute`**: Runs in the Lit Action environment and performs the actual Ability logic (e.g., send tokens, interact with contracts)

Here's a brief overview of an Ability's structure:

<div class="box info-box">
  <p class="box-title info-box-title">
    <span class="box-icon info-icon">Info</span> Note
  </p>
  <p>
    For a complete guide on implementing abilities, see
    <a href="./Creating-Abilities.md">How Abilities Work</a>.
  </p>
</div>

```typescript
import {
  createVincentAbility,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';

import type { EthersType /*LitNamespace*/ } from '../Lit';

import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  abilityParamsSchema,
  KNOWN_ERRORS,
} from './schemas';

export const vincentAbility = createVincentAbility({
  // Must match your package.json name
  packageName: '@your-org/my-ability' as const,

  // Brief description of what your ability does
  abilityDescription: 'Your ability description',

  // Schema for input parameters (defined in schemas.ts)
  abilityParamsSchema: abilityParamsSchema,

  // Policies this ability supports (empty array if none)
  supportedPolicies: supportedPoliciesForAbility([]),

  // Schemas for return values
  precheckSuccessSchema,
  precheckFailSchema,
  executeSuccessSchema,
  executeFailSchema,

  // Validation function - runs locally before execution
  precheck: async ({ abilityParams }, { fail, succeed }) => {
    // Validate that execution will likely succeed
    // For example: check balances, validate addresses, etc.

    if (/* validation passes */) {
      return succeed({ /* success data */ });
    } else {
      return fail({ error: 'Validation failed' });
    }
  },

  // Main execution function - runs in Lit Action environment
  execute: async ({ abilityParams }, { fail, succeed }) => {
    try {
      // Your ability's main logic goes here
      // This has access to sign with the user's PKP wallet

      return succeed({ /* success data */ });
    } catch (error) {
      return fail({ error: error.message });
    }
  },
});
```

#### 7. Update the Main Index File

**File:** `packages/my-ability/src/index.ts`

- Update the comment to reflect your ability name

#### 8. Update Jest Configuration

**File:** `packages/my-ability/jest.config.js`

- Update the display name to match your package name:

```javascript
module.exports = {
  displayName: '@your-org/my-ability', // Update this
  // ... rest of config
};
```

#### 10. Register Your Package with Nx

After making all the file changes, you need to update the workspace configuration to include your new package:

**File:** `nx.json` (in the repository root)

- Add your package to the release projects array:

```json
{
  "release": {
    "projects": ["ability-native-send", "policy-counter", "test-e2e", "my-ability"],
    ...
  }
}
```

#### 11. Install Dependencies

After all the above updates, run:

```bash
pnpm install
```

This ensures your new package is properly linked in the monorepo.

#### 11. Build Your Ability

After installing dependencies, build your Ability package with:

```bash
pnpm build
```

This ensures your Ability package has been properly configured, and can be imported for end-to-end testing.

If you see the following output, then your Ability package has been built successfully:

```bash
# The following output shows your new Ability package being recognized by Nx
 NX   Running target build for 4 projects and 3 tasks they depend on:

- ability-native-send
- policy-counter
- my-ability # <--- Your new Ability package name
- example-e2e
```

```bash
# The following output shows your new Ability package being built by Nx
> nx run my-ability:"action:build"

> pnpm node ./scripts/bundle-vincent-ability/esbuild.js

./src/lib
✅ lit-action.js
- 4.2232 MB (in decimal)
- 4.0276 MB (in binary)
✅ Vincent ability built successfully

> nx run my-ability:build

Compiling TypeScript files for project "my-ability"...
Done compiling TypeScript files for project "my-ability".

../../dist/src/generated/lit-action.js

../../dist/src/generated/vincent-ability-metadata.json

../../dist/src/generated/vincent-bundled-ability.ts
```

Congratulations! If you've made it to this point, then you've successfully created your own Vincent Ability package, and have it properly configured.

The next step would be to take a look at the included end-to-end test file: `packages/test-e2e/src/e2e.spec.ts` to see how to test your new Ability.

## Development Workflow

Now that you have your Ability package configured, let's review the development workflow for building, testing, and deploying your Abilities.

### Building Your Ability

To build your specific Ability package:

```bash
pnpm nx build my-ability
```

Or to build all packages in the repository:

```bash
pnpm build
```

This will:

1. Bundle your Lit Action code using esbuild
2. Generate TypeScript declarations
3. Create the bundled Ability wrapper
4. Output build artifacts to the `dist/` directory

### Testing Your Ability

#### End-to-End Tests

The Starter Kit includes comprehensive end-to-end tests that execute your Ability and Policy using the same environment used by Vincent Apps to execute published Abilities.

```bash
pnpm test-e2e
```

This command will:

1. Build all Abilities and Policies
2. Deploy them to IPFS via Pinata
3. Execute the end-to-end tests using the Vincent system
4. Verify that your Ability work as expected

#### Unit Tests (Optional)

You can also add unit tests for your Ability by specifying them in the package's directory i.e. `packages/my-ability/src/my-ability.spec.ts`.

You can then run the unit tests for your Ability using the following command:

```bash
# Run tests for your specific Ability
pnpm nx test my-ability

# Run all unit tests
pnpm test
```

### Deploying Your Ability

Deploy your Ability to IPFS:

```bash
pnpm nx action:deploy my-ability
```

The deployment process:

1. Bundles your TypeScript code into a Lit Action
2. Uploads the bundle to IPFS via Pinata
3. Generates metadata with the IPFS hash
4. Makes your Ability available for use by Vincent Apps

## Included Scripts Reference

### Root-Level Scripts

| Script        | Command          | Description                                                                      |
| ------------- | ---------------- | -------------------------------------------------------------------------------- |
| **build**     | `pnpm build`     | Builds all packages including action bundling                                    |
| **test**      | `pnpm test`      | Runs unit tests across all packages                                              |
| **test-e2e**  | `pnpm test-e2e`  | Builds and deploys all Abilities and Policies, then runs end-to-end tests        |
| **lint**      | `pnpm lint`      | Lints all packages                                                               |
| **typecheck** | `pnpm typecheck` | Type checks all packages                                                         |
| **clean**     | `pnpm clean`     | Removes build artifacts and node_modules                                         |
| **reset**     | `pnpm reset`     | Full clean and reinstall                                                         |
| **reset-e2e** | `pnpm reset-e2e` | Backs up E2E env file and clears existing `.env`s allowing for a fresh bootstrap |

### Project-Level Nx Targets

Run these with `pnpm nx <target> <project>`:

| Target            | Projects                                        | Description                        |
| ----------------- | ----------------------------------------------- | ---------------------------------- |
| **action:build**  | ability-native-send, policy-counter, my-ability | Bundles the Lit Action code        |
| **action:deploy** | ability-native-send, policy-counter, my-ability | Builds and deploys to IPFS         |
| **build**         | all                                             | TypeScript compilation             |
| **test**          | all                                             | Unit tests for individual packages |
| **test-e2e**      | test-e2e                                        | Full E2E test suite                |

## Getting Help

If you run into any issues, check the example implementations in `packages/ability-native-send` and `packages/policy-counter` for reference.

If something is still unclear, reach out to us on [Telegram](https://t.me/+aa73FAF9Vp82ZjJh) for assistance.
