// src/lib/handlers/vincentPolicyHandler.ts

import { ethers } from 'ethers';

import { BaseContext, InferOrUndefined, VincentPolicy } from '../types';
import { getOnePolicysOnChainParams } from '../policyCore/policyParameters/getOnchainPolicyParams';
import { LIT_DATIL_PUBKEY_ROUTER_ADDRESS, LIT_DATIL_VINCENT_ADDRESS } from './constants';
import { createDenyResult } from '../policyCore/helpers';
import { z } from 'zod';
import { getPkpInfo } from '../toolCore/helpers';

declare const Lit: {
  Actions: {
    getRpcUrl: (args: { chain: string }) => Promise<string>;
    setResponse: (response: { response: string }) => void;
  };
};
declare const LitAuth: {
  authSigAddress: string;
  actionIpfsIds: string[];
};

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function vincentPolicyHandler<
  PackageName extends string,
  PolicyToolParams extends z.ZodType,
  UserParams extends z.ZodType | undefined = undefined,
  EvalAllowResult extends z.ZodType | undefined = undefined,
  EvalDenyResult extends z.ZodType | undefined = undefined,
>({
  vincentPolicy,
  context,
  toolParams,
}: {
  vincentPolicy: VincentPolicy<
    PackageName,
    PolicyToolParams,
    UserParams,
    any, // PrecheckAllowResult
    any, // PrecheckDenyResult
    EvalAllowResult,
    EvalDenyResult,
    any, // CommitParams
    any, // CommitAllowResult
    any // CommitDenyResult
  >;
  toolParams: unknown;
  context: BaseContext;
}) {
  const {
    delegation: { delegator },
    appVersion,
    appId,
  } = context;

  console.log('actionIpfsIds:', LitAuth.actionIpfsIds.join(','));
  const policyIpfsCid = LitAuth.actionIpfsIds[0];
  const toolIpfsCid = context.toolIpfsCid; // FIXME: Use ipfsCidsStack when it's shipped

  console.log('context:', JSON.stringify(context));
  try {
    const delegationRpcUrl = await Lit.Actions.getRpcUrl({
      chain: 'yellowstone',
    });

    const { tokenId } = await getPkpInfo({
      litPubkeyRouterAddress: LIT_DATIL_PUBKEY_ROUTER_ADDRESS,
      yellowstoneRpcUrl: 'https://yellowstone-rpc.litprotocol.com/',
      pkpEthAddress: delegator,
    });
    console.log('tokenId:', tokenId);

    console.log('LitAuth.authSigAddress', LitAuth.authSigAddress);
    console.log(ethers.utils.getAddress(LitAuth.authSigAddress));

    const onChainPolicyParams = await getOnePolicysOnChainParams({
      delegationRpcUrl,
      vincentContractAddress: LIT_DATIL_VINCENT_ADDRESS,
      appDelegateeAddress: ethers.utils.getAddress(LitAuth.authSigAddress),
      agentWalletPkpTokenId: tokenId,
      toolIpfsCid,
      policyIpfsCid,
    });

    console.log('onChainPolicyParams:', JSON.stringify(onChainPolicyParams));
    const evaluateResult = await vincentPolicy.evaluate(
      {
        toolParams,
        userParams: onChainPolicyParams as InferOrUndefined<UserParams>,
      },
      {
        delegation: {
          delegatee: ethers.utils.getAddress(LitAuth.authSigAddress),
          delegator,
        },
        toolIpfsCid,
        appVersion,
        appId,
      },
    );

    console.log('evaluateResult:', JSON.stringify(evaluateResult));
    Lit.Actions.setResponse({
      response: JSON.stringify({
        ...evaluateResult,
      }),
    });
  } catch (error) {
    console.log('Policy evaluation failed:', (error as Error).message, (error as Error).stack);
    Lit.Actions.setResponse({
      response: JSON.stringify(
        createDenyResult({
          message: error instanceof Error ? error.message : String(error),
        }),
      ),
    });
  }
}
