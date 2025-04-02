import { getTestContext } from '../testContext';
import { approveTools } from './approveTools';
import { registerTools } from './registerTools';

describe('approveTools', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  // Register the tool with a single-item array
  const randomIpfsCids = [`Qm${Math.random().toString(36).substring(2, 15)}`];

  beforeAll(async () => {
    testContext = await getTestContext();

    // Register a tool first
    await registerTools(
      {
        toolIpfsCids: randomIpfsCids,
      },
      testContext.networkContext,
    );
  });

  it('should approve tools for use on the Vincent network', async () => {
    // Call the approveTools function with the original array structure
    const res = await approveTools(
      {
        toolIpfsCids: randomIpfsCids,
      },
      testContext.networkContext,
    );

    console.log(res);

    expect(res.hash).toBeDefined();
    expect(res.receipt).toBeDefined();
    expect(res.decodedLogs).toBeDefined();

    // Find the ToolApproved event for each tool
    const event = res.decodedLogs.find(
      (log) =>
        log.eventName === 'ToolApproved' &&
        log.args.toolIpfsCidHash !== undefined,
    );
    expect(event).toBeDefined();
  });
});
