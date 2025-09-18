import { formatEther } from 'viem';
import { bundledVincentAbility as erc20BundledAbility } from '@lit-protocol/vincent-ability-erc20-approval';

import {
  bundledVincentAbility as uniswapBundledAbility,
  type PrepareSignedUniswapQuote,
  getSignedUniswapQuote,
} from '@lit-protocol/vincent-ability-uniswap-swap';
import { bundledVincentAbility as solTransactionSignerBundledAbility } from '@lit-protocol/vincent-ability-sol-transaction-signer';

import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import { ethers } from 'ethers';
import type { PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import {
  getClient,
  getPkpTokenId,
  VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
} from '@lit-protocol/vincent-contracts-sdk';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import {
  Keypair,
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
  Connection,
  clusterApiUrl,
} from '@solana/web3.js';

import {
  createSiweMessage,
  generateAuthSig,
  LitAccessControlConditionResource,
} from '@lit-protocol/auth-helpers';

import {
  BASE_PUBLIC_CLIENT,
  BASE_RPC_URL,
  checkShouldMintAndFundPkp,
  DATIL_PUBLIC_CLIENT,
  getTestConfig,
  TEST_APP_DELEGATEE_ACCOUNT,
  TEST_APP_DELEGATEE_PRIVATE_KEY,
  TEST_APP_MANAGER_PRIVATE_KEY,
  TEST_CONFIG_PATH,
  TestConfig,
  YELLOWSTONE_RPC_URL,
} from './helpers';
import {
  fundAppDelegateeIfNeeded,
  permitAppVersionForAgentWalletPkp,
  permitAbilitiesForAgentWalletPkp,
  registerNewApp,
  removeAppDelegateeIfNeeded,
} from './helpers/setup-fixtures';
import * as util from 'node:util';
import { privateKeyToAccount } from 'viem/accounts';

import { checkShouldMintCapacityCredit } from './helpers/check-mint-capcity-credit';
import { LIT_ABILITY, LIT_NETWORK } from '@lit-protocol/constants';

import { api } from '@lit-protocol/vincent-wrapped-keys';
const { getVincentRegistryAccessControlCondition } = api;

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

const contractClient = getClient({
  signer: new ethers.Wallet(
    TEST_APP_MANAGER_PRIVATE_KEY,
    new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
  ),
});

// Create a delegatee wallet for ability execution
const getDelegateeWallet = () => {
  return new ethers.Wallet(
    TEST_APP_DELEGATEE_PRIVATE_KEY as string,
    new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
  );
};

const getSolanaTransactionSignerAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility: solTransactionSignerBundledAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

const createSolanaTransferTransaction = async (
  from: PublicKey,
  to: PublicKey,
  lamports: number,
) => {
  const transaction = new Transaction();
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports,
    }),
  );

  // Fetch recent blockhash from the network
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = from;

  return transaction;
};

