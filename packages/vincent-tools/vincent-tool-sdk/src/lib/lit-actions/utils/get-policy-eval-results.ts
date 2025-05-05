import { TypeOf, z } from "zod";

import { OnlyAllowedPolicyEvaluationResults, VincentPolicy, VincentPolicyEvaluationResults } from "../../types";

export const getPolicyEvalResults = <
    ToolParams extends z.ZodType<any, any, any>,
    Policies extends Record<string, { policyDef: VincentPolicy; toolParameterMappings: Partial<{ [K in keyof TypeOf<ToolParams>]: string; }> }>,
>(
    {
        denyPolicyResult,
        evaluatedPolicies,
        allowPolicyResults,
    }: {
        denyPolicyResult: VincentPolicyEvaluationResults<Policies>["denyPolicyResult"],
        evaluatedPolicies: Array<keyof Policies>,
        allowPolicyResults: VincentPolicyEvaluationResults<Policies>["allowPolicyResults"],
    }
) => {
    return denyPolicyResult
        ? {
            allow: false,
            evaluatedPolicies,
            allowPolicyResults,
            denyPolicyResult,
        } as VincentPolicyEvaluationResults<Policies>
        : {
            allow: true,
            evaluatedPolicies,
            allowPolicyResults,
        } as OnlyAllowedPolicyEvaluationResults<Policies>;
}