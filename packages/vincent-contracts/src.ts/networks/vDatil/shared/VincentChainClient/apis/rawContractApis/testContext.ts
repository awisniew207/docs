import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createVincentNetworkContext } from '../../vincentNetworkContext';
import { registerApp } from "./VincentAppFacet/registerApp";
import { vincentMainnetNetworkContext } from "../../../../datil-mainnet/vincentContext";
import { Account, createWalletClient, http, parseEther } from "viem";

export const getTestContext = async (opts?: {
  registerApp?: boolean;
  jit?: boolean;
}) => {

  const jit = opts?.jit || process.env.TEST_ENABLE_JIT === 'true';

  const masterTestPrivateKey = process.env.TEST_PRIVATE_KEY as `0x${string}`;

  if(!masterTestPrivateKey) {
    throw new Error('❌ TEST_PRIVATE_KEY is not set');
  }

  let jitTestAccount: Account | undefined = undefined;

  const masterTestAccount = privateKeyToAccount(masterTestPrivateKey);

  if(jit){
    jitTestAccount = privateKeyToAccount(generatePrivateKey());

    const masterWalletClient = createWalletClient({
      account: masterTestAccount,
      chain: vincentMainnetNetworkContext.chainConfig.chain,
      transport: http(vincentMainnetNetworkContext.rpcUrl),
    });
  
    const hash = await masterWalletClient.sendTransaction({
      to: jitTestAccount.address,
      value: parseEther('0.00001'), // 0.001 ETH
    })
  
    console.log('🔥 [getTestContext > JIT] Hash:', hash);
  }
  
  const networkContext = createVincentNetworkContext({
    account: jit ? jitTestAccount! : masterTestAccount,
    network: 'datil',
  });

  const randomDelegateeAccount = privateKeyToAccount(generatePrivateKey());

  const config = {
    APP_NAME: 'Test App',
    APP_DESCRIPTION: 'Test Description',
    AUTHORIZED_REDIRECT_URIS: ['http://localhost:3000'],
    DELEGATEES: [randomDelegateeAccount.address],
    TOOL_IPFS_CIDS: ['QmUT4Ke8cPtJYRZiWrkoG9RZc77hmRETNQjvDYfLtrMUEY'],
    TOOL_POLICIES: [['QmcLbQPohPURMuNdhYYa6wyDp9pm6eHPdHv9TRgFkPVebE']],
    TOOL_POLICY_PARAMETER_NAMES: [[['param1']]],
    TOOL_POLICY_PARAMETER_TYPES: [[['BYTES']]] as any, // This is an enum type in the contract, so we need to cast it to any

    failCase: {
      nonExistentAddress: '0x1234567890123456789012345678901234567890',
      nonExistentAppId: 999999,
    }
  };

  let appId: bigint;
  let managerAddress: `0x${string}`;
  let registerAppRes;

  if(opts?.registerApp){
    registerAppRes = await registerApp({
      appName: config.APP_NAME,
      appDescription: config.APP_DESCRIPTION,
      authorizedRedirectUris: config.AUTHORIZED_REDIRECT_URIS,
      delegatees: config.DELEGATEES,
      toolIpfsCids: config.TOOL_IPFS_CIDS,
      toolPolicies: config.TOOL_POLICIES,
      toolPolicyParameterNames: config.TOOL_POLICY_PARAMETER_NAMES,
      toolPolicyParameterTypes: config.TOOL_POLICY_PARAMETER_TYPES,
    }, networkContext);
  
    appId = registerAppRes.decodedLogs.find(log => log.eventName === 'NewAppVersionRegistered')?.args.appId;
    managerAddress = registerAppRes.decodedLogs.find(log => log.eventName === 'NewAppRegistered')?.args.manager;
    console.log('[getTestContext] Created app with ID:', appId);
    console.log('[getTestContext] Manager address:', managerAddress);
  }

  return {
    ...config,
    registerAppRes:{
      res: registerAppRes,
      appId: appId!,
      managerAddress: managerAddress!,
    }
  }
}