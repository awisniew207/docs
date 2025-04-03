// @ts-nocheck
/* eslint-disable */
import { config } from '@dotenvx/dotenvx';

// Load environment variables
config();

import fs from 'fs';
import path from 'path';
import {
    createWalletClient,
    http,
    defineChain,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createDatilChainManager } from '@lit-protocol/vincent-contracts';

import { mintNewPkp } from './utils/mint-pkp';
import { executeTool } from './utils/execute-tool';
import { permitAuthMethod } from './utils/permit-auth-method';

const YELLOWSTONE_RPC_URL = 'https://yellowstone-rpc.litprotocol.com/';
const APP_CONFIG_PATH = path.join(__dirname, '../config/vincent-contract-caller-config.json');

// Define Datil chain for Viem
const datilChain = defineChain({
    id: 175188,
    name: 'Datil Mainnet',
    network: 'datil',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: [YELLOWSTONE_RPC_URL],
        },
        public: {
            http: [YELLOWSTONE_RPC_URL],
        },
    },
});

const BASE_RPC_URL = process.env.BASE_RPC_URL;

// Create Viem account and wallet client for App Manager
const APP_MANAGER_PRIVATE_KEY = process.env.APP_MANAGER_PRIVATE_KEY;
const APP_MANAGER_VIEM_ACCOUNT = privateKeyToAccount(APP_MANAGER_PRIVATE_KEY as `0x${string}`);
const APP_MANAGER_VIEM_WALLET_CLIENT = createWalletClient({
    account: APP_MANAGER_VIEM_ACCOUNT,
    chain: datilChain,
    transport: http(YELLOWSTONE_RPC_URL)
});

// Create Viem account and wallet client for PKP owner
const AGENT_WALLET_PKP_OWNER_PRIVATE_KEY = process.env.AGENT_WALLET_PKP_OWNER_PRIVATE_KEY;
const AGENT_WALLET_PKP_OWNER_VIEM_ACCOUNT = privateKeyToAccount(AGENT_WALLET_PKP_OWNER_PRIVATE_KEY as `0x${string}`);
const AGENT_WALLET_PKP_OWNER_VIEM_WALLET_CLIENT = createWalletClient({
    account: AGENT_WALLET_PKP_OWNER_VIEM_ACCOUNT,
    chain: datilChain,
    transport: http(YELLOWSTONE_RPC_URL)
});

const APP_DELEGATEE_PRIVATE_KEY = process.env.APP_DELEGATEE_PRIVATE_KEY;
const APP_DELEGATEE_ADDRESS = privateKeyToAccount(APP_DELEGATEE_PRIVATE_KEY as `0x${string}`).address;

