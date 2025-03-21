import { getTestContext } from '../testContext';
import { registerTools } from './registerTools';

describe('registerTools', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext();
  });

  it('should register tools on the Vincent network', async () => {
    const randomIpfsCid = [`Qm${Math.random().toString(36).substring(2, 15)}`];

    // Call the registerTools function with the original array structure
    const res = await registerTools(
      {
        toolIpfsCids: randomIpfsCid,
      },
      testContext.networkContext,
    );

    console.log(res);

    expect(res.hash).toBeDefined();
    expect(res.receipt).toBeDefined();
    expect(res.decodedLogs).toBeDefined();

    // Find the NewToolRegistered event for each tool
    const event = res.decodedLogs.find(
      (log) =>
        log.eventName === 'NewToolRegistered' &&
        log.args.toolIpfsCidHash !== undefined,
    );
    expect(event).toBeDefined();
  });
});
