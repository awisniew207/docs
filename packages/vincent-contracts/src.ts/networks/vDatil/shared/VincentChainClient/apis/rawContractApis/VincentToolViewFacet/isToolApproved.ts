import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../vincentNetworkContext';
import { createVincentContracts } from '../../utils/createVincentContracts';

const IsToolApprovedRequest = z.object({
  toolIpfsCid: z.string().min(1, 'toolIpfsCid cannot be empty'),
});

type IsToolApprovedRequest = z.input<typeof IsToolApprovedRequest>;

/**
 * Checks if a tool is approved on the Vincent network
 * @param request The request containing the tool IPFS CID to check
 * @param ctx The Vincent network context
 * @returns Boolean indicating whether the tool is approved
 */
export async function isToolApproved(
  request: IsToolApprovedRequest,
  ctx: VincentNetworkContext,
) {
  const validatedRequest = IsToolApprovedRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentToolViewFacetContract } = createVincentContracts(ctx);

  const isApproved = await vincentToolViewFacetContract.read.isToolApproved([
    validatedRequest.toolIpfsCid,
  ]);

  logger.debug({ isApproved });

  return { isApproved };
}
