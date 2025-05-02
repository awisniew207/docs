/**
 * Tool Definition Tests
 *
 * A focused test file to verify that VincentPolicyEvaluationResults inference works correctly,
 * using a tool with two policies - one simple and one with commit functionality.
 */
import z from 'zod';
import { validateVincentToolDef } from '../lib/vincentTool';
import { validateVincentPolicyDef } from '../lib/vincentPolicy';

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

  // Define tool result schemas
  const executeSuccessSchema = z.object({
    success: z.boolean(),
    confirmed: z.boolean().optional(),
    timestamp: z.number().optional(),
    message: z.string(),
  });

  const executeFailSchema = z.object({
    errorCode: z.number(),
    errorMessage: z.string(),
  });

  const precheckSuccessSchema = z.object({
    valid: z.boolean(),
    validationMessage: z.string().optional(),
  });

  const precheckFailSchema = z.object({
    valid: z.boolean(),
    issues: z.array(z.string()),
  });

  // Create tool with both policies
  const tool = validateVincentToolDef({
    toolParamsSchema: baseToolSchema,
    supportedPolicies: {
      simplePolicy,
      commitPolicy,
    },

    // Add schemas for tool results
    precheckSuccessSchema,
    precheckFailSchema,
    executeSuccessSchema,
    executeFailSchema,

    precheck: async (params, { addDetails, fail, succeed, policyResults }) => {
      addDetails(['Starting precheck validation']);

      // Perform basic validation
      if (!params.action || !params.target || params.amount <= 0) {
        addDetails(['Invalid parameters detected']);
        const issues = [];

        if (!params.action) issues.push('Missing action');
        if (!params.target) issues.push('Missing target');
        if (params.amount <= 0) issues.push('Amount must be positive');

        return fail({
          valid: false,
          issues,
        });
      }

      addDetails([`Parameters validated for ${params.action}`]);
      return succeed({
        valid: true,
        validationMessage: 'All parameters are valid',
      });
    },

    // Execute function to demonstrate result type inference
    execute: async (params, { addDetails, fail, succeed, policyResults }) => {
      addDetails([`Executing ${params.action} on ${params.target}`]);

      try {
        // Verify type inference works correctly when results.allow is true
        // Access specific policy results - now TypeScript knows this is defined
        if (policyResults.allowPolicyResults.simplePolicy) {
          const simpleResult =
            policyResults.allowPolicyResults.simplePolicy.result;

          // TypeScript should now correctly infer the result type
          const { approved, reason } = simpleResult;
          addDetails([
            `Simple policy approved: ${approved}, reason: ${reason}`,
          ]);
        }

        // Type inference should work for the commit policy result
        if (policyResults.allowPolicyResults.commitPolicy) {
          const commitPolicyResult =
            policyResults.allowPolicyResults.commitPolicy.result;

          // No need for type guards anymore
          const { transactionId, status } = commitPolicyResult;
          addDetails([
            `Commit policy status: ${status}, txId: ${transactionId}`,
          ]);

          // The commit function should be available and properly typed
          const commitFn = policyResults.allowPolicyResults.commitPolicy.commit;

          // Call commit with properly typed parameters
          const commitResult = await commitFn({
            transactionId,
            status: 'complete',
          });

          // Type inference should work for commit result
          if (commitResult.allow) {
            const { confirmed, timestamp } = commitResult.result;
            addDetails([`Commit confirmed: ${confirmed}, at: ${timestamp}`]);

            return succeed({
              success: true,
              confirmed,
              timestamp,
              message: 'Operation executed successfully',
            });
          }
        }

        // If we reach here, something went wrong with the commit
        return fail({
          errorCode: 400,
          errorMessage: 'Failed to complete the transaction commit process',
        });
      } catch (error) {
        // Handle any unexpected errors
        addDetails([
          `Execution error: ${error instanceof Error ? error.message : String(error)}`,
        ]);

        return fail({
          errorCode: 500,
          errorMessage: 'Internal execution error',
        });
      }
    },
  });

  return tool;
}

// Export the test function
console.log(testPolicyEvaluationResults);
