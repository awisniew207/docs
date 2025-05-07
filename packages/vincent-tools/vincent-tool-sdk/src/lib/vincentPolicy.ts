import { z } from 'zod';
import {
  CommitFunction,
  EvaluateFunction,
  PolicyContext,
  PolicyResponseAllow,
  PolicyResponseAllowNoResult,
  PolicyResponseDeny,
  PolicyResponseDenyNoResult,
  PrecheckFunction,
  VincentPolicyDef,
} from './types';

export interface BaseContext {
  delegation: {
    delegatee: string;
    delegator: string;
  };
}

export interface CreatePolicyContextParams<
  AllowSchema extends z.ZodType | undefined = undefined,
  DenySchema extends z.ZodType | undefined = undefined,
> {
  ipfsCid: string;
  allowSchema?: AllowSchema;
  denySchema?: DenySchema;
  baseContext: BaseContext;
}

/**
 * Branded functions are used to enforce type safety at compile time for allow/deny calls.
 * The __brand property helps TypeScript distinguish between functions that require arguments
 * (when schemas are defined) and those that don't (when schemas are undefined).
 * This prevents runtime errors by catching incorrect usage during development.
 */
export function createPolicyContext<
  AllowSchema extends z.ZodType | undefined = undefined,
  DenySchema extends z.ZodType | undefined = undefined,
>({
  ipfsCid,
  baseContext,
  allowSchema,
  denySchema,
}: CreatePolicyContextParams<AllowSchema, DenySchema>): PolicyContext<
  AllowSchema,
  DenySchema
> {
  // Define type-safe functions without using brands
  // Instead, we'll use function overloads to enforce correct parameter usage
  function allowWithoutSchema(): PolicyResponseAllowNoResult {
    return {
      ipfsCid,
      allow: true,
    };
  }

  function allowWithSchema<T>(result: T): PolicyResponseAllow<T> {
    return {
      ipfsCid,
      allow: true,
      result,
    } as PolicyResponseAllow<T>;
  }

  function denyWithoutSchema(error?: string): PolicyResponseDenyNoResult {
    return {
      ipfsCid,
      allow: false,
      ...(error ? { error } : {}),
    } as PolicyResponseDenyNoResult;
  }

  function denyWithSchema<T>(result: T, error?: string): PolicyResponseDeny<T> {
    return {
      ipfsCid,
      allow: false,
      result,
      ...(error ? { error } : {}),
    } as PolicyResponseDeny<T>;
  }

  // Select the appropriate function implementation based on schema presence
  const allow = allowSchema ? allowWithSchema : allowWithoutSchema;
  const deny = denySchema ? denyWithSchema : denyWithoutSchema;

  return {
    delegation: baseContext.delegation,
    allow: allow as AllowSchema extends z.ZodType
      ? (
          result: z.infer<AllowSchema>,
        ) => PolicyResponseAllow<z.infer<AllowSchema>>
      : () => PolicyResponseAllowNoResult,
    deny: deny as DenySchema extends z.ZodType
      ? (
          result: z.infer<DenySchema>,
          error?: string,
        ) => PolicyResponseDeny<z.infer<DenySchema>>
      : (error?: string) => PolicyResponseDenyNoResult,
  };
}

export function createVincentPolicy<
  PackageName extends string,
  PolicyToolParams extends z.ZodType,
  UserParams extends z.ZodType | undefined = undefined,
  PrecheckAllowResult extends z.ZodType | undefined = undefined,
  PrecheckDenyResult extends z.ZodType | undefined = undefined,
  EvalAllowResult extends z.ZodType | undefined = undefined,
  EvalDenyResult extends z.ZodType | undefined = undefined,
  CommitParams extends z.ZodType | undefined = undefined,
  CommitAllowResult extends z.ZodType | undefined = undefined,
  CommitDenyResult extends z.ZodType | undefined = undefined,
  EvaluateFn = EvaluateFunction<
    PolicyToolParams,
    UserParams,
    EvalAllowResult,
    EvalDenyResult
  >,
  PrecheckFn =
    | undefined
    | PrecheckFunction<
        PolicyToolParams,
        UserParams,
        PrecheckAllowResult,
        PrecheckDenyResult
      >,
  CommitFn =
    | undefined
    | CommitFunction<CommitParams, CommitAllowResult, CommitDenyResult>,
