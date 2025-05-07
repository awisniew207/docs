/**
 * Tool Definition Type Checking
 *
 * This file validates that TypeScript correctly enforces type constraints
 * for tool definitions, focusing on success/failure responses.
 */
import { z } from 'zod';
import { createVincentTool } from '../lib/vincentTool';
import { createVincentToolPolicy } from '../lib/vincentPolicy';

// Define a simple schema for our test cases
const testSchema = z.object({
  action: z.string(),
  target: z.string(),
  amount: z.number().optional(),
});

// Define result schemas for different test cases
const successSchema = z.object({
  message: z.string(),
});

const failSchema = z.object({
  error: z.string(),
  code: z.number(),
});

// Create a test policy
const testPolicy = createVincentToolPolicy({
  toolParamsSchema: testSchema,
  policyDef: {
    ipfsCid: 'test-policy',
    package: '@lit-protocol/test-policy@1.0.0',
    toolParamsSchema: z.object({
      actionType: z.string(),
    }),
    evalAllowResultSchema: z.object({
      approved: z.boolean(),
    }),
    evaluate: async (params, { allow }) => {
      return allow({ approved: true });
    },
  },
  toolParameterMappings: {
    action: 'actionType',
  },
});

/**
 * Test Case 1: Basic tool with no schemas
 * This validates the behavior when no explicit schemas are provided.
 */
function testNoSchemas() {
  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],

    precheck: async (params, { succeed, fail }) => {
      // Should allow succeed() with no arguments
      succeed();

      // Should allow fail() with string error
      fail('Error message');

      // @ts-expect-error - Should not allow succeed() with arguments when no schema
      succeed({ message: 'test' });

      // @ts-expect-error - Should not allow fail() with object when no schema
      fail({ error: 'test' });

      return succeed();
    },

    execute: async (params, { succeed }) => {
      // Should allow succeed() with no arguments
      return succeed();

      // @ts-expect-error - Should not allow succeed() with arguments when no schema
      return succeed({ data: 'test' });
    },
  });

  return tool;
}

/**
 * Test Case 2: Tool with explicit success/fail schemas
 * This validates that TypeScript enforces schema constraints.
 */
function testWithSchemas() {
  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],
    executeSuccessSchema: successSchema,
    executeFailSchema: failSchema,

    precheck: async (params, { succeed }) => {
      return succeed();
    },

    execute: async (params, { succeed, fail }) => {
      // Should allow succeed() with valid schema
      succeed({
        message: 'Operation completed',
      });

      // Should allow fail() with valid schema
      fail({
        error: 'Something went wrong',
        code: 400,
      });

      // @ts-expect-error - Missing required fields
      succeed({});

      succeed({
        success: true,
        // @ts-expect-error - Wrong type for message
        message: 123,
      });

      succeed({
        message: 'test',
        // @ts-expect-error - Extra unexpected fields
        extra: 'field',
      });

      fail({
        error: 'Error message',
        // @ts-expect-error - Wrong type for error code
        code: '400',
      });

      return succeed({
        message: 'Success',
      });
    },
  });

  return tool;
}

/**
 * Test Case 3: Tool with different precheck and execute schemas
 * This validates that different schema types are correctly enforced.
 */
function testDifferentSchemas() {
  const precheckSuccessSchema = z.object({
    valid: z.boolean(),
  });

  const precheckFailSchema = z.object({
    reason: z.string(),
  });

  const executeSuccessSchema = z.object({
    result: z.string(),
    timestamp: z.number(),
  });

  const executeFailSchema = z.object({
    errorCode: z.number(),
  });

  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],
    precheckSuccessSchema,
    precheckFailSchema,
    executeSuccessSchema,
    executeFailSchema,

    precheck: async (params, { succeed, fail }) => {
      // Valid precheck schema
      succeed({ valid: true });

      // Valid precheck fail schema
      fail({ reason: 'Invalid parameters' });

      // @ts-expect-error - Using execute success schema in precheck
      succeed({ result: 'test', timestamp: 123 });

      // @ts-expect-error - Using execute fail schema in precheck
      fail({ errorCode: 400 });

      return succeed({ valid: true });
    },

    execute: async (params, { succeed, fail }) => {
      // Valid execute schema
      succeed({ result: 'success', timestamp: Date.now() });

      // Valid execute fail schema
      fail({ errorCode: 500 });

      // @ts-expect-error - Using precheck success schema in execute
      succeed({ valid: true });

      // @ts-expect-error - Using precheck fail schema in execute
      fail({ reason: 'Error' });

      return succeed({ result: 'data', timestamp: Date.now() });
    },
  });

  return tool;
}