(async () => {
    const APP_NAME = 'Vincent Test App';
    const APP_DESCRIPTION = 'A test app for the Vincent protocol';
    const AUTHORIZED_REDIRECT_URIS = ['https://testing.vincent.com'];
    const DELEGATEES = [APP_DELEGATEE_ADDRESS];

    const ERC20_APPROVAL_TOOL_IPFS_ID = 'QmdmwSnwkz5hoemz3B4xbW3BT1o6VbEV2LaretRDkqzHpS';
    const UNISWAP_SWAP_TOOL_IPFS_ID = 'QmVJkexbFS1its69zAkHj4VVxECLmL6oLwPDjMVmK8gAwB';

    const SPENDING_LIMIT_POLICY_IPFS_ID = 'QmcgUVAGxnYMT3vkkdsb2MCcDArruPEtdbcxBtTQDWJBSh';

    const TOOL_IPFS_IDS = [ERC20_APPROVAL_TOOL_IPFS_ID, UNISWAP_SWAP_TOOL_IPFS_ID];

    const TOOL_POLICIES = [
        [],
        [SPENDING_LIMIT_POLICY_IPFS_ID]
    ];
    const TOOL_POLICY_PARAMETER_NAMES = [
        [[]], // Parameters for ERC20_APPROVAL_TOOL
        [['maxDailySpendingLimitInUsdCents']] // Parameters for SPENDING_LIMIT_POLICY_TOOL
    ];
    const TOOL_POLICY_PARAMETER_TYPES = [
        [[]], // Parameter types for ERC20_APPROVAL_TOOL
        [['UINT256']] // Parameter types for SPENDING_LIMIT_POLICY_TOOL
    ];
    const TOOL_POLICY_PARAMETER_VALUES = [
        [[]],
        [
            [
                // Parameter values for SPENDING_LIMIT_POLICY_TOOL
                { type: 'uint256', value: "10000000000000" }, // maxDailySpendingLimitInUsdCents $100,000 USD (8 decimals)
            ]
        ]
    ];

    let APP_ID: bigint;
    let APP_VERSION: bigint;
    let USER_PKP: {
        tokenId: string;
        ethAddress: string;
        pkpPubKey: string;
    } | undefined;

    try {
        if (fs.existsSync(APP_CONFIG_PATH)) {
            const config = JSON.parse(fs.readFileSync(APP_CONFIG_PATH, 'utf8'));
            APP_ID = BigInt(config.appId);
            APP_VERSION = BigInt(config.appVersion);
            USER_PKP = config.userPkP;
            console.log(`ℹ️  Loaded existing App ID: ${APP_ID}, App Version: ${APP_VERSION}, User PKP: ${JSON.stringify(USER_PKP, null, 2)}`);
        } else {
            console.log('ℹ️  No existing App ID found');
            APP_ID = 0n;
            APP_VERSION = 1n;
            USER_PKP = undefined;
        }
    } catch (error) {
        console.log('ℹ️  Error reading App ID, starting fresh');
        APP_ID = 0n;
        APP_VERSION = 1n;
        USER_PKP = undefined;
    }

    const chainManagerAppManager = createDatilChainManager({
        account: APP_MANAGER_VIEM_WALLET_CLIENT,
        network: 'datil'
    });

    if (APP_ID !== 0n) {
        await chainManagerAppManager.vincentApi.appManagerDashboard.removeDelegatee({
            appId: APP_ID,
            delegatee: DELEGATEES[0]
        });
        console.log(`ℹ️  Remove delegatee from App: ${APP_ID}`);

        APP_ID = 0n;
        APP_VERSION = 1n;
    }

    if (APP_ID === 0n) {
        const appRegistrationResult = await chainManagerAppManager.vincentApi.appManagerDashboard.registerApp({
            appName: APP_NAME,
            appDescription: APP_DESCRIPTION,
            authorizedRedirectUris: AUTHORIZED_REDIRECT_URIS,
            delegatees: DELEGATEES,
            toolIpfsCids: TOOL_IPFS_IDS,
            toolPolicies: TOOL_POLICIES,
            toolPolicyParameterNames: TOOL_POLICY_PARAMETER_NAMES,
            toolPolicyParameterTypes: TOOL_POLICY_PARAMETER_TYPES as any
        });
        APP_ID = appRegistrationResult.decodedLogs[0].args.appId;
        console.log(`ℹ️  App registration result: ${APP_ID}`);
    } else {
        const appVersionRegistrationResult = await chainManagerAppManager.vincentApi.appManagerDashboard.registerNextAppVersion({
            toolIpfsCids: TOOL_IPFS_IDS,
            appId: APP_ID,
            toolPolicies: TOOL_POLICIES,
            toolPolicyParameterNames: TOOL_POLICY_PARAMETER_NAMES,
            toolPolicyParameterTypes: TOOL_POLICY_PARAMETER_TYPES as any
        });
        console.log(appVersionRegistrationResult);
        APP_VERSION = appVersionRegistrationResult.decodedLogs[0].args.appVersion;
        console.log(`ℹ️  App version registration result: ${APP_VERSION}`);
    }

    if (USER_PKP === undefined) {
        const pkpInfo = await mintNewPkp(
            AGENT_WALLET_PKP_OWNER_PRIVATE_KEY as `0x${string}`,
            ERC20_APPROVAL_TOOL_IPFS_ID,
            UNISWAP_SWAP_TOOL_IPFS_ID,
            SPENDING_LIMIT_POLICY_IPFS_ID
        );
        console.log(`ℹ️  Minted PKP with token id: ${pkpInfo.tokenId}`);
        console.log(`ℹ️  Minted PKP with address: ${pkpInfo.ethAddress}`);

        USER_PKP = {
            tokenId: pkpInfo.tokenId,
            ethAddress: pkpInfo.ethAddress,
            pkpPubKey: pkpInfo.publicKey
        };

        console.log(`ℹ️  Funding PKP: ${USER_PKP.ethAddress} with 0.01 ETH...`);
        await APP_MANAGER_VIEM_WALLET_CLIENT.sendTransaction({
            to: USER_PKP.ethAddress as `0x${string}`,
            value: BigInt(10000000000000000) // 0.01 ETH in wei
        });
        console.log('ℹ️  Funded PKP with 0.01 ETH');
    } else {
        await permitAuthMethod(
            AGENT_WALLET_PKP_OWNER_PRIVATE_KEY as `0x${string}`,
            USER_PKP.tokenId,
            ERC20_APPROVAL_TOOL_IPFS_ID,
            UNISWAP_SWAP_TOOL_IPFS_ID,
            SPENDING_LIMIT_POLICY_IPFS_ID
        );
        console.log('ℹ️  Permitted auth methods for PKP');
    }

    // Ensure config directory exists
    const configDir = path.dirname(APP_CONFIG_PATH);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    // Write config to file
    fs.writeFileSync(
        APP_CONFIG_PATH,
        JSON.stringify({
            appId: APP_ID.toString(),
            appVersion: APP_VERSION.toString(),
            userPkP: USER_PKP
        }, null, 2));
    console.log(`ℹ️  Saved App ID to config file: ${APP_CONFIG_PATH}`);

    // Create a chain manager using the PKP owner's wallet (not the PKP itself)
    const chainManagerAgentWalletPKPOwner = createDatilChainManager({
        account: AGENT_WALLET_PKP_OWNER_VIEM_WALLET_CLIENT,
        network: 'datil'
    });

    // Permit the app version for the PKP using the PKP owner's wallet
    await chainManagerAgentWalletPKPOwner.vincentApi.userDashboard.permitAppVersion({
        pkpTokenId: BigInt(USER_PKP.tokenId),
        appId: APP_ID,
        appVersion: APP_VERSION,
        toolIpfsCids: TOOL_IPFS_IDS,
        policyIpfsCids: TOOL_POLICIES,
        policyParameterNames: TOOL_POLICY_PARAMETER_NAMES,
        policyParameterValues: TOOL_POLICY_PARAMETER_VALUES as any
    });
    console.log('ℹ️  App permitted for Agent Wallet');

    console.log(`ℹ️  Validating tool execution and getting policies for delegatee: ${APP_DELEGATEE_ADDRESS} with PKP ${USER_PKP.tokenId} and ERC20 Approval tool ${ERC20_APPROVAL_TOOL_IPFS_ID}`);
    let toolExecutionPermittedForDelegatee = await chainManagerAgentWalletPKPOwner.vincentApi.toolLitActions.validateToolExecutionAndGetPolicies({
        delegatee: APP_DELEGATEE_ADDRESS,
        pkpTokenId: BigInt(USER_PKP.tokenId),
        toolIpfsCid: ERC20_APPROVAL_TOOL_IPFS_ID,
    });
    console.log(`ℹ️  Tool execution permitted for delegatee: ${JSON.stringify({
        isPermitted: toolExecutionPermittedForDelegatee.isPermitted,
        appId: toolExecutionPermittedForDelegatee.appId.toString(),
        appVersion: toolExecutionPermittedForDelegatee.appVersion.toString(),
        policies: toolExecutionPermittedForDelegatee.policies.map((policy: any) => ({
            policyIpfsCid: policy.policyIpfsCid,
            parameters: policy.parameters.map((param: any) => ({
                name: param.name,
                paramType: param.paramType,
                value: param.value
            }))
        }))
    }, null, 2)}`);

    console.log(`ℹ️  Validating tool execution and getting policies for delegatee: ${APP_DELEGATEE_ADDRESS} with PKP ${USER_PKP.tokenId} and Uniswap Swap tool ${UNISWAP_SWAP_TOOL_IPFS_ID}`);
    toolExecutionPermittedForDelegatee = await chainManagerAgentWalletPKPOwner.vincentApi.toolLitActions.validateToolExecutionAndGetPolicies({
        delegatee: APP_DELEGATEE_ADDRESS,
        pkpTokenId: BigInt(USER_PKP.tokenId),
        toolIpfsCid: UNISWAP_SWAP_TOOL_IPFS_ID,
    });
    console.log(`ℹ️  Tool execution permitted for delegatee: ${JSON.stringify({
        isPermitted: toolExecutionPermittedForDelegatee.isPermitted,
        appId: toolExecutionPermittedForDelegatee.appId.toString(),
        appVersion: toolExecutionPermittedForDelegatee.appVersion.toString(),
        policies: toolExecutionPermittedForDelegatee.policies.map((policy: any) => ({
            policyIpfsCid: policy.policyIpfsCid,
            parameters: policy.parameters.map((param: any) => ({
                name: param.name,
                paramType: param.paramType,
                value: param.value
            }))
        }))
    }, null, 2)}`);

    console.log(`ℹ️  Executing ERC20 approval tool...`);
    const erc20ApprovalExecutionResult = await executeTool({
        toolIpfsCid: ERC20_APPROVAL_TOOL_IPFS_ID,
        toolParameters: {
            pkpEthAddress: USER_PKP.ethAddress,
            rpcUrl: BASE_RPC_URL,
            chainId: '8453',
            tokenIn: '0x4200000000000000000000000000000000000006', // WETH
            amountIn: '0.00001',
        },
        delegateePrivateKey: APP_DELEGATEE_PRIVATE_KEY as `0x${string}`,
        debug: true,
    });

    console.log(`ℹ️  ERC20 approval tool execution result: ${erc20ApprovalExecutionResult}`);

    console.log(`ℹ️  Executing Uniswap swap tool...`);
    const uniswapSwapExecutionResult = await executeTool({
        toolIpfsCid: UNISWAP_SWAP_TOOL_IPFS_ID,
        toolParameters: {
            pkpEthAddress: USER_PKP.ethAddress,
            rpcUrl: BASE_RPC_URL,
            chainId: '8453',
            tokenIn: '0x4200000000000000000000000000000000000006', // WETH
            tokenOut: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', // DEGEN
            amountIn: '0.00001',
        },
        delegateePrivateKey: APP_DELEGATEE_PRIVATE_KEY as `0x${string}`,
        debug: true,
    });

    console.log(`ℹ️  Uniswap swap tool execution result: ${uniswapSwapExecutionResult}`);
})();
