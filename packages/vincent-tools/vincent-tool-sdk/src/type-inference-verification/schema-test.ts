/**
 * Schema Test File
 *
 * This file contains minimal test cases to verify that type checking
 * is working correctly for the allow() and deny() methods with various
 * schema configurations.
 */
import z from 'zod';
import { PolicyContext } from '../lib/types';
import { validateVincentPolicyDef } from '../lib/vincentPolicy';

// Base tool schema for all tests
const baseToolSchema = z.object({
  action: z.string(),
  target: z.string(),
  amount: z.number(),
});

/**
 * Test 1: With Schema
 *
 * This test verifies that TypeScript properly enforces schema constraints
 * when schemas are provided.
 */
function testWithSchema() {
  const objSchema = z.object({ id: z.string() });

  // Function signature to test types on a PolicyContext
  // @ts-expect-error
  function testContextSignature(
    context: PolicyContext<typeof objSchema, undefined>,
  ) {
    // Should error - no args with schema
    // @ts-expect-error
    context.allow();

    // Should error - wrong type
    // @ts-expect-error
    context.allow('not an object');

    // Should error - wrong shape
    // @ts-expect-error
    context.allow({ notId: 'wrong property' });

    // Valid - matches schema
    return context.allow({ id: 'valid-id' });
  }

  // Test in a real policy
  const policy = validateVincentPolicyDef({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'test1',
      toolParamsSchema: z.object({ actionType: z.string() }),
      evalAllowResultSchema: objSchema,

      evaluate: async (params, context) => {
        // These cause TypeScript errors:
        // @ts-expect-error - No args when schema exists
        context.allow();

        // @ts-expect-error - Wrong type
        context.allow(123);

        // @ts-expect-error - Wrong shape
        context.allow({ wrong: 'field' });

        // Valid case:
        return context.allow({ id: 'test-id' });
      },
    },
    toolParameterMappings: {
      action: 'actionType',
    },
  });

  return policy;
}

/**
 * Test 2: Without Schema
 *
 * This test verifies that TypeScript properly enforces constraints
 * when no schemas are provided (no args for allow, string or no args for deny).
 */
function testWithoutSchema() {
  // Function signature to test types on a PolicyContext
  // @ts-expect-error
  function testContextSignature(context: PolicyContext<undefined, undefined>) {
    // Valid - no schema means no args
    context.allow();

    // Should error - no schema means no args allowed
    // @ts-expect-error
    context.allow('no schema');

    // Should error - no schema means no args allowed
    // @ts-expect-error
    context.allow({ no: 'schema' });

    // Valid - string error is allowed with no schema
    context.deny('Error message');

    // Valid - no args is allowed
    return context.deny();
  }

  // Test in a real policy
  const policy = validateVincentPolicyDef({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'test2',
      toolParamsSchema: z.object({ actionType: z.string() }),
      // No schemas defined

      evaluate: async (params, context) => {
        // These cause TypeScript errors:
        // @ts-expect-error - Cannot accept arguments when no schema
        context.allow('not allowed');

        // @ts-expect-error - Cannot accept arguments when no schema
        context.allow(123);

        // @ts-expect-error - Cannot accept object when no schema
        context.allow({ not: 'allowed' });

        // @ts-expect-error - Object not allowed for deny without schema
        context.deny({ not: 'allowed' });

        // Valid cases - only one will be returned
        if (Math.random() > 0.5) {
          return context.allow();
        } else {
          return context.deny('Error message');
        }
      },
    },
    toolParameterMappings: {
      action: 'actionType',
    },
  });

  return policy;
}

/**
 * Test 3: String Schema
 *
 * This test verifies handling of string schemas, which are a special case.
 */
