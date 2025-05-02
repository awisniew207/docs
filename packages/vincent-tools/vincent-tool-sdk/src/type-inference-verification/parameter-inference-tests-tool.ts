/**
 * Tool Parameter Type Inference Testing
 *
 * This file tests the TypeScript type inference for tool parameters,
 * policy results, and context manipulation.
 */
import z from 'zod';
import { createVincentTool } from '../lib/vincentTool';
import { createVincentToolPolicy } from '../lib/vincentPolicy';

// Define a schema for our test cases
const testSchema = z.object({
  action: z.string(),
  target: z.string(),
  options: z
    .object({
      priority: z.number().optional(),
      dryRun: z.boolean().optional(),
    })
    .optional(),
});

/**
 * Test Case 1: Basic parameter type inference
 */
function testBasicParameterInference() {
  // Create a simple policy for testing
  const testPolicy = createVincentToolPolicy({
    toolParamsSchema: testSchema,
    policyDef: {
      ipfsCid: 'test-policy',
      toolParamsSchema: z.object({
        operation: z.string(),
      }),
      evalAllowResultSchema: z.object({
        allowed: z.boolean(),
      }),
      evaluate: async (params, context) => {
        return context.allow({ allowed: true });
      },
    },
    toolParameterMappings: {
      action: 'operation',
    },
  });

  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: { testPolicy },

    precheck: async (params, context) => {
      // Params should have the correct types
      const { action, target, options } = params;

      // String operations should work on string fields
      action.toUpperCase();
      target.toLowerCase();

      // @ts-expect-error - Using number methods on string
      action.toFixed(2);

      // Optional field access should work
      if (options) {
        const { priority, dryRun } = options;

        // Number operations should work if present
        if (priority !== undefined) {
          priority.toFixed(2);

          // @ts-expect-error - Using string methods on number
          priority.toUpperCase();
        }

        // Boolean operations should work if present
        if (dryRun !== undefined) {
          const isDry = dryRun === true;
          console.log(isDry);

          // @ts-expect-error - Using string methods on boolean
          dryRun.toUpperCase();
        }
      }

      return context.succeed();
    },

    execute: async (params, context) => {
      // Same parameter validation in execute
      const { action, target, options } = params;
      console.log(target);

      // String operations should work
      action.toUpperCase();

      // @ts-expect-error - Using array methods on string
      action.push('new');

      // Optional fields with correct types
      if (options?.priority) {
        options.priority.toFixed(2);
      }

      return context.succeed();
    },
  });

  return tool;
}

/**
 * Test Case 2: Policy result type inference
 */
function testPolicyResultInference() {
  // Create a policy with complex result type
  const complexPolicy = createVincentToolPolicy({
    toolParamsSchema: testSchema,
    policyDef: {
      ipfsCid: 'complex-policy',
      toolParamsSchema: z.object({
        command: z.string(),
      }),
      evalAllowResultSchema: z.object({
        level: z.enum(['low', 'medium', 'high']),
        metadata: z.object({
          timestamp: z.number(),
          signature: z.string(),
        }),
        flags: z.array(z.string()),
      }),
      evaluate: async (params, context) => {
        return context.allow({
          level: 'medium',
          metadata: {
            timestamp: Date.now(),
            signature: 'sig123',
          },
          flags: ['verbose', 'secure'],
        });
      },
    },
    toolParameterMappings: {
      action: 'command',
    },
  });

  // Create policy with commit function
  const commitPolicy = createVincentToolPolicy({
    toolParamsSchema: testSchema,
    policyDef: {
      ipfsCid: 'commit-policy',
      toolParamsSchema: z.object({
        resource: z.string(),
      }),
      evalAllowResultSchema: z.object({
        transactionId: z.string(),
      }),
      commitParamsSchema: z.object({
        transactionId: z.string(),
        status: z.enum(['complete', 'abort']),
      }),
      commitAllowResultSchema: z.object({
        success: z.boolean(),
        timestamp: z.number(),
      }),
      evaluate: async (params, context) => {
        return context.allow({
          transactionId: 'tx123',
        });
      },
      commit: async (params, context) => {
        return context.allow({
          success: params.status === 'complete',
          timestamp: Date.now(),
        });
      },
    },
    toolParameterMappings: {
      target: 'resource',
    },
  });

  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: {
      complexPolicy,
      commitPolicy,
    },

    precheck: async (params, context) => {
      const { policyResults } = context;

      // Testing allow/deny branch type inference
      if (policyResults.allow) {
        // When allowed, policy results should be accessible
        if (policyResults.allowPolicyResults.complexPolicy) {
          const { level, metadata, flags } =
            policyResults.allowPolicyResults.complexPolicy.result;

          // Enum type should be correctly inferred
          switch (level) {
            case 'low':
            case 'medium':
            case 'high':
              break;
            // @ts-expect-error - Invalid enum value
            case 'invalid':
              break;
          }

          // Nested objects should be correctly typed
          const { timestamp, signature } = metadata;
          timestamp.toFixed(0);
          signature.toUpperCase();

          // @ts-expect-error - Using wrong method type
          timestamp.toUpperCase();

          // Arrays should be correctly typed
          flags.forEach((flag) => {
            flag.toUpperCase();
          });

          // @ts-expect-error - flags is string[], not number[]
          flags.map((flag) => flag.toFixed(2));
        }

        // @ts-expect-error - denyPolicyResult shouldn't exist when allowed
        const denyResult = policyResults.denyPolicyResult;
      } else {
        // When denied, denyPolicyResult should exist
        const { ipfsCid, result } = policyResults.denyPolicyResult;
        console.log(ipfsCid, result);
      }

      return context.succeed();
    },

    execute: async (params, context) => {
      const { policyResults } = context;

      // Testing commit function type inference
      if (policyResults.allowPolicyResults.commitPolicy) {
        const { transactionId } =
          policyResults.allowPolicyResults.commitPolicy.result;

        // Commit function should be correctly typed
        const commitFn = policyResults.allowPolicyResults.commitPolicy.commit;

        // Valid commit parameters
        const commitResult = await commitFn({
          transactionId,
          status: 'complete',
        });

        await commitFn({
          transactionId,
          // @ts-expect-error - Invalid enum value
          status: 'invalid',
        });

        // @ts-expect-error - Missing required parameter
        await commitFn({
          transactionId,
        });

        // Result type checking
        if (commitResult.allow) {
          const { success, timestamp } = commitResult.result;

          // Boolean operations
          const isSuccess = success === true;
          console.log(isSuccess);

          // Number operations
          timestamp.toFixed(0);

          // @ts-expect-error - Using wrong method
          success.toFixed(0);
        }
      }

      return context.succeed();
    },
  });

  return tool;
}

