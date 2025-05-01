import z from 'zod';
import {
  PolicyContext,
  PolicyResponseAllow,
  PolicyResponseAllowNoResult,
  PolicyResponseDeny,
  PolicyResponseDenyNoResult,
} from './types';

function createPolicyContext<
  AllowSchema extends z.ZodType | undefined = undefined,
  DenySchema extends z.ZodType | undefined = undefined,
>(
  ipfsCid: string,
  allowSchema?: AllowSchema,
  denySchema?: DenySchema,
): PolicyContext<AllowSchema, DenySchema> {
  const details: string[] = [];

  // We need to use type assertion here to handle the function overloads
  const context = {
    ipfsCid,
    details,

    // Updated implementation to handle either string or string[]
    addDetails(detail: string | string[]) {
      if (Array.isArray(detail)) {
        details.push(...detail);
      } else {
        details.push(detail);
      }
    },

    // Rest of the implementation remains the same
    allow(result?: any) {
      // Runtime type checking
      if (allowSchema && result === undefined) {
        throw new Error(
          'Must provide result when allowResponseSchema is defined',
        );
      }

      if (!allowSchema && result !== undefined) {
        throw new Error(
          'Cannot provide result when no allowResponseSchema is defined',
        );
      }

      if (result === undefined) {
        return {
          ipfsCid,
          allow: true,
          details: [...details],
        } as PolicyResponseAllowNoResult;
      }

      return {
        ipfsCid,
        allow: true,
        details: [...details],
        result,
      } as PolicyResponseAllow<any>;
    },

    deny(resultOrError?: any, error?: string) {
      // Special case: if resultOrError is a string and no error is provided,
      // treat resultOrError as the error message
      if (typeof resultOrError === 'string' && error === undefined) {
        return {
          ipfsCid,
          allow: false,
          details: [...details],
          error: resultOrError,
        } as PolicyResponseDenyNoResult;
      }

      // Runtime validation for when denySchema exists
      if (
        denySchema &&
        resultOrError === undefined &&
        typeof resultOrError !== 'string'
      ) {
        throw new Error(
          'Must provide result when denyResponseSchema is defined',
        );
      }

      // Runtime validation for when no denySchema exists
      if (
        !denySchema &&
        resultOrError !== undefined &&
        typeof resultOrError !== 'string'
      ) {
        throw new Error(
          'Cannot provide result when no denyResponseSchema is defined',
        );
      }

      // Case with result and possibly error
      if (typeof resultOrError !== 'string' && resultOrError !== undefined) {
        return {
          ipfsCid,
          allow: false,
          details: [...details],
          result: resultOrError,
          ...(error ? { error } : {}),
        } as PolicyResponseDeny<any>;
      }

      // Default error-only case
      return {
        ipfsCid,
        allow: false,
        details: [...details],
        error: resultOrError,
      } as PolicyResponseDenyNoResult;
    },
  };

  return context as PolicyContext<AllowSchema, DenySchema>;
}

