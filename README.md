# Vincent Dashboard, Contracts and SDK monorepo

## Architecture Overview

The Vincent Agent Wallet system is a decentralized permission management framework designed to allow third party applications to request users for permission to execute transactions on their behalf.

It uses an on-chain Agent PKP (Public Key Pair) registry and an off-chain App Registry backend. The system leverages blockchain technology (on Yellowstone chain) and Lit Protocol for secure key management and execution, ensuring users maintain control over their permissions while developers can manage their Apps efficiently.

## Key Components

### Agent PKP (On-Chain Agent Registry)
- Manages user-approved permissions for Apps using Policies
- Structure: AgentPKP → Apps → Tools → Policies
- Controlled by the User Admin PKP, allowing updates like enabling/disabling Apps, Tools & Policies

### App Registry (On-Chain)
- Tracks delegatee addresses for Apps, managed by the App's Management Wallet
- Ensures only authorized delegatees can execute Tools on behalf of users

### Tools
- Vincent Tools are the operations that an Agent can perform on behalf of the user and are codified as Lit Actions.
- Lit Actions are immutable Javascript code snippets assigned to the Agent's wallet and hosted under a unique IPFS CID.
- As a Vincent App developer you prompt the user, via the Consent Page, to delegate the execution of these Tools for their Agent wallets thus allowing you to autonomously execute these pre-defined operations on behalf of your users.
- Tools operate under the compliance of policies and cannot execute anything they are not authorized to or exceeding the limits set by the policies.

### Policies
- Policies set guard-rails for the permitted Tools to dictate the operating conditions for that Tool.
- As Tools, Policies are also codified as Lit Actions and hosted under a unique IPFS CID.
- Multiple Policies can be applied to a Tool like max daily spend or 2FA and all these policies should be met before the Tool can sign using the delegated user's Agent wallet. This also becomes important since your AI Agents can occasionally hallucinate.
- A defined set of parameters can be configured for these Policies like specifying the max daily spend amount or the 2FA method.

### Consent Page
- A user-facing interface where permissions (Tools and Policies) are approved
- Displays App metadata and requested Roles/Tools from the App Registry
- Facilitates transaction signing with the User PKP and gas sponsorship via a Relayer

### Relayer
- Sponsors gas costs (on Yellowstone) and Lit payments for user transactions
- Uses capability delegation to enable seamless execution

## How It Works

### Developer Flow
1. Developers register an App with a unique Management Wallet and define its metadata (name, description, etc.).
2. They either create Tools (with IPFS-hosted Lit Actions and Policy schemas) and Policies, or use existing ones.
3. They secure their app using explicitly allowed `redirectUris` that the Vincent consent page respects.
4. The App integrates with the Consent Page, using an App Id.
5. When a user uses the Consent page to add delegations, they are redirected to the app with a signed JWT.

### User Flow
1. Users access the Consent Page via an App, review requested Tools and Policies, adjusting Policy variables if needed.
2. Approval triggers a transaction signed by the User PKP, sponsored by the Relayer, writing permissions to the Agent Registry.
3. Users can later manage permissions (disable Apps/Roles/Tools) via a dashboard.

### Execution
- Delegatees (approved by the App) use session signatures to execute Tools, validated against the Agent Registry.
- Lit Protocol ensures secure signing and execution of Tool Lit Actions, respecting the approved Tools, Policies, and Policy variables.

## Why It's Secure

- **User Control**: The User PKP is the sole admin of the Agent Registry, ensuring only the user can approve or revoke permissions.
- **Lit Protocol**: Uses threshold cryptography and decentralized key management, eliminating single points of failure compared to centralized solutions like Turnkey.
- **Delegatee Verification**: Only addresses approved by the App's Management Wallet can execute Tools, enforced on-chain.
- **Gas Sponsorship**: The Relayer's JIT sponsorship prevents users from needing to manage gas, reducing attack vectors while maintaining security via capability delegation.

## Lit vs. Turnkey

### Lit Protocol
- **Decentralized**: Keys are split across a network of nodes using threshold cryptography.
- **Flexibility**: Supports programmable Lit Actions for custom logic (e.g., Tools + Policies).
- **Security**: No single entity controls keys; user PKPs are user-owned and managed via AuthMethods.
- **Cost**: Requires Lit payments, offset by Relayer sponsorship in this system for the user.

### Turnkey
- **Centralized**: Relies on a trusted third-party service to manage keys.
- **Simplicity**: Easier to integrate for basic use cases but lacks programmability.
- **Security Trade-off**: Centralized control introduces a single point of failure and trust dependency.
- **Cost**: Typically subscription-based, potentially higher for complex workflows.

**Why Lit?**: Vincent prioritizes decentralization, user sovereignty, and programmable flexibility, making Lit the better fit over Turnkey's centralized model.


## Documentation
- [Vincent Docs](https://docs.heyvincent.ai/)
- [SDK Docs](https://sdk-docs.heyvincent.ai/)

# Ecosystem

## Policies

- Spending Limits Contract
  https://github.com/LIT-Protocol/SpendingLimitsContract

# Contributing

Check [CONTRIBUTING.md](./CONTRIBUTING.md) for setup and general development instructions.

### Dashboard action/policy IPFS CIDs:
```
ERC20_APPROVAL_TOOL_IPFS_ID=QmPZ46EiurxMb7DmE9McFyzHfg2B6ZGEERui2tnNNX7cky
UNISWAP_SWAP_TOOL_IPFS_ID=QmZbh52JYnutuFURnpwfywfiiHuFoJpqFyFzNiMtbiDNkK
SPENDING_LIMIT_POLICY_IPFS_ID=QmZrG2DFvVDgo3hZgpUn31TUgrHYfLQA2qEpAo3tnKmzhQ
```
