// src/lib/policyCore/commit.ts

import { z } from 'zod';
import { VincentToolPolicy, PolicyResponse } from '../types';
import {
  getSchemaForPolicyResponseResult,
  validateOrDeny,
  isPolicyDenyResponse,
  createDenyResult,
} from './helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Executes the `commit` lifecycle method on a VincentToolPolicy, validating both
 * the input parameters and the output result using Zod.
 */
export async function commit<
  CommitParamsSchema extends z.ZodType<any, any, any> | undefined = VincentToolPolicy<
    any,
    any
  >['policyDef']['commitParamsSchema'],
  CommitAllowResult extends z.ZodType<any, any, any> | undefined = VincentToolPolicy<
    any,
    any
  >['policyDef']['commitAllowResultSchema'],
  CommitDenyResult extends z.ZodType<any, any, any> | undefined = VincentToolPolicy<
    any,
    any
  >['policyDef']['commitDenyResultSchema'],
>(
  policy: VincentToolPolicy<any, any>,
  args: {
    commitParams: unknown;
    delegation: { delegatee: string; delegator: string };
  },
): Promise<PolicyResponse<CommitAllowResult, CommitDenyResult>> {
  const { policyDef } = policy;
  const { commit } = policyDef;
  const ipfsCid = policyDef.ipfsCid;

  if (!commit) {
    return createDenyResult({
      ipfsCid,
      message: 'This policy does not define a commit() method.',
    });
  }

  const parsedParams = validateOrDeny(
    args.commitParams,
    policyDef.commitParamsSchema,
    ipfsCid,
    'commit',
    'input',
  );

  if (isPolicyDenyResponse(parsedParams)) {
    return parsedParams as PolicyResponse<CommitAllowResult, CommitDenyResult>;
  }

  try {
    const result = await commit(parsedParams, { delegation: args.delegation });

    const { schemaToUse } = getSchemaForPolicyResponseResult({
      value: result,
      allowResultSchema: policyDef.commitAllowResultSchema,
      denyResultSchema: policyDef.commitDenyResultSchema,
    });

    const parsedResult = validateOrDeny(result, schemaToUse, ipfsCid, 'commit', 'output');

    if (isPolicyDenyResponse(parsedResult)) {
      return parsedResult as PolicyResponse<CommitAllowResult, CommitDenyResult>;
    }

    return {
      ipfsCid,
      allow: result.allow,
      result: parsedResult as CommitAllowResult,
    };
  } catch (err) {
    return createDenyResult({
      ipfsCid,
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
