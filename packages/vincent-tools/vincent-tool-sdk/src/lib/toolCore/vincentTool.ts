// src/lib/toolCore/vincentTool.ts

import { z } from 'zod';
import {
  PolicyEvaluationResultContext,
  ToolExecutionPolicyContext,
  ToolExecutionPolicyEvaluationResult,
  ToolLifecycleFunction,
  ToolResponse,
  VincentToolPolicy,
} from '../types';
import { createExecutionToolContext, createPrecheckToolContext } from './toolContext/toolContext';
import { BaseToolContext } from './toolDef/context/types';
import { createToolFailureResult } from './helpers/resultCreators';
import { getSchemaForToolResponseResult, validateOrFail } from './helpers/zod';
import { isToolFailureResponse, isToolResponse } from './helpers/typeGuards';
import { ToolPolicyMap } from './helpers';
import { ToolDefLifecycleFunction, VincentToolDef } from './toolDef/types';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type EnrichedVincentToolPolicy = VincentToolPolicy<any, any, any> & {
  __schemaTypes?: {
    evalAllowResultSchema?: z.ZodType;
    evalDenyResultSchema?: z.ZodType;
    commitParamsSchema?: z.ZodType;
    commitAllowResultSchema?: z.ZodType;
    commitDenyResultSchema?: z.ZodType;
  };
};

/**
 * Wraps a VincentToolDef object and returns a fully typed tool with
 * standard lifecycle entrypoints (`precheck`, `execute`) and strong inference
 * based on schemas and supported policies.
 */
export function createVincentTool<
  ToolParamsSchema extends z.ZodType,
  const PkgNames extends string,
  const PolicyMap extends ToolPolicyMap<any, PkgNames>,
  PolicyMapByPackageName extends PolicyMap['policyByPackageName'],
  PrecheckSuccessSchema extends z.ZodType | undefined = undefined,
  PrecheckFailSchema extends z.ZodType | undefined = undefined,
  ExecuteSuccessSchema extends z.ZodType | undefined = undefined,
  ExecuteFailSchema extends z.ZodType | undefined = undefined,
  PrecheckFn extends
    | ToolLifecycleFunction<
        ToolParamsSchema,
        PolicyEvaluationResultContext<PolicyMapByPackageName>,
        PrecheckSuccessSchema,
        PrecheckFailSchema
      >
    | undefined =
    | undefined
    | ToolLifecycleFunction<
        ToolParamsSchema,
        PolicyEvaluationResultContext<PolicyMapByPackageName>,
        PrecheckSuccessSchema,
        PrecheckFailSchema
      >,
  ExecuteFn extends ToolLifecycleFunction<
    ToolParamsSchema,
    ToolExecutionPolicyContext<PolicyMapByPackageName>,
    ExecuteSuccessSchema,
    ExecuteFailSchema
  > = ToolLifecycleFunction<
    ToolParamsSchema,
    ToolExecutionPolicyContext<PolicyMapByPackageName>,
    ExecuteSuccessSchema,
    ExecuteFailSchema
  >,
