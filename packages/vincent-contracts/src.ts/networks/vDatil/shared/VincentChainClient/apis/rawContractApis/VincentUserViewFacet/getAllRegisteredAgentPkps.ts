import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { toEthAddress } from '../../../../../../shared/utils/z-transformers';
import { VincentNetworkContext } from '../../../vincentNetworkContext';
import { createVincentContracts } from '../../utils/createVincentContracts';

const GetAllRegisteredAgentPkpsRequest = z.object({
  userAddress: toEthAddress,
});

type GetAllRegisteredAgentPkpsRequest = z.input<
  typeof GetAllRegisteredAgentPkpsRequest
>;

/**
 * Retrieves all registered agent PKP token IDs for a specific user address
 * @param request The request containing the user address
 * @param ctx The Vincent network context
 * @returns Array of PKP token IDs registered by the user address
 */
export async function getAllRegisteredAgentPkps(
  request: GetAllRegisteredAgentPkpsRequest,
  ctx: VincentNetworkContext,
) {
  const validatedRequest = GetAllRegisteredAgentPkpsRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentUserViewFacetContract } = createVincentContracts(ctx);

  const pkpTokenIds =
    await vincentUserViewFacetContract.read.getAllRegisteredAgentPkps([
      validatedRequest.userAddress,
    ]);

  return pkpTokenIds;
}
