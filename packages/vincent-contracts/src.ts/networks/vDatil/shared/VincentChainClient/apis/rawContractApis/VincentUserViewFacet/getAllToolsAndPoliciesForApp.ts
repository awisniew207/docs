import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../vincentNetworkContext';
import { createVincentContracts } from '../../utils/createVincentContracts';

const GetAllToolsAndPoliciesForAppRequest = z.object({
  pkpTokenId: z.coerce.bigint(),
  appId: z.coerce.bigint(),
});

type GetAllToolsAndPoliciesForAppRequest = z.input<
  typeof GetAllToolsAndPoliciesForAppRequest
>;

/**
 * Retrieves all tools and their associated policies for a specific PKP token and application
 * @param request The request containing the PKP token ID and application ID
 * @param ctx The Vincent network context
 * @returns Array of tools with their associated policies for the specified PKP and application
 */
export async function getAllToolsAndPoliciesForApp(
  request: GetAllToolsAndPoliciesForAppRequest,
  ctx: VincentNetworkContext,
) {
  const validatedRequest = GetAllToolsAndPoliciesForAppRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentUserViewFacetContract } = createVincentContracts(ctx);

  const tools = await vincentUserViewFacetContract.read.getAllToolsAndPoliciesForApp([
    validatedRequest.pkpTokenId,
    validatedRequest.appId,
  ]);

  return tools;
} 