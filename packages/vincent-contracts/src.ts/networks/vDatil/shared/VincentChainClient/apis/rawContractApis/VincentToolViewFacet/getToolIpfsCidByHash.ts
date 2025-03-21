import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../vincentNetworkContext';
import { createVincentContracts } from '../../utils/createVincentContracts';

const GetToolIpfsCidByHashRequest = z.object({
  toolIpfsCidHash: z.string().refine(val => /^0x[a-fA-F0-9]{64}$/.test(val), {
    message: 'toolIpfsCidHash must be a valid 32-byte hex string starting with 0x',
  }),
});

type GetToolIpfsCidByHashRequest = z.input<typeof GetToolIpfsCidByHashRequest>;

/**
 * Retrieves a tool's IPFS CID by its hash
 * @param request The request containing the tool IPFS CID hash to look up
 * @param ctx The Vincent network context
 * @returns The tool's IPFS CID
 */
export async function getToolIpfsCidByHash(
  request: GetToolIpfsCidByHashRequest,
  ctx: VincentNetworkContext,
) {
  const validatedRequest = GetToolIpfsCidByHashRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentToolViewFacetContract } = createVincentContracts(ctx);

  const toolIpfsCid = await vincentToolViewFacetContract.read.getToolIpfsCidByHash([
    validatedRequest.toolIpfsCidHash as `0x${string}`,
  ]);
  
  logger.debug({ toolIpfsCid });
  
  return { toolIpfsCid };
} 