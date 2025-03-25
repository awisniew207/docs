// @ts-nocheck

import { config } from '@dotenvx/dotenvx';

// Load environment variables
config();

import { ethers } from 'ethers';
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK, LIT_ABILITY, LIT_RPC, AUTH_METHOD_TYPE, AUTH_METHOD_SCOPE } from "@lit-protocol/constants";
import { LitActionResource, LitPKPResource } from "@lit-protocol/auth-helpers";
import { EthWalletProvider } from "@lit-protocol/lit-auth-client";
import { LitContracts } from "@lit-protocol/contracts-sdk";
import {
    createWalletClient,
    http,
    parseEther,
    defineChain,
    hexToBytes
} from 'viem';
import { privateKeyToAccount, type Account, createAccount, serializeTransaction as serializeViemTransaction } from 'viem/accounts';
import { createDatilChainManager } from '@lit-protocol/vincent-contracts';

import { mintNewPkp } from './utils/mint-pkp';
import { createPkpViemAccount } from './utils/create-pkp-viem-account';
import { executeTool } from './utils/execute-tool';

const YELLOWSTONE_RPC_URL = 'https://yellowstone-rpc.litprotocol.com/';

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
const APP_MANAGER_VIEM_ACCOUNT = privateKeyToAccount(APP_MANAGER_PRIVATE_KEY);
const APP_MANAGER_VIEM_WALLET_CLIENT = createWalletClient({
    account: APP_MANAGER_VIEM_ACCOUNT,
    chain: datilChain,
    transport: http(YELLOWSTONE_RPC_URL)
});

// Create Viem account and wallet client for PKP owner
const AGENT_WALLET_PKP_OWNER_PRIVATE_KEY = process.env.AGENT_WALLET_PKP_OWNER_PRIVATE_KEY;
const AGENT_WALLET_PKP_OWNER_VIEM_ACCOUNT = privateKeyToAccount(AGENT_WALLET_PKP_OWNER_PRIVATE_KEY);
const AGENT_WALLET_PKP_OWNER_VIEM_WALLET_CLIENT = createWalletClient({
    account: AGENT_WALLET_PKP_OWNER_VIEM_ACCOUNT,
    chain: datilChain,
    transport: http(YELLOWSTONE_RPC_URL)
});

const APP_DELEGATEE_PRIVATE_KEY = process.env.APP_DELEGATEE_PRIVATE_KEY;
const APP_DELEGATEE_ADDRESS = privateKeyToAccount(APP_DELEGATEE_PRIVATE_KEY).address;

const VINCENT_ADDRESS = '0x456DFB72AAe179E219FEbf3f339dF412dF30313D';

(async () => {
    const APP_NAME = 'Vincent Test App';
    const APP_DESCRIPTION = 'A test app for the Vincent protocol';
    const AUTHORIZED_REDIRECT_URIS = ['https://testing.vincent.com'];
    const DELEGATEES = [APP_DELEGATEE_ADDRESS];
    const TOOL_IPFS_IDS = ['QmXApiWuhCu58m7XVFmrGvEtorvBW6xi155D8gh26YZHTP'];
    const TOOL_POLICY_IPFS_IDS = ['QmPF6XZBFm7mfHxcAW2nzdewPDjMDVRxrTak3Tg398Y7F1'];

    // Use proper structure for policy-related parameters
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
                { type: 'uint256', value: '1000000000000000000' },
                { type: 'uint256', value: '10000' },
                { type: 'uint256', value: '86400' },
                { type: 'address[]', value: '0x4200000000000000000000000000000000000006,0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }
            ]
        ]
    ];

    let APP_ID = 23n;
    let APP_VERSION = 1n;

    const chainManagerAppManager = createDatilChainManager({
        account: APP_MANAGER_VIEM_WALLET_CLIENT,
        network: 'datil'
    });

    const removeDelegateeResult = await chainManagerAppManager.vincentApi.appManagerDashboard.removeDelegatee({
        appId: APP_ID,
        delegatee: DELEGATEES[0]
    })
    console.log(`ℹ️  Remove delegatee from App: ${APP_ID}`);

    const appRegistrationResult = await chainManagerAppManager.vincentApi.appManagerDashboard.registerApp({
        appName: APP_NAME,
        appDescription: APP_DESCRIPTION,
        authorizedRedirectUris: AUTHORIZED_REDIRECT_URIS,
        delegatees: DELEGATEES,
        toolIpfsCids: TOOL_IPFS_IDS,
        toolPolicies: TOOL_POLICIES,
        toolPolicyParameterNames: TOOL_POLICY_PARAMETER_NAMES,
        toolPolicyParameterTypes: TOOL_POLICY_PARAMETER_TYPES
    });
    APP_ID = appRegistrationResult.decodedLogs[0].args.appId;
    console.log(`ℹ️  App registration result: ${APP_ID}`);

    const pkpInfo = await mintNewPkp(AGENT_WALLET_PKP_OWNER_PRIVATE_KEY, TOOL_IPFS_IDS[0]);
    console.log(`ℹ️  Minted PKP with token id: ${pkpInfo.tokenId}`);
    console.log(`ℹ️  Minted PKP with address: ${pkpInfo.ethAddress}`);

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
        policyParameterValues: TOOL_POLICY_PARAMETER_VALUES
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
        policies: toolExecutionPermittedForDelegatee.policies.map(policy => ({
            policyIpfsCid: policy.policyIpfsCid,
            parameters: policy.parameters.map(param => ({
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
            tokenIn: '0x4200000000000000000000000000000000000006', // Wrapped ETH
            tokenOut: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
            amountIn: '1',
        },
        delegateePrivateKey: APP_DELEGATEE_PRIVATE_KEY,
        pkpEthAddress: pkpInfo.ethAddress,
        debug: true,
    });

    console.log(`ℹ️  Tool execution result: ${toolExecutionResult}`);
})();
