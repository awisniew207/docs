import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../vincentNetworkContext';
import { createVincentContracts } from '../../utils/createVincentContracts';

const GetPermittedAppVersionForPkpRequest = z.object({
  pkpTokenId: z.coerce.bigint(),
  appId: z.coerce.bigint(),
});

type GetPermittedAppVersionForPkpRequest = z.input<
  typeof GetPermittedAppVersionForPkpRequest
>;

/**
 * Retrieves the permitted application version for a specific PKP token and application
 * @param request The request containing the PKP token ID and application ID
 * @param ctx The Vincent network context
 * @returns The permitted application version for the specified PKP and application
 */
export async function getPermittedAppVersionForPkp(
  request: GetPermittedAppVersionForPkpRequest,
  ctx: VincentNetworkContext,
) {
  const validatedRequest = GetPermittedAppVersionForPkpRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentUserViewFacetContract } = createVincentContracts(ctx);

  const appVersion = await vincentUserViewFacetContract.read.getPermittedAppVersionForPkp([
    validatedRequest.pkpTokenId,
    validatedRequest.appId,
  ]);

  return appVersion;
} 