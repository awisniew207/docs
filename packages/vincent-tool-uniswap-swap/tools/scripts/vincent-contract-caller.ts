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
    const TOOL_IPFS_IDS = ['QmQ1FzWYoV2HDNhSNswAP6xUcW9odSPDvjqEuwkhFjhBB4'];
    const TOOL_POLICY_IPFS_IDS = ['QmYxpPHXyVUsy1BXCHbwgLLUrdrKJ3TNDoZKn1DUNJA4bp'];

    const TOOL_POLICIES = [
        TOOL_POLICY_IPFS_IDS
    ];
    const TOOL_POLICY_PARAMETER_NAMES = [
        [['maxAmountPerTx', 'maxSpendingLimit', 'spendingLimitDuration', 'allowedTokens']]
    ];
    const TOOL_POLICY_PARAMETER_TYPES = [
        [['UINT256', 'UINT256', 'UINT256', 'ADDRESS_ARRAY']]
    ];
    const TOOL_POLICY_PARAMETER_VALUES = [
        [
            [
                { type: 'uint256', value: "10000000000" }, // maxAmountPerTx $100 USD (8 decimals)
                { type: 'uint256', value: "10000000000000" }, // maxSpendingLimit $100,000 USD (8 decimals)
                { type: 'uint256', value: "86400" }, // spendingLimitDuration 1 day
                { type: 'address[]', value: '0x4200000000000000000000000000000000000006,0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913,0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed' }
            ]
        ]
    ];

    let APP_ID: bigint;
    let APP_VERSION = 1n;

    try {
        if (fs.existsSync(APP_CONFIG_PATH)) {
            const config = JSON.parse(fs.readFileSync(APP_CONFIG_PATH, 'utf8'));
            APP_ID = BigInt(config.appId);
            console.log(`ℹ️  Loaded existing App ID: ${APP_ID}`);
        } else {
            console.log('ℹ️  No existing App ID found');
            APP_ID = 0n;
        }
    } catch (error) {
        console.log('ℹ️  Error reading App ID, starting fresh');
        APP_ID = 0n;
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
    }

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

    // Ensure config directory exists
    const configDir = path.dirname(APP_CONFIG_PATH);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    // Write new APP_ID to config file
    fs.writeFileSync(APP_CONFIG_PATH, JSON.stringify({ appId: APP_ID.toString() }, null, 2));
    console.log(`ℹ️  Saved App ID to config file: ${APP_CONFIG_PATH}`);

    const pkpInfo = await mintNewPkp(AGENT_WALLET_PKP_OWNER_PRIVATE_KEY as `0x${string}`, TOOL_IPFS_IDS[0], TOOL_POLICY_IPFS_IDS[0]);
    console.log(`ℹ️  Minted PKP with token id: ${pkpInfo.tokenId}`);
    console.log(`ℹ️  Minted PKP with address: ${pkpInfo.ethAddress}`);

    console.log(`ℹ️  Funding PKP: ${pkpInfo.ethAddress} with 0.01 ETH...`);
    await APP_MANAGER_VIEM_WALLET_CLIENT.sendTransaction({
        to: pkpInfo.ethAddress as `0x${string}`,
        value: BigInt(10000000000000000) // 0.01 ETH in wei
    });
    console.log('ℹ️  Funded PKP with 0.01 ETH');

    // Create a chain manager using the PKP owner's wallet (not the PKP itself)
    const chainManagerAgentWalletPKPOwner = createDatilChainManager({
        account: AGENT_WALLET_PKP_OWNER_VIEM_WALLET_CLIENT,
        network: 'datil'
    });

    // Permit the app version for the PKP using the PKP owner's wallet
    await chainManagerAgentWalletPKPOwner.vincentApi.userDashboard.permitAppVersion({
        pkpTokenId: BigInt(pkpInfo.tokenId),
        appId: APP_ID,
        appVersion: APP_VERSION,
        toolIpfsCids: TOOL_IPFS_IDS,
        policyIpfsCids: TOOL_POLICIES,
        policyParameterNames: TOOL_POLICY_PARAMETER_NAMES,
        policyParameterValues: TOOL_POLICY_PARAMETER_VALUES as any
    });
    console.log('ℹ️  App permitted for Agent Wallet');

    console.log(`ℹ️  Validating tool execution and getting policies for delegatee: ${APP_DELEGATEE_ADDRESS} with PKP ${pkpInfo.tokenId} and tool ${TOOL_IPFS_IDS[0]}`);
    const toolExecutionPermittedForDelegatee = await chainManagerAgentWalletPKPOwner.vincentApi.toolLitActions.validateToolExecutionAndGetPolicies({
        delegatee: APP_DELEGATEE_ADDRESS,
        pkpTokenId: BigInt(pkpInfo.tokenId),
        toolIpfsCid: TOOL_IPFS_IDS[0],
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

    const toolExecutionResult = await executeTool({
        toolIpfsCid: TOOL_IPFS_IDS[0],
        toolParameters: {
            rpcUrl: BASE_RPC_URL,
            chainId: '8453',
            tokenIn: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', // DEGEN
            tokenOut: '0x4200000000000000000000000000000000000006', // WETH
            amountIn: '10',
        },
        delegateePrivateKey: APP_DELEGATEE_PRIVATE_KEY as `0x${string}`,
        pkpEthAddress: pkpInfo.ethAddress,
        debug: true,
    });

    console.log(`ℹ️  Tool execution result: ${toolExecutionResult}`);
})();