// vincentPolicy.ts - Update validateVincentPolicyDef function
export function validateVincentPolicyDef<
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
>(config: {
  toolParamsSchema: ToolParamsSchema;
  policyDef: {
    ipfsCid: string;
    toolParamsSchema: PolicyToolParams;
    userParamsSchema?: UserParams;
    evalAllowResultSchema?: EvalAllowResult;
    evalDenyResultSchema?: EvalDenyResult;
    precheckAllowResultSchema?: PrecheckAllowResult;
    precheckDenyResultSchema?: PrecheckDenyResult;
    commitParamsSchema?: CommitParams;
    commitAllowResultSchema?: CommitAllowResult;
    commitDenyResultSchema?: CommitDenyResult;

    evaluate: (
      args: {
        toolParams: z.infer<PolicyToolParams>;
        userParams: UserParams extends z.ZodType
          ? z.infer<UserParams>
          : undefined;
      },
      context: PolicyContext<EvalAllowResult, EvalDenyResult>,
    ) => Promise<
      | (EvalAllowResult extends z.ZodType
          ? PolicyResponseAllow<z.infer<EvalAllowResult>>
          : PolicyResponseAllowNoResult)
      | (EvalDenyResult extends z.ZodType
          ? PolicyResponseDeny<z.infer<EvalDenyResult>>
          : PolicyResponseDenyNoResult)
    >;

    precheck?: (
      args: {
        toolParams: z.infer<PolicyToolParams>;
        userParams: UserParams extends z.ZodType
          ? z.infer<UserParams>
          : undefined;
      },
      context: PolicyContext<PrecheckAllowResult, PrecheckDenyResult>,
    ) => Promise<
      | (PrecheckAllowResult extends z.ZodType
          ? PolicyResponseAllow<z.infer<PrecheckAllowResult>>
          : PolicyResponseAllowNoResult)
      | (PrecheckDenyResult extends z.ZodType
          ? PolicyResponseDeny<z.infer<PrecheckDenyResult>>
          : PolicyResponseDenyNoResult)
    >;

    commit?: CommitParams extends z.ZodType
      ? (
          args: z.infer<CommitParams>,
          context: PolicyContext<CommitAllowResult, CommitDenyResult>,
        ) => Promise<
          | (CommitAllowResult extends z.ZodType
              ? PolicyResponseAllow<z.infer<CommitAllowResult>>
              : PolicyResponseAllowNoResult)
          | (CommitDenyResult extends z.ZodType
              ? PolicyResponseDeny<z.infer<CommitDenyResult>>
              : PolicyResponseDenyNoResult)
        >
      : undefined;
  };
  toolParameterMappings: Partial<{
    [K in keyof z.infer<ToolParamsSchema>]: keyof z.infer<PolicyToolParams>;
  }>;
}) {
  if (config.policyDef.commitParamsSchema && !config.policyDef.commit) {
    throw new Error(
      'Policy defines commitParamsSchema but is missing commit function',
    );
  }

  const originalPolicyDef = config.policyDef;

  // Create wrapper functions that inject the context
  const policyDef = {
    ...originalPolicyDef,
    evaluate: async (args: {
      toolParams: z.infer<typeof originalPolicyDef.toolParamsSchema>;
      userParams: UserParams extends z.ZodType
        ? z.infer<UserParams>
        : undefined;
    }) => {
      // Create context for evaluation
      const context = createPolicyContext(
        originalPolicyDef.ipfsCid,
        originalPolicyDef.evalAllowResultSchema,
        originalPolicyDef.evalDenyResultSchema,
      );

      // Call the original evaluate with the context
      return originalPolicyDef.evaluate(args, context);
    },

    // Only create precheck wrapper if precheck exists
    ...(originalPolicyDef.precheck
      ? {
          precheck: async (args: {
            toolParams: z.infer<typeof originalPolicyDef.toolParamsSchema>;
            userParams: UserParams extends z.ZodType
              ? z.infer<UserParams>
              : undefined;
          }) => {
            // Create context for precheck
            const context = createPolicyContext(
              originalPolicyDef.ipfsCid,
              originalPolicyDef.precheckAllowResultSchema,
              originalPolicyDef.precheckDenyResultSchema,
            );

            // Call the original precheck with the context
            return originalPolicyDef.precheck!(args, context);
          },
        }
      : {}),

    // Only create commit wrapper if commit exists
    ...(originalPolicyDef.commit
      ? {
          commit: async (
            args: CommitParams extends z.ZodType ? z.infer<CommitParams> : any,
          ) => {
            // Create context for commit
            const context = createPolicyContext(
              originalPolicyDef.ipfsCid,
              originalPolicyDef.commitAllowResultSchema,
              originalPolicyDef.commitDenyResultSchema,
            );

            // Call the original commit with the context
            return originalPolicyDef.commit!(args, context);
          },
        }
      : {}),
  };

  const result = {
    policyDef: policyDef,
    toolParameterMappings: config.toolParameterMappings,
  };

  // Use the same type assertion as before to maintain type inference
  return result as {
    policyDef: typeof policyDef &
      (CommitParams extends z.ZodType
        ? {
            commit: NonNullable<(typeof policyDef)['commit']>;
          }
        : {});
    toolParameterMappings: typeof config.toolParameterMappings;
  };
}
