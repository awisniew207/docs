import type { z } from 'zod';

import type {
  BaseToolContext,
  PolicyEvaluationResultContext,
} from '@lit-protocol/vincent-tool-sdk';

export { type BaseToolContext };

/**
 * The Vincent Tool Client is used to interact with Vincent tools.
 *
 * - Precheck tool parameters and policies
 * - Execute tools remotely
 *
 * @typeParam ToolParamsSchema {@removeTypeParameterCompletely}
 * @typeParam PoliciesByPackageName {@removeTypeParameterCompletely}
 * @typeParam ExecuteSuccessSchema {@removeTypeParameterCompletely}
 * @typeParam ExecuteFailSchema {@removeTypeParameterCompletely}
 * @typeParam PrecheckSuccessSchema {@removeTypeParameterCompletely}
 * @typeParam PrecheckFailSchema {@removeTypeParameterCompletely}
 *
 * @category Interfaces
 */
export interface VincentToolClient<
  ToolParamsSchema extends z.ZodType,
  PoliciesByPackageName extends Record<string, any>,
  ExecuteSuccessSchema extends z.ZodType = z.ZodUndefined,
  ExecuteFailSchema extends z.ZodType = z.ZodUndefined,
  PrecheckSuccessSchema extends z.ZodType = z.ZodUndefined,
  PrecheckFailSchema extends z.ZodType = z.ZodUndefined,
> {
  /**
   * Performs a precheck of the tool parameters and policies.
   *
   * This method validates the tool parameters and checks if the policies allow the tool to be executed.
   *
   * @param rawToolParams - The parameters to be passed to the tool
   * @param context - The context for the tool execution, including the delegator PKP Ethereum address
   * @returns A promise that resolves to a ToolResponse containing the precheck result
   */
  precheck(
    rawToolParams: z.infer<ToolParamsSchema>,
    context: ToolClientContext & {
      rpcUrl?: string;
    }
  ): Promise<ToolResponse<PrecheckSuccessSchema, PrecheckFailSchema, PoliciesByPackageName>>;

  /**
   * Executes the tool with the given parameters.
   *
   * This method validates the tool parameters, executes the tool remotely, and returns the result.
   *
   * @param rawToolParams - The parameters to be passed to the tool
   * @param context - The context for the tool execution, including the delegator PKP Ethereum address
   * @returns A promise that resolves to a ToolResponse containing the execution result
   *
   */
  execute(
    rawToolParams: z.infer<ToolParamsSchema>,
    context: ToolClientContext
  ): Promise<ToolResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>>;
}

/** @category Interfaces */
export interface ToolResponseSuccess<Result, Policies extends Record<string, any>> {
  success: true;
  result: Result;
  context?: BaseToolContext<PolicyEvaluationResultContext<Policies>>;
}

/** @category Interfaces */
export interface ToolResponseSuccessNoResult<Policies extends Record<string, any>> {
  success: true;
  result?: never;
  context?: BaseToolContext<PolicyEvaluationResultContext<Policies>>;
}

/** @category Interfaces */
export interface ToolResponseFailure<Result, Policies extends Record<string, any>> {
  success: false;
  error?: string;
  result: Result;
  context?: BaseToolContext<PolicyEvaluationResultContext<Policies>>;
}

/** @category Interfaces */
export interface ToolResponseFailureNoResult<Policies extends Record<string, any>> {
  success: false;
  error?: string;
  result?: never;
  context?: BaseToolContext<PolicyEvaluationResultContext<Policies>>;
}

/** @category Interfaces */
export type ToolResponse<
  SuccessSchema extends z.ZodType | undefined,
  FailSchema extends z.ZodType | undefined,
  Policies extends Record<string, any>,
> =
  | (SuccessSchema extends z.ZodType
      ? ToolResponseSuccess<z.infer<SuccessSchema>, Policies>
      : ToolResponseSuccessNoResult<Policies>)
  | (FailSchema extends z.ZodType
      ? ToolResponseFailure<z.infer<FailSchema>, Policies>
      : ToolResponseFailureNoResult<Policies>);

export interface RemoteVincentToolExecutionResult<
  SuccessSchema extends z.ZodType | undefined,
  FailSchema extends z.ZodType | undefined,
  Policies extends Record<string, any>,
> {
  toolExecutionResult: ToolResponse<SuccessSchema, FailSchema, Policies>;
  toolContext: BaseToolContext<PolicyEvaluationResultContext<Policies>>;
}

/** @category Interfaces */
export interface ToolClientContext {
  delegatorPkpEthAddress: string;
}
