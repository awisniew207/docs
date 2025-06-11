---
category: Users
title: Concepts
---

# Vincent Tool

A Vincent Tool is an **immutable** serverless function that the User permits a Vincent App to perform specific actions on their behalf.

Vincent Tools can serve specific use cases, such as minting a reward token based on off-chain data, or they can serve general purposes, such as enabling ERC20 token swaps using the best price across multiple DEXs.

Vincent Tools leverage Lit Protocol's [Lit Actions](https://developer.litprotocol.com/sdk/serverless-signing/overview) to execute immutable and decentralized serverless functions that can read and write data to both on and off-chain sources, perform arbitrary computations, and sign blockchain transactions.

**On-chain example:** Uses AI to buy the hottest ERC20 token on Uniswap.
	
**Off-chain example:** Trade stocks with your broker API key.

# Vincent Policy

A Vincent Policy also leverages Lit Actions to determine whether a given Vincent App can execute a Vincent Tool for a Vincent App User. These Policies serve as guardrails that Vincent App Users configure to ensure Vincent Apps can only perform actions within the Vincent App User's intended boundaries and set parameters.

Similar to Vincent Tools, Vincent Policies can serve specific use cases, such as permitting a Vincent App to execute a Vincent Tool only when the Vincent App User holds a certain status in a Vincent App's off-chain database, or they can serve general purposes across multiple Vincent Apps, such as enforcing a daily spending limit from the Vincent App User's wallet.

Because Vincent Policies are powered by Lit Actions, they can use both on and off chain data to determine whether a Vincent Tool should execute. Vincent Policies can also write data to on and off chain sources to track state such as:

- Vincent Tool execution frequency
- Spending amounts over time periods
- Any other relevant Vincent Policy data

## Policy Parameters

Vincent Policies accept parameters that customize their behavior. These parameters are stored on-chain, set by Vincent App Users when they permit a Vincent App Version, and are retrieved during Vincent Policy execution to provide input for the Policy's logic. Vincent Policy parameters are configurable by the Vincent App User per Vincent App, cannot be altered by the Vincent App, and are able to be updated at any time by the Vincent App User.

For example, a Vincent App User can set a daily spending limit when authorizing a Vincent App Version that would apply only to that specific Vincent App. When the Vincent App executes Vincent Tools that transfer funds from the User's Agent Wallet, the Policy tracks the total spent in an on-chain smart contract. Once the daily spending limit is reached, the Vincent Policy would prevent the Vincent App from executing any more Vincent Tools that transfer funds from the Vincent App User's Agent Wallet, until the next day.

# Vincent Agent Wallet

