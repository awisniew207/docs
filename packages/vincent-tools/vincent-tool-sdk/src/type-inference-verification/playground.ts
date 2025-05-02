import z from 'zod';
import { validateVincentPolicyDef } from '../lib/vincentPolicy';
import { validateVincentToolDef } from '../lib/vincentTool';

// Define your tool schema
const myToolSchema = z.object({
  action: z.string(),
  target: z.string(),
  amount: z.number(),
});

// Define policy schemas
const policy1Schema = z.object({
  targetAllowed: z.boolean(),
  actionType: z.string(),
});
const userParams1Schema = z.object({ allowedTargets: z.array(z.string()) });
const commitParams1Schema = z.object({ confirmation: z.boolean() });

// Define the result schemas for policy1
const policy1EvalAllowResult = z.string(); // Result when allowed
const policy1EvalDenyResult = z.object({ reason: z.string() }); // Result when denied
const policy1CommitAllowResult = z.object({ success: z.boolean() });
const policy1CommitDenyResult = z.object({ errorCode: z.number() });

// Create policies with full type inference
const policy1 = validateVincentPolicyDef({
  toolParamsSchema: myToolSchema,
  policyDef: {
    ipfsCid: 'policy1',
    toolParamsSchema: policy1Schema,
    userParamsSchema: userParams1Schema,
    commitParamsSchema: commitParams1Schema,

    // Define schema types explicitly (optional but helpful for validation)
    evalAllowResultSchema: policy1EvalAllowResult,
    evalDenyResultSchema: policy1EvalDenyResult,
    commitAllowResultSchema: policy1CommitAllowResult,
    commitDenyResultSchema: policy1CommitDenyResult,

    precheck: async ({ toolParams, userParams }, context) => {
      if (toolParams.targetAllowed) {
        context.addDetails(['Target is allowed for this action']);
        return context.allow();
      } else {
        context.addDetails(['Target is not allowed for this action']);
        return context.deny();
      }
    },

    evaluate: async ({ toolParams, userParams }, context) => {
      const targetIsAllowed = userParams.allowedTargets.includes('example');

      if (targetIsAllowed && toolParams.targetAllowed) {
        context.addDetails(['Target is in the allowed targets list']);
        return context.allow('APPROVED');
      } else {
        context.addDetails(['Target is not in the allowed targets list']);
        return context.deny({ reason: 'Target not in allowed list' });
      }
    },

    commit: async (params, context) => {
      if (params.confirmation) {
        context.addDetails(['Commit successful']);
        return context.allow({ success: true });
      } else {
        context.addDetails(['Commit failed due to missing confirmation']);
        return context.deny({ errorCode: 400 });
      }
    },
  },
  toolParameterMappings: {
    target: 'targetAllowed',
    action: 'actionType',
  },
});

// Define the result schemas for policy2
const policy2Schema = z.object({
  maxAmount: z.number(),
  currency: z.string(),
});
const userParams2Schema = z.object({ limit: z.number() });
const commitParams2Schema = z.object({ transactionId: z.string() });

// For policy2, let's use different result types
const policy2PrecheckAllowResult = z.object({ validatedAmount: z.number() });
const policy2PrecheckDenyResult = z.object({ limitExceeded: z.boolean() });
const policy2EvalAllowResult = z.object({ approvedCurrency: z.string() });
const policy2EvalDenyResult = z.object({
  reason: z.string(),
  code: z.number(),
});
const policy2CommitAllowResult = z.object({
  transaction: z.string(),
  timestamp: z.number(),
});
const policy2CommitDenyResult = z.object({ failureReason: z.string() });

