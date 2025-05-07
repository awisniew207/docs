import { z } from 'zod';
import {
  BaseToolContext,
  ToolExecutionPolicyContext,
  ToolContext,
  ToolExecutionFailure,
  ToolExecutionFailureNoResult,
  ToolExecutionSuccess,
  ToolExecutionSuccessNoResult,
  PolicyEvaluationResultContext,
  VincentToolDef,
  VincentToolPolicy,
  VincentPolicyDef,
} from './types';

export interface CreateToolContextParams<
  SuccessSchema extends z.ZodType | undefined = undefined,
  FailSchema extends z.ZodType | undefined = undefined,
  Policies = Record<string, Record<string, unknown>>,
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
    };
  }

  function succeedWithSchema<T>(result: T): ToolExecutionSuccess<T> {
    return {
      success: true,
      result,
    } as ToolExecutionSuccess<T>;
  }

  function failWithoutSchema(error?: string): ToolExecutionFailureNoResult {
    return {
      success: false,
      ...(error ? { error } : {}),
    } as ToolExecutionFailureNoResult;
  }

  function failWithSchema<T>(
    result: T,
    error?: string,
  ): ToolExecutionFailure<T> {
    return {
      success: false,
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

  return {
    policiesContext: baseToolContext.policiesContext,
    succeed: succeedFn,
    fail: failFn,
  };
}

export function createPolicyMap<
  T extends readonly VincentToolPolicy<any, any>[],
  Pkgs extends
    T[number]['policyDef']['package'] = T[number]['policyDef']['package'],
>(
  policies: T,
): string extends Pkgs
  ? [
      '❌ Each policyDef.package must be a string literal. Use `as const` when passing the array.',
    ]
  : {
      [K in Pkgs]: Extract<T[number], { policyDef: { package: K } }>;
    } {
  const result = {} as any;
  for (const policy of policies) {
    const name = policy.policyDef.package;
    if (result[name]) {
      throw new Error('Duplicate policy package: ' + name + '');
    }
    result[name] = policy;
  }
  return result;
}
export function createVincentTool<
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
    PolicyArray[number]['policyDef']['package'] = PolicyArray[number]['policyDef']['package'],
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
      { policyDef: { package: K } }
    >;
  },
  PrecheckSuccessSchema extends z.ZodType | undefined = undefined,
  PrecheckFailSchema extends z.ZodType | undefined = undefined,
  ExecuteSuccessSchema extends z.ZodType | undefined = undefined,
  ExecuteFailSchema extends z.ZodType | undefined = undefined,
>(
  toolDef: VincentToolDef<
    ToolParamsSchema,
    PolicyArray,
    PkgNames,
    PolicyMapType,
    PrecheckSuccessSchema,
    PrecheckFailSchema,
    ExecuteSuccessSchema,
    ExecuteFailSchema
  >,
) {
  // Create the policy map internally
  const policyMap = createPolicyMap(toolDef.supportedPolicies);

  const originalToolDef = {
    ...toolDef,
    supportedPolicies: policyMap,
  };

  const wrappedToolDef = {
    ...originalToolDef,

    precheck: async (
      params: z.infer<ToolParamsSchema>,
      policiesContext: PolicyEvaluationResultContext<PolicyMapType>,
    ) => {
      const context = createToolContext({
        successSchema: originalToolDef.precheckSuccessSchema,
        failSchema: originalToolDef.precheckFailSchema,
        baseToolContext: { policiesContext: policiesContext },
      });

      return originalToolDef.precheck(params, context);
    },

    execute: async (
      params: z.infer<ToolParamsSchema>,
      policiesContext: ToolExecutionPolicyContext<PolicyMapType>,
    ) => {
      const context = createToolContext({
        successSchema: originalToolDef.executeSuccessSchema,
        failSchema: originalToolDef.executeFailSchema,
        baseToolContext: { policiesContext: policiesContext },
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
