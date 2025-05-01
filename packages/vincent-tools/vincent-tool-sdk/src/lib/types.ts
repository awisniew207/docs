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

export type PolicyResponse<AllowResult = never, DenyResult = never> =
  | PolicyResponseAllow<AllowResult>
  | PolicyResponseDeny<DenyResult>;

// Define PolicyContext with proper overloads
export interface PolicyContext<
  AllowSchema extends z.ZodType | undefined = undefined,
  DenySchema extends z.ZodType | undefined = undefined,
> {
  ipfsCid: string;
  details: string[];

  addDetails(detail: string): void;

  // Allow overloads with proper conditional typing
  allow(): AllowSchema extends z.ZodType ? never : PolicyResponseAllowNoResult;
  allow<T extends AllowSchema extends z.ZodType ? z.infer<AllowSchema> : never>(
    result: T,
  ): AllowSchema extends z.ZodType ? PolicyResponseAllow<T> : never;

  // Deny overloads with proper conditional typing
  deny(
    error?: string,
  ): DenySchema extends z.ZodType ? never : PolicyResponseDenyNoResult;
  deny<T extends DenySchema extends z.ZodType ? z.infer<DenySchema> : never>(
    result: T,
    error?: string,
  ): DenySchema extends z.ZodType ? PolicyResponseDeny<T> : never;
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

// Helper type to determine if a policy has commit
export type HasCommit<P> = P extends { commit: infer CommitFn }
  ? CommitFn extends Function
    ? true
    : false
  : false;

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

// Policy evaluation results with proper typing for commit
export type VincentPolicyEvaluationResults<
  Policies extends Record<string, { policyDef: VincentPolicyDef }>,
> = {
  evaluatedPolicies: Array<keyof Policies>;
  allowPolicyResults: {
    [PolicyKey in keyof Policies]?: {
      result: PolicyResponseAllow<any>;
    } & (HasCommit<Policies[PolicyKey]['policyDef']> extends true
      ? {
          commit: Extract<
            Policies[PolicyKey]['policyDef'],
            { commit: Function }
          >['commit'];
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
