import { ethers } from "ethers";
import { z } from "zod";

import { formatZodErrorString, getOnChainPolicyParams } from "./utils";
import { LIT_DATIL_VINCENT_ADDRESS } from "./constants";
import { VincentPolicy } from "../types";
import { createPolicyContext } from "../vincentPolicy";

declare const Lit: {
    Actions: {
        getRpcUrl: (args: { chain: string }) => Promise<string>;
        setResponse: (response: { response: string }) => void;
    }
}
declare const LitAuth: {
    authSigAddress: string;
    actionIpfsIds: string[];
}
declare const toolParams: z.infer<VincentPolicy['toolParamsSchema']>

export const vincentPolicyHandler = ({ vincentPolicy }: { vincentPolicy: VincentPolicy }) => {
    return async () => {
        const policyIpfsCid = LitAuth.actionIpfsIds[0];

        try {
            const parsedToolParams = parsePolicyToolParams({ toolParams, toolParamsSchema: vincentPolicy.toolParamsSchema });

            const context = createPolicyContext({
                ipfsCid: policyIpfsCid,
                baseContext: {
                    delegation: {
                        delegatee: ethers.utils.getAddress(LitAuth.authSigAddress),
                        // TODO Should this be the address, or maybe even pkpInfo object?
                        delegator: parsedToolParams.userPkpTokenId,
                    }
                },
                allowSchema: vincentPolicy.evalAllowResultSchema,
                denySchema: vincentPolicy.evalDenyResultSchema,
            });

            const onChainPolicyParams = await getOnChainPolicyParams({
                yellowstoneRpcUrl: await Lit.Actions.getRpcUrl({
                    chain: 'yellowstone',
                }),
                vincentContractAddress: LIT_DATIL_VINCENT_ADDRESS,
                toolIpfsCid: parsedToolParams.toolIpfsCid,
                policyUserParamsSchema: vincentPolicy.userParamsSchema,
            }, context);

            const evaluateResult = await vincentPolicy.evaluate(
                { toolParams: parsedToolParams, userParams: onChainPolicyParams },
                context
            );

            parseEvaluateResult({
                evaluateResult,
                evalAllowResultSchema: vincentPolicy.evalAllowResultSchema,
                evalDenyResultSchema: vincentPolicy.evalDenyResultSchema
            });

            Lit.Actions.setResponse({
                response: JSON.stringify({
                    ...evaluateResult,
                    ipfsCid: policyIpfsCid,
                })
            });
        } catch (error) {
            Lit.Actions.setResponse({
                response: JSON.stringify({
                    allow: false,
                    ipfsCid: policyIpfsCid,
                    error: error instanceof Error ? error.message : String(error),
                })
            });
        }
    }
}

const parsePolicyToolParams = ({ toolParams, toolParamsSchema }: { toolParams: z.infer<VincentPolicy['toolParamsSchema']>, toolParamsSchema: z.ZodType<any, any, any> }) => {
    try {
        return toolParamsSchema.parse(toolParams);
    } catch (error) {
        const errorMessage = error instanceof z.ZodError ? formatZodErrorString(error) : error instanceof Error ? error.message : String(error);
        throw new Error(`Error parsing toolParams using Zod toolParamsSchema (parsePolicyToolParams): ${errorMessage}`);
    }
}

const parseEvaluateResult = (
    { evaluateResult, evalAllowResultSchema, evalDenyResultSchema }:
        {
            evaluateResult: z.infer<VincentPolicy['evalAllowResultSchema']> | z.infer<VincentPolicy['evalDenyResultSchema']>,
            evalAllowResultSchema: z.ZodType<any, any, any>,
            evalDenyResultSchema: z.ZodType<any, any, any>
        }
) => {
    if (evaluateResult.allow && evalAllowResultSchema) {
        try {
            evalAllowResultSchema.parse(evaluateResult);
        } catch (error) {
            const errorMessage = error instanceof z.ZodError ? formatZodErrorString(error) : error instanceof Error ? error.message : String(error);
            throw new Error(`Error parsing evaluateResult using Zod evalAllowResultSchema (vincentPolicyHandler): ${errorMessage}`);
        }
    }

    if (!evaluateResult.allow && evalDenyResultSchema) {
        try {
            evalDenyResultSchema.parse(evaluateResult);
        } catch (error) {
            const errorMessage = error instanceof z.ZodError ? formatZodErrorString(error) : error instanceof Error ? error.message : String(error);
            throw new Error(`Error parsing evaluateResult using Zod evalDenyResultSchema (vincentPolicyHandler): ${errorMessage}`);
        }
    }
}