describe('Solana Transaction Signer Ability E2E Tests', () => {
  // Define permission data for all abilities and policies
  const PERMISSION_DATA: PermissionData = {
    // Solana Transaction Signer Ability has no policies
    [solTransactionSignerBundledAbility.ipfsCid]: {},
  };

  // An array of the IPFS cid of each ability to be tested, computed from the keys of PERMISSION_DATA
  const TOOL_IPFS_IDS: string[] = Object.keys(PERMISSION_DATA);

  // Define the policies for each ability, computed from TOOL_IPFS_IDS and PERMISSION_DATA
  const TOOL_POLICIES = TOOL_IPFS_IDS.map((abilityIpfsCid) => {
    // Get the policy IPFS CIDs for this ability from PERMISSION_DATA
    return Object.keys(PERMISSION_DATA[abilityIpfsCid]);
  });

  let TEST_CONFIG: TestConfig;
  let LIT_NODE_CLIENT: LitNodeClient;
  let TEST_SOLANA_KEYPAIR: Keypair;
  let CIPHERTEXT: string;
  let DATA_TO_ENCRYPT_HASH: string;
  let EVM_CONTRACT_CONDITION: any;

  afterAll(async () => {
    console.log('Disconnecting from Lit node client...');
    await disconnectVincentAbilityClients();
    await LIT_NODE_CLIENT.disconnect();
  });

  beforeAll(async () => {
    TEST_CONFIG = getTestConfig(TEST_CONFIG_PATH);
    TEST_CONFIG = await checkShouldMintAndFundPkp(TEST_CONFIG);
    TEST_CONFIG = await checkShouldMintCapacityCredit(TEST_CONFIG);

    // The App Manager needs to have Lit test tokens
    // in order to interact with the Vincent contract
    const appManagerLitTestTokenBalance = await DATIL_PUBLIC_CLIENT.getBalance({
      address: privateKeyToAccount(TEST_APP_MANAGER_PRIVATE_KEY as `0x${string}`).address,
    });
    if (appManagerLitTestTokenBalance === 0n) {
      throw new Error(
        `❌ App Manager has no Lit test tokens. Please fund ${
          privateKeyToAccount(TEST_APP_MANAGER_PRIVATE_KEY as `0x${string}`).address
        } with Lit test tokens`,
      );
    } else {
      console.log(
        `ℹ️  App Manager has ${formatEther(appManagerLitTestTokenBalance)} Lit test tokens`,
      );
    }

    await fundAppDelegateeIfNeeded();

    LIT_NODE_CLIENT = new LitNodeClient({
      litNetwork: LIT_NETWORK.Datil,
      debug: true,
    });
    await LIT_NODE_CLIENT.connect();

    const pkpTokenId = await getPkpTokenId({
      pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
      signer: ethers.Wallet.createRandom().connect(
        new ethers.providers.StaticJsonRpcProvider(YELLOWSTONE_RPC_URL),
      ),
    });
    console.log('pkpTokenId.toString()', pkpTokenId.toString());
    console.log('functionParams', [
      TEST_APP_DELEGATEE_ACCOUNT.address,
      pkpTokenId.toString(),
      solTransactionSignerBundledAbility.ipfsCid,
    ]);

    EVM_CONTRACT_CONDITION = {
      conditionType: 'evmContract',
      contractAddress: VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
      chain: 'yellowstone',
      functionName: 'validateAbilityExecutionAndGetPolicies',
      functionParams: [
        TEST_APP_DELEGATEE_ACCOUNT.address,
        pkpTokenId.toString(),
        solTransactionSignerBundledAbility.ipfsCid,
      ],
      functionAbi: {
        name: 'validateAbilityExecutionAndGetPolicies',
        stateMutability: 'view',
        inputs: [
          { name: 'delegatee', type: 'address' },
          { name: 'pkpTokenId', type: 'uint256' },
          { name: 'abilityIpfsCid', type: 'string' },
        ],
        outputs: [{ name: '', type: 'tuple' }],
      },
      returnValueTest: { key: '', comparator: '=', value: 'true' },
    };

    // EVM_CONTRACT_CONDITION = {
    //   conditionType: 'evmContract',
    //   contractAddress: VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
    //   chain: 'yellowstone',
    //   functionName: 'getPermittedAppVersionForPkp',
    //   functionParams: [
    //     pkpTokenId.toString(),
    //     TEST_CONFIG.appId!.toString(),
    //   ],
    //   functionAbi: {
    //     name: 'getPermittedAppVersionForPkp',
    //     type: 'function',
    //     stateMutability: 'view',
    //     inputs: [
    //       { name: 'pkpTokenId', type: 'uint256' },
    //       { name: 'appId', type: 'uint40' },
    //     ],
    //     outputs: [
    //       { name: '', type: 'uint24' },
    //     ],
    //   },
    //   returnValueTest: { key: '', comparator: '>=', value: '0' },
    // };
  });

  it('should permit the Solana Transaction Signer Ability for the Agent Wallet PKP', async () => {
    await permitAbilitiesForAgentWalletPkp(
      [solTransactionSignerBundledAbility.ipfsCid],
      TEST_CONFIG,
    );
  });

  it('should remove TEST_APP_DELEGATEE_ACCOUNT from an existing App if needed', async () => {
    await removeAppDelegateeIfNeeded();
  });

  it('should register a new App', async () => {
    TEST_CONFIG = await registerNewApp(TOOL_IPFS_IDS, TOOL_POLICIES, TEST_CONFIG, TEST_CONFIG_PATH);
  });

  it('should permit the App version for the Agent Wallet PKP', async () => {
    await permitAppVersionForAgentWalletPkp(PERMISSION_DATA, TEST_CONFIG);
  });

  it('should validate the Delegatee has permission to execute the Solana Transaction Signer Ability with the Agent Wallet PKP', async () => {
    const validationResult = await contractClient.validateAbilityExecutionAndGetPolicies({
      delegateeAddress: TEST_APP_DELEGATEE_ACCOUNT.address,
      pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
      abilityIpfsCid: TOOL_IPFS_IDS[0],
    });

    expect(validationResult).toBeDefined();
    expect(validationResult.isPermitted).toBe(true);
    expect(validationResult.appId).toBe(TEST_CONFIG.appId!);
    expect(validationResult.appVersion).toBe(TEST_CONFIG.appVersion!);
    expect(Object.keys(validationResult.decodedPolicies)).toHaveLength(0);
  });

  it('should generate a new solana keypair and encrypt it', async () => {
    TEST_SOLANA_KEYPAIR = Keypair.generate();

    const { ciphertext, dataToEncryptHash } = await LIT_NODE_CLIENT.encrypt({
      evmContractConditions: [EVM_CONTRACT_CONDITION],
      dataToEncrypt: TEST_SOLANA_KEYPAIR.secretKey,
    });
    CIPHERTEXT = ciphertext;
    DATA_TO_ENCRYPT_HASH = dataToEncryptHash;
  });

  it('should run precheck and validate transaction deserialization', async () => {
    const client = getSolanaTransactionSignerAbilityClient();

    // Create a test transaction
    const transaction = await createSolanaTransferTransaction(
      TEST_SOLANA_KEYPAIR.publicKey,
      TEST_SOLANA_KEYPAIR.publicKey,
      0.001 * LAMPORTS_PER_SOL, // 0.001 SOL
    );

    const serializedTransaction = transaction
      .serialize({ requireAllSignatures: false })
      .toString('base64');

    const precheckResult = await client.precheck(
      {
        serializedTransaction,
        ciphertext: CIPHERTEXT,
        dataToEncryptHash: DATA_TO_ENCRYPT_HASH,
        versionedTransaction: false,
      },
      { delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress! },
    );

    console.log(
      '[should run precheck and validate transaction deserialization]',
      util.inspect(precheckResult, { depth: 10 }),
    );

    expect(precheckResult.success).toBe(true);
    if (!precheckResult.success) {
      throw new Error(precheckResult.runtimeError);
    }
  });

  it('should decrypt solana key with hardcoded access control conditions', async () => {
    const sessionSignatures = await LIT_NODE_CLIENT.getSessionSigs({
      chain: 'ethereum',
      expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
      resourceAbilityRequests: [
        {
          resource: new LitAccessControlConditionResource('*'),
          ability: LIT_ABILITY.AccessControlConditionDecryption,
        },
      ],
      authNeededCallback: async ({ uri, expiration, resourceAbilityRequests }) => {
        const toSign = await createSiweMessage({
          uri,
          expiration,
          resources: resourceAbilityRequests,
          walletAddress: await getDelegateeWallet().getAddress(),
          nonce: await LIT_NODE_CLIENT.getLatestBlockhash(),
          litNodeClient: LIT_NODE_CLIENT,
        });

        return await generateAuthSig({
          signer: getDelegateeWallet(),
          toSign,
        });
      },
    });

    try {
      const decrypted = await LIT_NODE_CLIENT.decrypt({
        evmContractConditions: [EVM_CONTRACT_CONDITION],
        ciphertext: CIPHERTEXT,
        dataToEncryptHash: DATA_TO_ENCRYPT_HASH,
        sessionSigs: sessionSignatures,
        chain: 'yellowstone',
      });

      console.log('✅ Decryption successful with hardcoded ACC');
      expect(decrypted).toBeDefined();
      expect(decrypted.decryptedData).toBeDefined();
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      throw error;
    }
  });

  it.skip('should run execute and return a signed transaction', async () => {
    const client = getSolanaTransactionSignerAbilityClient();

    // Create a test transaction
    const transaction = await createSolanaTransferTransaction(
      TEST_SOLANA_KEYPAIR.publicKey,
      TEST_SOLANA_KEYPAIR.publicKey,
      0.001 * LAMPORTS_PER_SOL, // 0.001 SOL
    );

    const serializedTransaction = transaction
      .serialize({ requireAllSignatures: false })
      .toString('base64');

    const executeResult = await client.execute(
      {
        serializedTransaction,
        ciphertext: CIPHERTEXT,
        dataToEncryptHash: DATA_TO_ENCRYPT_HASH,
        versionedTransaction: false,
      },
      { delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress! },
    );

    console.log(
      '[should run execute and return a signed transaction]',
      util.inspect(executeResult, { depth: 10 }),
    );

    expect(executeResult.success).toBe(true);
  });
});
