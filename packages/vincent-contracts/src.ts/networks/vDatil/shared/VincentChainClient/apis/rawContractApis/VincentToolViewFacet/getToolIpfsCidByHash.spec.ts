import { keccak256, stringToHex } from 'viem';
import { getTestContext } from '../testContext';
import { registerTools } from '../VincentToolFacet/registerTools';
import { getToolIpfsCidByHash } from './getToolIpfsCidByHash';

describe('getToolIpfsCidByHash', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  // Create a unique IPFS CID for this test to avoid collisions
  const testIpfsCid = `QmTest${Math.random().toString(36).substring(2, 10)}`;
  let toolIpfsCidHash: `0x${string}`;

  beforeAll(async () => {
    testContext = await getTestContext();

    // Register the tool first so it exists in the contract
    await registerTools(
      {
        toolIpfsCids: [testIpfsCid],
      },
      testContext.networkContext,
    );

    // Calculate the hash the same way the contract does
    toolIpfsCidHash = keccak256(stringToHex(testIpfsCid));
  });

  it('should retrieve a tool IPFS CID by its hash from the Vincent network', async () => {
    const result = await getToolIpfsCidByHash(
      {
        toolIpfsCidHash,
      },
      testContext.networkContext,
    );

    // Log the result for debugging
    console.log(JSON.stringify(result, null, 2));

    // Verify structure of the response
    expect(result).toHaveProperty('toolIpfsCid');

    // Verify the returned IPFS CID matches what we registered
    expect(result.toolIpfsCid).toBe(testIpfsCid);
  });
});
