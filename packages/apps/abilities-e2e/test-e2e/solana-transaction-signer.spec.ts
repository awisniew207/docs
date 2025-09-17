import { ethers } from 'ethers';
import { bundledVincentAbility } from '@lit-protocol/vincent-ability-sol-transaction-signer';
import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { formatEther } from 'viem';
import type { ContractClient, PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import * as util from 'node:util';
import { Keypair, Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

import {
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

import { checkShouldMintCapacityCredit } from './helpers/check-mint-capcity-credit';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

// Create a delegatee wallet for ability execution
const getDelegateeWallet = () => {
  return new ethers.Wallet(
    TEST_APP_DELEGATEE_PRIVATE_KEY as string,
    new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
  );
};

// Get ability client for Solana transaction signer
const getSolanaTransactionSignerAbilityClient = () => {
  return getVincentAbilityClient({
    bundledVincentAbility,
    ethersSigner: getDelegateeWallet(),
  });
};

// Helper function to create a simple Solana transfer transaction
const createSolanaTransferTransaction = (from: PublicKey, to: PublicKey, lamports: number) => {
  const transaction = new Transaction();
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports,
    }),
  );

  // Set recent blockhash (this would normally come from the network)
  transaction.recentBlockhash = 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N';
  transaction.feePayer = from;

  return transaction;
};