/**
 * Test Case 4: Context type safety with policy results
 * This validates that policyResults are correctly typed.
 */
function testPolicyResultTypes() {
  // First test: Precheck with properly typed policyResults
  const toolWithPrecheck = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],

    precheck: async (params, { policyResults, succeed }) => {
      // Should be able to check if policy evaluation allowed
      if (policyResults.allow) {
        // Should be able to access the policy result with the correct type
        const result =
          policyResults.allowPolicyResults['@lit-protocol/test-policy@1.0.0'];
        if (result) {
          const { approved } = result.result;
          console.log(approved);
        }

        const invalid =
          // @ts-expect-error - Property doesn't exist on the result type
          policyResults.allowPolicyResults.testPolicy?.result.invalid;
        console.log(invalid);
      } else {
        // Should be able to access deny result when not allowed
        const denyResult = policyResults.denyPolicyResult;
        console.log(denyResult.ipfsCid);
      }

      return succeed();
    },

    execute: async (params, { succeed }) => {
      return succeed();
    },
  });

  return toolWithPrecheck;
}

export function assertAllow<T extends { allow: true }>(
  obj: T,
): asserts obj is T {
  // This function just asserts that obj.allow is true
  // It doesn't actually need to do anything at runtime
  // TypeScript will use it for control flow analysis
}

// Separate test for execute-specific policy result typing
export function testExecutePolicyResultTyping() {
  const toolWithExecute = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],

    precheck: async (params, { succeed }) => {
      return succeed();
    },

    execute: async (params, { policyResults, succeed }) => {
      assertAllow(policyResults);

      // @ts-expect-error - Cannot negate a property known to be true
      const allowIsAlwaysTrue: false = !policyResults.allow;

      // Should have access to test policy result
      const result =
        policyResults.allowPolicyResults['@lit-protocol/test-policy@1.0.0'];
      if (result) {
        // Should be able to access properties of the result
        const { approved } = result.result;
        console.log(approved);
      }

      // @ts-expect-error - denyPolicyResult should not exist in execute
      const denyResult = policyResults.denyPolicyResult[testPolicy];
      console.log(denyResult);

      return succeed();
    },
  });

  return toolWithExecute;
}

/**
 * Test Case 5: Testing improper tool definition should fail
 */
function testImproperToolDefinition() {
  // @ts-expect-error - Missing required precheck function
  const missingPrecheck = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],
    execute: async (params, { succeed }) => {
      return succeed();
    },
  });

  // @ts-expect-error - Missing required execute function
  const missingExecute = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],
    precheck: async (params, { succeed }) => {
      return succeed();
    },
  });

  // @ts-expect-error - Missing required supportedPolicies
  const missingPolicies = createVincentTool({
    toolParamsSchema: testSchema,
    precheck: async (params, { succeed }) => {
      return succeed();
    },
    execute: async (params, { succeed }) => {
      return succeed();
    },
  });

  // @ts-expect-error - Missing required toolParamsSchema
  const missingSchema = createVincentTool({
    supportedPolicies: [testPolicy],
    precheck: async (params, { succeed }) => {
      return succeed();
    },
    execute: async (params, { succeed }) => {
      return succeed();
    },
  });
}

/**
 * Test Case 6: Testing return types are enforced
 * Each sub-test has its own function to properly test at the function definition level.
 */

// Basic tools for tests
const testReturnNoSchema = () => {
  // This is a good tool with proper returns
  const goodTool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],

    precheck: async (params, { succeed }) => {
      return succeed();
    },

    execute: async (params, { succeed }) => {
      return succeed();
    },
  });

  return goodTool;
};

// Test: Precheck with no return
const testPrecheckNoReturn = () => {
  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],

    // @ts-expect-error - Function doesn't return anything
    precheck: async (params, { succeed }) => {
      // No return statement
    },

    execute: async (params, { succeed }) => {
      return succeed();
    },
  });

  return tool;
};

