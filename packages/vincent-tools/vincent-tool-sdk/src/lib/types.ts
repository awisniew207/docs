import { z } from 'zod';

export interface PolicyResponseBase {
  ipfsCid: string;
}

export type PolicyResponseAllow<AllowResult = never> = AllowResult extends never
  ? PolicyResponseAllowNoResult
  : Omit<PolicyResponseBase, 'allow'> & { allow: true; result: AllowResult };

export interface PolicyResponseAllowNoResult extends PolicyResponseBase {
  allow: true;
  result?: never;
}

export type PolicyResponseDeny<DenyResult = never> = DenyResult extends never
  ? PolicyResponseDenyNoResult
  : Omit<PolicyResponseBase, 'allow'> & {
      allow: false;
      result: DenyResult;
      error?: string;
    };

export interface PolicyResponseDenyNoResult extends PolicyResponseBase {
  allow: false;
  error?: string;
  result: never;
}

export type PolicyResponse<AllowResult = never, DenyResult = never> =
  | PolicyResponseAllow<AllowResult>
  | PolicyResponseDeny<DenyResult>;

export interface PolicyContext<
  AllowSchema extends z.ZodType | undefined = undefined,
  DenySchema extends z.ZodType | undefined = undefined,
> {
  delegation: {
    delegatee: string;
    delegator: string;
  };

  // Instead of branded types, we use conditional types directly
  allow: AllowSchema extends z.ZodType
    ? (
        result: z.infer<AllowSchema>,
      ) => PolicyResponseAllow<z.infer<AllowSchema>>
    : () => PolicyResponseAllowNoResult;

  deny: DenySchema extends z.ZodType
    ? (
        result: z.infer<DenySchema>,
        error?: string,
      ) => PolicyResponseDeny<z.infer<DenySchema>>
    : (error?: string) => PolicyResponseDenyNoResult;
}

// Type for the wrapped commit function that handles both with and without args
export type WrappedCommitFunction<CommitParams, Result> =
  CommitParams extends void
    ? () => Promise<Result> // No arguments version
    : (args: CommitParams) => Promise<Result>; // With arguments version

export type EvaluateFunction<
  PolicyToolParams extends z.ZodType,
  UserParams extends z.ZodType | undefined,
  EvalAllowResult extends z.ZodType | undefined,
  EvalDenyResult extends z.ZodType | undefined,
