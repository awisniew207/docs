import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../vincentNetworkContext';
import { createVincentContracts } from '../../utils/createVincentContracts';

const GetAllPermittedAppIdsForPkpRequest = z.object({
  pkpTokenId: z.coerce.bigint(),
});

type GetAllPermittedAppIdsForPkpRequest = z.input<
  typeof GetAllPermittedAppIdsForPkpRequest
>;

/**
 * Retrieves all permitted application IDs for a specific PKP token
 * @param request The request containing the PKP token ID
 * @param ctx The Vincent network context
 * @returns Array of application IDs that the PKP token is permitted to use
 */
export async function getAllPermittedAppIdsForPkp(
  request: GetAllPermittedAppIdsForPkpRequest,
  ctx: VincentNetworkContext,
) {
  const validatedRequest = GetAllPermittedAppIdsForPkpRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentUserViewFacetContract } = createVincentContracts(ctx);

  const appIds = await vincentUserViewFacetContract.read.getAllPermittedAppIdsForPkp([
    validatedRequest.pkpTokenId,
  ]);

  return appIds;
} 