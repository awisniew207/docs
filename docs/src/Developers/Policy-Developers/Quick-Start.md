---
title: Quick Start
---

# Quick Start

The [Vincent Starter Kit](https://github.com/LIT-Protocol/vincent-starter-kit/tree/main) is a complete example repository for Vincent Ability and Policy authors. This monorepo template provides a complete development environment with pre-built examples, an end-to-end testing framework, and development workflows for creating, deploying, and testing Vincent Policies.

This guide will walk you through setting up the Vincent Starter Kit, understanding its structure, and writing your first Vincent Policy.

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

   Vincent Policies are stored in a distributed storage system so they can be retrieved and executed by Vincent Apps. This Starter Kit uses [Pinata](https://pinata.cloud/) to store your Policy code on IPFS, so it can be retrieved and executed by Vincent Apps.

   The first step of the bootstrap process will prompt you to provide a Pinata JWT, which can be obtained from [Pinata](https://app.pinata.cloud/developers/api-keys) after creating an account. This JWT will be used to by the included deployment scripts to upload your Policy code to IPFS.

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

After running this script, if you see the following output, then you know your copy of the Starter Kit is properly configured and ready for you to start developing your own Vincent Policies:

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

## Creating Your Own Policy

Now that you have the Vincent Starter Kit running, you can start creating your own Vincent Policy.

Before getting started, it's helpful to understand what's included in the Starter Kit and how to use the included scripts to build, deploy, and test your Policy.

### Example Packages

The `packages` directory is where you'll find the example Ability and Policy, as well as the end-to-end tests:

| Package                 | Description                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| **ability-native-send** | Example Vincent Ability that sends native currency of a blockchain to provided recipient address. |
| **policy-counter**      | Example Vincent Policy that counts and restricts the number of times an Ability is executed.      |
| **test-e2e**            | The end-to-end tests that execute the example Ability and Policy using the Vincent system.        |

### Creating the Policy Package

To get started with developing your Policy, you can copy the `policy-counter` package as a template.

From the root of the repository, run the following command to copy the `policy-counter` package to a new package (change `my-policy` to your desired package name):

<div class="box info-box">
    <p class="box-title info-box-title">
        <span class="box-icon info-icon">Info</span> Note
    </p>
    <p>
        The following uses `rsync` to copy the `policy-counter` package to a new package, but excludes the `node_modules` and `dist` directories.
    </p>
    <p>
        If you don't have `rsync` installed, you can simply manually copy the `policy-counter` package to a new package, and delete the `node_modules` and `dist` directories.
    </p>
</div>

```bash
# Create the destination dir (if it doesn't exist)
mkdir -p packages/my-policy

# Copy everything except node_modules and dist
rsync -a \
  --exclude='node_modules/' \
  --exclude='dist/' \
  packages/policy-counter/ \
  packages/my-policy/
```

### Configuring Your New Policy Package

After copying the example policy, you'll need to update several configuration files to make your new package function correctly.

Here's what needs to be changed:

#### 1. Update `package.json`

**File:** `packages/my-policy/package.json`

Update the following fields:

- Change the package name from `@lit-protocol/vincent-example-policy-counter` to your package name (e.g., `@your-org/my-policy`)
- Update the description to describe what your policy does

```js
{
  "name": "@your-org/my-policy",
  "version": "0.0.1",
  "description": "Your policy description here",
  ...
}
```

#### 2. Update `project.json`

**File:** `packages/my-policy/project.json`

Update all references to the package name:

- Change `"name": "policy-counter"` to `"name": "my-policy"`
- Update source root: `"sourceRoot": "packages/my-policy/src"`
- Update all references to the working directory: `"cwd": "packages/my-policy"`
- Update input path: `"input": "packages/my-policy/src/generated"`
- Update output path: `"outputPath": "packages/my-policy/dist"`
- Update main file: `"main": "packages/my-policy/src/index.ts"`
- Update tsConfig: `"tsConfig": "packages/my-policy/tsconfig.lib.json"`
- Update asset paths to reference `packages/my-policy`

#### 3. Run `pnpm install`

After updating the `package.json` and `project.json` files, run:

```bash
pnpm install
```

This ensures your new package is properly linked in the monorepo, and all dependencies are installed.

#### 4. Update Schema Definitions

**File:** `packages/my-policy/src/lib/schemas.ts`

This file contains the Zod schemas that define:

- Parameters that are expected to be provided by the Ability (`abilityParamsSchema`) e.g. transaction amount, recipient address
- User configuration parameters that define the limits and rules of your Policy (`userParamsSchema`) e.g. spending limits, time windows, permitted recipient addresses
- Parameters passed to the commit function (`commitParamsSchema`) e.g. amount spent, remaining sends, timestamps
- Success/failure schemas for precheck, evaluate, and commit functions

Update these schemas to match your Policy's requirements.

#### 5. Update the Vincent Policy Implementation

**File:** `packages/my-policy/src/lib/vincent-policy.ts`

This is where you define your Policy's core logic.

A Vincent Policy has a simple structure with three main functions:

- **`precheck`**: Runs locally to provide a best-effort check that your Policy should permit the execution of the Vincent Ability
- **`evaluate`**: Runs in the Lit Action environment to validate whether your Policy permits the Ability execution based on current state
- **`commit`**: Runs in the Lit Action environment to update the Policy's state after a successful Ability execution

Here's a brief overview of a Policy's structure:

<div class="box info-box">
  <p class="box-title info-box-title">
    <span class="box-icon info-icon">Info</span> Note
  </p>
  <p>
    For a complete guide on implementing policies, see
    <a href="./Creating-Policies.md">Creating Vincent Policies</a>.
  </p>
</div>

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-ability-sdk';

import type { LitNamespace, EthersType } from '../Lit';
import {
  commitAllowResultSchema,
  commitDenyResultSchema,
  commitParamsSchema,
  evalAllowResultSchema,
  evalDenyResultSchema,
  precheckAllowResultSchema,
  precheckDenyResultSchema,
  abilityParamsSchema,
  userParamsSchema,
} from './schemas';

declare const Lit: typeof LitNamespace;
declare const ethers: EthersType;

export const vincentPolicy = createVincentPolicy({
  // Must match your package.json name
  packageName: '@your-org/my-policy' as const,

  // Schema definitions for parameters and results
  abilityParamsSchema,
  userParamsSchema,
  commitParamsSchema,

  precheckAllowResultSchema,
  precheckDenyResultSchema,

  evalAllowResultSchema,
  evalDenyResultSchema,

  commitAllowResultSchema,
  commitDenyResultSchema,

  // Validation function - runs locally before execution
  precheck: async ({ abilityParams, userParams }, { allow, deny }) => {
    // Validate that the policy should permit the ability execution
    // For example: check current limits, validate parameters, etc.

    if (/* policy allows execution */) {
      return allow({ /* allow data */ });
    } else {
      return deny({ reason: 'Policy denied execution' });
    }
  },

  // Evaluation function - runs in Lit Action environment
  evaluate: async ({ abilityParams, userParams }, { allow, deny }) => {
    try {
      // Check current policy state and determine if execution should be allowed
      // This has access to blockchain data and external APIs

      if (/* policy evaluation passes */) {
        return allow({ /* evaluation data */ });
      } else {
        return deny({ reason: 'Policy evaluation failed' });
      }
    } catch (error) {
      return deny({ reason: error.message });
    }
  },

  // Commit function - runs in Lit Action environment after successful execution
  commit: async (commitParams, { allow, deny }) => {
    try {
      // Update policy state based on the successful ability execution
      // For example: increment counters, record transactions, etc.

      return allow({ /* commit success data */ });
    } catch (error) {
      return deny({ reason: error.message });
    }
  },
});
```

#### 6. Update the Input UI Schema

**File:** `packages/my-policy/src/inputUiSchema.json`

When a Vincent App User is permitting the Vincent App to execute an Ability, they will be prompted to configure the user parameters for your Policy. This file defines the UI schema that will be used to render the form fields for the user parameters.

<div class="box info-box">
  <p class="box-title info-box-title">
    <span class="box-icon info-icon">Info</span> Note
  </p>
  <p>
    For more details on how to write and customize the <code>uiSchema</code>, see the <a href="https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema/" target="_blank" rel="noopener">React JSONSchema Form uiSchema documentation</a>.
  </p>
</div>

The file contains two main sections:

- **`jsonSchema`**: Defines the data structure, types, validation rules, and descriptions for your Policy's user parameters
- **`uiSchema`**: Defines the UI presentation, widgets, placeholders, and help text for the form fields

<div class="box info-box">
  <p class="box-title info-box-title">
    <span class="box-icon info-icon">Info</span> Important
  </p>
  <p>
    The structure and parameter names in <code>inputUiSchema.json</code> must exactly match your <code>userParamsSchema</code> in <code>schemas.ts</code> to ensure the Vincent interface can properly validate and collect user configuration.
  </p>
</div>

#### 7. Update Jest Configuration

**File:** `packages/my-policy/jest.config.js`

- Update the display name to match your package name:

```javascript
module.exports = {
  displayName: '@your-org/my-policy', // Update this
  // ... rest of config
};
```

#### 9. Register Your Package with Nx

After making all the file changes, you need to update the workspace configuration to include your new package:

**File:** `nx.json` (in the repository root)

- Add your package to the release projects array:

```json
{
  "release": {
    "projects": ["ability-native-send", "policy-counter", "test-e2e", "my-policy"],
    ...
  }
}
```

#### 10. Install Dependencies

After all the above updates, run:

```bash
pnpm install
```

This ensures your new package is properly linked in the monorepo.

#### 10. Build Your Policy

After installing dependencies, build your Policy package with:

```bash
pnpm build
```

This ensures your Policy package has been properly configured, and can be imported for end-to-end testing.

If you see the following output, then your Policy package has been built successfully:

```bash
# The following output shows your new Policy package being recognized by Nx
 NX   Running target build for 4 projects and 3 tasks they depend on:

- ability-native-send
- policy-counter
- my-policy # <--- Your new Policy package name
- example-e2e
```

```bash
# The following output shows your new Policy package being built by Nx
> nx run my-policy:"action:build"

> pnpm node ./scripts/bundle-vincent-policy/esbuild.js

./src/lib
✅ lit-action.js
- 4.2112 MB (in decimal)
- 4.0162 MB (in binary)
✅ Vincent policy built successfully

> nx run my-policy:build

Compiling TypeScript files for project "my-policy"...
Done compiling TypeScript files for project "my-policy".
```

Congratulations! If you've made it to this point, then you've successfully created your own Vincent Policy package, and have it properly configured.

To test your Policy, you'll need to integrate it with an Ability and configure it to run as part of the Ability's execution. The included `packages/test-e2e/src/e2e.spec.ts` test file contains an example of how to do this by configuring the `ability-native-send` Ability to use the `policy-counter` Policy. You can also read more about how to configure an Ability to support a Policy in the [How Abilities Work](../Ability-Developers/Creating-Abilities.md#defining-supported-policies) guide.

## Development Workflow

Now that you have your Policy package configured, let's review the development workflow for building, testing, and deploying your Policies.

### Building Your Policy

To build your specific Policy package:

```bash
pnpm nx build my-policy
```

Or to build all packages in the repository:

```bash
pnpm build
```

This will:

1. Bundle your Lit Action code using esbuild
2. Generate TypeScript declarations
3. Create the bundled Policy wrapper
4. Output build artifacts to the `dist/` directory

### Testing Your Policy

#### End-to-End Tests

The Starter Kit includes comprehensive end-to-end tests that execute your Policy alongside Abilities using the same environment used by Vincent Apps:

```bash
pnpm test-e2e
```

This command will:

1. Build all Abilities and Policies
2. Deploy them to IPFS via Pinata
3. Execute the end-to-end tests using the Vincent system
4. Verify that your Policy works as expected with Abilities

#### Unit Tests (Optional)

You can also add unit tests for your Policy by specifying them in the package's directory i.e. `packages/my-policy/src/my-policy.spec.ts`.

You can then run the unit tests for your Policy using the following command:

```bash
# Run tests for your specific Policy
pnpm nx test my-policy

# Run all unit tests
pnpm test
```

### Deploying Your Policy

Deploy your Policy to IPFS:

```bash
pnpm nx action:deploy my-policy
```

The deployment process:

1. Bundles your TypeScript code into a Lit Action
2. Uploads the bundle to IPFS via Pinata
3. Generates metadata with the IPFS hash
4. Makes your Policy available for use by Vincent Abilities

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

| Target            | Projects                                       | Description                        |
| ----------------- | ---------------------------------------------- | ---------------------------------- |
| **action:build**  | ability-native-send, policy-counter, my-policy | Bundles the Lit Action code        |
| **action:deploy** | ability-native-send, policy-counter, my-policy | Builds and deploys to IPFS         |
| **build**         | all                                            | TypeScript compilation             |
| **test**          | all                                            | Unit tests for individual packages |
| **test-e2e**      | test-e2e                                       | Full E2E test suite                |

## Getting Help

If you run into any issues, check the example implementations in `packages/policy-counter` and `packages/ability-native-send` for reference.

If something is still unclear, reach out to us on [Telegram](https://t.me/+aa73FAF9Vp82ZjJh) for assistance.