function testStringSchema() {
  // Test in a real policy
  const policy = validateVincentPolicyDef({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'test3',
      toolParamsSchema: z.object({ actionType: z.string() }),
      evalAllowResultSchema: z.string(),
      evalDenyResultSchema: z.string(),

      evaluate: async (params, context) => {
        // These cause TypeScript errors:
        // @ts-expect-error - No args when schema exists
        context.allow();

        // @ts-expect-error - Wrong type (number not string)
        context.allow(123);

        // @ts-expect-error - Wrong type (object not string)
        context.allow({ not: 'a string' });

        // @ts-expect-error - No args when schema exists
        context.deny();

        // @ts-expect-error - Wrong type (object not string)
        context.deny({ not: 'a string' });

        // Valid cases - only one will be returned
        if (Math.random() > 0.5) {
          return context.allow('Success message');
        } else {
          return context.deny('Error message');
        }
      },
    },
    toolParameterMappings: {
      action: 'actionType',
    },
  });

  return policy;
}

/**
 * Test 4: Different Contexts
 *
 * This test verifies that different schemas are enforced correctly
 * in different contexts (precheck, evaluate, commit).
 */
function testDifferentContexts() {
  // Different schemas for different contexts
  const precheckSchema = z.object({ validCheck: z.boolean() });
  const evalSchema = z.object({ status: z.string() });
  const commitSchema = z.object({ txId: z.string() });

  const policy = validateVincentPolicyDef({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'test4',
      toolParamsSchema: z.object({ actionType: z.string() }),

      // Define different schemas for different contexts
      precheckAllowResultSchema: precheckSchema,
      evalAllowResultSchema: evalSchema,

      commitParamsSchema: z.object({ confirmation: z.string() }),
      commitAllowResultSchema: commitSchema,

      precheck: async (params, context) => {
        // These cause TypeScript errors:
        // @ts-expect-error - Wrong schema (using evaluate schema)
        context.allow({ status: 'wrong context' });

        // @ts-expect-error - Wrong schema (using commit schema)
        context.allow({ txId: 'wrong context' });

        // Valid for precheck
        return context.allow({ validCheck: true });
      },

      evaluate: async (params, context) => {
        // These cause TypeScript errors:
        // @ts-expect-error - Wrong schema (using precheck schema)
        context.allow({ validCheck: true });

        // @ts-expect-error - Wrong schema (using commit schema)
        context.allow({ txId: 'wrong context' });

        // Valid for evaluate
        return context.allow({ status: 'approved' });
      },

      commit: async (params, context) => {
        // Should have the right parameter type
        const confirmation = params.confirmation;

        // These cause TypeScript errors:
        // @ts-expect-error - Wrong schema (using precheck schema)
        context.allow({ validCheck: true });

        // @ts-expect-error - Wrong schema (using evaluate schema)
        context.allow({ status: 'wrong context' });

        // Valid for commit
        return context.allow({ txId: `tx-${confirmation}` });
      },
    },
    toolParameterMappings: {
      action: 'actionType',
    },
  });

  return policy;
}

/**
 * Test 5: Number and Boolean Schemas
 *
 * This test verifies that number and boolean schemas work correctly.
 */
function testPrimitiveSchemas() {
  // Test in a real policy
  const policy = validateVincentPolicyDef({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'test5',
      toolParamsSchema: z.object({ actionType: z.string() }),
      evalAllowResultSchema: z.number(),
      evalDenyResultSchema: z.boolean(),

      evaluate: async (params, context) => {
        // These cause TypeScript errors:
        // @ts-expect-error - No args when schema exists
        context.allow();

        // @ts-expect-error - Wrong type (string not number)
        context.allow('not a number');

        // @ts-expect-error - Wrong type (object not number)
        context.allow({ value: 123 });

        // @ts-expect-error - No args when schema exists (except string error)
        context.deny();

        // @ts-expect-error - Wrong type (number not boolean)
        context.deny(123);

        // Valid cases - only one will be executed
        if (Math.random() > 0.5) {
          return context.allow(123);
        } else {
          return context.deny(false, 'Operation failed');
        }
      },
    },
    toolParameterMappings: {
      action: 'actionType',
    },
  });

  return policy;
}

// Export all test functions
export {
  testWithSchema,
  testWithoutSchema,
  testStringSchema,
  testDifferentContexts,
  testPrimitiveSchemas,
};
