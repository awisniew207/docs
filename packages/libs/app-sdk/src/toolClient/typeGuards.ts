// src/lib/toolClient/typeGuards.ts

import type {
  RemoteVincentToolExecutionResult,
  ToolExecuteResponse,
  ToolExecuteResponseFailure,
  ToolExecuteResponseFailureNoResult,
  ToolExecuteResponseSuccess,
  ToolExecuteResponseSuccessNoResult,
} from './execute/types';

/** @category API */
export function isToolResponseSuccess(
  value: unknown
): value is
  | ToolExecuteResponseSuccess<any, Record<string, any>>
  | ToolExecuteResponseSuccessNoResult<Record<string, any>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as any).success === true
  );
}

/** @category API */
export function isToolResponseFailure(
  value: unknown
): value is
  | ToolExecuteResponseFailure<any, Record<string, any>>
  | ToolExecuteResponseFailureNoResult<Record<string, any>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as any).success === false
  );
}

/** @category API */
export function isToolResponseRuntimeFailure(
  value: unknown
): value is ToolExecuteResponseFailureNoResult<Record<string, any>> {
  if (!isToolResponseFailure(value)) return false;

  return 'runtimeError' in value && typeof (value as any).runtimeError === 'string';
}

/** @category API */
export function isToolResponseSchemaValidationFailure(
  value: unknown
): value is ToolExecuteResponseFailureNoResult<Record<string, any>> {
  if (!isToolResponseFailure(value)) return false;
  return (
    'schemaValidationError' in value && typeof (value as any).schemaValidationError === 'object'
  );
}

/** @hidden */
export function isToolResponse(
  value: unknown
): value is ToolExecuteResponse<any, any, Record<string, any>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as any).success === 'boolean'
  );
}

/** @hidden */
export function isRemoteVincentToolExecutionResult(
  value: unknown
): value is RemoteVincentToolExecutionResult<any, any, Record<any, any>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toolExecutionResult' in value &&
    'toolContext' in value &&
    isToolResponse((value as any).toolExecutionResult) &&
    typeof (value as any).toolContext === 'object' &&
    (value as any).toolContext !== null
  );
}
