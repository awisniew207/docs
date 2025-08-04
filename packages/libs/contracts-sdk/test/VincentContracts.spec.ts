import { config } from '@dotenvx/dotenvx';
import { ethers, providers } from 'ethers';

import {
  LitActionResource,
  LitPKPResource,
  createSiweMessage,
  generateAuthSig,
} from '@lit-protocol/auth-helpers';
import { LIT_NETWORK, LIT_ABILITY } from '@lit-protocol/constants';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';

import type { AppVersionAbilities } from '../src/index';

import { getTestClient } from '../src/index';
import { expectAssertArray, expectAssertObject } from './assertions';

const generateRandomIpfsCid = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return (
    'Qm' +
    Array.from({ length: 42 }, (): string => chars[Math.floor(Math.random() * chars.length)]).join(
      '',
    )
  );
};

config();
if (!process.env.TEST_APP_MANAGER_PRIVATE_KEY) {
  console.error('TEST_APP_MANAGER_PRIVATE_KEY environment variable is required');
  process.exit(1);
}

if (!process.env.TEST_USER_AUTH_SIG_PRIVATE_KEY) {
  console.error('TEST_USER_AUTH_SIG_PRIVATE_KEY environment variable is required');
  process.exit(1);
}

if (!process.env.TEST_USER_PKP_PUBKEY) {
  console.error('TEST_USER_PKP_PUBKEY environment variable is required');
  process.exit(1);
}

if (!process.env.TEST_USER_PKP_ADDRESS) {
  console.error('TEST_USER_PKP_ADDRESS environment variable is required');
  process.exit(1);
}

if (!process.env.TEST_USER_AGENT_PKP_ADDRESS) {
  console.error('TEST_USER_AGENT_PKP_ADDRESS environment variable is required');
  process.exit(1);
}