// Test: Execute with no return
const testExecuteNoReturn = () => {
  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],

    precheck: async (params, { succeed }) => {
      return succeed();
    },

    // @ts-expect-error - Function doesn't return anything
    execute: async (params, { succeed }) => {
      // No return statement
    },
  });

  return tool;
};

// Test: Precheck returning raw value
const testPrecheckRawReturn = () => {
  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],

    // @ts-expect-error - Returning raw value instead of ToolPrecheckResponse
    precheck: async (params, { succeed }) => {
      return true;
    },

    execute: async (params, { succeed }) => {
      return succeed();
    },
  });

  return tool;
};

// Test: Execute returning raw value
const testExecuteRawReturn = () => {
  const executeSuccessSchema = z.object({
    success: z.boolean(),
    message: z.string(),
  });

  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],
    executeSuccessSchema,

    precheck: async (params, { succeed }) => {
      return succeed();
    },

    // @ts-expect-error - Returning raw object instead of ToolExecutionResponse
    execute: async (params, { succeed }) => {
      return { success: true, message: 'test' };
    },
  });

  return tool;
};

// Test: Execute returning wrong type object
const testExecuteWrongTypeReturn = () => {
  const executeSuccessSchema = z.object({
    success: z.boolean(),
    message: z.string(),
  });

  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],
    executeSuccessSchema,

    precheck: async (params, { succeed }) => {
      return succeed();
    },

    execute: async (params, { succeed }) => {
      // This is correct
      // return context.succeed({ success: true, message: "test" });

      // @ts-expect-error - Wrong type of return object
      return succeed({ wrongField: 'test' });
    },
  });

  return tool;
};

// Test: Precheck returning wrong schema
const testPrecheckWrongSchema = () => {
  const precheckSuccessSchema = z.object({
    valid: z.boolean(),
  });

  const executeSuccessSchema = z.object({
    result: z.string(),
  });

  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],
    precheckSuccessSchema,
    executeSuccessSchema,

    precheck: async (params, { succeed }) => {
      // This would be correct
      // return context.succeed({ valid: true });

      // @ts-expect-error - Using execute schema for precheck return
      return succeed({ result: 'test' });
    },

    execute: async (params, { succeed }) => {
      return succeed({ result: 'test' });
    },
  });

  return tool;
};

// Test: Execute returning precheck schema
const testExecuteWrongSchema = () => {
  const precheckSuccessSchema = z.object({
    valid: z.boolean(),
  });

  const executeSuccessSchema = z.object({
    result: z.string(),
  });

  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],
    precheckSuccessSchema,
    executeSuccessSchema,

    precheck: async (params, { succeed }) => {
      return succeed({ valid: true });
    },

    execute: async (params, { succeed }) => {
      // This would be correct
      // return context.succeed({ result: "test" });

      // @ts-expect-error - Using precheck schema for execute return
      return succeed({ valid: true });
    },
  });

  return tool;
};

// Test: Precheck returning fail from success schema
const testPrecheckSuccessWithFailSchema = () => {
  const precheckSuccessSchema = z.object({
    valid: z.boolean(),
  });

  const precheckFailSchema = z.object({
    reason: z.string(),
    code: z.number(),
  });

  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],
    precheckSuccessSchema,
    precheckFailSchema,

    precheck: async (params, { succeed, fail }) => {
      if (Math.random() > 0.5) {
        return succeed({ valid: true });
      } else {
        // This would be correct
        // return context.fail({ reason: "test", code: 400 });

        // @ts-expect-error - Using success schema for fail return
        return fail({ valid: false });
      }
    },

    execute: async (params, { succeed }) => {
      return succeed();
    },
  });

  return tool;
};

// Test: Execute returning fail with success schema
const testExecuteFailWithSuccessSchema = () => {
  const executeSuccessSchema = z.object({
    result: z.string(),
  });

  const executeFailSchema = z.object({
    error: z.string(),
    code: z.number(),
  });

  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],
    executeSuccessSchema,
    executeFailSchema,

    precheck: async (params, { succeed }) => {
      return succeed();
    },

    execute: async (params, { succeed, fail }) => {
      if (Math.random() > 0.5) {
        return succeed({ result: 'test' });
      } else {
        // This would be correct
        // return context.fail({ error: "test", code: 400 });

        // @ts-expect-error - Using success schema for fail return
        return fail({ result: 'error' });
      }
    },
  });

  return tool;
};

