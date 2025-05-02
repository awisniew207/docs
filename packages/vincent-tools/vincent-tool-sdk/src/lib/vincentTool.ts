import { z } from 'zod';
import {
  VincentPolicyDef,
  ToolContext,
  ToolExecutionSuccess,
  ToolExecutionSuccessNoResult,
  ToolExecutionFailure,
  ToolExecutionFailureNoResult,
  OnlyAllowedPolicyEvaluationResults,
  VincentPolicyEvaluationResults,
  ToolPrecheckFailureNoResult,
  ToolPrecheckFailure,
  ToolPrecheckSuccessNoResult,
  ToolPrecheckSuccess,
  VincentToolSupportedPolicy,
  BaseToolContext,
} from './types';

export interface CreateToolContextParams<
  SuccessSchema extends z.ZodType | undefined = undefined,
  FailSchema extends z.ZodType | undefined = undefined,
  Policies = any,
> {
  successSchema?: SuccessSchema;
  failSchema?: FailSchema;
  baseToolContext: BaseToolContext<Policies>;
}

export function createToolContext<
  SuccessSchema extends z.ZodType | undefined = undefined,
  FailSchema extends z.ZodType | undefined = undefined,
  Policies = any,
>({
  successSchema,
  failSchema,
  baseToolContext,
}: CreateToolContextParams<SuccessSchema, FailSchema, Policies>): ToolContext<
  SuccessSchema,
  FailSchema,
  Policies
> {
  const details: string[] = [];

  type SucceedFn<S extends z.ZodType | undefined> = S extends z.ZodType
    ? {
        (result: z.infer<S>): ToolExecutionSuccess<z.infer<S>>;
        __brand: 'requires-arg';
      }
    : { (): ToolExecutionSuccessNoResult; __brand: 'no-arg' };

  type FailFn<S extends z.ZodType | undefined> = S extends z.ZodType
    ? {
        (result: z.infer<S>, error?: string): ToolExecutionFailure<z.infer<S>>;
        __brand: 'requires-arg';
      }
    : { (error?: string): ToolExecutionFailureNoResult; __brand: 'no-arg' };

  function succeedWithoutSchema(): ToolExecutionSuccessNoResult {
    return {
      success: true,
      details: [...details],
    };
  }

  function succeedWithSchema<T>(result: T): ToolExecutionSuccess<T> {
    return {
      success: true,
      details: [...details],
      result,
    } as ToolExecutionSuccess<T>;
  }

  function failWithoutSchema(error?: string): ToolExecutionFailureNoResult {
    return {
      success: false,
      details: [...details],
      ...(error ? { error } : {}),
    } as ToolExecutionFailureNoResult;
  }

  function failWithSchema<T>(
    result: T,
    error?: string,
  ): ToolExecutionFailure<T> {
    return {
      success: false,
      details: [...details],
      result,
      ...(error ? { error } : {}),
    } as ToolExecutionFailure<T>;
  }

  let succeedFn: any;
  let failFn: any;

  if (successSchema) {
    succeedFn = succeedWithSchema as SucceedFn<NonNullable<SuccessSchema>>;
    succeedFn.__brand = 'requires-arg';
  } else {
    succeedFn = succeedWithoutSchema as SucceedFn<undefined>;
    succeedFn.__brand = 'no-arg';
  }

  if (failSchema) {
    failFn = failWithSchema as FailFn<NonNullable<FailSchema>>;
    failFn.__brand = 'requires-arg';
  } else {
    failFn = failWithoutSchema as FailFn<undefined>;
    failFn.__brand = 'no-arg';
  }

  const context: ToolContext<SuccessSchema, FailSchema, Policies> = {
    details,
    policyResults: baseToolContext.policyResults,
    addDetails(detail: string | string[]) {
      if (Array.isArray(detail)) {
        details.push(...detail);
      } else {
        details.push(detail);
      }
    },
    succeed: succeedFn,
    fail: failFn,
  };

  return context;
}

export function validateVincentToolDef<
  ToolParamsSchema extends z.ZodType,
  Policies extends Record<
    string,
    VincentToolSupportedPolicy<ToolParamsSchema, VincentPolicyDef>
  >,
  PrecheckSuccessSchema extends z.ZodType | undefined = undefined,
  PrecheckFailSchema extends z.ZodType | undefined = undefined,
  ExecuteSuccessSchema extends z.ZodType | undefined = undefined,
  ExecuteFailSchema extends z.ZodType | undefined = undefined,
>(toolDef: {
  toolParamsSchema: ToolParamsSchema;
  supportedPolicies: Policies;

  precheckSuccessSchema?: PrecheckSuccessSchema;
  precheckFailSchema?: PrecheckFailSchema;
  executeSuccessSchema?: ExecuteSuccessSchema;
  executeFailSchema?: ExecuteFailSchema;

  precheck: (
    params: z.infer<ToolParamsSchema>,
    context: ToolContext<
      PrecheckSuccessSchema,
      PrecheckFailSchema,
      VincentPolicyEvaluationResults<Policies>
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
      OnlyAllowedPolicyEvaluationResults<Policies>
    >,
  ) => Promise<
    | (ExecuteSuccessSchema extends z.ZodType
        ? ToolExecutionSuccess<z.infer<ExecuteSuccessSchema>>
        : ToolExecutionSuccessNoResult)
    | (ExecuteFailSchema extends z.ZodType
        ? ToolExecutionFailure<z.infer<ExecuteFailSchema>>
        : ToolExecutionFailureNoResult)
  >;
}) {
  const originalToolDef = toolDef;

  const wrappedToolDef = {
    ...originalToolDef,

    precheck: async (
      params: z.infer<ToolParamsSchema>,
      policyEvaluationResults: VincentPolicyEvaluationResults<Policies>,
    ) => {
      const context = createToolContext({
        successSchema: originalToolDef.precheckSuccessSchema,
        failSchema: originalToolDef.precheckFailSchema,
        baseToolContext: { policyResults: policyEvaluationResults },
      });

      return originalToolDef.precheck(params, context);
    },

    execute: async (
      params: z.infer<ToolParamsSchema>,
      policyEvaluationResults: OnlyAllowedPolicyEvaluationResults<Policies>,
    ) => {
      const context = createToolContext({
        successSchema: originalToolDef.executeSuccessSchema,
        failSchema: originalToolDef.executeFailSchema,
        baseToolContext: { policyResults: policyEvaluationResults },
      });

      return originalToolDef.execute(params, context);
    },
  };

  const result = {
    ...wrappedToolDef,
    // Explicitly include schema types for type inference
    __schemaTypes: {
      precheckSuccessSchema: toolDef.precheckSuccessSchema,
      precheckFailSchema: toolDef.precheckFailSchema,
      executeSuccessSchema: toolDef.executeSuccessSchema,
      executeFailSchema: toolDef.executeFailSchema,
    },
  };

  // Use the same type assertion -- but include __schemaTypes to fix generic inference issues
  return result as typeof wrappedToolDef & {
    __schemaTypes: {
      precheckSuccessSchema: PrecheckSuccessSchema;
      precheckFailSchema: PrecheckFailSchema;
      executeSuccessSchema: ExecuteSuccessSchema;
      executeFailSchema: ExecuteFailSchema;
    };
  };
}
