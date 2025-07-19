// src/lib/toolCore/helpers/resultCreators.ts

import type { z, ZodType } from 'zod';

import type {
  ToolResultFailure,
  ToolResultFailureNoResult,
  ToolResultSuccess,
  ToolResultSuccessNoResult,
  SchemaValidationError,
} from '../../types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function createToolSuccessResult(): ToolResultSuccessNoResult;
export function createToolSuccessResult<T>({ result }: { result: T }): ToolResultSuccess<T>;
export function createToolSuccessResult<T>(args?: {
  result: T;
}): ToolResultSuccess<T> | ToolResultSuccessNoResult {
  if (!args || args.result === undefined) {
    return { success: true };
  }
  return { success: true, result: args.result };
}

export function createToolFailureResult({
  runtimeError,
  schemaValidationError,
}: {
  runtimeError?: string;
  schemaValidationError?: SchemaValidationError;
}): ToolResultFailureNoResult;
export function createToolFailureResult<T>({
  message,
  result,
  schemaValidationError,
}: {
  result: T;
  message?: string;
  schemaValidationError?: SchemaValidationError;
}): ToolResultFailure<T>;
export function createToolFailureResult<T>({
  message,
  result,
  schemaValidationError,
}: {
  result?: T;
  message?: string;
  schemaValidationError?: SchemaValidationError;
}): ToolResultFailure<T> | ToolResultFailureNoResult {
  if (result === undefined) {
    return {
      success: false,
      runtimeError: message,
      result: undefined as never,
      ...(schemaValidationError ? { schemaValidationError } : {}),
    };
  }

  return {
    success: false,
    runtimeError: message,
    result,
    ...(schemaValidationError ? { schemaValidationError } : {}),
  };
}

export function createToolFailureNoResult(
  message: string,
  schemaValidationError?: SchemaValidationError,
): ToolResultFailureNoResult {
  return createToolFailureResult({ runtimeError: message, schemaValidationError });
}

export function wrapFailure<T extends z.ZodType<any, any, any>>(
  value: z.infer<T>,
  message?: string,
  schemaValidationError?: SchemaValidationError,
): ToolResultFailure<z.infer<T>> {
  return createToolFailureResult({ result: value, message, schemaValidationError });
}

export function wrapNoResultFailure<T extends ZodType<any, any, any> | undefined>(
  message: string,
  schemaValidationError?: SchemaValidationError,
): T extends ZodType<any, any, any> ? ToolResultFailure<z.infer<T>> : ToolResultFailureNoResult {
  return createToolFailureNoResult(message, schemaValidationError) as any;
}

export function wrapSuccess<T extends z.ZodType<any, any, any>>(
  value: z.infer<T>,
): ToolResultSuccess<z.infer<T>> {
  return createToolSuccessResult({ result: value });
}

export function wrapNoResultSuccess(): ToolResultSuccessNoResult {
  return createToolSuccessResult();
}
