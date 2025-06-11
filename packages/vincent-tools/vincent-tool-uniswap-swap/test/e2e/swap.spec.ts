import { encodeAbiParameters, formatEther, parseEventLogs } from 'viem';
import { vincentPolicyMetadata as spendingLimitPolicyMetadata } from '@lit-protocol/vincent-policy-spending-limit';
import { vincentToolMetadata as erc20ToolMetadata } from '@lit-protocol/vincent-tool-erc20-approval';

import { vincentToolMetadata as uniswapToolMetadata } from '../../src';

import {
  TestConfig,
  getTestConfig,
  TEST_CONFIG_PATH,
  checkShouldMintAndFundPkp,
  BASE_PUBLIC_CLIENT,
  TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY,
  permitAuthMethod,
  TEST_APP_MANAGER_VIEM_WALLET_CLIENT,
  DATIL_PUBLIC_CLIENT,
  VINCENT_ADDRESS,
  TEST_APP_DELEGATEE_ACCOUNT,
  TEST_APP_MANAGER_VIEM_ACCOUNT,
  DELEGATEES,
  saveTestConfig,
  TEST_AGENT_WALLET_PKP_OWNER_VIEM_WALLET_CLIENT,
  APP_NAME,
  APP_DESCRIPTION,
  AUTHORIZED_REDIRECT_URIS,
  DEPLOYMENT_STATUS,
  PARAMETER_TYPE,
  TEST_APP_DELEGATEE_PRIVATE_KEY,
  BASE_RPC_URL,
  ETH_RPC_URL,
  executeTool,
} from './helpers';
import {
  VincentAppFacetAbi,
  VincentAppViewFacetAbi,
  VincentUserFacetAbi,
  VincentUserViewFacetAbi,
} from './vincent-contract-abis';
import { checkShouldMintCapacityCredit } from './helpers/check-mint-capcity-credit';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Uniswap Swap Tool E2E Tests', () => {
  const TOOL_IPFS_IDS = [erc20ToolMetadata.ipfsCid, uniswapToolMetadata.ipfsCid];

  const TOOL_POLICIES = [[], [spendingLimitPolicyMetadata.ipfsCid]];
  const TOOL_POLICY_PARAMETER_NAMES = [
    [], // No policies for ERC20_APPROVAL_TOOL, so use empty array
    [['maxDailySpendingLimitInUsdCents']], // Parameters for SPENDING_LIMIT_POLICY_TOOL
  ];
  const TOOL_POLICY_PARAMETER_TYPES = [
    [], // No policies for ERC20_APPROVAL_TOOL, so use empty array
    [[PARAMETER_TYPE.UINT256]], // Parameter types for SPENDING_LIMIT_POLICY_TOOL
  ];
  const TOOL_POLICY_PARAMETER_VALUES = [
    [], // Empty array for the ERC20 Approval Tool (it has no policies)
    [
      [
        // Parameter values for SPENDING_LIMIT_POLICY_TOOL
        encodeAbiParameters(
          [{ type: 'uint256' }],
          [BigInt('1000000000')], // maxDailySpendingLimitInUsdCents $10 USD (8 decimals)
        ),
      ],
    ],
  ];

  let TEST_CONFIG: TestConfig;

  beforeAll(async () => {
    TEST_CONFIG = getTestConfig(TEST_CONFIG_PATH);
    TEST_CONFIG = await checkShouldMintAndFundPkp(TEST_CONFIG);
    TEST_CONFIG = await checkShouldMintCapacityCredit(TEST_CONFIG);

    // The Agent Wallet PKP needs to have Base ETH and WETH
    // in order to execute the ERC20 Approval and Uniswap Swap Tools
    const agentWalletPkpBaseEthBalance = await BASE_PUBLIC_CLIENT.getBalance({
      address: TEST_CONFIG.userPkp!.ethAddress! as `0x${string}`,
    });
    if (agentWalletPkpBaseEthBalance === 0n) {
      throw new Error(
        `❌ Agent Wallet PKP has no Base ETH. Please fund ${TEST_CONFIG.userPkp!.ethAddress!} with Base ETH`,
      );
    } else {
      console.log(`ℹ️  Agent Wallet PKP has ${formatEther(agentWalletPkpBaseEthBalance)} Base ETH`);
    }

    const agentWalletPkpBaseWethBalance = await BASE_PUBLIC_CLIENT.getBalance({
      address: TEST_CONFIG.userPkp!.ethAddress! as `0x${string}`,
    });
    if (agentWalletPkpBaseWethBalance === 0n) {
      throw new Error(
        `❌ Agent Wallet PKP has no Base WETH. Please fund ${TEST_CONFIG.userPkp!.ethAddress!} with Base WETH`,
      );
    } else {
      console.log(
        `ℹ️  Agent Wallet PKP has ${formatEther(agentWalletPkpBaseWethBalance)} Base WETH`,
      );
    }

    // The App Manager needs to have Lit test tokens
    // in order to interact with the Vincent contract
    const appManagerLitTestTokenBalance = await DATIL_PUBLIC_CLIENT.getBalance({
      address: TEST_APP_MANAGER_VIEM_ACCOUNT.address,
    });
    if (appManagerLitTestTokenBalance === 0n) {
      throw new Error(
        `❌ App Manager has no Lit test tokens. Please fund ${TEST_APP_MANAGER_VIEM_ACCOUNT.address} with Lit test tokens`,
      );
    } else {
      console.log(
        `ℹ️  App Manager has ${formatEther(appManagerLitTestTokenBalance)} Lit test tokens`,
      );
    }
  });

  it('should permit the ERC20 Approval Tool, Uniswap Swap Tool, and Spending Limit Policy for the Agent Wallet PKP', async () => {
    await permitAuthMethod(
      TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY as `0x${string}`,
      TEST_CONFIG.userPkp!.tokenId!,
      erc20ToolMetadata.ipfsCid,
      uniswapToolMetadata.ipfsCid,
      spendingLimitPolicyMetadata.ipfsCid,
    );
  });

  it('should remove TEST_APP_DELEGATEE_ACCOUNT from an existing App if needed', async () => {
    if (TEST_CONFIG.appId !== null) {
      const txHash = await TEST_APP_MANAGER_VIEM_WALLET_CLIENT.writeContract({
        address: VINCENT_ADDRESS as `0x${string}`,
        abi: VincentAppFacetAbi,
        functionName: 'removeDelegatee',
        args: [TEST_CONFIG.appId, TEST_APP_DELEGATEE_ACCOUNT.address],
      });

      const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
        hash: txHash,
      });

      expect(txReceipt.status).toBe('success');
      console.log(`Removed Delegatee from App ID: ${TEST_CONFIG.appId}\nTx hash: ${txHash}`);
    } else {
      console.log('🔄 No existing App ID found, checking if Delegatee is registered to an App...');

      let registeredApp: {
        id: bigint;
        name: string;
        description: string;
        isDeleted: boolean;
        deploymentStatus: number;
        manager: `0x${string}`;
        latestVersion: bigint;
        delegatees: `0x${string}`[];
        authorizedRedirectUris: string[];
      } | null = null;

      try {
        registeredApp = (await DATIL_PUBLIC_CLIENT.readContract({
          address: VINCENT_ADDRESS as `0x${string}`,
          abi: VincentAppViewFacetAbi,
          functionName: 'getAppByDelegatee',
          args: [TEST_APP_DELEGATEE_ACCOUNT.address],
        })) as typeof registeredApp;

        if (registeredApp!.manager !== TEST_APP_MANAGER_VIEM_ACCOUNT.address) {
          throw new Error(
            `❌ App Delegatee: ${TEST_APP_DELEGATEE_ACCOUNT.address} is already registered to App ID: ${registeredApp!.id.toString()}, and TEST_APP_MANAGER_PRIVATE_KEY is not the owner of the App`,
          );
        }

        console.log(
          `ℹ️  App Delegatee: ${TEST_APP_DELEGATEE_ACCOUNT.address} is already registered to App ID: ${registeredApp!.id.toString()}. Removing Delegatee...`,
        );

        const txHash = await TEST_APP_MANAGER_VIEM_WALLET_CLIENT.writeContract({
          address: VINCENT_ADDRESS as `0x${string}`,
          abi: VincentAppFacetAbi,
          functionName: 'removeDelegatee',
          args: [registeredApp!.id, TEST_APP_DELEGATEE_ACCOUNT.address],
        });

        const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
          hash: txHash,
        });

        expect(txReceipt.status).toBe('success');
        console.log(`ℹ️  Removed Delegatee from App ID: ${registeredApp!.id}\nTx hash: ${txHash}`);
      } catch (error: unknown) {
        // Check if the error is a DelegateeNotRegistered revert
        if (error instanceof Error && error.message.includes('DelegateeNotRegistered')) {
          console.log(
            `ℹ️  App Delegatee: ${TEST_APP_DELEGATEE_ACCOUNT.address} is not registered to any App.`,
          );
        } else {
          throw new Error(
            `❌ Error checking if delegatee is registered: ${(error as Error).message}`,
          );
        }
      }
    }
  });

  it('should register a new App', async () => {
    const txHash = await TEST_APP_MANAGER_VIEM_WALLET_CLIENT.writeContract({
      address: VINCENT_ADDRESS as `0x${string}`,
      abi: VincentAppFacetAbi,
      functionName: 'registerApp',
      args: [
        // AppInfo
        {
          name: APP_NAME,
          description: APP_DESCRIPTION,
          deploymentStatus: DEPLOYMENT_STATUS.DEV,
          authorizedRedirectUris: AUTHORIZED_REDIRECT_URIS,
          delegatees: DELEGATEES,
        },
        // VersionTools
        {
          toolIpfsCids: TOOL_IPFS_IDS,
          toolPolicies: TOOL_POLICIES,
          toolPolicyParameterNames: TOOL_POLICY_PARAMETER_NAMES,
          toolPolicyParameterTypes: TOOL_POLICY_PARAMETER_TYPES,
        },
      ],
    });

    const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
      hash: txHash,
    });
    expect(txReceipt.status).toBe('success');

    const parsedLogs = parseEventLogs({
      abi: VincentAppFacetAbi,
      logs: txReceipt.logs,
    });
    const appRegisteredLog = parsedLogs.filter((log) => log.eventName === 'NewAppRegistered');
    const newAppId = appRegisteredLog[0].args.appId;

    expect(newAppId).toBeDefined();
    if (TEST_CONFIG.appId !== null) expect(newAppId).toBeGreaterThan(BigInt(TEST_CONFIG.appId));

    TEST_CONFIG.appId = newAppId;
    TEST_CONFIG.appVersion = '1';
    saveTestConfig(TEST_CONFIG_PATH, TEST_CONFIG);
    console.log(`Registered new App with ID: ${TEST_CONFIG.appId}\nTx hash: ${txHash}`);
  });

  it('should permit the App version for the Agent Wallet PKP', async () => {
    const txHash = await TEST_AGENT_WALLET_PKP_OWNER_VIEM_WALLET_CLIENT.writeContract({
      address: VINCENT_ADDRESS as `0x${string}`,
      abi: VincentUserFacetAbi,
      functionName: 'permitAppVersion',
      args: [
        BigInt(TEST_CONFIG.userPkp!.tokenId!),
        BigInt(TEST_CONFIG.appId!),
        BigInt(TEST_CONFIG.appVersion!),
        TOOL_IPFS_IDS,
        TOOL_POLICIES,
        TOOL_POLICY_PARAMETER_NAMES,
        TOOL_POLICY_PARAMETER_VALUES,
      ],
    });

    const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
      hash: txHash,
    });
    expect(txReceipt.status).toBe('success');
    console.log(
      `Permitted App with ID ${TEST_CONFIG.appId} and version ${TEST_CONFIG.appVersion} for Agent Wallet PKP with token id ${TEST_CONFIG.userPkp!.tokenId}\nTx hash: ${txHash}`,
    );
  });

  it('should validate the Delegatee has permission to execute the ERC20 Approval Tool with the Agent Wallet PKP', async () => {
    const validationResult = (await DATIL_PUBLIC_CLIENT.readContract({
      address: VINCENT_ADDRESS as `0x${string}`,
      abi: VincentUserViewFacetAbi,
      functionName: 'validateToolExecutionAndGetPolicies',
      args: [
        TEST_APP_DELEGATEE_ACCOUNT.address,
        BigInt(TEST_CONFIG.userPkp!.tokenId!),
        TOOL_IPFS_IDS[0],
      ],
    })) as {
      isPermitted: boolean;
      appId: bigint;
      appVersion: bigint;
      policies: string[][];
    };

    expect(validationResult).toBeDefined();
    expect(validationResult.isPermitted).toBe(true);
    expect(validationResult.appId).toBe(BigInt(TEST_CONFIG.appId!));
    expect(validationResult.appVersion).toBe(BigInt(TEST_CONFIG.appVersion!));
    expect(validationResult.policies).toEqual([]);
  });

  it('should validate the Delegatee has permission to execute the Uniswap Swap Tool with the Agent Wallet PKP', async () => {
    const validationResult = (await DATIL_PUBLIC_CLIENT.readContract({
      address: VINCENT_ADDRESS as `0x${string}`,
      abi: VincentUserViewFacetAbi,
      functionName: 'validateToolExecutionAndGetPolicies',
      args: [
        TEST_APP_DELEGATEE_ACCOUNT.address,
        BigInt(TEST_CONFIG.userPkp!.tokenId!),
        TOOL_IPFS_IDS[1],
      ],
    })) as {
      isPermitted: boolean;
      appId: bigint;
      appVersion: bigint;
      policies: string[][];
    };

    expect(validationResult).toBeDefined();
    expect(validationResult.isPermitted).toBe(true);
    expect(validationResult.appId).toBe(BigInt(TEST_CONFIG.appId!));
    expect(validationResult.appVersion).toBe(BigInt(TEST_CONFIG.appVersion!));
    expect(validationResult.policies).toEqual([
      {
        policyIpfsCid: spendingLimitPolicyMetadata.ipfsCid,
        parameters: [
          {
            name: 'maxDailySpendingLimitInUsdCents',
            paramType: 2,
            value: encodeAbiParameters(
              [{ type: 'uint256' }],
              [BigInt('1000000000')], // maxDailySpendingLimitInUsdCents $10 USD (8 decimals)
            ),
          },
        ],
      },
    ]);
  });

  it('should fund TEST_APP_DELEGATEE if they have no Lit test tokens', async () => {
    const balance = await DATIL_PUBLIC_CLIENT.getBalance({
      address: TEST_APP_DELEGATEE_ACCOUNT.address,
    });
    if (balance === 0n) {
      // @ts-expect-error KZG is incorrectly being marked as required here
      const txHash = await TEST_APP_MANAGER_VIEM_WALLET_CLIENT.sendTransaction({
        to: TEST_APP_DELEGATEE_ACCOUNT.address,
        value: BigInt(10000000000000000), // 0.01 ETH in wei
      });
      const txReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
        hash: txHash,
      });
      console.log(`Funded TEST_APP_DELEGATEE with 0.01 ETH\nTx hash: ${txHash}`);
      expect(txReceipt.status).toBe('success');
    } else {
      expect(balance).toBeGreaterThan(0n);
    }
  });

  describe('ERC20 approval tool when there is no approval', () => {
    beforeAll(async () => {
      // First, remove any existing approvals
      const erc20ApprovalExecutionResult = await executeTool({
        toolIpfsCid: erc20ToolMetadata.ipfsCid,
        toolParameters: {
          rpcUrl: BASE_RPC_URL,
          chainId: 8453,
          spenderAddress: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 Router 02 on Base
          tokenAddress: '0x4200000000000000000000000000000000000006', // WETH
          tokenDecimals: 18,
          tokenAmount: 0,
        },
        delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        delegateePrivateKey: TEST_APP_DELEGATEE_PRIVATE_KEY as `0x${string}`,
        debug: true,
        capacityCreditTokenId: TEST_CONFIG.capacityCreditInfo!.capacityTokenId!,
      });
      const parsedResponse = JSON.parse(erc20ApprovalExecutionResult.response as string);

      expect(BigInt(parsedResponse.toolExecutionResult.result.approvedAmount)).toBe(0n);

      console.log(
        'waiting for approval tx to finalize',
        parsedResponse.toolExecutionResult.result.approvalTxHash,
      );
      const allowanceTxReceipt = await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
        hash: parsedResponse.toolExecutionResult.result.approvalTxHash as `0x${string}`,
      });
      console.log('approval TX is GTG! continuing');

      // Wait for 2 seconds
      // await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    it('should add an approval successfully', async () => {
      const erc20ApprovalExecutionResult = await executeTool({
        toolIpfsCid: erc20ToolMetadata.ipfsCid,
        toolParameters: {
          rpcUrl: BASE_RPC_URL,
          chainId: 8453,
          spenderAddress: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 Router 02 on Base
          tokenAddress: '0x4200000000000000000000000000000000000006', // WETH
          tokenDecimals: 18,
          tokenAmount: 1,
        },
        delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        delegateePrivateKey: TEST_APP_DELEGATEE_PRIVATE_KEY as `0x${string}`,
        debug: true,
        capacityCreditTokenId: TEST_CONFIG.capacityCreditInfo!.capacityTokenId!,
      });

      expect(erc20ApprovalExecutionResult).toBeDefined();

      const parsedResponse = JSON.parse(erc20ApprovalExecutionResult.response as string);

      console.log({ parsedResponse });
      expect(parsedResponse.policyEvaluationResults).toBeDefined();
      expect(parsedResponse.policyEvaluationResults.allow).toBe(true);
      expect(parsedResponse.policyEvaluationResults.evaluatedPolicies.length).toBe(0);
      expect(parsedResponse.policyEvaluationResults.allowedPolicies).toEqual({});

      expect(parsedResponse.toolExecutionResult).toBeDefined();
      expect(parsedResponse.toolExecutionResult.success).toBe(true);
      expect(parsedResponse.toolExecutionResult.result).toBeDefined();
      expect(parsedResponse.toolExecutionResult.result.existingApprovalSufficient).toBe(false);

      // Allowance will decrease after swap
      expect(BigInt(parsedResponse.toolExecutionResult.result.approvedAmount)).toBeGreaterThan(0n);
      expect(parsedResponse.toolExecutionResult.result.tokenAddress).toBe(
        '0x4200000000000000000000000000000000000006',
      );
      expect(parsedResponse.toolExecutionResult.result.tokenDecimals).toBe(18);
      expect(parsedResponse.toolExecutionResult.result.spenderAddress).toBe(
        '0x2626664c2603336E57B271c5C0b26F421741e481',
      );
      console.log(
        'waiting for approval tx to finalize',
        parsedResponse.toolExecutionResult.result.approvalTxHash,
      );
      const allowanceTxReceipt = await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
        hash: parsedResponse.toolExecutionResult.result.approvalTxHash as `0x${string}`,
      });
      console.log('approval TX is GTG! continuing');
    });
  });

  describe('ERC20 approval tool should work when there is an existing approval', () => {
    beforeAll(async () => {
      {
        // First, remove any existing approvals
        const erc20ApprovalExecutionResult = await executeTool({
          toolIpfsCid: erc20ToolMetadata.ipfsCid,
          toolParameters: {
            rpcUrl: BASE_RPC_URL,
            chainId: 8453,
            spenderAddress: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 Router 02 on Base
            tokenAddress: '0x4200000000000000000000000000000000000006', // WETH
            tokenDecimals: 18,
            tokenAmount: 0,
          },
          delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          delegateePrivateKey: TEST_APP_DELEGATEE_PRIVATE_KEY as `0x${string}`,
          debug: true,
          capacityCreditTokenId: TEST_CONFIG.capacityCreditInfo!.capacityTokenId!,
        });
        const parsedResponse = JSON.parse(erc20ApprovalExecutionResult.response as string);

        expect(BigInt(parsedResponse.toolExecutionResult.result.approvedAmount)).toBe(0n);

        console.log(
          'waiting for approval tx to finalize',
          parsedResponse.toolExecutionResult.result.approvalTxHash,
        );
        await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
          hash: parsedResponse.toolExecutionResult.result.approvalTxHash as `0x${string}`,
        });
        console.log('approval TX is GTG! continuing');
      }

      {
        // Now add an approval so our test case will be guaranteed one already exists
        const erc20ApprovalExecutionResult = await executeTool({
          toolIpfsCid: erc20ToolMetadata.ipfsCid,
          toolParameters: {
            rpcUrl: BASE_RPC_URL,
            chainId: 8453,
            spenderAddress: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 Router 02 on Base
            tokenAddress: '0x4200000000000000000000000000000000000006', // WETH
            tokenDecimals: 18,
            tokenAmount: 1,
          },
          delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          delegateePrivateKey: TEST_APP_DELEGATEE_PRIVATE_KEY as `0x${string}`,
          debug: true,
          capacityCreditTokenId: TEST_CONFIG.capacityCreditInfo!.capacityTokenId!,
        });
        const parsedResponse = JSON.parse(erc20ApprovalExecutionResult.response as string);

        expect(BigInt(parsedResponse.toolExecutionResult.result.approvedAmount)).toBeGreaterThan(
          0n,
        );

        console.log(
          'waiting for approval tx to finalize',
          parsedResponse.toolExecutionResult.result.approvalTxHash,
        );
        await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
          hash: parsedResponse.toolExecutionResult.result.approvalTxHash as `0x${string}`,
        });
        console.log('approval TX is GTG! continuing');
      }
    });

    it('should succeed without a TX when there is already a valid approval', async () => {
      const erc20ApprovalExecutionResult = await executeTool({
        toolIpfsCid: erc20ToolMetadata.ipfsCid,
        toolParameters: {
          rpcUrl: BASE_RPC_URL,
          chainId: 8453,
          spenderAddress: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 Router 02 on Base
          tokenAddress: '0x4200000000000000000000000000000000000006', // WETH
          tokenDecimals: 18,
          tokenAmount: 1,
        },
        delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        delegateePrivateKey: TEST_APP_DELEGATEE_PRIVATE_KEY as `0x${string}`,
        debug: true,
        capacityCreditTokenId: TEST_CONFIG.capacityCreditInfo!.capacityTokenId!,
      });

      expect(erc20ApprovalExecutionResult).toBeDefined();

      const parsedResponse = JSON.parse(erc20ApprovalExecutionResult.response as string);

      console.log({ parsedResponse });
      expect(parsedResponse.policyEvaluationResults).toBeDefined();
      expect(parsedResponse.policyEvaluationResults.allow).toBe(true);
      expect(parsedResponse.policyEvaluationResults.evaluatedPolicies.length).toBe(0);
      expect(parsedResponse.policyEvaluationResults.allowedPolicies).toEqual({});

      expect(parsedResponse.toolExecutionResult).toBeDefined();
      expect(parsedResponse.toolExecutionResult.success).toBe(true);
      expect(parsedResponse.toolExecutionResult.result).toBeDefined();
      expect(parsedResponse.toolExecutionResult.result.existingApprovalSufficient).toBe(true);
      expect(parsedResponse.toolExecutionResult.result.approvalTxHash).toBeUndefined();

      // Allowance will decrease after swap
      expect(BigInt(parsedResponse.toolExecutionResult.result.approvedAmount)).toBeGreaterThan(0n);
      expect(parsedResponse.toolExecutionResult.result.tokenAddress).toBe(
        '0x4200000000000000000000000000000000000006',
      );
      expect(parsedResponse.toolExecutionResult.result.tokenDecimals).toBe(18);
      expect(parsedResponse.toolExecutionResult.result.spenderAddress).toBe(
        '0x2626664c2603336E57B271c5C0b26F421741e481',
      );
    });
  });

  it('should execute the Uniswap Swap Tool with the Agent Wallet PKP', async () => {
    const uniswapSwapExecutionResult = await executeTool({
      toolIpfsCid: uniswapToolMetadata.ipfsCid,
      toolParameters: {
        ethRpcUrl: ETH_RPC_URL,
        rpcUrlForUniswap: BASE_RPC_URL,
        chainIdForUniswap: 8453,
        tokenInAddress: '0x4200000000000000000000000000000000000006', // WETH
        tokenInDecimals: 18,
        tokenInAmount: 0.0000077,
        tokenOutAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
        tokenOutDecimals: 8,
      },
      delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
      delegateePrivateKey: TEST_APP_DELEGATEE_PRIVATE_KEY as `0x${string}`,
      debug: true,
      capacityCreditTokenId: TEST_CONFIG.capacityCreditInfo!.capacityTokenId!,
    });

    expect(uniswapSwapExecutionResult).toBeDefined();

    console.log(uniswapSwapExecutionResult);
    const parsedResponse = JSON.parse(uniswapSwapExecutionResult.response as string);

    expect(parsedResponse.toolExecutionResult.success).toBeTruthy();

    expect(parsedResponse.toolExecutionResult.result).toBeDefined();
    expect(parsedResponse.toolExecutionResult.result.swapTxHash).toBeDefined();
    expect(parsedResponse.toolExecutionResult.result.spendTxHash).toBeDefined();

    const swapTxHash = parsedResponse.toolExecutionResult.result.swapTxHash;
    expect(swapTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

    const swapTxReceipt = await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
      hash: swapTxHash as `0x${string}`,
    });
    expect(swapTxReceipt.status).toBe('success');

    const spendTxHash = parsedResponse.toolExecutionResult.result.spendTxHash;
    expect(spendTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

    const spendTxReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
      hash: spendTxHash as `0x${string}`,
    });
    expect(spendTxReceipt.status).toBe('success');
  });
});