const policy2 = validateVincentPolicyDef({
  toolParamsSchema: myToolSchema,
  policyDef: {
    ipfsCid: 'policy2',
    toolParamsSchema: policy2Schema,
    userParamsSchema: userParams2Schema,
    commitParamsSchema: commitParams2Schema,

    // Define schema types explicitly
    precheckAllowResultSchema: policy2PrecheckAllowResult,
    precheckDenyResultSchema: policy2PrecheckDenyResult,
    evalAllowResultSchema: policy2EvalAllowResult,
    evalDenyResultSchema: policy2EvalDenyResult,
    commitAllowResultSchema: policy2CommitAllowResult,
    commitDenyResultSchema: policy2CommitDenyResult,

    precheck: async ({ toolParams, userParams }, context) => {
      const isWithinLimit = toolParams.maxAmount <= userParams.limit;

      if (isWithinLimit) {
        context.addDetails([
          `Amount ${toolParams.maxAmount} is within limit ${userParams.limit}`,
        ]);
        return context.allow({ validatedAmount: 1983 });
      } else {
        context.addDetails([
          `Amount ${toolParams.maxAmount} exceeds limit ${userParams.limit}`,
        ]);
        return context.deny({ limitExceeded: true });
      }
    },

    evaluate: async ({ toolParams, userParams }, context) => {
      const isValidCurrency = ['USD', 'EUR', 'GBP'].includes(
        toolParams.currency,
      );
      const isWithinLimit = toolParams.maxAmount <= userParams.limit;

      if (isValidCurrency && isWithinLimit) {
        context.addDetails([`Currency ${toolParams.currency} is supported`]);
        return context.allow({ approvedCurrency: toolParams.currency });
      } else {
        const reason = !isValidCurrency
          ? `Currency ${toolParams.currency} is not supported`
          : `Amount ${toolParams.maxAmount} exceeds limit ${userParams.limit}`;

        context.addDetails([reason]);
        return context.deny({
          reason: reason,
          code: !isValidCurrency ? 415 : 400,
        });
      }
    },

    commit: async (params, context) => {
      // For demo purposes, let's say transactions with "fail" in the ID will be denied
      if (!params.transactionId.includes('fail')) {
        context.addDetails(['Transaction processed successfully']);
        return context.allow({
          transaction: `completed-${params.transactionId}`,
          timestamp: Date.now(),
        });
      } else {
        context.addDetails(['Transaction failed']);
        return context.deny({
          failureReason: 'Invalid transaction ID format',
        });
      }
    },
  },
  toolParameterMappings: {
    amount: 'maxAmount',
    action: 'currency',
  },
});

// Define schemas for policy3
const policy3ToolParams = z.object({
  toolName: z.string(),
  maxUsage: z.number(),
});

const policy3UserParams = z.object({
  userAddress: z.string(),
  accessLevel: z.enum(['basic', 'premium', 'admin']),
});

const policy3EvalAllowResult = z.object({
  message: z.string(),
  timedate: z.date(),
});

const policy3EvalDenyResult = z.object({
  reason: z.string(),
  suggestedAccessLevel: z.enum(['basic', 'premium', 'admin']).optional(),
});

// Create policy3 without a commit function
const policy3 = validateVincentPolicyDef({
  toolParamsSchema: myToolSchema,
  policyDef: {
    ipfsCid: 'policy3ipfscid123',
    toolParamsSchema: policy3ToolParams,
    userParamsSchema: policy3UserParams,
    evalAllowResultSchema: policy3EvalAllowResult,
    evalDenyResultSchema: policy3EvalDenyResult,

    // Only has evaluate, no precheck or commit
    evaluate: async ({ toolParams, userParams }, context) => {
      // Policy logic: Allow only premium and admin users
      if (userParams.accessLevel === 'basic') {
        context.addDetails([
          `User with access level ${userParams.accessLevel} cannot access this tool`,
        ]);
        return context.deny({
          reason: 'Basic users cannot access this tool',
          suggestedAccessLevel: 'premium' as const,
        });
      }

      context.addDetails([
        `Access granted to ${toolParams.toolName} for ${userParams.accessLevel} user`,
      ]);
      return context.allow({
        message: `Access granted to ${toolParams.toolName}`,
        timedate: new Date(),
      });
    },
    // No commit method!
  },
  toolParameterMappings: {
    amount: 'toolName',
  },
});

const toolExecuteSuccessSchema = z.object({
  executedAction: z.string(),
  targetAddress: z.string(),
  transactionAmount: z.number(),
  timestamp: z.number(),
  txHash: z.string(),
});

const toolExecuteFailSchema = z.object({
  errorCode: z.number(),
  errorMessage: z.string(),
  suggestion: z.string().optional(),
});

const toolPrecheckSuccessSchema = z.object({
  validatedParams: z.boolean(),
  message: z.string(),
});