/**
 * Test Case 3: Complex destructuring and inference
 */
function testComplexDestructuring() {
  // Create a simple policy
  const testPolicy = createVincentToolPolicy({
    toolParamsSchema: testSchema,
    policyDef: {
      ipfsCid: 'test-policy',
      toolParamsSchema: z.object({
        action: z.string(),
      }),
      evalAllowResultSchema: z.object({
        data: z.any(),
      }),
      evaluate: async (params, context) => {
        return context.allow({ data: {} });
      },
    },
    toolParameterMappings: {
      action: 'action',
    },
  });

  // Define success and failure schemas
  const successSchema = z.object({
    result: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
    metadata: z.record(z.string()),
  });

  const failSchema = z.object({
    error: z.object({
      code: z.number(),
      message: z.string(),
      details: z.array(z.string()).optional(),
    }),
  });

  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: { testPolicy },
    executeSuccessSchema: successSchema,
    executeFailSchema: failSchema,

    precheck: async (params, context) => {
      return context.succeed();
    },

    execute: async (params, context) => {
      // Destructure deeply
      const { addDetails, succeed, fail } = context;

      // Validate that types are preserved through destructuring
      addDetails(['Test details']);

      // @ts-expect-error - Wrong argument type
      addDetails(123);

      // Check complex union type handling
      succeed({
        // String is valid in the union
        result: 'string result',
        metadata: { source: 'test' },
      });

      succeed({
        // Number is valid in the union
        result: 123,
        metadata: { source: 'test' },
      });

      succeed({
        // Array of strings is valid in the union
        result: ['one', 'two', 'three'],
        metadata: { source: 'test' },
      });

      succeed({
        // @ts-expect-error - Object is not in the union
        result: { key: 'value' },
        metadata: { source: 'test' },
      });

      succeed({
        // @ts-expect-error - Array of numbers is not in the union
        result: [1, 2, 3],
        metadata: { source: 'test' },
      });

      // Test complex nested object validation
      fail({
        error: {
          code: 500,
          message: 'Internal error',
          details: ['detail1', 'detail2'],
        },
      });

      fail({
        error: {
          code: 400,
          message: 'Bad request',
          // details is optional, can be omitted
        },
      });

      fail({
        error: {
          // @ts-expect-error - Wrong type for code
          code: '400', // Should be number
          message: 'Bad request',
        },
      });

      fail({
        // @ts-expect-error - Missing required message
        error: {
          code: 400,
        },
      });

      return succeed({
        result: 'final result',
        metadata: { status: 'complete' },
      });
    },
  });

  return tool;
}

/**
 * Test Case 4: Advanced parameter validation
 */
