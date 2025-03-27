import { ethers } from "ethers";

export const broadcastTx = async (provider: ethers.providers.JsonRpcProvider, signedTx: string) => {
  return Lit.Actions.runOnce(
    { waitForResponse: true, name: 'txnSender' },
    async () => {
      const txHash = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'txnSender' },
        async () => {
          const receipt = await provider.sendTransaction(signedTx);
          return receipt.hash;
        }
      );

      if (!ethers.utils.isHexString(txHash)) {
        throw new Error(`Invalid transaction hash: ${txHash}`);
      }

      return txHash;
    }
  );
};
