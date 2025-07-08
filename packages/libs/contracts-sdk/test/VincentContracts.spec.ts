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

config();
if (!process.env.TEST_APP_MANAGER_PRIVATE_KEY) {
  console.error('TEST_APP_MANAGER_PRIVATE_KEY environment variable is required');
  process.exit(1);
}

describe('VincentContracts', () => {
  it('should register a new app successfully', async () => {
    const provider = new providers.JsonRpcProvider('https://yellowstone-rpc.litprotocol.com');
    const signer = new ethers.Wallet(process.env.TEST_APP_MANAGER_PRIVATE_KEY!, provider);

    const client = new VincentContracts(signer);

    const appId = '136';
    const delegatees = [
      '0x1234567890123456789012345678901234567895',
      // '0x0987654321098765432109876543210987654321',
    ];
    const versionTools: AppVersionTools = {
      toolIpfsCids: ['QmTool1IpfsCidHere', 'QmTool2IpfsCidHere'],
      toolPolicies: [
        ['QmPolicy1ForTool1', 'QmPolicy2ForTool1'],
        ['QmPolicy1ForTool2', 'QmPolicy2ForTool2'],
      ],
    };

    const initialResult = await client.registerApp(appId, delegatees, versionTools);

    console.log('App registration result:', initialResult);
    expect(initialResult).toHaveProperty('txHash');
    expect(initialResult).toHaveProperty('newAppVersion');
    expect(typeof initialResult.txHash).toBe('string');
    expect(typeof initialResult.newAppVersion).toBe('string');
    // Then, register a next version
    const nextVersionTools: AppVersionTools = {
      toolIpfsCids: ['QmTool3IpfsCidHere', 'QmTool4IpfsCidHere'],
      toolPolicies: [
        ['QmPolicy1ForTool3', 'QmPolicy2ForTool3'],
        ['QmPolicy1ForTool4', 'QmPolicy2ForTool4'],
      ],
    };

    const nextVersionResult = await client.registerNextVersion(appId, nextVersionTools);

    console.log('Next version registration result:', nextVersionResult);
    expect(nextVersionResult).toHaveProperty('txHash');
    expect(nextVersionResult).toHaveProperty('newAppVersion');
    expect(typeof nextVersionResult.txHash).toBe('string');
    expect(typeof nextVersionResult.newAppVersion).toBe('string');

    const initialVersion = parseInt(initialResult.newAppVersion);
    const nextVersion = parseInt(nextVersionResult.newAppVersion);
    expect(nextVersion).toBeGreaterThan(initialVersion);
  });

  it('should register a new app successfully with the Pkp Ether wallet', async () => {
    const provider = new providers.JsonRpcProvider('https://yellowstone-rpc.litprotocol.com');

    const signer = new ethers.Wallet(process.env.TEST_APP_MANAGER_PRIVATE_KEY!, provider);

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
          walletAddress: signer.address,
          nonce: await litNodeClient.getLatestBlockhash(),
          litNodeClient,
        });

        return await generateAuthSig({
          signer,
          toSign,
        });
      },
    });

    const pkpEthersWallet = new PKPEthersWallet({
      litNodeClient,
      pkpPubKey:
        '0x04663ef0e5610c9ff50fa3b9988c3469265e87bec41a810a8dd979410fb33c3cd668a0796334e6f7bc6ebf34bd8ac1735e3bcc393257123a46204c00cd35798ec5',
      controllerSessionSigs,
    });

    await pkpEthersWallet.init();

    const client = new VincentContracts(pkpEthersWallet);

    const appId = '101';
    const delegatees = [
      '0x1234567890123456789012345678901234567899',
      // '0x0987654321098765432109876543210987654325',
    ];
    const versionTools: AppVersionTools = {
      toolIpfsCids: ['QmTool1IpfsCidHere', 'QmTool2IpfsCidHere'],
      toolPolicies: [
        ['QmPolicy1ForTool1', 'QmPolicy2ForTool1'],
        ['QmPolicy1ForTool2', 'QmPolicy2ForTool2'],
      ],
    };

    const initialResult = await client.registerApp(appId, delegatees, versionTools);

    console.log('App registration result:', initialResult);
    expect(initialResult).toHaveProperty('txHash');
    expect(initialResult).toHaveProperty('newAppVersion');
    expect(typeof initialResult.txHash).toBe('string');
    expect(typeof initialResult.newAppVersion).toBe('string');

    const nextVersionTools: AppVersionTools = {
      toolIpfsCids: ['QmTool3IpfsCidHere', 'QmTool4IpfsCidHere'],
      toolPolicies: [
        ['QmPolicy1ForTool3', 'QmPolicy2ForTool3'],
        ['QmPolicy1ForTool4', 'QmPolicy2ForTool4'],
      ],
    };

    const nextVersionResult = await client.registerNextVersion(appId, nextVersionTools);

    console.log('Next version registration result:', nextVersionResult);
    expect(nextVersionResult).toHaveProperty('txHash');
    expect(nextVersionResult).toHaveProperty('newAppVersion');
    expect(typeof nextVersionResult.txHash).toBe('string');
    expect(typeof nextVersionResult.newAppVersion).toBe('string');

    const initialVersion = parseInt(initialResult.newAppVersion);
    const nextVersion = parseInt(nextVersionResult.newAppVersion);
    expect(nextVersion).toBeGreaterThan(initialVersion);

    await litNodeClient.disconnect();
  });
});