function testAdvancedParameterValidation() {
  // Create a schema with complex types
  const advancedSchema = z.object({
    action: z.enum(['create', 'read', 'update', 'delete']),
    target: z.string().regex(/^[a-z0-9-]+$/),
    data: z
      .union([
        z.object({ type: z.literal('string'), value: z.string() }),
        z.object({ type: z.literal('number'), value: z.number() }),
        z.object({ type: z.literal('boolean'), value: z.boolean() }),
      ])
      .optional(),
    metadata: z.record(z.string()).optional(),
  });

  // Create a policy
  const testPolicy = createVincentToolPolicy({
    toolParamsSchema: advancedSchema,
    policyDef: {
      ipfsCid: 'test-policy',
      toolParamsSchema: z.object({
        op: z.string(),
      }),
      evalAllowResultSchema: z.boolean(),
      evaluate: async (params, context) => {
        return context.allow(true);
      },
    },
    toolParameterMappings: {
      action: 'op',
    },
  });

  const tool = createVincentTool({
    toolParamsSchema: advancedSchema,
    supportedPolicies: { testPolicy },

    precheck: async (params, context) => {
      // Test enum type inference
      const { action } = params;

      // Valid enum values should be allowed
      switch (action) {
        case 'create':
        case 'read':
        case 'update':
        case 'delete':
          break;
        // @ts-expect-error - Invalid enum value
        case 'invalid':
          break;
      }

      // Test discriminated union type inference
      if (params.data) {
        // TypeScript should narrow based on the 'type' field
        switch (params.data.type) {
          case 'string':
            // Value should be a string when type is 'string'
            params.data.value.toUpperCase();
            // @ts-expect-error - Not a number operation
            params.data.value.toFixed(2);
            break;

          case 'number':
            // Value should be a number when type is 'number'
            params.data.value.toFixed(2);
            // @ts-expect-error - Not a string operation
            params.data.value.toUpperCase();
            break;

          case 'boolean':
            // Value should be a boolean when type is 'boolean'
            const isTrue = params.data.value === true;
            console.log(isTrue);
            // @ts-expect-error - Not a string operation
            params.data.value.toUpperCase();
            break;
        }
      }

      return context.succeed();
    },

    execute: async (params, context) => {
      // Further test discriminated union handling
      if (params.data) {
        const { type, value } = params.data;

        if (type === 'string') {
          // String operations
          value.includes('test');
        } else if (type === 'number') {
          // Number operations
          value.toFixed(2);
          // @ts-expect-error - Not available on number
          value.includes('test');
        } else if (type === 'boolean') {
          // Boolean operations
          const isFalse = !value;
          console.log(isFalse);
          // @ts-expect-error - Not available on boolean
          value.toFixed(2);
        }
      }

      return context.succeed();
    },
  });

  return tool;
}

/**
 * Test Case 5: Validating missing types cause errors
 */
function testMissingTypes() {
  // Create a policy
  const testPolicy = createVincentToolPolicy({
    toolParamsSchema: testSchema,
    policyDef: {
      ipfsCid: 'test',
      toolParamsSchema: z.object({ op: z.string() }),
      evalAllowResultSchema: z.object({ data: z.string() }),
      evaluate: async (params, context) => {
        return context.allow({ data: 'test' });
      },
    },
    toolParameterMappings: { action: 'op' },
  });

  // Define result schema
  const successSchema = z.object({
    result: z.string(),
  });

  // Case where success schema is defined but fail schema is not
  const toolWithOnlySuccessSchema = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: { testPolicy },
    executeSuccessSchema: successSchema,

    precheck: async (params, context) => {
      return context.succeed();
    },

    execute: async (params, context) => {
      // Should be able to succeed with schema
      context.succeed({ result: 'test' });

      // Should be able to fail with just an error string since no fail schema
      context.fail('Error message');

      // @ts-expect-error - Can't fail with an object when no fail schema defined
      context.fail({ error: 'message' });

      return context.succeed({ result: 'final' });
    },
  });

  // Case with failSchema but no successSchema
  const failSchema = z.object({
    error: z.string(),
  });

  const toolWithOnlyFailSchema = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: { testPolicy },
    executeFailSchema: failSchema,

    precheck: async (params, context) => {
      return context.succeed();
    },

    execute: async (params, context) => {
      // Should be able to succeed with no args since no success schema
      context.succeed();

      // Should be able to fail with schema
      context.fail({ error: 'test error' });

      // @ts-expect-error - Can't succeed with an object when no success schema defined
      context.succeed({ result: 'success' });

      return context.succeed();
    },
  });

  return { toolWithOnlySuccessSchema, toolWithOnlyFailSchema };
}

// Export all test cases
export const toolParameterTests = {
  testBasicParameterInference,
  testPolicyResultInference,
  testComplexDestructuring,
  testAdvancedParameterValidation,
  testMissingTypes,
};