describe('VincentContracts', () => {
  it('should perform all actions on a new App and User Agent', async () => {
    const provider = new providers.JsonRpcProvider('https://yellowstone-rpc.litprotocol.com');

    // App Contracts Client
    const appManagerSigner = new ethers.Wallet(process.env.TEST_APP_MANAGER_PRIVATE_KEY!, provider);
    const appClient = getTestClient({ signer: appManagerSigner });

    const appId = Math.floor(Math.random() * (10_000_000_000 - 1000)) + 1000; // Copied from Registry upto 10B
    const delegatees = [ethers.Wallet.createRandom().address];

    // Register initial app version
    const initialVersionAbilities: AppVersionAbilities = {
      abilityIpfsCids: [generateRandomIpfsCid()],
      abilityPolicies: [[]],
    };
    const initialAppVersion = await appClient.registerApp(
      {
        appId,
        delegateeAddresses: delegatees,
        versionAbilities: initialVersionAbilities,
      },
      {
        gasLimit: 10000000,
      },
    );
    console.log('App registration result:', initialAppVersion);
    expect(initialAppVersion).toHaveProperty('txHash');

    // Get the app by ID
    const appByIdResult = await appClient.getAppById({
      appId,
    });
    console.log('App by ID result:', appByIdResult);

    expectAssertObject(appByIdResult);

    expect(appByIdResult.id).toEqual(appId);
    expect(appByIdResult.isDeleted).toEqual(false);
    expect(appByIdResult.manager).toEqual(appManagerSigner.address);
    expect(appByIdResult.latestVersion).toEqual(1);
    expect(appByIdResult.delegateeAddresses).toEqual(delegatees);

    // Disable the initial app version
    const disableAppVersionResult = await appClient.enableAppVersion({
      appId,
      appVersion: 1,
      enabled: false,
    });
    console.log('Disable app version result:', disableAppVersionResult);
    expect(disableAppVersionResult).toHaveProperty('txHash');

    // Get app version
    const appVersionResult = await appClient.getAppVersion({
      appId,
      version: 1,
    });
    console.log('App version result:', appVersionResult);

    expectAssertObject(appVersionResult);
    expect(appVersionResult.appVersion.version).toEqual(1);
    expect(appVersionResult.appVersion.enabled).toEqual(false);

    // Get all apps by manager
    const appsByManagerResult = await appClient.getAppsByManagerAddress({
      managerAddress: appManagerSigner.address,
      offset: '0',
    });
    console.log('Apps by manager result:', appsByManagerResult);
    expect(appsByManagerResult.length).toBeGreaterThan(0);

    // Get app by delegatee
    const appByDelegateeResult = await appClient.getAppByDelegateeAddress({
      delegateeAddress: delegatees[0],
    });
    console.log('App by delegatee result:', appByDelegateeResult);
    expectAssertObject(appByDelegateeResult);
    expect(appByDelegateeResult.id).toEqual(appId);
    expect(appByDelegateeResult.isDeleted).toEqual(false);
    expect(appByDelegateeResult.manager).toEqual(appManagerSigner.address);
    expect(appByDelegateeResult.latestVersion).toEqual(1);
    expect(appByDelegateeResult.delegateeAddresses).toEqual(delegatees);

    // Get app ID by delegatee
    const appIdByDelegateeResult = await appClient.getAppIdByDelegatee({
      delegateeAddress: delegatees[0],
    });
    console.log('App ID by delegatee result:', appIdByDelegateeResult);
    expect(appIdByDelegateeResult).toEqual(appId);

    // Test getAppIdByDelegatee with non-registered delegatee
    const nonRegisteredDelegatee = ethers.Wallet.createRandom().address;
    const nonRegisteredAppIdResult = await appClient.getAppIdByDelegatee({
      delegateeAddress: nonRegisteredDelegatee,
    });
    console.log('Non-registered delegatee app ID result:', nonRegisteredAppIdResult);
    expect(nonRegisteredAppIdResult).toBe(null);

    // Register next app version
    const nextVersionAbilities: AppVersionAbilities = {
      abilityIpfsCids: [initialVersionAbilities.abilityIpfsCids[0], generateRandomIpfsCid()], // one existing & one new ability
      abilityPolicies: [
        [generateRandomIpfsCid()], // new policy for the existing ability
        [generateRandomIpfsCid(), generateRandomIpfsCid()], // new policy for the new ability
      ],
    };
    const nextAppVersion = await appClient.registerNextVersion({
      appId,
      versionAbilities: nextVersionAbilities,
    });
    console.log('Next version registration result:', nextAppVersion);
    expect(nextAppVersion).toHaveProperty('txHash');
    expect(nextAppVersion.newAppVersion).toEqual(2);

    // Add a delegatee
    const addDelegateeResult = await appClient.addDelegatee({
      appId,
      delegateeAddress: ethers.Wallet.createRandom().address,
    });
    console.log('Add delegatee result:', addDelegateeResult);
    expect(addDelegateeResult).toHaveProperty('txHash');

    // Remove the delegatee
    const removeDelegateeResult = await appClient.removeDelegatee({
      appId,
      delegateeAddress: delegatees[0],
    });
    console.log('Remove delegatee result:', removeDelegateeResult);
    expect(removeDelegateeResult).toHaveProperty('txHash');

    // Delete the app
    const deleteAppResult = await appClient.deleteApp({
      appId,
    });
    console.log('Delete app result:', deleteAppResult);
    expect(deleteAppResult).toHaveProperty('txHash');

    // Undelete the app
    const undeleteAppResult = await appClient.undeleteApp({
      appId,
    });
    console.log('Undelete app result:', undeleteAppResult);
    expect(undeleteAppResult).toHaveProperty('txHash');

    // User Client
    const userSigner = new ethers.Wallet(process.env.TEST_USER_AUTH_SIG_PRIVATE_KEY!, provider);
    const userClient = getTestClient({ signer: userSigner });
    const litNodeClient = new LitNodeClient({
      litNetwork: LIT_NETWORK.Datil,
      debug: false,
    });
    await litNodeClient.connect();

    const controllerSessionSigs = await litNodeClient.getSessionSigs({
      chain: 'ethereum',
      expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
      capabilityAuthSigs: [],
      resourceAbilityRequests: [
        {
          resource: new LitPKPResource('*'),
          ability: LIT_ABILITY.PKPSigning,
        },
        {
          resource: new LitActionResource('*'),
          ability: LIT_ABILITY.LitActionExecution,
        },
      ],
      authNeededCallback: async ({ uri, expiration, resourceAbilityRequests }: any) => {
        // authNeededCallback: async ({ uri, expiration, resourceAbilityRequests }: { uri: string; expiration: string; resourceAbilityRequests: any[] }) => {
        const toSign = await createSiweMessage({
          uri,
          expiration,
          resources: resourceAbilityRequests,
          walletAddress: userSigner.address,
          nonce: await litNodeClient.getLatestBlockhash(),
          litNodeClient,
        });

        return await generateAuthSig({
          signer: userSigner,
          toSign,
        });
      },
    });

    const pkpEthersWallet = new PKPEthersWallet({
      litNodeClient,
      pkpPubKey: process.env.TEST_USER_PKP_PUBKEY!,
      controllerSessionSigs,
    });
    await pkpEthersWallet.init();

    const pkpClient = getTestClient({ signer: pkpEthersWallet });

    const permitAppResult = await pkpClient.permitApp({
      pkpEthAddress: process.env.TEST_USER_AGENT_PKP_ADDRESS!,
      appId,
      appVersion: nextAppVersion.newAppVersion,
      // Pre-CBOR2 payload for this case was:
      // permissionData: {
      //   abilityIpfsCids: nextVersionAbilities.abilityIpfsCids,
      //   policyIpfsCids: nextVersionAbilities.abilityPolicies,
      //   policyParameterValues: [
      //     ['0xa1781f6d61784461696c795370656e64696e674c696d6974496e55736443656e7473653130303030'], // CBOR2 encoded {"maxDailySpendingLimitInUsdCents": "10000"}
      //     [
      //       '0xa2781f6d61784461696c795370656e64696e674c696d6974496e55736443656e74736535303030306c746f6b656e41646472657373782a307834323030303030303030303030303030303030303030303030303030303030303030303030303036', // CBOR2 encoded {"maxDailySpendingLimitInUsdCents": "50000", "tokenAddress": "0x4200000000000000000000000000000000000006"}
      //       '0x', // empty policy var
      //     ],
      //   ],
      // },
      // PermissionData from user-space should always be POJO
      permissionData: {
        [nextVersionAbilities.abilityIpfsCids[0]]: {
          [nextVersionAbilities.abilityPolicies[0][0]]: {
            maxDailySpendingLimitInUsdCents: '10000',
          },
        },
        [nextVersionAbilities.abilityIpfsCids[1]]: {
          [nextVersionAbilities.abilityPolicies[1][0]]: {
            maxDailySpendingLimitInUsdCents: '50000',
            tokenAddress: '0x4200000000000000000000000000000000000006',
          },
          // [nextVersionAbilities.abilityPolicies[1][1]]: Omitted entirely rather than `0x`, because it has no params in this case.
        },
      },
    });

    console.log('Permit app result:', permitAppResult);
    expect(permitAppResult).toHaveProperty('txHash');

    // Get Agent Pkps
    const agentPkpsResult = await userClient.getAllRegisteredAgentPkpEthAddresses({
      userPkpAddress: process.env.TEST_USER_PKP_ADDRESS!,
      offset: '0',
    });
    console.log('Agent pkps result:', agentPkpsResult);
    expect(agentPkpsResult.length).toBeGreaterThan(0);
    expect(agentPkpsResult[0]).toEqual(process.env.TEST_USER_AGENT_PKP_ADDRESS!);

    // Get permitted app version for pkp
    const permittedAppVersionForPkpResult = await userClient.getPermittedAppVersionForPkp({
      pkpEthAddress: process.env.TEST_USER_AGENT_PKP_ADDRESS!,
      appId,
    });
    console.log('Permitted app version for pkp result:', permittedAppVersionForPkpResult);
    expect(permittedAppVersionForPkpResult).toEqual(nextAppVersion.newAppVersion);

    // Get all permitted app ids for pkp
    const allPermittedAppIdsForPkpResult = await userClient.getAllPermittedAppIdsForPkp({
      pkpEthAddress: process.env.TEST_USER_AGENT_PKP_ADDRESS!,
      offset: '0',
    });
    console.log('All permitted app ids for pkp result:', allPermittedAppIdsForPkpResult);
    expect(allPermittedAppIdsForPkpResult.length).toBeGreaterThan(0);

    // Get all abilities and policies for app
    const allAbilitiesAndPoliciesForAppResult = await userClient.getAllAbilitiesAndPoliciesForApp({
      pkpEthAddress: process.env.TEST_USER_AGENT_PKP_ADDRESS!,
      appId,
    });
    expectAssertObject(allAbilitiesAndPoliciesForAppResult);
    console.log('All abilities and policies for app result:', allAbilitiesAndPoliciesForAppResult);
    expect(Object.keys(allAbilitiesAndPoliciesForAppResult).length).toBeGreaterThan(0); // Weak test since the order of the ability is not guaranteed

    await litNodeClient.disconnect();

    // Get delegated agent pkp token ids
    const delegatedAgentPkpTokenIdsResult = await userClient.getDelegatedPkpEthAddresses({
      appId,
      version: nextAppVersion.newAppVersion,
      offset: 0,
    });
    console.log('Delegated agent pkp token ids result:', delegatedAgentPkpTokenIdsResult);
    expectAssertArray(delegatedAgentPkpTokenIdsResult);
    expect(delegatedAgentPkpTokenIdsResult.length).toBeGreaterThan(0);
    expect(delegatedAgentPkpTokenIdsResult[0]).toEqual(process.env.TEST_USER_AGENT_PKP_ADDRESS!);

    // Set ability policy parameters
    const setAbilityPolicyParametersResult = await pkpClient.setAbilityPolicyParameters({
      pkpEthAddress: process.env.TEST_USER_AGENT_PKP_ADDRESS!,
      appId,
      appVersion: nextAppVersion.newAppVersion,
      // Pre-CBOR2 payload for this case was:
      // abilityIpfsCids: [],
      // policyIpfsCids: [[nextVersionAbilities.abilityPolicies[1][1]]], // second policy was never set by the Agent
      // policyParameterValues: [
      //   [
      //     '0xa2781f6d61784461696c795370656e64696e674c696d6974496e55736443656e74736535303030306c746f6b656e41646472657373782a307834323030303030303030303030303030303030303030303030303030303030303030303030303036',
      //   ], //
      // ],
      policyParams: {
        [nextVersionAbilities.abilityIpfsCids[1]]: {
          [nextVersionAbilities.abilityPolicies[1][1]]: {
            maxDailySpendingLimitInUsdCents: '50000',
            tokenAddress: '0x4200000000000000000000000000000000000006',
          },
        },
      },
    });
    console.log('Set ability policy parameters result:', setAbilityPolicyParametersResult);
    expect(setAbilityPolicyParametersResult).toHaveProperty('txHash');

    // Unpermit app
    const unpermitAppResult = await pkpClient.unPermitApp({
      pkpEthAddress: process.env.TEST_USER_AGENT_PKP_ADDRESS!,
      appId,
      appVersion: nextAppVersion.newAppVersion,
    });
    console.log('Unpermit app result:', unpermitAppResult);
    expect(unpermitAppResult).toHaveProperty('txHash');

    // Set delegatees (replaces all existing delegatees)
    const newDelegatees = [
      ethers.Wallet.createRandom().address,
      ethers.Wallet.createRandom().address,
    ];
    const setDelegateeResult = await appClient.setDelegatee({
      appId,
      delegateeAddresses: newDelegatees,
    });
    console.log('Set delegatee result:', setDelegateeResult);
    expect(setDelegateeResult).toHaveProperty('txHash');

    const appAfterSetDelegatee = await appClient.getAppById({
      appId,
    });
    console.log('App after set delegatee:', appAfterSetDelegatee);
    expectAssertObject(appAfterSetDelegatee);
    expect(appAfterSetDelegatee.delegateeAddresses).toEqual(newDelegatees);
  }, 60000);
});