>(
  policyDef: VincentPolicyDef<
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
    EvaluateFn,
    PrecheckFn,
    CommitFn
  >,
) {
  // Implementation stays exactly the same as current validateVincentPolicyDef
  if (policyDef.commitParamsSchema && !policyDef.commit) {
    throw new Error(
      'Policy defines commitParamsSchema but is missing commit function',
    );
  }

  const originalPolicyDef = policyDef;

  // Create wrapper functions that create a new context and merge baseContext into them
  const wrappedPolicyDef = {
    ...originalPolicyDef,
    package: originalPolicyDef.package,
    evaluate: async (
      args: {
        toolParams: z.infer<typeof originalPolicyDef.toolParamsSchema>;
        userParams: UserParams extends z.ZodType
          ? z.infer<UserParams>
          : undefined;
      },
      baseContext: BaseContext,
    ) => {
      const context = createPolicyContext({
        baseContext,
        ipfsCid: originalPolicyDef.ipfsCid,
        allowSchema: originalPolicyDef.evalAllowResultSchema,
        denySchema: originalPolicyDef.evalDenyResultSchema,
      });

      return (
        originalPolicyDef.evaluate as EvaluateFunction<
          PolicyToolParams,
          UserParams,
          EvalAllowResult,
          EvalDenyResult
        >
      )(args, context);
    },

    // Only create precheck wrapper if precheck exists; it is optional.
    ...(originalPolicyDef.precheck
      ? {
          precheck: async (
            args: {
              toolParams: z.infer<typeof originalPolicyDef.toolParamsSchema>;
              userParams: UserParams extends z.ZodType
                ? z.infer<UserParams>
                : undefined;
            },
            baseContext: BaseContext,
          ) => {
            const context = createPolicyContext({
              ipfsCid: originalPolicyDef.ipfsCid,
              baseContext,
              allowSchema: originalPolicyDef.precheckAllowResultSchema,
              denySchema: originalPolicyDef.precheckDenyResultSchema,
            });

            return (
              originalPolicyDef.precheck as PrecheckFunction<
                PolicyToolParams,
                UserParams,
                PrecheckAllowResult,
                PrecheckDenyResult
              >
            )(args, context);
          },
        }
      : { precheck: undefined }),

    // Only create commit wrapper if commit exists; it is optional also
    ...(originalPolicyDef.commit
      ? {
          commit: async (
            args: CommitParams extends z.ZodType
              ? z.infer<CommitParams>
              : undefined,
            baseContext: BaseContext,
          ) => {
            const context = createPolicyContext({
              ipfsCid: originalPolicyDef.ipfsCid,
              baseContext,
              denySchema: originalPolicyDef.commitDenyResultSchema,
              allowSchema: originalPolicyDef.commitAllowResultSchema,
            });

            return (
              originalPolicyDef.commit as CommitFunction<
                CommitParams,
                CommitAllowResult,
                CommitDenyResult
              >
            )(args, context);
          },
        }
      : { commit: undefined }),
  };

  return wrappedPolicyDef;
}

export function createVincentToolPolicy<
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
  EvaluateFn = EvaluateFunction<
    PolicyToolParams,
    UserParams,
    EvalAllowResult,
    EvalDenyResult
  >,
  PrecheckFn =
    | undefined
    | PrecheckFunction<
        PolicyToolParams,
        UserParams,
        PrecheckAllowResult,
        PrecheckDenyResult
      >,
  CommitFn =
    | undefined
    | CommitFunction<CommitParams, CommitAllowResult, CommitDenyResult>,
>(config: {
  toolParamsSchema: ToolParamsSchema;
  policyDef: VincentPolicyDef<
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
    EvaluateFn,
    PrecheckFn,
    CommitFn
  >;
  toolParameterMappings: Partial<{
    [K in keyof z.infer<ToolParamsSchema>]: keyof z.infer<PolicyToolParams>;
  }>;
}) {
  // Use createVincentPolicy to create the wrapped policy
  const policyDef = createVincentPolicy(config.policyDef);

  const result = {
    policyDef,
    toolParameterMappings: config.toolParameterMappings,
    // Explicitly include schema types in the returned object for type inference
    __schemaTypes: {
      evalAllowResultSchema: config.policyDef.evalAllowResultSchema,
      evalDenyResultSchema: config.policyDef.evalDenyResultSchema,
      commitParamsSchema: config.policyDef.commitParamsSchema,
      commitAllowResultSchema: config.policyDef.commitAllowResultSchema,
      commitDenyResultSchema: config.policyDef.commitDenyResultSchema,
      // Explicit function types
      evaluate: config.policyDef.evaluate as EvaluateFn,
      precheck: config.policyDef.precheck as PrecheckFn,
      commit: config.policyDef.commit as CommitFn,
    },
  };

  // Use the same type assertion -- but include __schemaTypes to fix generic inference issues
  return result as {
    policyDef: typeof policyDef;
    toolParameterMappings: typeof config.toolParameterMappings;
    __schemaTypes: {
      evalAllowResultSchema: EvalAllowResult;
      evalDenyResultSchema: EvalDenyResult;
      commitParamsSchema: CommitParams;
      commitAllowResultSchema: CommitAllowResult;
      commitDenyResultSchema: CommitDenyResult;
      // Explicit function types
      evaluate: EvaluateFn;
      precheck: PrecheckFn;
      commit: CommitFn;
    };
  };
}