Vincent Agent Wallets are non-custodial wallets ([MPC](https://en.wikipedia.org/wiki/Secure_multi-party_computation)) that enable users to interact with Vincent Apps. These wallets leverage Lit Protocol's [Programmable Key Pairs (PKPs)](https://developer.litprotocol.com/user-wallets/pkps/overview) to provide wallets that are owned by a user's _authentication method_ which include many different methods supported by Lit Protocol, such as a one-time-password sent to an email address or phone number, a passkey saved on the User's device, a social account such as a Google, X, or Telegram, and [many more](https://developer.litprotocol.com/user-wallets/pkps/advanced-topics/auth-methods/overview#existing-supported-auth-methods).

The signing capability of Vincent Agent Wallets are what's delegated to Vincent Apps to allow them to execute Vincent Tools on behalf of a Vincent App User and perform on-chain actions. For example, a Vincent App that offers to trade ERC20 tokens based on some unique algorithm would add an ERC20 token swap Vincent Tool to a Vincent App Version. The Vincent App User would authorize the Vincent App Version, permitting the Vincent App to execute the ERC20 token swap Vincent Tool on behalf of the Vincent App User, restricted by whatever Vincent Policies the Vincent App User has set for the Tool.

Because Vincent Agent Wallets are Lit Protocol PKPs, Vincent Apps can never directly access a Vincent App User's Agent Wallet. Instead, they can only execute Vincent Tools that the Vincent App User has explicitly authorized. Each Vincent Tool's code strictly defines what data can be signed, and Vincent Apps cannot modify this code or sign any data beyond the Vincent Tool's programmed scope. When a Vincent Tool needs to sign data, like a blockchain transaction, it must request the signature through the Lit network, which verifies the origin of the request came from the authorized Vincent Tool before generating the signature.

:::info
This security model enables Vincent's core innovation: Vincent App Users can safely delegate on-chain actions to Vincent Apps while maintaining complete control over their assets. Vincent Apps can execute authorized Vincent Tools on behalf of Vincent App Users, but they can never access private keys or sign data outside of what the Vincent Tool has been programmed to do.
:::

# Vincent App

A Vincent App bundles Vincent Tools and their associated Vincent Policies, where Vincent Tools define the actions that the Vincent App can perform on behalf of a Vincent App User, and Vincent Policies ensure these actions execute within the Vincent App User's defined parameters and permissions.

## App Version

Vincent App Versions define the specific set of Vincent Tools and Policies that Vincent Apps can execute on behalf of a Vincent App User. When a Vincent App User wants to delegate signing capabilities to a Vincent App, they must authorize a specific Vincent App Version.

Vincent App Managers can create new versions for their Vincent Apps, specifying new Vincent Tools and Policies that will be available to be executed by a Vincent App. Once created, Vincent App Versions are immutable and cannot be altered. Vincent Apps are only authorized to execute the Vincent Tools and Policies associated with the Vincent App Version that's been approved by the Vincent App User.

This immutability ensures that Apps can evolve and add new features through new versions, but Vincent App Users maintain complete control over what actions can be performed on behalf of their Vincent Agent Wallet. To execute new Vincent Tools and Policies, Vincent App Users must explicitly authorize a new Vincent App Version, guaranteeing that nothing can be executed without their permission.

## App Manager

A Vincent App Manager is a blockchain account (whether a standard externally owned account, or anything else that can sign Ethereum transactions) that creates and manages a Vincent App.

Vincent App Managers configure their App's metadata, including it's name, description, redirect URIs, and deployment status. They also define which Vincent Tools and Policies each Vincent App Version will use, and control which Vincent App Versions remain active and available for Vincent App Users to authorize.

## App User

A Vincent App User owns a Vincent Agent Wallet and controls what actions can be performed with it. When a Vincent App User wants to use a Vincent App, they must first authorize a specific Vincent App Version, which defines the set of Vincent Tools and Policies that Vincent Apps can execute on their behalf.

Vincent App Users maintain complete control over their assets through two key mechanisms: they explicitly authorize which Vincent App Versions can be used with their Vincent Agent Wallet, and they configure Vincent Policy parameters that restrict how Vincent Tools can be executed.

For example, a Vincent App User might authorize a trading App's Version that includes a Vincent Tool that swaps tokens on a DEX, but they set a daily spending limit of 1 ETH. The Vincent App can execute the Vincent swap Tool, but only within the constraints of the Vincent App User's configured Policy parameters.

This authorization model ensures that Vincent App Users can safely delegate actions to Vincent Apps while maintaining control over their assets and the conditions under which those assets can be used.

# How these Concepts Tie Together

The lifecycle of a Vincent App follows these steps:

1. An App Manager creates a new App, specifying the App metadata, and the Tools and Policies that the first version of the App will use
2. A User navigates to the App's webapp and clicks a button that uses the Vincent SDK to redirect to the Vincent Consent page
3. The User authenticates with Vincent and either retrieves an existing Vincent Agent wallet or creates a new one
4. The User views the App Consent page, which displays the App metadata, the Tools and associated Policies that the App Version will use, and provides input fields for any Policy parameters configured for each Tool's Policy
5. The User approves delegation for the App Version and is redirected back to the App's webapp
6. The App's webapp receives the redirect from the Vincent Consent page and logs the User in
7. The User interacts with the webapp and clicks a button that requires execution of a Vincent Tool
8. The App's webapp backend triggers the Tool execution
9.  The App collects the necessary data for the Tool execution and submits a request to the Lit Protocol network
10. The Tool begins execution and first checks which Vincent App the executor is associated with
    - If the executor is not associated with any App, execution halts and returns a not-authorized error
11. The Tool then checks which App Version the App User has authorized and retrieves the Policies and Policy parameters that the User set for the executing Tool
12. The Tool then executes each Policy, providing it with the retrieved on-chain Policy parameters
    - If any Policy returns a `false` value or an error, Tool execution halts and returns an error
13. After all Policies execute successfully, the Tool runs its logic and performs its designed actions
14. The Tool returns the execution results to the App's webapp backend