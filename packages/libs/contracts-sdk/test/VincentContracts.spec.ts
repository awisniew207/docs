import { VincentContracts, AppVersionTools } from '../src/index';
import { ethers } from 'ethers';
import { config } from '@dotenvx/dotenvx';

config();
if (!process.env.TEST_APP_MANAGER_PRIVATE_KEY) {
  console.error('TEST_APP_MANAGER_PRIVATE_KEY environment variable is required');
  process.exit(1);
}

describe('VincentContracts', () => {
  it('should register a new app successfully', async () => {
    const provider = new ethers.JsonRpcProvider('https://yellowstone-rpc.litprotocol.com');
    const signer = new ethers.Wallet(process.env.TEST_APP_MANAGER_PRIVATE_KEY!, provider);

    const client = new VincentContracts(signer);

    const appId = '123';
    const delegatees = [
      '0x1234567890123456789012345678901234567890',
      '0x0987654321098765432109876543210987654321',
    ];
    const versionTools: AppVersionTools = {
      toolIpfsCids: ['QmTool1IpfsCidHere', 'QmTool2IpfsCidHere'],
      toolPolicies: [
        ['QmPolicy1ForTool1', 'QmPolicy2ForTool1'],
        ['QmPolicy1ForTool2', 'QmPolicy2ForTool2'],
      ],
    };

    const result = await client.registerApp(appId, delegatees, versionTools);

    console.log('App registration result:', result);
    expect(result).toHaveProperty('txHash');
    expect(result).toHaveProperty('newAppVersion');
    expect(typeof result.txHash).toBe('string');
    expect(typeof result.newAppVersion).toBe('string');
  });
});