>(
  toolDef: VincentToolDef<
    ToolParamsSchema,
    PkgNames,
    PolicyMap,
    PolicyMapByPackageName,
    PrecheckSuccessSchema,
    PrecheckFailSchema,
    ExecuteSuccessSchema,
    ExecuteFailSchema,
    ToolDefLifecycleFunction<
      ToolParamsSchema,
      PolicyEvaluationResultContext<PolicyMapByPackageName>,
      PrecheckSuccessSchema,
      PrecheckFailSchema
    >,
    ToolDefLifecycleFunction<
      ToolParamsSchema,
      ToolExecutionPolicyContext<PolicyMapByPackageName>,
      ExecuteSuccessSchema,
      ExecuteFailSchema
    >
  >,
) {
  const { policyByPackageName: policyMap } = toolDef.policyMap;

  const originalToolDef = {
    ...toolDef,
  };

  const wrappedToolDef = {
    ...originalToolDef,

    ...(originalToolDef.precheck !== undefined
      ? {
          precheck: async (
            params: z.infer<ToolParamsSchema>,
            baseToolContext: BaseToolContext<PolicyEvaluationResultContext<PolicyMapByPackageName>>,
          ) => {
            try {
              const { toolParamsSchema, precheckSuccessSchema, precheckFailSchema } = toolDef;

              const context = createPrecheckToolContext<
                PrecheckSuccessSchema,
                PrecheckFailSchema,
                PolicyMapByPackageName
              >({
                baseContext: baseToolContext,
                successSchema: originalToolDef.precheckSuccessSchema,
                failSchema: originalToolDef.precheckFailSchema,
              });

              const parsedToolParams = validateOrFail(
                params.toolParams,
                toolParamsSchema,
                'precheck',
                'input',
              );

              if (isToolFailureResponse(parsedToolParams)) {
                return parsedToolParams;
              }

              const { precheck: precheckFn } = originalToolDef;

              if (!precheckFn) {
                throw new Error('precheck function unexpectedly missing');
              }

              const result = await precheckFn(params, context);

              const { schemaToUse } = getSchemaForToolResponseResult({
                value: result,
                successResultSchema: precheckSuccessSchema,
                failureResultSchema: precheckFailSchema,
              });

              const parsed = validateOrFail(
                result as ToolResponse<PrecheckSuccessSchema, PrecheckFailSchema>,
                schemaToUse,
                'precheck',
                'output',
              );

              if (isToolResponse(parsed)) {
                return parsed;
              }

              return createToolFailureResult({
                message: 'Tool returned invalid result shape from precheck()',
              });
            } catch (err) {
              return createToolFailureResult({
                message: err instanceof Error ? err.message : 'Unknown error',
              });
            }
          },
        }
      : { precheck: undefined }),

    execute: async (
      params: z.infer<ToolParamsSchema>,
      baseToolContext: BaseToolContext<ToolExecutionPolicyEvaluationResult<PolicyMapByPackageName>>,
    ) => {
      try {
        const context = createExecutionToolContext<
          ExecuteSuccessSchema,
          ExecuteFailSchema,
          PolicyMapByPackageName
        >({
          baseContext: baseToolContext,
          successSchema: originalToolDef.executeSuccessSchema,
          failSchema: originalToolDef.executeFailSchema,
          supportedPolicies: policyMap as PolicyMapByPackageName,
        });

        const { toolParamsSchema, executeSuccessSchema, executeFailSchema } = toolDef;

        const parsedToolParams = validateOrFail(
          params.toolParams,
          toolParamsSchema,
          'execute',
          'input',
        );

        if (isToolFailureResponse(parsedToolParams)) {
          return parsedToolParams;
        }

        const result = await originalToolDef.execute(params, context);

        const { schemaToUse } = getSchemaForToolResponseResult({
          value: result,
          successResultSchema: executeSuccessSchema,
          failureResultSchema: executeFailSchema,
        });

        const parsed = validateOrFail(
          result as ToolResponse<ExecuteSuccessSchema, ExecuteFailSchema>,
          schemaToUse,
          'execute',
          'output',
        );

        if (isToolResponse(parsed)) {
          return parsed;
        }

        return createToolFailureResult({
          message: 'Tool returned invalid result shape from execute()',
        });
      } catch (err) {
        return createToolFailureResult({
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
  };

  return {
    ...wrappedToolDef,
    __schemaTypes: {
      precheckSuccessSchema: toolDef.precheckSuccessSchema,
      precheckFailSchema: toolDef.precheckFailSchema,
      executeSuccessSchema: toolDef.executeSuccessSchema,
      executeFailSchema: toolDef.executeFailSchema,
    },
  } as VincentToolDef<
    ToolParamsSchema,
    PkgNames,
    PolicyMap,
    PolicyMapByPackageName,
    PrecheckSuccessSchema,
    PrecheckFailSchema,
    ExecuteSuccessSchema,
    ExecuteFailSchema,
    PrecheckFn,
    ExecuteFn
  > & {
    supportedPolicies: PolicyMapByPackageName;
    precheck: (typeof wrappedToolDef)['precheck'];
    execute: (typeof wrappedToolDef)['execute'];
    __schemaTypes: {
      precheckSuccessSchema: PrecheckSuccessSchema;
      precheckFailSchema: PrecheckFailSchema;
      executeSuccessSchema: ExecuteSuccessSchema;
      executeFailSchema: ExecuteFailSchema;
    };
  };
}
