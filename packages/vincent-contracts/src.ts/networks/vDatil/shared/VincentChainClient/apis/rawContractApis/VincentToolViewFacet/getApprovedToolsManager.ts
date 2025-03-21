import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../vincentNetworkContext';
import { createVincentContracts } from '../../utils/createVincentContracts';

/**
 * Returns the current approved tools manager address from the Vincent network
 * @param ctx The Vincent network context
 * @returns The address of the current approved tools manager
 */
export async function getApprovedToolsManager(ctx: VincentNetworkContext) {
  logger.debug('Getting approved tools manager');

  const { vincentToolViewFacetContract } = createVincentContracts(ctx);

  const manager = await vincentToolViewFacetContract.read.getApprovedToolsManager();
  
  logger.debug({ manager });
  
  return { manager };
} 