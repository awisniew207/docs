import { ethers } from "ethers";
import { z } from "zod";

import type { VincentPolicy } from "../types";
import type { BaseContext } from "../vincentPolicy";
import { formatZodErrorString, getOnChainParamsForPolicy } from "./utils";
import { LIT_DATIL_VINCENT_ADDRESS } from "./constants";

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

export const vincentPolicyHandler = ({ vincentPolicy, context }: { vincentPolicy: VincentPolicy, context: BaseContext }) => {
    return async () => {
        const policyIpfsCid = LitAuth.actionIpfsIds[0];

        try {
            const parsedToolParams = parsePolicyToolParams({ toolParams, toolParamsSchema: vincentPolicy.toolParamsSchema });

            const onChainPolicyParams = await getOnChainParamsForPolicy({
                yellowstoneRpcUrl: await Lit.Actions.getRpcUrl({
                    chain: 'yellowstone',
                }),
                vincentContractAddress: LIT_DATIL_VINCENT_ADDRESS,
                appDelegateeAddress: ethers.utils.getAddress(LitAuth.authSigAddress),
                agentWalletPkpTokenId: parsedToolParams.userPkpTokenId,
                toolIpfsCid: parsedToolParams.toolIpfsCid,
                policyIpfsCid,
                policyUserParamsSchema: vincentPolicy.userParamsSchema,
            });

            const evaluateResult = await vincentPolicy.evaluate(
                { toolParams: parsedToolParams, userParams: onChainPolicyParams },
                // TODO
                // @ts-expect-error Argument of type 'BaseContext' is not assignable to parameter of type 'PolicyContext<any, any>'.
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

const parseEvaluateResult = ({
    evaluateResult,
    evalAllowResultSchema,
    evalDenyResultSchema
}: {
    evaluateResult: z.infer<VincentPolicy['evalAllowResultSchema']> | z.infer<VincentPolicy['evalDenyResultSchema']>,
    evalAllowResultSchema: z.ZodType<any, any, any>,
    evalDenyResultSchema: z.ZodType<any, any, any>
}) => {
    const schema = evaluateResult.allow ? evalAllowResultSchema : evalDenyResultSchema;
    if (!schema) return;

    try {
        schema.parse(evaluateResult);
    } catch (error) {
        const errorMessage = error instanceof z.ZodError ? formatZodErrorString(error) : error instanceof Error ? error.message : String(error);
        throw new Error(`Error parsing evaluateResult using Zod ${evaluateResult.allow ? 'evalAllowResultSchema' : 'evalDenyResultSchema'} (vincentPolicyHandler): ${errorMessage}`);
    }
}
