## 1.1.0 (2025-09-03)

### 🚀 Features

- CHANGELOG: ([4f01765b](https://github.com/LIT-Protocol/Vincent/commit/4f01765b))

  1. Added new flags for update-contracts for dev | prod env and fixed the Makefile to handle dev deployments
  2. Added function selectors for new App, User, UserFacet functions
  3. Removed the temp function that allows the contract owner to assign all the apps of a manager to a new address. See PR for more info
  4. Updated the Dev Vincent contract address in the SDK to be used in getTestClient
  5. Updated the dev and prod contracts to use all the latest functions we added

- Add getPermittedAppsForPkps method which returns the permitted App ID and App version for an array of provided PKP token IDs ([a3a03eda](https://github.com/LIT-Protocol/Vincent/commit/a3a03eda))

### ❤️ Thank You

- Adarsh-Kumar28
- Wyatt Barnes @spacesailor24

# 1.0.1 (2025-08-05)

### 🩹 Fixes

- #### Policy Param Parsing Fixes ([16470065](https://github.com/LIT-Protocol/Vincent/commit/16470065))

  - Resolves some inconsistencies in Policy Parameter parsing so that policies can be enabled but have no parameters
  - Removed dynamic imports
  - Replaced `Buffer` dependency with ethers.utils.hexlify usage

### ❤️ Thank You

- Daryl Collins

# 1.0.0 (2025-08-05)

### 🚀 Features

- Add validateAbilityExecutionAndGetPolicies() method ([176e2023](https://github.com/LIT-Protocol/Vincent/commit/176e2023))
- Add CBOR2 encoding to policy parameter persistence and loading from the chain ([4f592cea](https://github.com/LIT-Protocol/Vincent/commit/4f592cea))

### 🩹 Fixes

### Enable typedoc generation for the contracts-sdk ([bcf9244c](https://github.com/LIT-Protocol/Vincent/commit/bcf9244c))

- Return null from getAppVersion() if the error is an AppNotRegistered error (previously only did this for AppVersionNotRegistered) ([176e2023](https://github.com/LIT-Protocol/Vincent/commit/176e2023))
- De-dupe definitions in our combined Vincent Diamond ABI to avoid being spammed by logging from ethers about the duplication ([176e2023](https://github.com/LIT-Protocol/Vincent/commit/176e2023))

### ⚠️ Breaking Changes

- #### API changes for v1.0 ([aedcd1b7](https://github.com/LIT-Protocol/Vincent/commit/aedcd1b7))

  - Numbers instead of strings for things that are numeric but won't be big enough to require BigInt
  - Renamed some arguments to be more explicit e.g. 'xxx'->xxxAddress
  - getAppsByManager() -> getAppsByManagerAddress()
  - getAppByDelegatee() -> getAppByDelegateeAddress()
  - Modified interfaces that took and returned pkpTokenIds to take and return pkpEthAddresses instead
  - Used partial ABI of pkpRouter contract to avoid bringing in multiple MB of contracts-sdk ABIs
  - getDelegatedAgentPkpTokenIds() -> getDelegatedPkpEthAddresses()
  - getAllRegisteredAgentPkps() -> getAllRegisteredAgentPkpEthAddresses()
  - Optional pageOpts for fetching pages of pkpEthAddresses, with optional offset and limit - default page size is 100
  - `overrides` is now correctly defined as an Ethers.Overrides type
  - Added some internal types for contract results to be sure we're sane in our usage
  - Removed `success` property from responses of methods that returned `{ txHash, success }` - it was redundant - there was no way `success` could ever be anything other than `true`.
  - Removed logic in `registerNextVersion() that would return `-1` for newAppVersion in cases where we couldn't identify what it was, and instead threw an explicit error
  - Return an empty array for collection methods that might have no results instead of reverting

- #### Support dev and prod contracts ([5262c600](https://github.com/LIT-Protocol/Vincent/commit/5262c600))

  - Refactored to export methods for creating a ContractClient instance instead of flat, raw methods list
  - `getTestClient({ signer })` for CI or dev usage where you don't care about the data being kept around
  - `getClient({ signer })` for production usage where you care about the data

  #### Internal method for interacting with local chain instances

  - `clientFromContract({ contract })` allows a completely custom contract to be provided, for cases where we may running entirely local chain instance w/ custom addresses or contract implementations.

### ❤️ Thank You

- Daryl Collins
