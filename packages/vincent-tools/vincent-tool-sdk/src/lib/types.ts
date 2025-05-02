import { z } from 'zod';

export interface PolicyResponseBase {
  ipfsCid: string;
  details: string[];
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
  result?: never;
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

  addDetails(detail: string | string[]): void;

  // We use 'branded' function types to force TypeScript to check argument presence
  // Otherwise calling w/ no arguments is not a type error even if a schema was provided (!)
  allow: AllowSchema extends z.ZodType
    ? {
        (
          result: z.infer<AllowSchema>,
        ): PolicyResponseAllow<z.infer<AllowSchema>>;
        __brand: 'requires-arg';
      }
    : { (): PolicyResponseAllowNoResult; __brand: 'no-arg' };

  deny: DenySchema extends z.ZodType
    ? {
        (
          result: z.infer<DenySchema>,
          error?: string,
        ): PolicyResponseDeny<z.infer<DenySchema>>;
        __brand: 'requires-arg';
      }
    : { (error?: string): PolicyResponseDenyNoResult; __brand: 'no-arg' };
}

export interface BasicPolicyDef<
  ToolParams extends z.ZodType,
  UserParams extends z.ZodType | undefined = undefined,
  EvalAllowResult extends z.ZodType | undefined = undefined,
  EvalDenyResult extends z.ZodType | undefined = undefined,
