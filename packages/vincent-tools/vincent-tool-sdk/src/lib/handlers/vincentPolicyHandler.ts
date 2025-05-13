// src/lib/handlers/vincentPolicyHandler.ts

import { ethers } from 'ethers';

import {
  CommitFunction,
  InferOrUndefined,
  PolicyLifecycleFunction,
  VincentPolicyDef,
} from '../types';
import { getOnchainPolicyParams } from '../policyCore/policyParameters/getOnchainPolicyParams';
import { LIT_DATIL_VINCENT_ADDRESS } from './constants';
import { createDenyResult } from '../policyCore/helpers';
import { createVincentPolicy } from '../policyCore';
import { z } from 'zod';

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

export async function vincentPolicyHandler<
  PackageName extends string,
  ToolParamsSchema extends z.ZodType,
  PolicyToolParams extends z.ZodType,
  UserParams extends z.ZodType | undefined = undefined,
  PrecheckAllowResult extends z.ZodType | undefined = undefined,
  PrecheckDenyResult extends z.ZodType | undefined = undefined,
  EvalAllowResult extends z.ZodType | undefined = undefined,
  EvalDenyResult extends z.ZodType | undefined = undefined,
  CommitParams extends z.ZodType | undefined = undefined,
  CommitAllowResult extends z.ZodType | undefined = undefined,
  CommitDenyResult extends z.ZodType | undefined = undefined,
>({
  vincentPolicyDef,
  context,
  toolParams,
}: {
  vincentPolicyDef: VincentPolicyDef<
    PackageName,
    PolicyToolParams,
    UserParams,
    PrecheckAllowResult,
    PrecheckDenyResult,
    EvalAllowResult,
    EvalDenyResult,
    CommitParams,
    CommitAllowResult,
    CommitDenyResult,
    PolicyLifecycleFunction<PolicyToolParams, UserParams, EvalAllowResult, EvalDenyResult>,
    PolicyLifecycleFunction<PolicyToolParams, UserParams, PrecheckAllowResult, PrecheckDenyResult>,
    CommitFunction<CommitParams, CommitAllowResult, CommitDenyResult>
  >;
  toolParams: ToolParamsSchema;
  context: {
    userPkpTokenId: string;
    toolIpfsCid: string;
    rpcUrl: string;
  };
}) {
  const { userPkpTokenId, toolIpfsCid } = context;
  const policyIpfsCid = LitAuth.actionIpfsIds[0];

  try {
    const delegationRpcUrl = await Lit.Actions.getRpcUrl({
      chain: 'yellowstone',
    });

    const onChainPolicyParams = await getOnchainPolicyParams({
      delegationRpcUrl,
      vincentContractAddress: LIT_DATIL_VINCENT_ADDRESS,
      appDelegateeAddress: ethers.utils.getAddress(LitAuth.authSigAddress),
      agentWalletPkpTokenId: userPkpTokenId,
      toolIpfsCid: toolIpfsCid,
      policyIpfsCid,
    });

    const vincentPolicy = createVincentPolicy(vincentPolicyDef);
    const evaluateResult = await vincentPolicy.evaluate(
      {
        toolParams,
        userParams: onChainPolicyParams as InferOrUndefined<UserParams>,
      },
      {
        delegation: {
          delegatee: ethers.utils.getAddress(LitAuth.authSigAddress),
          delegator: userPkpTokenId,
        },
      },
    );

    Lit.Actions.setResponse({
      response: JSON.stringify({
        ...evaluateResult,
        ipfsCid: policyIpfsCid,
      }),
    });
  } catch (error) {
    Lit.Actions.setResponse({
      response: JSON.stringify(
        createDenyResult({
          ipfsCid: policyIpfsCid,
          message: error instanceof Error ? error.message : String(error),
        }),
      ),
    });
  }
}