> = (
  args: {
    toolParams: z.infer<PolicyToolParams>;
    userParams: UserParams extends z.ZodType ? z.infer<UserParams> : undefined;
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

export type PrecheckFunction<
  PolicyToolParams extends z.ZodType,
  UserParams extends z.ZodType | undefined,
  PrecheckAllowResult extends z.ZodType | undefined,
  PrecheckDenyResult extends z.ZodType | undefined,
> = (
  args: {
    toolParams: z.infer<PolicyToolParams>;
    userParams: UserParams extends z.ZodType ? z.infer<UserParams> : undefined;
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
export type CommitFunction<
  CommitParams extends z.ZodType | undefined,
  CommitAllowResult extends z.ZodType | undefined,
  CommitDenyResult extends z.ZodType | undefined,
> = (
  args: CommitParams extends z.ZodType ? z.infer<CommitParams> : undefined,
  context: PolicyContext<CommitAllowResult, CommitDenyResult>,
) => Promise<
  | (CommitAllowResult extends z.ZodType
      ? PolicyResponseAllow<z.infer<CommitAllowResult>>
      : PolicyResponseAllowNoResult)
  | (CommitDenyResult extends z.ZodType
      ? PolicyResponseDeny<z.infer<CommitDenyResult>>
      : PolicyResponseDenyNoResult)
>;

export type VincentPolicyDef<
  PackageName extends string,
  PolicyToolParams extends z.ZodType,
  // Schema generics
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
> = {
  // Schema properties
  ipfsCid: string;
  packageName: PackageName;
  toolParamsSchema: PolicyToolParams;
  userParamsSchema?: UserParams;
  evalAllowResultSchema?: EvalAllowResult;
  evalDenyResultSchema?: EvalDenyResult;
  precheckAllowResultSchema?: PrecheckAllowResult;
  precheckDenyResultSchema?: PrecheckDenyResult;
  commitParamsSchema?: CommitParams;
  commitAllowResultSchema?: CommitAllowResult;
  commitDenyResultSchema?: CommitDenyResult;

  // Function properties - now directly using the function generic types
  evaluate: EvaluateFn;
  precheck?: PrecheckFn;
  commit?: CommitFn;
};
// Tool supported policy with proper typing on the parameter mappings
export type VincentToolPolicy<
  ToolParamsSchema extends z.ZodType,
  PolicyDefType extends VincentPolicyDef<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >,
  PackageName extends string = string,
> = {
  policyDef: PolicyDefType & { packageName: PackageName };
  toolParameterMappings: Partial<{
    [K in keyof z.infer<ToolParamsSchema>]: keyof z.infer<
      PolicyDefType['toolParamsSchema']
    >;
  }>;
};

export type PolicyEvaluationResultContext<
  Policies extends Record<
    string,
    {
      policyDef: VincentPolicyDef<
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any
      >;
      __schemaTypes?: {
        evalAllowResultSchema?: z.ZodType;
        evalDenyResultSchema?: z.ZodType;
        commitParamsSchema?: z.ZodType;
        commitAllowResultSchema?: z.ZodType;
        commitDenyResultSchema?: z.ZodType;
        evaluate?: Function;
        precheck?: Function;
        commit?: Function;
      };
    }
  >,
> = {
  evaluatedPolicies: Array<keyof Policies>;
} & (
  | {
      allow: true;
      allowedPolicies: {
        [PolicyKey in keyof Policies]?: {
          result: Policies[PolicyKey]['__schemaTypes'] extends {
            evalAllowResultSchema: infer Schema;
          }
            ? Schema extends z.ZodType
              ? z.infer<Schema>
              : never
            : never;
          commit: Policies[PolicyKey]['__schemaTypes'] extends {
            commit: infer CommitFn;
          }
            ? CommitFn extends Function
              ? WrappedCommitFunction<
                  Policies[PolicyKey]['__schemaTypes'] extends {
                    commitParamsSchema: infer CommitParams;
                  }
                    ? CommitParams extends z.ZodType
                      ? z.infer<CommitParams>
                      : never
                    : never,
                  | (Policies[PolicyKey]['__schemaTypes'] extends {
                      commitAllowResultSchema: infer CommitAllowSchema;
                    }
                      ? CommitAllowSchema extends z.ZodType
                        ? PolicyResponseAllow<z.infer<CommitAllowSchema>>
                        : PolicyResponseAllowNoResult
                      : PolicyResponseAllowNoResult)
                  | (Policies[PolicyKey]['__schemaTypes'] extends {
                      commitDenyResultSchema: infer CommitDenySchema;
                    }
                      ? CommitDenySchema extends z.ZodType
                        ? PolicyResponseDeny<z.infer<CommitDenySchema>>
                        : PolicyResponseDenyNoResult
                      : PolicyResponseDenyNoResult)
                >
              : never
            : undefined;
        };
      };
      deniedPolicy?: never;
    }
  | {
      allow: false;
      deniedPolicy: {
        packageName: keyof Policies;
        result: {
          error?: string;
        } & (Policies[Extract<
          keyof Policies,
          string
        >]['__schemaTypes'] extends {
          evalDenyResultSchema: infer Schema;
        }
          ? Schema extends z.ZodType
            ? z.infer<Schema>
            : {}
          : {});
      };
      allowedPolicies?: {
        [PolicyKey in keyof Policies]?: {
          result: Policies[PolicyKey]['__schemaTypes'] extends {
            evalAllowResultSchema: infer Schema;
          }
            ? Schema extends z.ZodType
              ? z.infer<Schema>
              : never
            : never;
        };
      };
    }
);

export type ToolExecutionPolicyContext<
  Policies extends Record<
    string,
    {
      policyDef: VincentPolicyDef<
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any
      >;
      __schemaTypes?: {
        evalAllowResultSchema?: z.ZodType;
        evalDenyResultSchema?: z.ZodType;
        commitParamsSchema?: z.ZodType;
        commitAllowResultSchema?: z.ZodType;
        commitDenyResultSchema?: z.ZodType;
        evaluate?: Function;
        precheck?: Function;
        commit?: Function;
      };
    }
  >,
> = {
  evaluatedPolicies: Array<keyof Policies>;
  allow: true;
  allowedPolicies: {
    [PolicyKey in keyof Policies]?: {
      result: Policies[PolicyKey]['__schemaTypes'] extends {
        evalAllowResultSchema: infer Schema;
      }
        ? Schema extends z.ZodType
          ? z.infer<Schema>
          : never
        : never;
      commit: Policies[PolicyKey]['__schemaTypes'] extends {
        commit: infer CommitFn;
      }
        ? CommitFn extends Function
          ? WrappedCommitFunction<
              Policies[PolicyKey]['__schemaTypes'] extends {
                commitParamsSchema: infer CommitParams;
              }
                ? CommitParams extends z.ZodType
                  ? z.infer<CommitParams>
                  : void
                : never, // Use 'void' instead of 'never' for no-params case
              | (Policies[PolicyKey]['__schemaTypes'] extends {
                  commitAllowResultSchema: infer CommitAllowSchema;
                }
                  ? CommitAllowSchema extends z.ZodType
                    ? PolicyResponseAllow<z.infer<CommitAllowSchema>>
                    : PolicyResponseAllowNoResult
                  : PolicyResponseAllowNoResult)
              | (Policies[PolicyKey]['__schemaTypes'] extends {
                  commitDenyResultSchema: infer CommitDenySchema;
                }
                  ? CommitDenySchema extends z.ZodType
                    ? PolicyResponseDeny<z.infer<CommitDenySchema>>
                    : PolicyResponseDenyNoResult
                  : PolicyResponseDenyNoResult)
            >
          : never
        : undefined;
    };
  };
} & {
  readonly deniedPolicy: never;
};

// Tool definition
// Tool response types, similar to PolicyResponse
export interface ToolResponseBase {
  success: boolean;
}

export type ToolExecutionSuccess<SuccessResult = never> =
  SuccessResult extends never
    ? ToolExecutionSuccessNoResult
    : Omit<ToolResponseBase, 'success'> & {
        success: true;
        result: SuccessResult;
      };

export interface ToolExecutionSuccessNoResult extends ToolResponseBase {
  success: true;
  result?: never;
}

export type ToolExecutionFailure<FailResult = never> = FailResult extends never
  ? ToolExecutionFailureNoResult
  : Omit<ToolResponseBase, 'success'> & {
      success: false;
      result: FailResult;
      error?: string;
    };

export interface ToolExecutionFailureNoResult extends ToolResponseBase {
  success: false;
  error?: string;
  result?: never;
}

export type ToolExecutionResponse<SuccessResult = never, FailResult = never> =
  | ToolExecutionSuccess<SuccessResult>
  | ToolExecutionFailure<FailResult>;

export type ToolPrecheckSuccess<SuccessResult = never> =
  SuccessResult extends never
    ? ToolPrecheckSuccessNoResult
    : Omit<ToolResponseBase, 'success'> & {
        success: true;
        result: SuccessResult;
      };

export interface ToolPrecheckSuccessNoResult extends ToolResponseBase {
  success: true;
  result?: never;
}

export type ToolPrecheckFailure<FailResult = never> = FailResult extends never
  ? ToolPrecheckFailureNoResult
  : Omit<ToolResponseBase, 'success'> & {
      success: false;
      result: FailResult;
      error?: string;
    };

export interface ToolPrecheckFailureNoResult extends ToolResponseBase {
  success: false;
  error?: string;
  result?: never;
}

export type ToolPrecheckResponse<SuccessResult = never, FailResult = never> =
  | ToolPrecheckSuccess<SuccessResult>
  | ToolPrecheckFailure<FailResult>;

export interface BaseToolContext<Policies = any> {
  policiesContext: Policies;
}

export interface ToolContext<
  SuccessSchema extends z.ZodType | undefined = undefined,
  FailSchema extends z.ZodType | undefined = undefined,
  Policies = any,
> extends BaseToolContext<Policies> {
  // Use branded function types similar to PolicyContext
  // We use 'branded' function types to force TypeScript to check argument presence
  // Otherwise calling w/ no arguments is not a type error even if a schema was provided (!)
  succeed: SuccessSchema extends z.ZodType
    ? {
        (
          result: z.infer<SuccessSchema>,
        ): ToolExecutionSuccess<z.infer<SuccessSchema>>;
        __brand: 'requires-arg';
      }
    : { (): ToolExecutionSuccessNoResult; __brand: 'no-arg' };

  fail: FailSchema extends z.ZodType
    ? {
        (
          result: z.infer<FailSchema>,
          error?: string,
        ): ToolExecutionFailure<z.infer<FailSchema>>;
        __brand: 'requires-arg';
      }
    : { (error?: string): ToolExecutionFailureNoResult; __brand: 'no-arg' };
}
export interface VincentToolDef<
  ToolParamsSchema extends z.ZodType,
  PolicyArray extends readonly VincentToolPolicy<
    ToolParamsSchema,
    VincentPolicyDef<
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any
    >
  >[],
  PkgNames extends
    PolicyArray[number]['policyDef']['packageName'] = PolicyArray[number]['policyDef']['packageName'],
  PolicyMapType extends Record<
    string,
    {
      policyDef: VincentPolicyDef<
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any
      >;
      __schemaTypes?: {
        evalAllowResultSchema?: z.ZodType;
        evalDenyResultSchema?: z.ZodType;
        commitParamsSchema?: z.ZodType;
        commitAllowResultSchema?: z.ZodType;
        commitDenyResultSchema?: z.ZodType;
      };
    }
  > = {
    [K in PkgNames]: Extract<
      PolicyArray[number],
      { policyDef: { packageName: K } }
    >;
  },
  PrecheckSuccessSchema extends z.ZodType | undefined = undefined,
  PrecheckFailSchema extends z.ZodType | undefined = undefined,
  ExecuteSuccessSchema extends z.ZodType | undefined = undefined,
  ExecuteFailSchema extends z.ZodType | undefined = undefined,
> {
  toolParamsSchema: ToolParamsSchema;
  supportedPolicies: PolicyArray;
  precheckSuccessSchema?: PrecheckSuccessSchema;
  precheckFailSchema?: PrecheckFailSchema;
  executeSuccessSchema?: ExecuteSuccessSchema;
  executeFailSchema?: ExecuteFailSchema;

  precheck: (
    params: z.infer<ToolParamsSchema>,
    context: ToolContext<
      PrecheckSuccessSchema,
      PrecheckFailSchema,
      PolicyEvaluationResultContext<PolicyMapType>
    >,
  ) => Promise<
    | (PrecheckSuccessSchema extends z.ZodType
        ? ToolPrecheckSuccess<z.infer<PrecheckSuccessSchema>>
        : ToolPrecheckSuccessNoResult)
    | (PrecheckFailSchema extends z.ZodType
        ? ToolPrecheckFailure<z.infer<PrecheckFailSchema>>
        : ToolPrecheckFailureNoResult)
  >;

  execute: (
    params: z.infer<ToolParamsSchema>,
    context: ToolContext<
      ExecuteSuccessSchema,
      ExecuteFailSchema,
      ToolExecutionPolicyContext<PolicyMapType>
    >,
  ) => Promise<
    | (ExecuteSuccessSchema extends z.ZodType
        ? ToolExecutionSuccess<z.infer<ExecuteSuccessSchema>>
        : ToolExecutionSuccessNoResult)
    | (ExecuteFailSchema extends z.ZodType
        ? ToolExecutionFailure<z.infer<ExecuteFailSchema>>
        : ToolExecutionFailureNoResult)
  >;
}

export interface BasePolicyContext {
  delegation: {
    delegatee: string;
    delegator: string;
  };
}
