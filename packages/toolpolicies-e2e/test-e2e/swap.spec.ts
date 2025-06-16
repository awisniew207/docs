import { encodeAbiParameters, formatEther, parseEventLogs } from 'viem';
import { vincentPolicyMetadata as spendingLimitPolicyMetadata } from '@lit-protocol/vincent-policy-spending-limit';
import { bundledVincentTool as erc20BundledTool } from '@lit-protocol/vincent-tool-erc20-approval';

import { bundledVincentTool as uniswapBundledTool } from '@lit-protocol/vincent-tool-uniswap-swap';

import { getVincentToolClient } from '@lit-protocol/vincent-sdk';
import { ethers } from 'ethers';

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
  YELLOWSTONE_RPC_URL,
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
  const TOOL_IPFS_IDS = [erc20BundledTool.ipfsCid, uniswapBundledTool.ipfsCid];

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

  // Create a delegatee wallet for tool execution
  const getDelegateeWallet = () => {
    return new ethers.Wallet(
      TEST_APP_DELEGATEE_PRIVATE_KEY as string,
      new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
    );
  };

  // Get tool clients for ERC20 approval and Uniswap swap
  const getErc20ApprovalToolClient = () => {
    return getVincentToolClient({
      bundledVincentTool: erc20BundledTool,
      ethersSigner: getDelegateeWallet(),
    });
  };

  const getUniswapSwapToolClient = () => {
    return getVincentToolClient({
      bundledVincentTool: uniswapBundledTool,
      ethersSigner: getDelegateeWallet(),
    });
  };

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
      erc20BundledTool.ipfsCid,
      uniswapBundledTool.ipfsCid,
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
    // @ts-expect-error eventName exists?
    const appRegisteredLog = parsedLogs.filter((log) => log.eventName === 'NewAppRegistered');
    // @ts-expect-error args exists?
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
      const erc20ApprovalToolClient = getErc20ApprovalToolClient();
      const erc20ApprovalExecutionResult = await erc20ApprovalToolClient.execute(
        {
          rpcUrl: BASE_RPC_URL,
          chainId: 8453,
          spenderAddress: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 Router 02 on Base
          tokenAddress: '0x4200000000000000000000000000000000000006', // WETH
          tokenDecimals: 18,
          tokenAmount: 0,
        },
        {
          delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        },
      );

      console.log('erc20ApprovalExecutionResult', erc20ApprovalExecutionResult);

      expect(erc20ApprovalExecutionResult).toHaveProperty('success', true);
      if (erc20ApprovalExecutionResult.success === false) {
        // A bit redundant, but typescript doesn't understand `expect().toBe(true)` is narrowing to the type.
        throw new Error(erc20ApprovalExecutionResult.error);
      }
      expect(BigInt(erc20ApprovalExecutionResult.result.approvedAmount)).toBe(0n);

      if (erc20ApprovalExecutionResult.result.approvalTxHash) {
        console.log(
          'waiting for approval tx to finalize',
          erc20ApprovalExecutionResult.result.approvalTxHash,
        );
        await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
          hash: erc20ApprovalExecutionResult.result.approvalTxHash as `0x${string}`,
        });
        console.log('approval TX is GTG! continuing');
      }
    });

    it('should add an approval successfully', async () => {
      const erc20ApprovalToolClient = getErc20ApprovalToolClient();
      const erc20ApprovalExecutionResult = await erc20ApprovalToolClient.execute(
        {
          rpcUrl: BASE_RPC_URL,
          chainId: 8453,
          spenderAddress: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 Router 02 on Base
          tokenAddress: '0x4200000000000000000000000000000000000006', // WETH
          tokenDecimals: 18,
          tokenAmount: 1,
        },
        {
          delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        },
      );

      console.log('erc20ApprovalExecutionResult', erc20ApprovalExecutionResult);
      expect(erc20ApprovalExecutionResult).toBeDefined();

      expect(erc20ApprovalExecutionResult.success).toBe(true);
      if (erc20ApprovalExecutionResult.success === false) {
        // A bit redundant, but typescript doesn't understand `expect().toBe(true)` is narrowing to the type.
        throw new Error(erc20ApprovalExecutionResult.error);
      }
      console.log({ erc20ApprovalExecutionResult });
      expect(erc20ApprovalExecutionResult.context?.policiesContext).toBeDefined();
      expect(erc20ApprovalExecutionResult.context?.policiesContext.allow).toBe(true);
      expect(erc20ApprovalExecutionResult.context?.policiesContext.evaluatedPolicies.length).toBe(
        0,
      );
      expect(erc20ApprovalExecutionResult.context?.policiesContext.allowedPolicies).toEqual({});

      expect(erc20ApprovalExecutionResult.result).toBeDefined();

      // Allowance will decrease after swap
      expect(BigInt(erc20ApprovalExecutionResult.result.approvedAmount)).toBeGreaterThan(0n);
      expect(erc20ApprovalExecutionResult.result.tokenAddress).toBe(
        '0x4200000000000000000000000000000000000006',
      );
      expect(erc20ApprovalExecutionResult.result.tokenDecimals).toBe(18);
      expect(erc20ApprovalExecutionResult.result.spenderAddress).toBe(
        '0x2626664c2603336E57B271c5C0b26F421741e481',
      );
      console.log(
        'waiting for approval tx to finalize',
        erc20ApprovalExecutionResult.result.approvalTxHash,
      );
      await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
        hash: erc20ApprovalExecutionResult.result.approvalTxHash as `0x${string}`,
      });
      console.log('approval TX is GTG! continuing');
    });
  });

  describe('ERC20 approval tool should work when there is an existing approval', () => {
    beforeAll(async () => {
      {
        // First, remove any existing approvals
        const erc20ApprovalToolClient = getErc20ApprovalToolClient();
        const erc20ApprovalExecutionResult = await erc20ApprovalToolClient.execute(
          {
            rpcUrl: BASE_RPC_URL,
            chainId: 8453,
            spenderAddress: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 Router 02 on Base
            tokenAddress: '0x4200000000000000000000000000000000000006', // WETH
            tokenDecimals: 18,
            tokenAmount: 0,
          },
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(erc20ApprovalExecutionResult.success).toBe(true);
        if (erc20ApprovalExecutionResult.success === false) {
          // A bit redundant, but typescript doesn't understand `expect().toBe(true)` is narrowing to the type.
          throw new Error(erc20ApprovalExecutionResult.error);
        }

        expect(BigInt(erc20ApprovalExecutionResult.result.approvedAmount)).toBe(0n);

        if (erc20ApprovalExecutionResult.result.approvalTxHash) {
          console.log(
            'waiting for approval tx to finalize',
            erc20ApprovalExecutionResult.result.approvalTxHash,
          );
          await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
            hash: erc20ApprovalExecutionResult.result.approvalTxHash as `0x${string}`,
          });
          console.log('approval TX is GTG! continuing');
        }
      }

      {
        // Now add an approval so our test case will be guaranteed one already exists
        const erc20ApprovalToolClient = getErc20ApprovalToolClient();
        const erc20ApprovalExecutionResult = await erc20ApprovalToolClient.execute(
          {
            rpcUrl: BASE_RPC_URL,
            chainId: 8453,
            spenderAddress: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 Router 02 on Base
            tokenAddress: '0x4200000000000000000000000000000000000006', // WETH
            tokenDecimals: 18,
            tokenAmount: 1,
          },
          {
            delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
          },
        );

        expect(erc20ApprovalExecutionResult.success).toBe(true);
        if (erc20ApprovalExecutionResult.success === false) {
          // A bit redundant, but typescript doesn't understand `expect().toBe(true)` is narrowing to the type.
          throw new Error(erc20ApprovalExecutionResult.error);
        }

        expect(BigInt(erc20ApprovalExecutionResult.result.approvedAmount)).toBeGreaterThan(0n);

        console.log(
          'waiting for approval tx to finalize',
          erc20ApprovalExecutionResult.result.approvalTxHash,
        );
        await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
          hash: erc20ApprovalExecutionResult.result.approvalTxHash as `0x${string}`,
        });
        console.log('approval TX is GTG! continuing');
      }
    });

    it('should succeed without a TX when there is already a valid approval', async () => {
      const erc20ApprovalToolClient = getErc20ApprovalToolClient();
      const erc20ApprovalExecutionResult = await erc20ApprovalToolClient.execute(
        {
          rpcUrl: BASE_RPC_URL,
          chainId: 8453,
          spenderAddress: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 Router 02 on Base
          tokenAddress: '0x4200000000000000000000000000000000000006', // WETH
          tokenDecimals: 18,
          tokenAmount: 1,
        },
        {
          delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
        },
      );

      expect(erc20ApprovalExecutionResult).toBeDefined();

      expect(erc20ApprovalExecutionResult.success).toBe(true);
      if (erc20ApprovalExecutionResult.success === false) {
        // A bit redundant, but typescript doesn't understand `expect().toBe(true)` is narrowing to the type.
        throw new Error(erc20ApprovalExecutionResult.error);
      }
      console.log({ erc20ApprovalExecutionResult });
      expect(erc20ApprovalExecutionResult.context?.policiesContext).toBeDefined();
      expect(erc20ApprovalExecutionResult.context?.policiesContext.allow).toBe(true);
      expect(erc20ApprovalExecutionResult.context?.policiesContext.evaluatedPolicies.length).toBe(
        0,
      );
      expect(erc20ApprovalExecutionResult.context?.policiesContext.allowedPolicies).toEqual({});

      expect(erc20ApprovalExecutionResult.result).toBeDefined();
      expect(erc20ApprovalExecutionResult.result.approvalTxHash).toBeUndefined();

      // Allowance will decrease after swap
      expect(BigInt(erc20ApprovalExecutionResult.result.approvedAmount)).toBeGreaterThan(0n);
      expect(erc20ApprovalExecutionResult.result.tokenAddress).toBe(
        '0x4200000000000000000000000000000000000006',
      );
      expect(erc20ApprovalExecutionResult.result.tokenDecimals).toBe(18);
      expect(erc20ApprovalExecutionResult.result.spenderAddress).toBe(
        '0x2626664c2603336E57B271c5C0b26F421741e481',
      );
    });
  });

  it('should execute the Uniswap Swap Tool with the Agent Wallet PKP', async () => {
    const uniswapSwapToolClient = getUniswapSwapToolClient();
    const uniswapSwapExecutionResult = await uniswapSwapToolClient.execute(
      {
        ethRpcUrl: ETH_RPC_URL,
        rpcUrlForUniswap: BASE_RPC_URL,
        chainIdForUniswap: 8453,
        tokenInAddress: '0x4200000000000000000000000000000000000006', // WETH
        tokenInDecimals: 18,
        tokenInAmount: 0.0000077,
        tokenOutAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
        tokenOutDecimals: 8,
      },
      {
        delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
      },
    );

    expect(uniswapSwapExecutionResult).toBeDefined();

    expect(uniswapSwapExecutionResult.success).toBe(true);
    if (uniswapSwapExecutionResult.success === false) {
      // A bit redundant, but typescript doesn't understand `expect().toBe(true)` is narrowing to the type.
      throw new Error(uniswapSwapExecutionResult.error);
    }

    console.log(uniswapSwapExecutionResult);

    expect(uniswapSwapExecutionResult.result).toBeDefined();
    expect(uniswapSwapExecutionResult.result.swapTxHash).toBeDefined();
    expect(uniswapSwapExecutionResult.result.spendTxHash).toBeDefined();

    const swapTxHash = uniswapSwapExecutionResult.result.swapTxHash;
    expect(swapTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

    const swapTxReceipt = await BASE_PUBLIC_CLIENT.waitForTransactionReceipt({
      hash: swapTxHash as `0x${string}`,
    });
    expect(swapTxReceipt.status).toBe('success');

    const spendTxHash = uniswapSwapExecutionResult.result.spendTxHash;
    expect(spendTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

    const spendTxReceipt = await DATIL_PUBLIC_CLIENT.waitForTransactionReceipt({
      hash: spendTxHash as `0x${string}`,
    });
    expect(spendTxReceipt.status).toBe('success');
  });
});
