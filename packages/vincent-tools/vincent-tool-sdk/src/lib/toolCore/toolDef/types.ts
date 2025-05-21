// src/lib/toolCore/toolDef/types.ts

import { z } from 'zod';
import {
  ContextFailure,
  ContextFailureNoResult,
  ContextSuccess,
  ContextSuccessNoResult,
  EnforceToolResponse,
  ToolContext,
} from './context/types';
import { PolicyEvaluationResultContext, ToolExecutionPolicyContext } from '../../types';
import { ToolPolicyMap } from '../helpers';

export type ToolDefLifecycleFunction<
  ToolParams extends z.ZodType,
  Policies,
  SuccessSchema extends z.ZodType | undefined,
  FailSchema extends z.ZodType | undefined,
> = (
  args: {
    toolParams: z.infer<ToolParams>;
    policiesContext: Policies;
  },
  context: ToolContext<SuccessSchema, FailSchema, Policies>,
) => Promise<
  EnforceToolResponse<
    | (SuccessSchema extends z.ZodType
        ? ContextSuccess<z.infer<SuccessSchema>>
        : ContextSuccessNoResult)
    | (FailSchema extends z.ZodType ? ContextFailure<z.infer<FailSchema>> : ContextFailureNoResult)
  >
>;

export type VincentToolDef<
  ToolParamsSchema extends z.ZodType,
  PkgNames extends string,
  PolicyMap extends ToolPolicyMap<any, PkgNames>,
  PolicyMapType extends PolicyMap['policyByPackageName'],
  PrecheckSuccessSchema extends z.ZodType | undefined = undefined,
  PrecheckFailSchema extends z.ZodType | undefined = undefined,
  ExecuteSuccessSchema extends z.ZodType | undefined = undefined,
  ExecuteFailSchema extends z.ZodType | undefined = undefined,
  PrecheckFn =
    | undefined
    | ToolDefLifecycleFunction<
        ToolParamsSchema,
        PolicyEvaluationResultContext<PolicyMapType>,
        PrecheckSuccessSchema,
        PrecheckFailSchema
      >,
  ExecuteFn = ToolDefLifecycleFunction<
    ToolParamsSchema,
    ToolExecutionPolicyContext<PolicyMapType>,
    ExecuteSuccessSchema,
    ExecuteFailSchema
  >,
> = {
  toolParamsSchema: ToolParamsSchema;
  policyMap: PolicyMap;

  precheckSuccessSchema?: PrecheckSuccessSchema;
  precheckFailSchema?: PrecheckFailSchema;
  executeSuccessSchema?: ExecuteSuccessSchema;
  executeFailSchema?: ExecuteFailSchema;

  precheck?: PrecheckFn;
  execute: ExecuteFn;
};
