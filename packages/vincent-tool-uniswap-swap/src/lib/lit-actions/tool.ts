/* eslint-disable */
import {
  getPkpInfo,
  getVincentContract,
  NETWORK_CONFIG,
} from '@lit-protocol/vincent-tool';

import {
  getUniswapQuoterRouter,
  getTokenInfo,
  getBestQuote,
  createUniswapSwapTx,
  signTx,
  broadcastTransaction,
} from './utils';

declare global {
  // Required Inputs
  const toolParams: {
    pkpEthAddress: string;
    rpcUrl: string;
    chainId: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
  };
}

(async () => {
  try {
    console.log(`Using Lit Network: ${LIT_NETWORK}`);
    console.log(
      `Using Vincent Contract Address: ${VINCENT_ADDRESS}`
    );
    console.log(
      `Using Pubkey Router Address: ${NETWORK_CONFIG[LIT_NETWORK as keyof typeof NETWORK_CONFIG]
        .pubkeyRouterAddress
      }`
    );

    // @ts-ignore
    const { UNISWAP_V3_QUOTER, UNISWAP_V3_ROUTER } = getUniswapQuoterRouter(
      toolParams.chainId
    );

    const delegateeAddress = ethers.utils.getAddress(LitAuth.authSigAddress);
    const toolIpfsCid = LitAuth.actionIpfsIds[0];
    const provider = new ethers.providers.JsonRpcProvider(toolParams.rpcUrl);
    const vincentContract = await getVincentContract(
      VINCENT_ADDRESS
    );
    const pkp = await getPkpInfo(toolParams.pkpEthAddress);
    const tokenInfo = await getTokenInfo(
      provider,
      toolParams.tokenIn,
      toolParams.amountIn,
      toolParams.tokenOut,
      pkp
    );

    console.log(`Checking if Delegatee ${delegateeAddress} has permission to execute tool ${toolIpfsCid} with PKP ${pkp.tokenId}`);
    const vincentToolExecutionObject = await vincentContract.validateToolExecutionAndGetPolicies(
      delegateeAddress,
      pkp.tokenId,
      toolIpfsCid
    );

    console.log(`Tool execution object: ${JSON.stringify(vincentToolExecutionObject)}`);

    if (!vincentToolExecutionObject.isPermitted) {
      throw new Error('Tool execution not permitted');
    }

    if (vincentToolExecutionObject.policies.length === 0) {
      console.log(
        `No policy found for tool ${toolIpfsCid} on PKP ${pkp.tokenId} for delegatee ${delegateeAddress}`
      );
    } else {
      const policies = vincentToolExecutionObject.policies.map((policy: any) => ({
        policyIpfsCid: policy.policyIpfsCid,
        parameters: policy.parameters.map((param: any) => ({
          name: param.name,
          paramType: param.paramType,
          value: param.value
        }))
      }))

      for (const policy of policies) {
        console.log(`Executing Policy: ${policy.policyIpfsCid} with parameters: ${JSON.stringify(policy.parameters, null, 2)}`);

        await Lit.Actions.call({
          ipfsId: policy.policyIpfsCid,
          params: {
            vincentAppId: vincentToolExecutionObject.appId.toString(),
            vincentAppVersion: vincentToolExecutionObject.appVersion.toString(),
            userParams: {
              ...toolParams,
              pkpPubKey: pkp.publicKey,
              amountIn: tokenInfo.tokenIn.amount.toString(),
            },
            policy,
          },
        });
      }
    }

    // Get best quote and calculate minimum output
    const { bestFee, amountOutMin } = await getBestQuote(
      provider,
      toolParams.chainId,
      toolParams.tokenIn,
      toolParams.tokenOut,
      tokenInfo.tokenIn.amount,
      tokenInfo.tokenOut.decimals
    );

    // Approval Transaction
    const approvalTx = await createUniswapSwapTx(
      provider,
      pkp.ethAddress,
      UNISWAP_V3_ROUTER,
      tokenInfo.tokenIn.contract,
      tokenInfo.tokenIn.amount,
      toolParams.chainId,
      true
    );

    console.log('Unsigned approval transaction:', approvalTx);

    const signedApprovalTx = await signTx(
      pkp.publicKey,
      approvalTx,
      'erc20ApprovalSig'
    );
    const approvalHash = await broadcastTransaction(provider, signedApprovalTx);
    console.log('Approval transaction hash:', approvalHash);

    // Wait for approval confirmation
    console.log('Waiting for approval confirmation...');
    const approvalConfirmation = await provider.waitForTransaction(
      approvalHash,
      1
    );
    if (approvalConfirmation.status === 0) {
      throw new Error('Approval transaction failed');
    }

    // Swap Transaction
    const swapTx = await createUniswapSwapTx(
      provider,
      pkp.ethAddress,
      UNISWAP_V3_ROUTER,
      tokenInfo.tokenIn.contract,
      tokenInfo.tokenIn.amount,
      toolParams.chainId,
      false,
      {
        fee: bestFee,
        amountOutMin,
        tokenOut: toolParams.tokenOut
      }
    );

    const signedSwapTx = await signTx(pkp.publicKey, swapTx, 'erc20SwapSig');

    console.log('Swap transaction:', signedSwapTx);

    const swapHash = await broadcastTransaction(provider, signedSwapTx);
    console.log('Swap transaction hash:', swapHash);

    Lit.Actions.setResponse({
      response: JSON.stringify({
        status: 'success',
        approvalHash,
        swapHash,
      }),
    });
  } catch (err: any) {
    console.error('Error:', err);

    // Extract detailed error information
    const errorDetails = {
      message: err.message,
      code: err.code,
      reason: err.reason,
      error: err.error,
      ...(err.transaction && { transaction: err.transaction }),
      ...(err.receipt && { receipt: err.receipt }),
    };

    Lit.Actions.setResponse({
      response: JSON.stringify({
        status: 'error',
        error: err.message || String(err),
        details: errorDetails,
      }),
    });
  }
})();