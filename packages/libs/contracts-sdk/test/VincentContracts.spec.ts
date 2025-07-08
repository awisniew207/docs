import { VincentContracts, AppVersionTools } from '../src/index';
import { ethers, providers } from 'ethers';
import { config } from '@dotenvx/dotenvx';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LIT_NETWORK, LIT_ABILITY } from '@lit-protocol/constants';
import {
  LitActionResource,
  LitPKPResource,
  createSiweMessage,
  generateAuthSig,
} from '@lit-protocol/auth-helpers';

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

if (!process.env.TEST_USER_AGENT_PKP_TOKEN_ID) {
  console.error('TEST_USER_AGENT_PKP_TOKEN_ID environment variable is required');
  process.exit(1);
}

describe('VincentContracts', () => {
  it("should register a new app, update it, and permit it by the user's Agent", async () => {
    const provider = new providers.JsonRpcProvider('https://yellowstone-rpc.litprotocol.com');

    // App Contracts Client
    const appManagerSigner = new ethers.Wallet(process.env.TEST_APP_MANAGER_PRIVATE_KEY!, provider);
    const appClient = new VincentContracts(appManagerSigner);

    const appId = ethers.BigNumber.from(ethers.utils.randomBytes(32));
    const delegatees = [ethers.Wallet.createRandom().address];

    // Register initial app version
    const initialVersionTools: AppVersionTools = {
      toolIpfsCids: [generateRandomIpfsCid()],
      toolPolicies: [[]],
    };
    const initialAppVersion = await appClient.registerApp(
      appId.toString(),
      delegatees,
      initialVersionTools,
    );
    console.log('App registration result:', initialAppVersion);
    expect(initialAppVersion).toHaveProperty('txHash');
    expect(initialAppVersion).toHaveProperty('newAppVersion');

    // Register next app version
    const nextVersionTools: AppVersionTools = {
      toolIpfsCids: [initialVersionTools.toolIpfsCids[0], generateRandomIpfsCid()], // one existing & one new tool
      toolPolicies: [
        [generateRandomIpfsCid()], // new policy for the existing tool
        [generateRandomIpfsCid(), generateRandomIpfsCid()], // new policy for the new tool
      ],
    };
    const nextAppVersion = await appClient.registerNextVersion(appId.toString(), nextVersionTools);
    console.log('Next version registration result:', nextAppVersion);
    expect(nextAppVersion).toHaveProperty('txHash');
    expect(nextAppVersion).toHaveProperty('newAppVersion');

    const initialVersion = parseInt(initialAppVersion.newAppVersion);
    const nextVersion = parseInt(nextAppVersion.newAppVersion);
    expect(nextVersion).toBeGreaterThan(initialVersion);

    // User Client
    const userSigner = new ethers.Wallet(process.env.TEST_USER_AUTH_SIG_PRIVATE_KEY!, provider);
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
      authNeededCallback: async ({ uri, expiration, resourceAbilityRequests }) => {
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

    const userClient = new VincentContracts(pkpEthersWallet);
    const permitAppResult = await userClient.permitApp(
      process.env.TEST_USER_AGENT_PKP_TOKEN_ID!,
      appId.toString(),
      nextAppVersion.newAppVersion,
      {
        toolIpfsCids: nextVersionTools.toolIpfsCids,
        policyIpfsCids: nextVersionTools.toolPolicies,
        policyParameterValues: [
          ['0xa1781f6d61784461696c795370656e64696e674c696d6974496e55736443656e7473653130303030'], // CBOR2 encoded {"maxDailySpendingLimitInUsdCents": "10000"}
          [
            '0xa2781f6d61784461696c795370656e64696e674c696d6974496e55736443656e74736535303030306c746f6b656e41646472657373782a307834323030303030303030303030303030303030303030303030303030303030303030303030303036', // CBOR2 encoded {"maxDailySpendingLimitInUsdCents": "50000", "tokenAddress": "0x4200000000000000000000000000000000000006"}
            '0x', // empty policy var
          ],
        ],
      },
    );

    console.log('Permit app result:', permitAppResult);
    expect(permitAppResult).toHaveProperty('txHash');
    expect(permitAppResult).toHaveProperty('success');
    expect(permitAppResult.success).toBe(true);

    await litNodeClient.disconnect();
  }, 30000);
});
