import { z } from 'zod';
import {
  PolicyContext,
  PolicyResponseAllow,
  PolicyResponseAllowNoResult,
  PolicyResponseDeny,
  PolicyResponseDenyNoResult,
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
  const details: string[] = [];

  type AllowFn<S extends z.ZodType | undefined> = S extends z.ZodType
    ? {
        (result: z.infer<S>): PolicyResponseAllow<z.infer<S>>;
        __brand: 'requires-arg';
      }
    : { (): PolicyResponseAllowNoResult; __brand: 'no-arg' };

  type DenyFn<S extends z.ZodType | undefined> = S extends z.ZodType
    ? {
        (result: z.infer<S>, error?: string): PolicyResponseDeny<z.infer<S>>;
        __brand: 'requires-arg';
      }
    : { (error?: string): PolicyResponseDenyNoResult; __brand: 'no-arg' };

  function allowWithoutSchema(): PolicyResponseAllowNoResult {
    return {
      ipfsCid,
      allow: true,
      details: [...details],
    };
  }

  function allowWithSchema<T>(result: T): PolicyResponseAllow<T> {
    return {
      ipfsCid,
      allow: true,
      details: [...details],
      result,
    } as PolicyResponseAllow<T>;
  }

  function denyWithoutSchema(error?: string): PolicyResponseDenyNoResult {
    return {
      ipfsCid,
      allow: false,
      details: [...details],
      ...(error ? { error } : {}),
    } as PolicyResponseDenyNoResult;
  }

  function denyWithSchema<T>(result: T, error?: string): PolicyResponseDeny<T> {
    return {
      ipfsCid,
      allow: false,
      details: [...details],
      result,
      ...(error ? { error } : {}),
    } as PolicyResponseDeny<T>;
  }

  let allowFn: any;
  let denyFn: any;

  if (allowSchema) {
    allowFn = allowWithSchema as AllowFn<NonNullable<AllowSchema>>;
    allowFn.__brand = 'requires-arg';
  } else {
    allowFn = allowWithoutSchema as AllowFn<undefined>;
    allowFn.__brand = 'no-arg';
  }

  if (denySchema) {
    denyFn = denyWithSchema as DenyFn<NonNullable<DenySchema>>;
    denyFn.__brand = 'requires-arg';
  } else {
    denyFn = denyWithoutSchema as DenyFn<undefined>;
    denyFn.__brand = 'no-arg';
  }

  const context: PolicyContext<AllowSchema, DenySchema> = {
    delegation: baseContext.delegation,
    addDetails(detail: string | string[]) {
      if (Array.isArray(detail)) {
        details.push(...detail);
      } else {
        details.push(detail);
      }
    },
    allow: allowFn,
    deny: denyFn,
  };

  return context;
}

export function createVincentPolicy<
  PolicyToolParams extends z.ZodType,
  UserParams extends z.ZodType | undefined = undefined,
  PrecheckAllowResult extends z.ZodType | undefined = undefined,
  PrecheckDenyResult extends z.ZodType | undefined = undefined,
  EvalAllowResult extends z.ZodType | undefined = undefined,
  EvalDenyResult extends z.ZodType | undefined = undefined,
  CommitParams extends z.ZodType | undefined = undefined,
  CommitAllowResult extends z.ZodType | undefined = undefined,
  CommitDenyResult extends z.ZodType | undefined = undefined,
>(policyDef: {
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
}) {
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

      return originalPolicyDef.evaluate(args, context);
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

            return originalPolicyDef.precheck!(args, context);
          },
        }
      : {}),

    // Only create commit wrapper if commit exists; it is optional also
    ...(originalPolicyDef.commit
      ? {
          commit: async (
            args: CommitParams extends z.ZodType ? z.infer<CommitParams> : any,
            baseContext: BaseContext,
          ) => {
            const context = createPolicyContext({
              ipfsCid: originalPolicyDef.ipfsCid,
              baseContext,
              denySchema: originalPolicyDef.commitDenyResultSchema,
              allowSchema: originalPolicyDef.commitAllowResultSchema,
            });

            return originalPolicyDef.commit!(args, context);
          },
        }
      : { commit: undefined }),
  };

  return wrappedPolicyDef as typeof wrappedPolicyDef &
    (CommitParams extends z.ZodType
      ? {
          commit: NonNullable<(typeof policyDef)['commit']>;
        }
      : {
          commit: undefined;
        });
}

export function createVincentToolPolicy<
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

  // Create wrapper functions that create a new context and merge baseContext into them
  const policyDef = {
    ...originalPolicyDef,
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

      return originalPolicyDef.evaluate(args, context);
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

            return originalPolicyDef.precheck!(args, context);
          },
        }
      : {}),

    // Only create commit wrapper if commit exists; it is optional also
    ...(originalPolicyDef.commit
      ? {
          commit: async (
            args: CommitParams extends z.ZodType ? z.infer<CommitParams> : any,
            baseContext: BaseContext,
          ) => {
            const context = createPolicyContext({
              ipfsCid: originalPolicyDef.ipfsCid,
              baseContext,
              denySchema: originalPolicyDef.commitDenyResultSchema,
              allowSchema: originalPolicyDef.commitAllowResultSchema,
            });

            return originalPolicyDef.commit!(args, context);
          },
        }
      : {}),
  };

  const result = {
    policyDef: policyDef,
    toolParameterMappings: config.toolParameterMappings,
    // Explicitly include schema types in the returned object for type inference
    __schemaTypes: {
      evalAllowResultSchema: config.policyDef.evalAllowResultSchema,
      evalDenyResultSchema: config.policyDef.evalDenyResultSchema,
      commitParamsSchema: config.policyDef.commitParamsSchema,
      commitAllowResultSchema: config.policyDef.commitAllowResultSchema,
      commitDenyResultSchema: config.policyDef.commitDenyResultSchema,
    },
  };

  // Use the same type assertion -- but include __schemaTypes to fix generic inference issues
  return result as {
    policyDef: typeof policyDef &
      (CommitParams extends z.ZodType
        ? {
            commit: NonNullable<(typeof policyDef)['commit']>;
          }
        : {});
    toolParameterMappings: typeof config.toolParameterMappings;
    __schemaTypes: {
      evalAllowResultSchema: EvalAllowResult;
      evalDenyResultSchema: EvalDenyResult;
      commitParamsSchema: CommitParams;
      commitAllowResultSchema: CommitAllowResult;
      commitDenyResultSchema: CommitDenyResult;
    };
  };
}
