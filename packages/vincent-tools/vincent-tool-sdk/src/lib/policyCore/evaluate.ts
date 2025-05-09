// src/lib/policyCore/evaluate.ts

import { z } from 'zod';
import { PolicyResponse, VincentToolPolicy } from '../types';
import {
  createDenyResult,
  isPolicyDenyResponse,
  getValidatedParamsOrDeny,
  validateOrDeny,
  getSchemaForPolicyResponseResult,
} from './helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Executes the `evaluate` method on a wrapped VincentToolPolicy, with runtime validation
 * on input and output using the Zod schemas defined by the policy.
 */
export async function evaluate<
  ToolParamsSchema extends VincentToolPolicy<any, any>['policyDef']['toolParamsSchema'],
  UserParamsSchema extends VincentToolPolicy<
    any,
    any
  >['policyDef']['userParamsSchema'] = VincentToolPolicy<any, any>['policyDef']['userParamsSchema'],
  EvalAllowResult extends z.ZodType<any, any, any> | undefined = VincentToolPolicy<
    any,
    any
  >['policyDef']['evalAllowResultSchema'],
  EvalDenyResult extends z.ZodType<any, any, any> | undefined = VincentToolPolicy<
    any,
    any
  >['policyDef']['evalDenyResultSchema'],
>(
  policy: VincentToolPolicy<any, any>,
  args: {
    toolParams: unknown;
    userParams: unknown;
    delegation: { delegatee: string; delegator: string };
  },
): Promise<PolicyResponse<EvalAllowResult, EvalDenyResult>> {
  const { policyDef } = policy;
  const { toolParams, userParams, delegation } = args;
  const { ipfsCid } = policyDef;
  try {
    const validated = getValidatedParamsOrDeny({
      policy,
      rawToolParams: toolParams,
      rawUserParams: userParams,
      ipfsCid,
      phase: 'evaluate',
    });

    if (isPolicyDenyResponse(validated)) {
      return validated as PolicyResponse<EvalAllowResult, EvalDenyResult>;
    }

    const result = await policyDef.evaluate(
      {
        toolParams: validated.toolParams,
        userParams: validated.userParams,
      },
      { delegation },
    );

    const { schemaToUse } = getSchemaForPolicyResponseResult({
      value: result,
      allowResultSchema: policyDef.evalAllowResultSchema,
      denyResultSchema: policyDef.evalDenyResultSchema,
    });

    const parsedResult = validateOrDeny(result, schemaToUse, ipfsCid, 'evaluate', 'output');

    if (isPolicyDenyResponse(parsedResult)) {
      return parsedResult as PolicyResponse<EvalAllowResult, EvalDenyResult>;
    }

    return {
      ipfsCid,
      allow: result.allow,
      result: parsedResult as EvalAllowResult,
    };
  } catch (err) {
    return createDenyResult({
      ipfsCid,
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
