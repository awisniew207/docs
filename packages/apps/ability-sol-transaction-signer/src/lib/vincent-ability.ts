import {
  createVincentAbility,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { Keypair } from '@solana/web3.js';

import { api } from '@lit-protocol/vincent-wrapped-keys';
const { getVincentRegistryAccessControlCondition } = api;

import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  abilityParamsSchema,
} from './schemas';
import { signSolanaTransaction, deserializeTransaction } from './lit-action-helpers';

declare const Lit: {
  Actions: {
    decryptAndCombine: (params: {
      accessControlConditions: any[];
      ciphertext: string;
      dataToEncryptHash: string;
      authSig: any;
      chain: string;
    }) => Promise<string>;
  };
};

export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/vincent-ability-sol-transaction-signer' as const,
  abilityDescription:
    'Sign a Solana transaction using a Vincent Agent Wallet with encrypted private key.' as const,
  abilityParamsSchema,
  supportedPolicies: supportedPoliciesForAbility([]),

  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ abilityParams }, { succeed, fail }) => {
    const { serializedTransaction, versionedTransaction } = abilityParams;

    try {
      deserializeTransaction(serializedTransaction, versionedTransaction);

      return succeed();
    } catch (error) {
      return fail({
        error: `Failed to decode Solana transaction: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },

  execute: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    const { serializedTransaction, ciphertext, dataToEncryptHash, versionedTransaction } =
      abilityParams;
    const { ethAddress } = delegatorPkpInfo;

    try {
      const accessControlConditions = [
        await getVincentRegistryAccessControlCondition({
          agentWalletAddress: ethAddress,
        }),
      ];

      const decryptedPrivateKey = await Lit.Actions.decryptAndCombine({
        accessControlConditions,
        ciphertext,
        dataToEncryptHash,
        authSig: null,
        chain: 'ethereum',
      });

      const solanaKeypair = Keypair.fromSecretKey(Buffer.from(decryptedPrivateKey, 'hex'));

      const transaction = deserializeTransaction(serializedTransaction, versionedTransaction);

      signSolanaTransaction({
        solanaKeypair,
        transaction,
        versionedTransaction,
      });

      return succeed({
        signedTransaction: transaction.serialize().toString('base64'),
      });
    } catch (error) {
      return fail({
        error: `Failed to sign Solana transaction: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
});
