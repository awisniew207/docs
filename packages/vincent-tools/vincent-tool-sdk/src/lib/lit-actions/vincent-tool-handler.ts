import { TypeOf, z } from "zod";
import { ethers } from "ethers";

import type { VincentPolicy, VincentPolicyEvaluationResults, VincentToolDef, WrappedCommitFunction, OnlyAllowedPolicyEvaluationResults } from "../types";
import type { BaseContext } from "../vincentPolicy";
import { getPkpInfo, getPolicyEvalResults, parseToolParams, validatePolicies } from "./utils";
import { LIT_DATIL_PUBKEY_ROUTER_ADDRESS } from "./constants";

declare const LitAuth: {
    authSigAddress: string;
    actionIpfsIds: string[];
}
declare const Lit: {
    Actions: {
        setResponse: (response: { response: string }) => void;
        call: (params: { ipfsId: string, params: Record<string, unknown> }) => Promise<string>;
        getRpcUrl: (args: { chain: string }) => Promise<string>;
    }
}
declare const toolParams: z.infer<VincentToolDef<any, any>['toolParamsSchema']>;

export const vincentToolHandler = <
    ToolParams extends z.ZodType<any, any, any>,
    Policies extends Record<string, { policyDef: VincentPolicy; toolParameterMappings: Partial<{ [K in keyof TypeOf<ToolParams>]: string; }> }>,
>({ vincentToolDef, context }: { vincentToolDef: VincentToolDef<ToolParams, Policies>, context: BaseContext }) => {
    return async () => {
        const toolIpfsCid = LitAuth.actionIpfsIds[0];
        const evaluatedPolicies: Array<keyof Policies> = [];
        const allowPolicyResults: VincentPolicyEvaluationResults<Policies>["allowPolicyResults"] = {};

        let denyPolicyResult: VincentPolicyEvaluationResults<Policies>["denyPolicyResult"] = undefined;

        const parsePolicyExecutionResult = (
            {
                rawLitActionResponse,
                policyPackageName,
                policy,
            }: {
                rawLitActionResponse: string,
                policyPackageName: keyof Policies,
                policy: Policies[keyof Policies]
            }
        ) => {
            const parsedLitActionResponse = JSON.parse(rawLitActionResponse);

            evaluatedPolicies.push(policyPackageName);

            const policyExecutionResult = parsedLitActionResponse.allow
                ? policy.policyDef.evalAllowResultSchema?.parse(parsedLitActionResponse) ?? parsedLitActionResponse
                : policy.policyDef.evalDenyResultSchema?.parse(parsedLitActionResponse) ?? parsedLitActionResponse;

            if (parsedLitActionResponse.allow) {
                // TODO
                // @ts-expect-error Resolve TypeScript error for allowPolicyResults type mismatch
                allowPolicyResults[policyPackageName as keyof Policies] = {
                    result: policyExecutionResult,
                    ...(typeof policy.policyDef === "object" && "commit" in policy.policyDef && typeof policy.policyDef.commit === "function"
                        ? { commit: policy.policyDef.commit.bind(policy.policyDef) }
                        : undefined),
                };
            } else {
                denyPolicyResult = { result: policyExecutionResult, ipfsCid: policy.policyDef.ipfsCid };
                throw new Error("A policy denied execution");
            }
        }

        const executePolicies = async (parsedToolParams: TypeOf<ToolParams>) => {
            const validatedPolicies = await validatePolicies({
                yellowstoneRpcUrl: await Lit.Actions.getRpcUrl({ chain: 'yellowstone' }),
                appDelegateeAddress: ethers.utils.getAddress(LitAuth.authSigAddress),
                toolSupportedPolicies: vincentToolDef.supportedPolicies,
                parsedToolParams,
                toolIpfsCid,
                pkpTokenId: parsedToolParams.userPkpTokenId
            });

            for (const { policyPackageName, policyParams } of validatedPolicies) {
                const policy = vincentToolDef.supportedPolicies[policyPackageName];

                const userPkpInfo = await getPkpInfo({
                    litPubkeyRouterAddress: LIT_DATIL_PUBKEY_ROUTER_ADDRESS,
                    yellowstoneRpcUrl: await Lit.Actions.getRpcUrl({ chain: 'yellowstone' }),
                    pkpEthAddress: parsedToolParams.pkpEthAddress
                });

                const rawLitActionResponse = await Lit.Actions.call({
                    ipfsId: policy.policyDef.ipfsCid,
                    params: {
                        toolParams: {
                            ...policyParams,
                            toolIpfsCid,
                            userPkpTokenId: userPkpInfo.tokenId,
                        }
                    }
                });

                try {
                    parsePolicyExecutionResult({
                        rawLitActionResponse,
                        policyPackageName,
                        policy,
                    });
                } catch (error) {
                    if (error instanceof Error && error.message === "A policy denied execution") {
                        break;
                    } else {
                        throw error;
                    }
                }
            }
        }

        const executeTool = async (
            {
                policyEvaluationResults,
                parsedToolParams,
            }: {
                policyEvaluationResults: VincentPolicyEvaluationResults<Policies> | OnlyAllowedPolicyEvaluationResults<Policies>,
                parsedToolParams: TypeOf<ToolParams>,
            }
        ) => {
            if (!policyEvaluationResults.allow) {
                return { success: false, reason: "A policy denied execution" };
            }

            return vincentToolDef.execute(
                parsedToolParams,
                policyEvaluationResults as OnlyAllowedPolicyEvaluationResults<Policies>,
                // TODO
                // @ts-expect-error Argument of type 'BaseContext' is not assignable to parameter of type 'ToolContext<undefined, undefined, any>'.
                context
            );
        }

        const executePolicyCommitFunctions = async (
            {
                policyEvaluationResults,
            }: {
                policyEvaluationResults: VincentPolicyEvaluationResults<Policies> | OnlyAllowedPolicyEvaluationResults<Policies>,
            }
        ) => {
            if (!policyEvaluationResults.allow) return;

            for (const allowPolicyResult of Object.values(allowPolicyResults)) {
                if (allowPolicyResult?.commit) {
                    // TODO The result of these commit functions should be returned
                    await (allowPolicyResult.commit as WrappedCommitFunction<any, any>)(allowPolicyResult.result);
                }
            }
        }

        try {
            const parsedToolParams = parseToolParams({ toolParams, toolParamsSchema: vincentToolDef.toolParamsSchema });

            await executePolicies(parsedToolParams);

            const policyEvaluationResults = getPolicyEvalResults({
                denyPolicyResult,
                evaluatedPolicies,
                allowPolicyResults,
            });

            const toolExecutionResult = await executeTool({ policyEvaluationResults, parsedToolParams });

            await executePolicyCommitFunctions({ policyEvaluationResults });

            Lit.Actions.setResponse({
                response: JSON.stringify({
                    policyEvaluationResults,
                    toolExecutionResult,
                }),
            });
        } catch (error) {
            Lit.Actions.setResponse({
                response: JSON.stringify({
                    policyEvaluationResults: getPolicyEvalResults({
                        denyPolicyResult,
                        evaluatedPolicies,
                        allowPolicyResults,
                    }),
                    toolExecutionResult: {
                        success: false,
                        error: error instanceof Error ? error.message : String(error),
                    },
                }),
            });
        }
    }
}
