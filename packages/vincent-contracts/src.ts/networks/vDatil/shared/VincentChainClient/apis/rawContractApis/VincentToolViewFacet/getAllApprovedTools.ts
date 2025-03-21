import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../vincentNetworkContext';
import { createVincentContracts } from '../../utils/createVincentContracts';

/**
 * Returns all approved tools from the Vincent network
 * @param ctx The Vincent network context
 * @returns Array of approved tool IPFS CIDs
 */
export async function getAllApprovedTools(ctx: VincentNetworkContext) {
  logger.debug('Getting all approved tools');

  const { vincentToolViewFacetContract } = createVincentContracts(ctx);

  const toolIpfsCids =
    await vincentToolViewFacetContract.read.getAllApprovedTools();

  logger.debug({ toolIpfsCids });

  return { toolIpfsCids };
}