// Test: Tool with void-returning functions inside
const testReturnWithInnerFunctions = () => {
  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],

    precheck: async (params, { succeed }) => {
      // Internal function that doesn't return anything shouldn't affect the overall return type
      const logDetails = () => {
        console.log('Details:', params);
        // No return here is fine
      };

      logDetails();
      return succeed();
    },

    execute: async (params, { succeed }) => {
      // Internal async function with no return
      const processData = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        // No return here is fine
      };

      await processData();
      return succeed();
    },
  });

  return tool;
};

// Test: Conditional returns in precheck
const testPrecheckConditionalReturns = () => {
  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],

    // @ts-expect-error - Missing return in one code path
    precheck: async (params, { succeed }) => {
      if (params.action === 'test') {
        return succeed();
      }
      // Missing return in this path
    },

    execute: async (params, { succeed }) => {
      return succeed();
    },
  });

  return tool;
};

// Test: Conditional returns in execute
const testExecuteConditionalReturns = () => {
  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],

    precheck: async (params, { succeed }) => {
      return succeed();
    },

    // @ts-expect-error - Missing return in one code path
    execute: async (params, { succeed }) => {
      if (params.action === 'test') {
        return succeed();
      }
      // Missing return in this path
    },
  });

  return tool;
};

// Test: Async precheck without await or return
const testPrecheckAsyncWithoutAwait = () => {
  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],

    // @ts-expect-error - Missing return from async function that calls other async functions
    precheck: async (params, { succeed }) => {
      // Call async function without await or using its result
      fetchData();

      async function fetchData() {
        return succeed();
      }

      // No return here
    },

    execute: async (params, { succeed }) => {
      return succeed();
    },
  });

  return tool;
};

// Test: Return from try-catch in execute
const testExecuteTryCatchReturn = () => {
  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],

    precheck: async (params, { succeed }) => {
      return succeed();
    },

    // @ts-expect-error - Missing return in catch block
    execute: async (params, { succeed, fail }) => {
      try {
        // This is fine
        return succeed();
      } catch (error) {
        // Missing return here
        fail('Error occurred');
      }
    },
  });

  return tool;
};

export function testReturnTypeEnforcement() {
  return {
    testReturnNoSchema,
    testPrecheckNoReturn,
    testExecuteNoReturn,
    testPrecheckRawReturn,
    testExecuteRawReturn,
    testExecuteWrongTypeReturn,
    testPrecheckWrongSchema,
    testExecuteWrongSchema,
    testPrecheckSuccessWithFailSchema,
    testExecuteFailWithSuccessSchema,
    testReturnWithInnerFunctions,
    testPrecheckConditionalReturns,
    testExecuteConditionalReturns,
    testPrecheckAsyncWithoutAwait,
    testExecuteTryCatchReturn,
  };
}

/**
 * Test Case 7: Context destructuring maintains type safety
 */
function testContextDestructuring() {
  const executeSuccessSchema = z.object({
    data: z.string(),
  });

  const tool = createVincentTool({
    toolParamsSchema: testSchema,
    supportedPolicies: [testPolicy],
    executeSuccessSchema,

    precheck: async (params, { succeed }) => {
      // Destructuring should maintain type safety
      // This should all work
      succeed();

      // @ts-expect-error - Wrong parameter type for succeed
      succeed({ wrongField: true });

      return succeed();
    },

    execute: async (params, { succeed }) => {
      // Destructuring with type-specific functions
      // Should be type safe
      succeed({ data: 'result' });

      // @ts-expect-error - Wrong field name
      succeed({ wrongField: 'result' });

      // @ts-expect-error - Missing required field
      succeed({});

      return succeed({ data: 'final result' });
    },
  });

  return tool;
}

export const toolTypeValidation = {
  testNoSchemas,
  testWithSchemas,
  testDifferentSchemas,
  testPolicyResultTypes,
  testImproperToolDefinition,
  testReturnTypeEnforcement,
  testContextDestructuring,
};