const toolPrecheckFailSchema = z.object({
  invalidField: z.string(),
  reason: z.string(),
});

// Create your tool with fully typed policies
const myTool = validateVincentToolDef({
  toolParamsSchema: myToolSchema,
  supportedPolicies: {
    policy1,
    policy2,
    policy3,
  },

  // Add schemas for tool results
  executeSuccessSchema: toolExecuteSuccessSchema,
  executeFailSchema: toolExecuteFailSchema,
  precheckSuccessSchema: toolPrecheckSuccessSchema,
  precheckFailSchema: toolPrecheckFailSchema,

  precheck: async (
    params,
    {
      addDetails,
      fail,
      policyResults: { allow, allowPolicyResults, denyPolicyResult },
      succeed,
    },
  ) => {
    // Add details about what we're checking
    addDetails([`Prechecking tool execution for action: ${params.action}`]);

    // Basic validation
    if (!params.action || !params.target) {
      addDetails(['Missing required parameters']);
      return fail({
        invalidField: !params.action ? 'action' : 'target',
        reason: 'Required field is empty or missing',
      });
    }

    // Amount validation
    if (params.amount <= 0) {
      addDetails([`Invalid amount: ${params.amount}`]);
      return fail({
        invalidField: 'amount',
        reason: 'Amount must be greater than zero',
      });
    }

    // Process policy results if needed
    if (allow) {
      // Type-safe access to policies
      if (allowPolicyResults.policy1) {
        const policy1Result = allowPolicyResults.policy1.result;
        addDetails([`Policy1 approved with result: ${policy1Result}`]);
      }

      if (allowPolicyResults.policy2) {
        const policy2Result = allowPolicyResults.policy2.result;
        addDetails([
          `Policy2 approved with currency: ${policy2Result.approvedCurrency}`,
        ]);
      }

      if (allowPolicyResults.policy3) {
        const policy3Result = allowPolicyResults.policy3.result;
        addDetails([`Policy3 approved with message: ${policy3Result.message}`]);
      }

      // Return success result
      return succeed({
        validatedParams: true,
        message: `All parameters validated for ${params.action} on ${params.target}`,
      });
    } else {
      // Handle the denial case
      const denyReason =
        denyPolicyResult?.result?.error || 'Policy check failed';
      addDetails([`Policy denied: ${denyReason}`]);

      return fail({
        invalidField: 'policy',
        reason: denyReason,
      });
    }
  },

  execute: async (params, { policyResults, addDetails, fail, succeed }) => {
    // Add details about what we're executing
    addDetails([
      `Executing ${params.action} on ${params.target} for amount ${params.amount}`,
    ]);

    try {
      // Simulate successful execution
      if (params.action === 'transfer' && params.amount > 0) {
        // Execute the transaction
        const txHash = `0x${Math.random().toString(16).substring(2, 10)}`;

        // Use commit functions from policies if available
        if (policyResults.allowPolicyResults.policy1) {
          const commitResult =
            await policyResults.allowPolicyResults.policy1.commit({
              confirmation: true,
            });

          if (commitResult.allow) {
            addDetails([
              `Policy1 commit succeeded: ${commitResult.result.success}`,
            ]);
          } else {
            // If policy commit fails, we can still decide to continue or fail the tool execution
            addDetails([
              `Policy1 commit failed with code: ${commitResult.result.errorCode}`,
            ]);
          }
        }

        if (policyResults.allowPolicyResults.policy2) {
          const commitResult =
            await policyResults.allowPolicyResults.policy2.commit({
              transactionId: txHash,
            });

          if (commitResult.allow) {
            addDetails([
              `Policy2 commit succeeded: ${commitResult.result.transaction}`,
              `Timestamp: ${commitResult.result.timestamp}`,
            ]);
          }
        }

        // Return success with typed result
        return succeed({
          executedAction: params.action,
          targetAddress: params.target,
          transactionAmount: params.amount,
          timestamp: Date.now(),
          txHash,
        });
      } else {
        // Simulate a failure case
        return fail({
          errorCode: 400,
          errorMessage: `Cannot perform ${params.action} operation`,
          suggestion: 'Try a "transfer" action instead',
        });
      }
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

console.log(Object.keys(myTool));
