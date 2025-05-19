// src/lib/policyCore/helpers/resultCreators.ts

import { z, ZodType } from 'zod';
import {
  PolicyResponseAllow,
  PolicyResponseAllowNoResult,
  PolicyResponseDeny,
  PolicyResponseDenyNoResult,
  PolicyEvaluationResultContext,
} from '../../types';

/**
 * Overload: return a fully-typed deny response with a result
 */
export function createDenyResult<T>(params: { message: string; result: T }): PolicyResponseDeny<T>;
/**
 * Overload: return a deny response with no result
 */
export function createDenyResult(params: { message: string }): PolicyResponseDenyNoResult;
/**
 * Implementation
 */
export function createDenyResult<T>(params: {
  message: string;
  result?: T;
}): PolicyResponseDeny<T> | PolicyResponseDenyNoResult {
  if (params.result === undefined) {
    return {
      allow: false,
      error: params.message,
      result: undefined as never,
    };
  }

  return {
    allow: false,
    error: params.message,
    result: params.result,
  };
}

export function createDenyNoResult(message: string): PolicyResponseDenyNoResult {
  return createDenyResult({ message });
}

/**
 * Overload: return a fully-typed allow response with a result
 */
export function createAllowResult<T>(params: { result: T }): PolicyResponseAllow<T>;

/**
 * Overload: return an allow response with no result
 */

/**
 * Implementation
 */
export function createAllowResult<T>(params: {
  result?: T;
}): PolicyResponseAllow<T> | PolicyResponseAllowNoResult {
  if (params.result === undefined) {
    return {
      allow: true,
      result: undefined as never,
    };
  }

  return {
    allow: true,
    result: params.result,
  };
}

export function createAllowEvaluationResult<PolicyMapType extends Record<string, any>>(params: {
  evaluatedPolicies: Array<keyof PolicyMapType>;
  allowedPolicies: PolicyEvaluationResultContext<PolicyMapType>['allowedPolicies'];
}): PolicyEvaluationResultContext<PolicyMapType> {
  return {
    allow: true,
    evaluatedPolicies: params.evaluatedPolicies,
    allowedPolicies: params.allowedPolicies,
    deniedPolicy: undefined, // important for union discrimination
  } as PolicyEvaluationResultContext<PolicyMapType>;
}

export function createDenyEvaluationResult<PolicyMapType extends Record<string, any>>(params: {
  evaluatedPolicies: Array<keyof PolicyMapType>;
  allowedPolicies: PolicyEvaluationResultContext<PolicyMapType>['allowedPolicies'];
  deniedPolicy: PolicyEvaluationResultContext<PolicyMapType>['deniedPolicy'];
}): PolicyEvaluationResultContext<PolicyMapType> {
  return {
    allow: false,
    evaluatedPolicies: params.evaluatedPolicies,
    allowedPolicies: params.allowedPolicies,
    deniedPolicy: params.deniedPolicy,
  } as PolicyEvaluationResultContext<PolicyMapType>;
}

// Wraps a validated value as a typed allow result
export function wrapAllow<T extends ZodType<any, any, any>>(
  value: z.infer<T>,
): PolicyResponseAllow<z.infer<T>> {
  return createAllowResult({ result: value });
}

// Wraps a deny result as fully typed (for schema-defined denials)
export function wrapDeny<T extends ZodType<any, any, any>>(
  message: string,
  result: z.infer<T>,
): PolicyResponseDeny<z.infer<T>> {
  return createDenyResult({ message, result });
}

// Wraps a schema-less denial into a conditionally valid deny return
export function returnNoResultDeny<T extends ZodType<any, any, any> | undefined>(
  message: string,
): T extends ZodType<any, any, any> ? PolicyResponseDeny<z.infer<T>> : PolicyResponseDenyNoResult {
  return createDenyNoResult(message) as any;
}

// Optionally: type guard if needed
export function isTypedAllowResponse<T extends ZodType<any, any, any>>(
  val: unknown,
): val is PolicyResponseAllow<z.infer<T>> {
  return typeof val === 'object' && val !== null && (val as any).allow === true;
}