> {
  ipfsCid: string;
  toolParamsSchema: ToolParams;
  userParamsSchema?: UserParams;
  evalAllowResultSchema?: EvalAllowResult;
  evalDenyResultSchema?: EvalDenyResult;

  evaluate: (
    args: {
      toolParams: z.infer<ToolParams>;
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
}

export interface PolicyWithPrecheck<
  ToolParams extends z.ZodType,
  UserParams extends z.ZodType | undefined = undefined,
  PrecheckAllowResult extends z.ZodType | undefined = undefined,
  PrecheckDenyResult extends z.ZodType | undefined = undefined,
  EvalAllowResult extends z.ZodType | undefined = undefined,
  EvalDenyResult extends z.ZodType | undefined = undefined,
> extends Omit<
    BasicPolicyDef<ToolParams, UserParams, EvalAllowResult, EvalDenyResult>,
    'evaluate'
  > {
  precheckAllowResultSchema?: PrecheckAllowResult;
  precheckDenyResultSchema?: PrecheckDenyResult;

  precheck: (
    args: {
      toolParams: z.infer<ToolParams>;
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

  evaluate: (
    args: {
      toolParams: z.infer<ToolParams>;
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
}

export interface PolicyWithCommit<
  ToolParams extends z.ZodType,
  UserParams extends z.ZodType | undefined = undefined,
  CommitParams extends z.ZodType | undefined = undefined,
  CommitAllowResult extends z.ZodType | undefined = undefined,
  CommitDenyResult extends z.ZodType | undefined = undefined,
  EvalAllowResult extends z.ZodType | undefined = undefined,
  EvalDenyResult extends z.ZodType | undefined = undefined,
> extends Omit<
    BasicPolicyDef<ToolParams, UserParams, EvalAllowResult, EvalDenyResult>,
    'evaluate'
  > {
  commitParamsSchema?: CommitParams;
  commitAllowResultSchema?: CommitAllowResult;
  commitDenyResultSchema?: CommitDenyResult;

  evaluate: (
    args: {
      toolParams: z.infer<ToolParams>;
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
}

export interface PolicyWithPrecheckAndCommit<
  ToolParams extends z.ZodType,
  UserParams extends z.ZodType | undefined = undefined,
  PrecheckAllowResult extends z.ZodType | undefined = undefined,
  PrecheckDenyResult extends z.ZodType | undefined = undefined,
  CommitParams extends z.ZodType | undefined = undefined,
  CommitAllowResult extends z.ZodType | undefined = undefined,
  CommitDenyResult extends z.ZodType | undefined = undefined,
  EvalAllowResult extends z.ZodType | undefined = undefined,
  EvalDenyResult extends z.ZodType | undefined = undefined,
> extends Omit<
    PolicyWithPrecheck<
      ToolParams,
      UserParams,
      PrecheckAllowResult,
      PrecheckDenyResult,
      EvalAllowResult,
      EvalDenyResult
    >,
    'evaluate'
  > {
  commitParamsSchema?: CommitParams;
  commitAllowResultSchema?: CommitAllowResult;
  commitDenyResultSchema?: CommitDenyResult;

  evaluate: (
    args: {
      toolParams: z.infer<ToolParams>;
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
}

// Union type for all policy definitions
// Do not be alarmed by the `any` types here -- the actual policies are still constrained by the types that make up the union
export type VincentPolicyDef =
  | BasicPolicyDef<any, any, any, any>
  | PolicyWithPrecheck<any, any, any, any, any, any>
  | PolicyWithCommit<any, any, any, any, any, any, any>
  | PolicyWithPrecheckAndCommit<any, any, any, any, any, any, any, any, any>;

export type HasCommit<P> = P extends { commit: Function } ? true : false;

// Type for the wrapped commit function that only requires the args parameter
export type WrappedCommitFunction<CommitParams, Result> = (
  args: CommitParams,
) => Promise<Result>;

// Tool supported policy with proper typing on the parameter mappings
export type VincentToolSupportedPolicy<
  ToolParamsSchema extends z.ZodType,
  PolicyDefType extends VincentPolicyDef,
> = {
  policyDef: PolicyDefType;
  toolParameterMappings: Partial<{
    [K in keyof z.infer<ToolParamsSchema>]: keyof z.infer<
      PolicyDefType['toolParamsSchema']
    >;
  }>;
};

export type VincentPolicyEvaluationResults<
  Policies extends Record<
    string,
    {
      policyDef: VincentPolicyDef;
      __schemaTypes?: {
        evalAllowResultSchema?: z.ZodType;
        evalDenyResultSchema?: z.ZodType;
        commitParamsSchema?: z.ZodType;
        commitAllowResultSchema?: z.ZodType;
        commitDenyResultSchema?: z.ZodType;
      };
    }
  >,
> = {
  evaluatedPolicies: Array<keyof Policies>;
} & (
  | {
      allow: true;
      allowPolicyResults: {
        [PolicyKey in keyof Policies]?: {
          result: Policies[PolicyKey]['__schemaTypes'] extends {
            evalAllowResultSchema: infer Schema;
          }
            ? Schema extends z.ZodType
              ? z.infer<Schema>
              : never
            : never;
          commit: HasCommit<Policies[PolicyKey]['policyDef']> extends true
            ? Policies[PolicyKey]['policyDef'] extends {
                commit: infer Commit;
              }
              ? Commit extends (
                  args: infer Args,
                  context: any,
                ) => Promise<infer Result>
                ? WrappedCommitFunction<Args, Result>
                : never
              : never
            : never;
        };
      };
      denyPolicyResult?: never;
    }
  | {
      allow: false;
      denyPolicyResult: {
        ipfsCid: keyof Policies;
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
      allowPolicyResults?: {
        [PolicyKey in keyof Policies]?: {
          result: Policies[PolicyKey]['__schemaTypes'] extends {
            evalAllowResultSchema: infer Schema;
          }
            ? Schema extends z.ZodType
              ? z.infer<Schema>
              : never
            : never;
          commit: HasCommit<Policies[PolicyKey]['policyDef']> extends true
            ? Policies[PolicyKey]['policyDef'] extends {
                commit: infer Commit;
              }
              ? Commit extends (
                  args: infer Args,
                  context: any,
                ) => Promise<infer Result>
                ? WrappedCommitFunction<Args, Result>
                : never
              : never
            : never;
        };
      };
    }
);

export type OnlyAllowedPolicyEvaluationResults<
  Policies extends Record<
    string,
    {
      policyDef: VincentPolicyDef;
      __schemaTypes?: {
        evalAllowResultSchema?: z.ZodType;
        evalDenyResultSchema?: z.ZodType;
        commitParamsSchema?: z.ZodType;
        commitAllowResultSchema?: z.ZodType;
        commitDenyResultSchema?: z.ZodType;
      };
    }
  >,
> = {
  evaluatedPolicies: Array<keyof Policies>;
  allow: true;
  allowPolicyResults: {
    [PolicyKey in keyof Policies]?: {
      result: Policies[PolicyKey]['__schemaTypes'] extends {
        evalAllowResultSchema: infer Schema;
      }
        ? Schema extends z.ZodType
          ? z.infer<Schema>
          : never
        : never;
      commit: HasCommit<Policies[PolicyKey]['policyDef']> extends true
        ? Policies[PolicyKey]['policyDef'] extends {
            commit: infer Commit;
          }
          ? Commit extends (
              args: infer Args,
              context: any,
            ) => Promise<infer Result>
            ? WrappedCommitFunction<Args, Result>
            : never
          : never
        : never;
    };
  };
} & {
  readonly denyPolicyResult: never;
};

// Tool definition
// Tool response types, similar to PolicyResponse
export interface ToolResponseBase {
  details: string[];
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
  policyResults: Policies;
}

export interface ToolContext<
  SuccessSchema extends z.ZodType | undefined = undefined,
  FailSchema extends z.ZodType | undefined = undefined,
  Policies = any,
> extends BaseToolContext<Policies> {
  details: string[];

  addDetails(detail: string | string[]): void;

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
  Policies extends Record<
    string,
    VincentToolSupportedPolicy<ToolParamsSchema, VincentPolicyDef>
  >,
  PrecheckSuccessSchema extends z.ZodType | undefined = undefined,
  PrecheckFailSchema extends z.ZodType | undefined = undefined,
  ExecuteSuccessSchema extends z.ZodType | undefined = undefined,
  ExecuteFailSchema extends z.ZodType | undefined = undefined,
> {
  toolParamsSchema: ToolParamsSchema;
  supportedPolicies: Policies;

  // Schema definitions for precheck and execute response types are all optional
  precheckSuccessSchema?: PrecheckSuccessSchema;
  precheckFailSchema?: PrecheckFailSchema;
  executeSuccessSchema?: ExecuteSuccessSchema;
  executeFailSchema?: ExecuteFailSchema;

  precheck: (
    params: z.infer<ToolParamsSchema>,
    policyEvaluationResults: VincentPolicyEvaluationResults<Policies>,
    context: ToolContext<PrecheckSuccessSchema, PrecheckFailSchema>,
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
    policyEvaluationResults: OnlyAllowedPolicyEvaluationResults<Policies>,
    context: ToolContext<ExecuteSuccessSchema, ExecuteFailSchema>,
  ) => Promise<
    | (ExecuteSuccessSchema extends z.ZodType
        ? ToolExecutionSuccess<z.infer<ExecuteSuccessSchema>>
        : ToolExecutionSuccessNoResult)
    | (ExecuteFailSchema extends z.ZodType
        ? ToolExecutionFailure<z.infer<ExecuteFailSchema>>
        : ToolExecutionFailureNoResult)
  >;
}
