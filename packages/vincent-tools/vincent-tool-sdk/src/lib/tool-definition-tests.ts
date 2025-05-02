/**
 * Tool Definition Tests
 *
 * A focused test file to verify that VincentPolicyEvaluationResults inference works correctly,
 * using a tool with two policies - one simple and one with commit functionality.
 */
import z from 'zod';
import { validateVincentToolDef } from './vincentTool';
import { validateVincentPolicyDef } from './vincentPolicy';

// Base tool schema
const baseToolSchema = z.object({
  action: z.string(),
  target: z.string(),
  amount: z.number(),
});

/**
 * Simple test to verify inference of policy evaluation results
 * with a focus on the commit function type inference.
 */
function testPolicyEvaluationResults() {
  // Policy 1: Simple policy with object result schema
  const simplePolicy = validateVincentPolicyDef({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'simple-policy',
      toolParamsSchema: z.object({
        actionType: z.string(),
        targetId: z.string(),
      }),
      evalAllowResultSchema: z.object({
        approved: z.boolean(),
        reason: z.string(),
      }),

      evaluate: async (params, context) => {
        return context.allow({
          approved: true,
          reason: `Action ${params.toolParams.actionType} approved`,
        });
      },
    },
    toolParameterMappings: {
      action: 'actionType',
      target: 'targetId',
    },
  });

  // Policy 2: Policy with commit function
  const commitPolicy = validateVincentPolicyDef({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'commit-policy',
      toolParamsSchema: z.object({
        operation: z.string(),
        resource: z.string(),
        value: z.number(),
      }),

      // Evaluation schema
      evalAllowResultSchema: z.object({
        transactionId: z.string(),
        status: z.string(),
      }),

      // Commit phase schemas
      commitParamsSchema: z.object({
        transactionId: z.string(),
        status: z.enum(['complete', 'reject']),
      }),
      commitAllowResultSchema: z.object({
        confirmed: z.boolean(),
        timestamp: z.number(),
      }),

      evaluate: async (params, context) => {
        const txId = `tx-${Date.now()}`;
        return context.allow({
          transactionId: txId,
          status: 'pending',
        });
      },

      commit: async (params, context) => {
        // Access commit parameters
        const { transactionId, status } = params;

        console.log(transactionId);
        return context.allow({
          confirmed: status === 'complete',
          timestamp: Date.now(),
        });
      },
    },
    toolParameterMappings: {
      action: 'operation',
      target: 'resource',
      amount: 'value',
    },
  });

  // Create tool with both policies
  const tool = validateVincentToolDef({
    toolParamsSchema: baseToolSchema,
    supportedPolicies: {
      simplePolicy,
      commitPolicy,
    },

    precheck: async (params, results) => {
      return { valid: true };
    },

    // Execute function to demonstrate result type inference
    execute: async (params, results) => {
      // Verify type inference works correctly when results.allow is true
      // Access specific policy results - now TypeScript knows this is defined
      if (results.allowPolicyResults.simplePolicy) {
        const simpleResult = results.allowPolicyResults.simplePolicy.result;

        // TypeScript should now correctly infer the result type
        const { approved, reason } = simpleResult;
        console.log(`Simple policy approved: ${approved}, reason: ${reason}`);
      }

      // Type inference should work for the commit policy result
      if (results.allowPolicyResults.commitPolicy) {
        const commitPolicyResult =
          results.allowPolicyResults.commitPolicy.result;

        // No need for type guards anymore
        const { transactionId, status } = commitPolicyResult;
        console.log(`Commit policy status: ${status}, txId: ${transactionId}`);

        // The commit function should be available and properly typed
        const commitFn = results.allowPolicyResults.commitPolicy.commit;

        // Call commit with properly typed parameters
        const commitResult = await commitFn({
          transactionId,
          status: 'complete',
        });

        // Type inference should work for commit result
        if (commitResult.allow) {
          const { confirmed, timestamp } = commitResult.result;
          return {
            success: true,
            confirmed,
            timestamp,
          };
        }
      }

      return { success: false };
    },
  });

  return tool;
}

// Export the test function
export { testPolicyEvaluationResults };
