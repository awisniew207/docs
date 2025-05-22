---
category: Users
title: Concepts
---

# Concepts

## Vincent Tool

A Tool is an immutable serverless function that App Delegatees can execute to perform specific actions on behalf of an App User.

Tools can be specific to a Vincent App's use case, such as a Tool that mints a reward token based on some off-chain App data, or they can be general-purpose and used across multiple Apps, such as a Tool that enables swapping ERC20 tokens using the best price across multiple DEXs.

Vincent Tools leverage Lit Protocol's [Lit Actions](https://developer.litprotocol.com/sdk/serverless-signing/overview) to provide a secure and decentralized way to execute serverless functions that have the ability to read and write data to both on and off chain sources, perform arbitrary computations, and even sign blockchain transactions when permitted to do so by the App User.

## Vincent Policy

A Policy is an immutable serverless function which contains logic for determining whether a given App Delegatee is permitted to execute a given Tool for a given App User. These Policies are guardrails configured by the App User that ensure that Apps do not perform actions or exceed boundaries that violate the App User's intent, or the service the App is providing.

Similar to Tools, Policies can be specific to a Vincent App's use case, such as a Policy that only permits an App Delegatee to execute a Tool if the App User has a certain status in the App's off-chain database, or they can be general-purpose and used across multiple Apps, such as a Policy that enforces a daily spending limit from the App User's wallet.

Because Policies are powered by Lit Protocol's Lit Actions, both on and off chain data can be used to determine whether a given Tool should be permitted to be executed. Policies can also write data to on and off chain sources to keep track of state such as the number of times a Tool has been executed in a day, the amount that's been spent over a period of time, or any other data that is relevant for the Policy.

### Policy Parameters

Policies can be configured with parameters that are used to customize the behavior of the Policy. These parameters are stored on-chain, are set by the App User when they permit an App Version, and are retrieved during Policy execution to be provided as input for the Policy's logic.

## Vincent App

A Vincent App is a collection of Tools and their associated Policies where the Tools define the actions that can be performed by the App's Delegatees on behalf of an App User, and the Policies ensure these actions are executed within the User's defined parameters and permissions.

### App Version

Each App Version is a specific set of Tools and Policies that is permitted by an App User. Apps can have multiple versions, each with varying sets of Tools and Policies, but an App Delegatee is never permitted to execute a Tool or Policy that is not part of the Version the User has authorized.

### App Manager

An App Manager is a blockchain account (whether a standard externally owned account, or anything else that can sign Ethereum transactions) that is used to create and manage a Vincent App.

App Managers are responsible for setting the App metadata such as the App's name, description, redirect URIs, and deployment status.

Additionally, App Managers are responsible for setting other properties of the App such as what Vincent Tools and Policies are used by each App Version, what blockchain addresses are App Delegatees, and what App Versions are currently active and are able to be used by App Users.

### App Delegatee

An App Delegatee is a blockchain account that is associated with a Vincent App. Each Delegatee of an App is permitted to execute any of the Tools (and their associated Policies) that are part of the App Version the User has authorized.

## How these Concepts Tie Together

The lifecycle of a Vincent App is as follows:

1. An App Manager creates a new App, specifying the App metadata, and the Tools and Policies that will be used by the first version of the App
2. The App Manager specifies the App Delegatees that are permitted to execute the App's Tools (and their associated Policies) on behalf of App Users
3. A User navigates to the App's webapp and clicks a button that uses the Vincent SDK to redirect the User to the Vincent Consent page
4. The User authenticates with Vincent and an existing Vincent Agent wallet is retrieved, or a new wallet is created
5. The User is then presented with the App Consent page, which displays the App metadata, the Tools and associated Policies that will be used by the App Version, and are given input fields to specify any values for the Policy parameters that have been configured for each Tool's Policy
6. The User approves delegation for the App Version and is redirected back to the App's webapp
7. The App's webapp receives the redirect from the Vincent Consent page and logs the User in
8. The User interacts with the webapp and clicks a button that requires the execution of a Tool
9. The App's webapp backend triggers the execution of the Tool by an App Delegatee
10. The App Delegatee collects the necessary data to provide to the Tool for execution, and submits a request to the Lit Protocol network to execute the Tool
11. The Tool begins execution and first checks what Vincent App the executor of the Tool (the App Delegatee) is associated with
    - If the executor is not associated with any App, execution is halted and a not-authorized error is returned
12. The Tool then checks what App Version the App User has authorized, and retrieves the Policy and Policy parameters that have been set for the executing Tool by the User
13. The Tool then executes each Policy
    - If any of the Policies return a `false` value or an error, the Tool is halted and an error is returned
14. After all Policies have been executed successfully, the Tool executes the Tool's logic and performs whatever actions it was designed to perform
15. The Tool returns the results of its execution to the App's webapp backend