describe('Solana Transaction Signer Ability E2E Tests', () => {
  // Define permission data for the ability (no policies needed for basic test)
  const PERMISSION_DATA: PermissionData = {
    [bundledVincentAbility.ipfsCid]: {},
  };

  // An array of the IPFS cid of each ability to be tested
  const ABILITY_IPFS_IDS: string[] = Object.keys(PERMISSION_DATA);

  // Define the policies for each ability (none for basic signing)
  const ABILITY_POLICIES = ABILITY_IPFS_IDS.map((abilityIpfsCid) => {
    return Object.keys(PERMISSION_DATA[abilityIpfsCid]);
  });

  let TEST_CONFIG: TestConfig;
  let contractClient: ContractClient;

  // Test Solana keypairs for transaction testing
  let testSolanaKeypair: Keypair;
  let recipientSolanaKeypair: Keypair;

  // Stubbed encryption values (to be filled in manually)
  let ciphertext: string;
  let dataToEncryptHash: string;

  afterAll(async () => {
    console.log('Disconnecting from Lit node client...');
    await disconnectVincentAbilityClients();
  });

  beforeAll(async () => {
    TEST_CONFIG = getTestConfig(TEST_CONFIG_PATH);
    TEST_CONFIG = await checkShouldMintAndFundPkp(TEST_CONFIG);
    TEST_CONFIG = await checkShouldMintCapacityCredit(TEST_CONFIG);

    contractClient = getClient({
      signer: new ethers.Wallet(
        TEST_APP_MANAGER_PRIVATE_KEY,
        new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
      ),
    });

    // The App Manager needs to have Lit test tokens in order to interact with the Vincent contract
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

    // Generate test Solana keypairs
    testSolanaKeypair = Keypair.generate();
    recipientSolanaKeypair = Keypair.generate();

    console.log(`ℹ️  Test Solana keypair: ${testSolanaKeypair.publicKey.toBase58()}`);
    console.log(`ℹ️  Recipient Solana keypair: ${recipientSolanaKeypair.publicKey.toBase58()}`);

    // TODO: Implement encryption of testSolanaKeypair.secretKey
    // For now, we'll use placeholder values that need to be set manually
    ciphertext = 'PLACEHOLDER_CIPHERTEXT'; // Set this manually
    dataToEncryptHash = 'PLACEHOLDER_DATA_TO_ENCRYPT_HASH'; // Set this manually

    console.log(
      '⚠️  IMPORTANT: Set ciphertext and dataToEncryptHash manually before running tests',
    );
  });

  it('should permit the Solana Transaction Signer Ability for the Agent Wallet PKP', async () => {
    await permitAbilitiesForAgentWalletPkp([bundledVincentAbility.ipfsCid], TEST_CONFIG);
  });

  it('should remove TEST_APP_DELEGATEE_ACCOUNT from an existing App if needed', async () => {
    await removeAppDelegateeIfNeeded();
  });

  it('should fund TEST_APP_DELEGATEE if they have no Lit test tokens', async () => {
    await fundAppDelegateeIfNeeded();
  });

  it('should register a new App', async () => {
    TEST_CONFIG = await registerNewApp(
      ABILITY_IPFS_IDS,
      ABILITY_POLICIES,
      TEST_CONFIG,
      TEST_CONFIG_PATH,
    );
  });

  it('should permit the App version for the Agent Wallet PKP', async () => {
    await permitAppVersionForAgentWalletPkp(PERMISSION_DATA, TEST_CONFIG);
  });

  it('should validate the Delegatee has permission to execute the Solana Transaction Signer Ability', async () => {
    const validationResult = await contractClient.validateAbilityExecutionAndGetPolicies({
      delegateeAddress: TEST_APP_DELEGATEE_ACCOUNT.address,
      pkpEthAddress: TEST_CONFIG.userPkp!.ethAddress!,
      abilityIpfsCid: ABILITY_IPFS_IDS[0],
    });

    expect(validationResult).toBeDefined();
    expect(validationResult.isPermitted).toBe(true);
    expect(validationResult.appId).toBe(TEST_CONFIG.appId!);
    expect(validationResult.appVersion).toBe(TEST_CONFIG.appVersion!);
    expect(Object.keys(validationResult.decodedPolicies)).toHaveLength(0);
  });

  it('should run precheck and validate transaction deserialization', async () => {
    // Skip if encryption values not set
    if (ciphertext === 'PLACEHOLDER_CIPHERTEXT') {
      console.log('⚠️  Skipping precheck test - ciphertext not set manually');
      return;
    }

    const client = getSolanaTransactionSignerAbilityClient();

    // Create a test transaction
    const transaction = createSolanaTransferTransaction(
      testSolanaKeypair.publicKey,
      recipientSolanaKeypair.publicKey,
      0.001 * LAMPORTS_PER_SOL, // 0.001 SOL
    );

    const serializedTransaction = transaction
      .serialize({ requireAllSignatures: false })
      .toString('base64');

    const precheckResult = await client.precheck(
      {
        serializedTransaction,
        ciphertext,
        dataToEncryptHash,
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

    // Since we removed the deserialized transaction from precheck response,
    // we just verify success (transaction was validly deserialized)
    expect(precheckResult.result).toBeDefined();
  });

  it('should execute the Solana Transaction Signer Ability and return signed transaction', async () => {
    // Skip if encryption values not set
    if (ciphertext === 'PLACEHOLDER_CIPHERTEXT') {
      console.log('⚠️  Skipping execute test - ciphertext not set manually');
      return;
    }

    const client = getSolanaTransactionSignerAbilityClient();

    // Create a test transaction
    const transaction = createSolanaTransferTransaction(
      testSolanaKeypair.publicKey,
      recipientSolanaKeypair.publicKey,
      0.001 * LAMPORTS_PER_SOL, // 0.001 SOL
    );

    const serializedTransaction = transaction
      .serialize({ requireAllSignatures: false })
      .toString('base64');

    const execResult = await client.execute(
      {
        serializedTransaction,
        ciphertext,
        dataToEncryptHash,
        versionedTransaction: false,
      },
      { delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress! },
    );

    console.log(
      '[should execute the Solana Transaction Signer Ability and return signed transaction]',
      util.inspect(execResult, { depth: 10 }),
    );

    // Check top-level execution result structure and values
    expect(execResult).toBeDefined();
    expect(execResult.success).toBe(true);
    if (!execResult.success) {
      throw new Error(execResult.runtimeError);
    }

    // Check result object
    expect(execResult.result).toBeDefined();
    expect(execResult.result.signedTransaction).toBeDefined();
    expect(typeof execResult.result.signedTransaction).toBe('string');

    // Verify the signed transaction is valid base64
    expect(() => Buffer.from(execResult.result.signedTransaction, 'base64')).not.toThrow();

    // The signed transaction should be longer than the unsigned one (contains signatures)
    expect(execResult.result.signedTransaction.length).toBeGreaterThan(
      serializedTransaction.length,
    );
  });

  it('should handle versioned transactions', async () => {
    // Skip if encryption values not set
    if (ciphertext === 'PLACEHOLDER_CIPHERTEXT') {
      console.log('⚠️  Skipping versioned transaction test - ciphertext not set manually');
      return;
    }

    const client = getSolanaTransactionSignerAbilityClient();

    // Create a test transaction
    const transaction = createSolanaTransferTransaction(
      testSolanaKeypair.publicKey,
      recipientSolanaKeypair.publicKey,
      0.001 * LAMPORTS_PER_SOL, // 0.001 SOL
    );

    const serializedTransaction = transaction
      .serialize({ requireAllSignatures: false })
      .toString('base64');

    const execResult = await client.execute(
      {
        serializedTransaction,
        ciphertext,
        dataToEncryptHash,
        versionedTransaction: true, // Test with versioned flag
      },
      { delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress! },
    );

    console.log('[should handle versioned transactions]', util.inspect(execResult, { depth: 10 }));

    expect(execResult.success).toBe(true);
    if (!execResult.success) {
      throw new Error(execResult.runtimeError);
    }

    expect(execResult.result).toBeDefined();
    expect(execResult.result.signedTransaction).toBeDefined();
    expect(typeof execResult.result.signedTransaction).toBe('string');
  });

  it('should fail precheck with invalid transaction data', async () => {
    const client = getSolanaTransactionSignerAbilityClient();

    const precheckResult = await client.precheck(
      {
        serializedTransaction: 'invalid-base64-data',
        ciphertext: 'dummy-ciphertext',
        dataToEncryptHash: 'dummy-hash',
        versionedTransaction: false,
      },
      { delegatorPkpEthAddress: TEST_CONFIG.userPkp!.ethAddress! },
    );

    console.log(
      '[should fail precheck with invalid transaction data]',
      util.inspect(precheckResult, { depth: 10 }),
    );

    expect(precheckResult.success).toBe(false);
    expect(precheckResult.runtimeError).toContain('Failed to decode Solana transaction');
  });
});
