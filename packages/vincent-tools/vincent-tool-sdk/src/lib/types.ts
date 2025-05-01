// types.ts - Updated interfaces with optional UserParams and CommitParams
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

// Define the PolicyResponse union type that combines allow and deny responses
export type PolicyResponse<AllowResult = never, DenyResult = never> =
  | PolicyResponseAllow<AllowResult>
  | PolicyResponseDeny<DenyResult>;

export interface PolicyContext<
  AllowSchema extends z.ZodType | undefined = undefined,
  DenySchema extends z.ZodType | undefined = undefined,
> {
  ipfsCid: string;
  details: string[];

  // Accept either a single string or an array of strings
  addDetails(detail: string | string[]): void;

  // Function overloads for allow:
  // When no schema is defined, only allow without arguments
  allow(): AllowSchema extends undefined ? PolicyResponseAllowNoResult : never;
  // When schema is defined, require argument matching the schema
  allow<T extends z.infer<NonNullable<AllowSchema>>>(
    result: AllowSchema extends undefined ? never : T,
  ): PolicyResponseAllow<T>;

  // Function overloads for deny:
  // When no schema is defined, accept string error or no arguments
  deny(
    error?: DenySchema extends undefined ? string : never,
  ): PolicyResponseDenyNoResult;
  // When schema is defined, require argument matching the schema
  deny<T extends z.infer<NonNullable<DenySchema>>>(
    result: DenySchema extends undefined ? never : T,
    error?: string,
  ): PolicyResponseDeny<T>;
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

// Update PolicyWithPrecheck
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

// Update PolicyWithCommit
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

// Update PolicyWithPrecheckAndCommit
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

// Updated evaluation results type
export type VincentPolicyEvaluationResponse<
  PrecheckAllowResult = never,
  PrecheckDenyResult = never,
  EvalAllowResult = never,
  EvalDenyResult = never,
> = {
  precheckResponse?: PolicyResponse<PrecheckAllowResult, PrecheckDenyResult>;
  evaluateResponse?: PolicyResponse<EvalAllowResult, EvalDenyResult>;
  allowed: boolean;
};

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

// Tool supported policy with proper typing
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
  Policies extends Record<string, { policyDef: VincentPolicyDef }>,
> = {
  evaluatedPolicies: Array<keyof Policies>;
  allowPolicyResults: {
    [PolicyKey in keyof Policies]?: {
      result: PolicyResponseAllow<any>;
    } & (HasCommit<Policies[PolicyKey]['policyDef']> extends true
      ? {
          // Use a wrapped commit function type that only requires args
          commit: Policies[PolicyKey]['policyDef'] extends {
            commit: infer Commit;
          }
            ? Commit extends (
                args: infer Args,
                context: any,
              ) => Promise<infer Result>
              ? WrappedCommitFunction<Args, Result>
              : never
            : never;
        }
      : {});
  };
} & (
  | { allow: true; denyPolicyResult?: never }
  | {
      allow: false;
      denyPolicyResult: {
        result: PolicyResponseDeny<any>;
        ipfsCid: keyof Policies;
      };
    }
);

// Tool definition
export interface VincentToolDef<
  ToolParamsSchema extends z.ZodType,
  Policies extends Record<
    string,
    VincentToolSupportedPolicy<ToolParamsSchema, VincentPolicyDef>
  >,
> {
  toolParamsSchema: ToolParamsSchema;
  supportedPolicies: Policies;
  precheck: (
    params: z.infer<ToolParamsSchema>,
    policyEvaluationResults: VincentPolicyEvaluationResults<Policies>,
  ) => Promise<unknown>;
  execute: (
    params: z.infer<ToolParamsSchema>,
    policyEvaluationResults: VincentPolicyEvaluationResults<Policies>,
  ) => Promise<unknown>;
}
