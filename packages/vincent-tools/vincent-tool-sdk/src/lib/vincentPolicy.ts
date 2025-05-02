import z from 'zod';
import {
  PolicyContext,
  PolicyResponseAllow,
  PolicyResponseAllowNoResult,
  PolicyResponseDeny,
  PolicyResponseDenyNoResult,
} from './types';

/**
 * Branded functions are used to enforce type safety at compile time for allow/deny calls.
 * The __brand property helps TypeScript distinguish between functions that require arguments
 * (when schemas are defined) and those that don't (when schemas are undefined).
 * This prevents runtime errors by catching incorrect usage during development.
 */
function createPolicyContext<
  AllowSchema extends z.ZodType | undefined = undefined,
  DenySchema extends z.ZodType | undefined = undefined,
>(
  ipfsCid: string,
  allowSchema?: AllowSchema,
  denySchema?: DenySchema,
): PolicyContext<AllowSchema, DenySchema> {
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

  // Build our context object
  const context = {
    ipfsCid,
    details,
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

  // Cast to expected interface type
  return context as unknown as PolicyContext<AllowSchema, DenySchema>;
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
    // Explicitly include schema types in the returned object for type inference
    __schemaTypes: {
      evalAllowResultSchema: config.policyDef.evalAllowResultSchema,
      evalDenyResultSchema: config.policyDef.evalDenyResultSchema,
      commitParamsSchema: config.policyDef.commitParamsSchema,
      commitAllowResultSchema: config.policyDef.commitAllowResultSchema,
      commitDenyResultSchema: config.policyDef.commitDenyResultSchema,
    },
  };

  // Use the same type assertion as before but include __schemaTypes
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
