import { PKPBase } from '@lit-protocol/pkp-base';
import { PKPBaseProp, SigResponse } from '@lit-protocol/types';
import {
  concatHex,
  hashMessage,
  hashTypedData,
  Hex,
  keccak256,
  serializeTransaction,
  toBytes,
  toHex,
} from 'viem';
import { publicKeyToAddress, toAccount } from 'viem/accounts';

export async function createViemAccount(params: PKPBaseProp) {
  const pkpBase = PKPBase.createInstance(params);

  const publicKey = `0x${pkpBase.uncompressedPubKey}` as `0x${string}`;

  const address = publicKeyToAddress(publicKey);

  const formatSignature = (signature: SigResponse): Hex => {
    const r = `0x${signature.r.padStart(64, '0')}` as Hex;
    const s = `0x${signature.s.padStart(64, '0')}` as Hex;

    // Convert recid to v value (27 + recid for Ethereum)
    const v = toHex(27 + signature.recid) as Hex;

    // Concatenate the components
    return concatHex([r, s, v]) as Hex;
  };

  return toAccount({
    address,
    async signMessage({ message }) {
      await pkpBase.ensureLitNodeClientReady();

      const toSign = toBytes(hashMessage(message));

      const signature = await pkpBase.runSign(toSign);

      return formatSignature(signature);
    },
    async signTransaction(transaction) {
      await pkpBase.ensureLitNodeClientReady();

      const txWithOpts = { ...transaction };

      const serialised = serializeTransaction(txWithOpts);

      const transactionHash = keccak256(serialised);

      const toSign = toBytes(transactionHash);

      const signature = await pkpBase.runSign(toSign);

      return formatSignature(signature);
    },
    async signTypedData(typedData) {
      await pkpBase.ensureLitNodeClientReady();

      const hash = hashTypedData(typedData);

      const toSign = toBytes(hash);

      const signature = await pkpBase.runSign(toSign);

      return formatSignature(signature);
    },
  });
}
