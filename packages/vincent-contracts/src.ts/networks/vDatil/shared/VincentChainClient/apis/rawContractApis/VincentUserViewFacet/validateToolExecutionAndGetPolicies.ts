import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { toEthAddress } from '../../../../../../shared/utils/z-transformers';
import { VincentNetworkContext } from '../../../vincentNetworkContext';
import { createVincentContracts } from '../../utils/createVincentContracts';

const ValidateToolExecutionAndGetPoliciesRequest = z.object({
  delegatee: toEthAddress,
  pkpTokenId: z.coerce.bigint(),
  toolIpfsCid: z.string(),
});

type ValidateToolExecutionAndGetPoliciesRequest = z.input<
  typeof ValidateToolExecutionAndGetPoliciesRequest
>;

/**
 * Validates if a tool execution is permitted for a specific PKP token and retrieves its policies
 * @param request The request containing the delegatee address, PKP token ID, and tool IPFS CID
 * @param ctx The Vincent network context
 * @returns Tool execution validation result including permitted status and associated policies
 */
export async function validateToolExecutionAndGetPolicies(
  request: ValidateToolExecutionAndGetPoliciesRequest,
  ctx: VincentNetworkContext,
) {
  const validatedRequest =
    ValidateToolExecutionAndGetPoliciesRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentUserViewFacetContract } = createVincentContracts(ctx);

  const validation =
    await vincentUserViewFacetContract.read.validateToolExecutionAndGetPolicies(
      [
        validatedRequest.delegatee,
        validatedRequest.pkpTokenId,
        validatedRequest.toolIpfsCid,
      ],
    );

  return validation;
}
