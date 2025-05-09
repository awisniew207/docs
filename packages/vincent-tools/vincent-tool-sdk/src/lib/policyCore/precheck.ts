// src/lib/policyCore/precheck.ts

import { z } from 'zod';
import { PolicyResponse, VincentToolPolicy } from '../types';
import { createDenyResult } from './helpers';
import { isPolicyDenyResponse } from './helpers';
import { getValidatedParamsOrDeny, validateOrDeny } from './helpers';
import { getSchemaForPolicyResponseResult } from './helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Executes the `precheck` method on a wrapped VincentToolPolicy, with runtime validation
 * on input and output using the Zod schemas defined by the policy.
 */
export async function precheck<
  ToolParamsSchema extends VincentToolPolicy<any, any>['policyDef']['toolParamsSchema'],
  UserParamsSchema extends VincentToolPolicy<
    any,
    any
  >['policyDef']['userParamsSchema'] = VincentToolPolicy<any, any>['policyDef']['userParamsSchema'],
  PrecheckAllowResult extends z.ZodType<any, any, any> | undefined = VincentToolPolicy<
    any,
    any
  >['policyDef']['precheckAllowResultSchema'],
  PrecheckDenyResult extends z.ZodType<any, any, any> | undefined = VincentToolPolicy<
    any,
    any
  >['policyDef']['precheckDenyResultSchema'],
>(
  policy: VincentToolPolicy<any, any>,
  args: {
    toolParams: unknown;
    userParams: unknown;
    delegation: { delegatee: string; delegator: string };
  },
): Promise<PolicyResponse<PrecheckAllowResult, PrecheckDenyResult>> {
  const { policyDef } = policy;
  const { toolParams, userParams, delegation } = args;
  const { ipfsCid } = policyDef;
  try {
    const validated = getValidatedParamsOrDeny({
      policy,
      rawToolParams: toolParams,
      rawUserParams: userParams,
      ipfsCid,
      phase: 'precheck',
    });

    if (isPolicyDenyResponse(validated)) {
      return validated as PolicyResponse<PrecheckAllowResult, PrecheckDenyResult>;
    }

    const result = await policyDef.precheck(
      {
        toolParams: validated.toolParams,
        userParams: validated.userParams,
      },
      { delegation },
    );

    const { schemaToUse } = getSchemaForPolicyResponseResult({
      value: result,
      allowResultSchema: policyDef.precheckAllowResultSchema,
      denyResultSchema: policyDef.precheckDenyResultSchema,
    });

    const parsedResult = validateOrDeny(result, schemaToUse, ipfsCid, 'precheck', 'output');

    if (isPolicyDenyResponse(parsedResult)) {
      return parsedResult as PolicyResponse<PrecheckAllowResult, PrecheckDenyResult>;
    }

    return {
      ipfsCid,
      allow: result.allow,
      result: parsedResult as PrecheckAllowResult,
    };
  } catch (err) {
    return createDenyResult({
      ipfsCid,
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
