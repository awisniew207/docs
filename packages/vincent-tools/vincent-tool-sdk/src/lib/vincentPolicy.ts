import z from 'zod';
import {
  PolicyContext,
  PolicyResponseAllow,
  PolicyResponseAllowNoResult,
  PolicyResponseDeny,
  PolicyResponseDenyNoResult,
} from './types';

// Simplified implementation that works correctly with the tests
function createPolicyContext<
  AllowSchema extends z.ZodType | undefined = undefined,
  DenySchema extends z.ZodType | undefined = undefined,
>(
  ipfsCid: string,
  allowSchema?: AllowSchema,
  denySchema?: DenySchema,
): PolicyContext<AllowSchema, DenySchema> {
  const details: string[] = [];

  // Create object with the correct function implementations
  const context: Record<string, any> = {
    ipfsCid,
    details,
    addDetails(detail: string | string[]) {
      if (Array.isArray(detail)) {
        details.push(...detail);
      } else {
        details.push(detail);
      }
    },
  };

  // Implementation for allow() - determine based on schema presence
  if (allowSchema) {
    context.allow = function <T>(result: T) {
      return {
        ipfsCid,
        allow: true,
        details: [...details],
        result,
      };
    };
  } else {
    context.allow = function () {
      return {
        ipfsCid,
        allow: true,
        details: [...details],
      };
    };
  }

  // Implementation for deny() - determine based on schema presence
  if (denySchema) {
    if (denySchema instanceof z.ZodString) {
      // Special case for string schema
      context.deny = function (resultOrError: string, errorMsg?: string) {
        if (errorMsg === undefined) {
          return {
            ipfsCid,
            allow: false,
            details: [...details],
            result: resultOrError,
          };
        }
        return {
          ipfsCid,
          allow: false,
          details: [...details],
          result: resultOrError,
          error: errorMsg,
        };
      };
    } else {
      context.deny = function <T>(result: T, error?: string) {
        return {
          ipfsCid,
          allow: false,
          details: [...details],
          result,
          ...(error ? { error } : {}),
        };
      };
    }
  } else {
    context.deny = function (error?: string) {
      return {
        ipfsCid,
        allow: false,
        details: [...details],
        ...(error ? { error } : {}),
      };
    };
  }

  // To fix the issue with TypeScript not detecting errors when calling functions
  // without required arguments, we need to use a cast that forces TypeScript
  // to use the exact interface definition and its constraints.
  //
  // Instead of returning the implementation directly, we cast to the interface
  // which has the correct function overloads with their parameter requirements.
  return context as PolicyContext<AllowSchema, DenySchema>;
}

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
