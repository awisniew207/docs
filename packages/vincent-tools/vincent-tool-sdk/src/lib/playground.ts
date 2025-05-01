import z from 'zod';
import { validateVincentPolicyDef } from './vincentPolicy';
import { validateVincentToolDef } from './vincentTool';

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
      context.addDetails('Checking if target is allowed for this action');

      if (toolParams.targetAllowed) {
        return context.allow('ALLOWED_BY_PRECHECK');
      } else {
        return context.deny('Target is not allowed for this action');
      }
    },

    evaluate: async ({ toolParams, userParams }, context) => {
      context.addDetails('Checking if target is in allowed targets list');
      const targetIsAllowed = userParams.allowedTargets.includes('example');

      if (targetIsAllowed && toolParams.targetAllowed) {
        return context.allow('APPROVED');
      } else {
        return context.deny({ reason: 'Target not in allowed list' });
      }
    },

    commit: async (params, context) => {
      context.addDetails(
        'Committing with confirmation: ' + params.confirmation,
      );

      if (params.confirmation) {
        return context.allow({ success: true });
      } else {
        return context.deny(
          { errorCode: 400 },
          'Commit failed due to missing confirmation',
        );
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
      context.addDetails(
        `Checking if amount ${toolParams.maxAmount} is within limit ${userParams.limit}`,
      );

      if (isWithinLimit) {
        return context.allow({ validatedAmount: 1983 });
      } else {
        return context.deny({ limitExceeded: true });
      }
    },

    evaluate: async ({ toolParams, userParams }, context) => {
      const isValidCurrency = ['USD', 'EUR', 'GBP'].includes(
        toolParams.currency,
      );
      const isWithinLimit = toolParams.maxAmount <= userParams.limit;

      context.addDetails(`Validating currency ${toolParams.currency}`);
      context.addDetails(
        `Checking amount ${toolParams.maxAmount} against limit ${userParams.limit}`,
      );

      if (isValidCurrency && isWithinLimit) {
        return context.allow({ approvedCurrency: toolParams.currency });
      } else {
        const reason = !isValidCurrency
          ? `Currency ${toolParams.currency} is not supported`
          : `Amount ${toolParams.maxAmount} exceeds limit ${userParams.limit}`;

        return context.deny(
          {
            reason: reason,
            code: !isValidCurrency ? 415 : 400,
          },
          reason,
        );
      }
    },

    commit: async (params, context) => {
      context.addDetails(`Processing transaction: ${params.transactionId}`);

      // For demo purposes, let's say transactions with "fail" in the ID will be denied
      if (!params.transactionId.includes('fail')) {
        return context.allow({
          transaction: `completed-${params.transactionId}`,
          timestamp: Date.now(),
        });
      } else {
        return context.deny(
          { failureReason: 'Invalid transaction ID format' },
          'Transaction failed',
        );
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
      context.addDetails(`Checking access level: ${userParams.accessLevel}`);
      context.addDetails(`Tool: ${toolParams.toolName}`);

      // Policy logic: Allow only premium and admin users
      if (userParams.accessLevel === 'basic') {
        return context.deny({
          reason: 'Basic users cannot access this tool',
          suggestedAccessLevel: 'premium',
        });
      }

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

// Create your tool with fully typed policies
const myTool = validateVincentToolDef({
  toolParamsSchema: myToolSchema,
  supportedPolicies: {
    policy1,
    policy2,
    policy3,
  },
  precheck: async (params, policyResults) => {
    // Type-safe access to policies
    if (policyResults.allowPolicyResults.policy1) {
      // The commit function has been wrapped to only need the args parameter
      // No need to pass a context as it's injected by the wrapper
      const commitResult =
        await policyResults.allowPolicyResults.policy1.commit({
          confirmation: true,
        });

      console.log('Policy1 commit result:', commitResult.allow);
    }

    if (policyResults.allowPolicyResults.policy2) {
      const commitResult =
        await policyResults.allowPolicyResults.policy2.commit({
          transactionId: 'orhfjkjsdfslkjhdf',
        });

      if (commitResult.allow === true) {
        const { transaction, timestamp } = commitResult.result;
        console.log(`Transaction ${transaction} processed at ${timestamp}`);
      } else if (commitResult.allow === false && commitResult.result) {
        console.log('failureReason', commitResult.result.failureReason);
      }
    }

    // Policy3 doesn't have commit, so we don't try to call it
    if (policyResults.allowPolicyResults.policy3) {
      console.log('Policy3 approved but has no commit function');
    }

    return true;
  },
  execute: async (params, policyResults) => {
    return {
      status: 'success',
      details: ['Tool executed successfully'],
    };
  },
});

// Export to avoid unused variable warning
export { myTool };
