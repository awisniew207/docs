import { z } from 'zod';
import {
  BaseToolContext,
  ToolContext,
  ToolExecutionFailure,
  ToolExecutionSuccess,
  VincentToolPolicy,
  VincentPolicyDef,
  VincentToolDef,
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
>(params: {
  baseContext: BaseToolContext<Policies>;
  successSchema?: SuccessSchema;
  failSchema?: FailSchema;
}): ToolContext<SuccessSchema, FailSchema, Policies> {
  const { baseContext, successSchema, failSchema } = params;

  function succeedWithSchema<T>(result: T): ToolExecutionSuccess<T> {
    return {
      success: true,
      result,
    } as ToolExecutionSuccess<T>;
  }

  function succeedWithoutSchema(): ToolExecutionSuccess<never> {
    return {
      success: true,
    } as ToolExecutionSuccess<never>;
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

  function failWithoutSchema(error?: string): ToolExecutionFailure<never> {
    return {
      success: false,
      ...(error ? { error } : {}),
    } as ToolExecutionFailure<never>;
  }

  const succeed = successSchema ? succeedWithSchema : succeedWithoutSchema;
  const fail = failSchema ? failWithSchema : failWithoutSchema;

  return {
    ...baseContext,
    succeed,
    fail,
  } as ToolContext<SuccessSchema, FailSchema, Policies>;
}

export function createPolicyMap<
  T extends readonly VincentToolPolicy<any, any>[],
  Pkgs extends
    T[number]['policyDef']['packageName'] = T[number]['policyDef']['packageName'],
>(
  policies: T,
): string extends Pkgs
  ? [
      '❌ Each policyDef.packageName must be a string literal. Use `as const` when passing the array.',
    ]
  : {
      [K in Pkgs]: Extract<T[number], { policyDef: { packageName: K } }>;
    } {
  const result = {} as any;
  for (const policy of policies) {
    const name = policy.policyDef.packageName;
    if (result[name]) {
      throw new Error('Duplicate policy packageName: ' + name + '');
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
  const policyMap = toolDef.supportedPolicies
    ? createPolicyMap(toolDef.supportedPolicies)
    : {};

  const originalToolDef = {
    ...toolDef,
    supportedPolicies: policyMap,
  };

  const wrappedToolDef = {
    ...originalToolDef,

    ...(originalToolDef.precheck !== undefined
      ? {
          precheck: async (
            params: z.infer<ToolParamsSchema>,
            baseToolContext: BaseToolContext,
          ) => {
            const context = createToolContext({
              successSchema: originalToolDef.precheckSuccessSchema,
              failSchema: originalToolDef.precheckFailSchema,
              baseContext: baseToolContext,
            });

            const { precheck: precheckFn } = originalToolDef;

            if (!precheckFn) {
              throw new Error('Commit function unexpectedly missing');
            }

            return precheckFn(params, context);
          },
        }
      : { precheck: undefined }),

    execute: async (
      params: z.infer<ToolParamsSchema>,
      baseToolContext: BaseToolContext,
    ) => {
      const context = createToolContext({
        successSchema: originalToolDef.executeSuccessSchema,
        failSchema: originalToolDef.executeFailSchema,
        baseContext: baseToolContext,
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
