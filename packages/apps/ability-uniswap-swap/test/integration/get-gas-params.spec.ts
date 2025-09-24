import { Block, FeeData, JsonRpcProvider, formatUnits } from 'ethers-v6';

import { getGasParams } from '../../src/lib/ability-helpers';
import { BASE_RPC_URL } from '../helpers/test-variables';

// Extend Jest timeout to 30 seconds for live RPC
jest.setTimeout(30000);

describe('getGasParams (live and mocked)', () => {
  describe('live: Base network', () => {
    it('should fetch real EIP-1559 gas params from Base network and apply buffer', async () => {
      const estimatedGas = '100000'; // gas units
      const result = await getGasParams({ rpcUrl: BASE_RPC_URL, estimatedGas });

      // Basic structure checks
      expect(result).toBeDefined();
      expect(typeof result.estimatedGas).toBe('string');

      // Buffer check: default is 50% => estimated * 1.5
      const expectedBuffered = (BigInt(estimatedGas) * 150n) / 100n;
      expect(BigInt(result.estimatedGas)).toBe(expectedBuffered);

      if ('gasPrice' in result) {
        // Legacy path (unlikely on Base, but assert if it happens)
        expect(typeof result.gasPrice).toBe('string');
        expect(BigInt(result.gasPrice) > 0n).toBe(true);

        // Logging (human-readable)
        console.log('[live: Base network] Gas Params (legacy):', {
          estimatedGas: result.estimatedGas,
          gasPriceGwei: formatUnits(result.gasPrice, 'gwei') + ' gwei',
        });
      } else {
        // EIP-1559 path (expected on Base)
        expect(typeof result.maxFeePerGas).toBe('string');
        expect(typeof result.maxPriorityFeePerGas).toBe('string');
        expect(BigInt(result.maxFeePerGas) > 0n).toBe(true);
        expect(BigInt(result.maxPriorityFeePerGas) > 0n).toBe(true);

        // Sanity: cap >= tip
        expect(BigInt(result.maxFeePerGas) >= BigInt(result.maxPriorityFeePerGas)).toBe(true);

        // Logging (human-readable)
        console.log('[live: Base network] Gas Params (eip1559):', {
          estimatedGas: result.estimatedGas,
          maxFeePerGasGwei: formatUnits(result.maxFeePerGas, 'gwei') + ' gwei',
          maxPriorityFeePerGasGwei: formatUnits(result.maxPriorityFeePerGas, 'gwei') + ' gwei',
        });
      }
    });
  });

  describe('mocked: deterministic behavior', () => {
    let feeDataSpy: jest.SpyInstance<Promise<FeeData>>;
    let blockSpy: jest.SpyInstance;

    beforeEach(() => {
      feeDataSpy = jest.spyOn(JsonRpcProvider.prototype, 'getFeeData');
      blockSpy = jest.spyOn(JsonRpcProvider.prototype, 'getBlock');
    });

    afterEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });

    it('EIP-1559: computes cap as base * headroom + tip when provider maxFeePerGas is null', async () => {
      const baseFee = 1_000_000_000n; // 1 gwei
      const priority = 1_000_000n; // 0.001 gwei

      feeDataSpy.mockResolvedValue({
        gasPrice: null,
        maxFeePerGas: null,
        maxPriorityFeePerGas: priority,
        toJSON: () => ({}),
      } as FeeData);

      blockSpy.mockResolvedValue({
        baseFeePerGas: baseFee,
        number: 123456,
        hash: '0x123',
      } as Block);

      const estimatedGas = '21000';
      const result = await getGasParams({
        rpcUrl: 'http://mock.rpc',
        estimatedGas,
      });

      // Assert buffer: 21000 * 1.5 = 31500
      expect(result.estimatedGas).toBe('31500');

      // EIP-1559 branch
      expect('maxFeePerGas' in result).toBe(true);
      if ('maxFeePerGas' in result) {
        const expectedCap = baseFee * 2n + priority; // default headroom is 2x
        expect(result.maxFeePerGas).toBe(expectedCap.toString());
        expect(result.maxPriorityFeePerGas).toBe(priority.toString());
        expect(BigInt(result.maxFeePerGas) >= BigInt(result.maxPriorityFeePerGas)).toBe(true);
      }
    });

    it('EIP-1559: uses provider maxFeePerGas when available', async () => {
      const maxFee = 5_000_000_000n; // 5 gwei
      const priority = 1_500_000_000n; // 1.5 gwei

      feeDataSpy.mockResolvedValue({
        gasPrice: null,
        maxFeePerGas: maxFee,
        maxPriorityFeePerGas: priority,
        toJSON: () => ({}),
      } as FeeData);

      blockSpy.mockResolvedValue({
        baseFeePerGas: 2_000_000_000n, // 2 gwei (ignored when maxFee is provided)
        number: 123456,
        hash: '0x123',
      } as Block);

      const estimatedGas = '42000';
      const result = await getGasParams({
        rpcUrl: 'http://mock.rpc',
        estimatedGas,
      });

      // Assert buffer: 42000 * 1.5 = 63000
      expect(result.estimatedGas).toBe('63000');

      // Should use provider's maxFeePerGas directly
      if ('maxFeePerGas' in result) {
        expect(result.maxFeePerGas).toBe(maxFee.toString());
        expect(result.maxPriorityFeePerGas).toBe(priority.toString());
      }
    });

    it('EIP-1559: applies custom headroom multiplier', async () => {
      const baseFee = 2_000_000_000n; // 2 gwei
      const priority = 500_000_000n; // 0.5 gwei
      const headroomMultiplier = 1.5; // 1.5x instead of default 2x

      feeDataSpy.mockResolvedValue({
        gasPrice: null,
        maxFeePerGas: null,
        maxPriorityFeePerGas: priority,
        toJSON: () => ({}),
      } as FeeData);

      blockSpy.mockResolvedValue({
        baseFeePerGas: baseFee,
        number: 123456,
        hash: '0x123',
      } as Block);

      const estimatedGas = '30000';
      const result = await getGasParams({
        rpcUrl: 'http://mock.rpc',
        estimatedGas,
        headroomMultiplier,
      });

      // Assert buffer: 30000 * 1.5 = 45000
      expect(result.estimatedGas).toBe('45000');

      if ('maxFeePerGas' in result) {
        // baseFee * 1.5 + priority = 2 gwei * 1.5 + 0.5 gwei = 3.5 gwei
        const expectedCap = 3_000_000_000n + priority;
        expect(result.maxFeePerGas).toBe(expectedCap.toString());
        expect(result.maxPriorityFeePerGas).toBe(priority.toString());
      }
    });

    it('Legacy: returns gasPrice when EIP-1559 fields are unavailable', async () => {
      const gasPrice = 20_000_000_000n; // 20 gwei

      feeDataSpy.mockResolvedValue({
        gasPrice,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        toJSON: () => ({}),
      } as FeeData);

      blockSpy.mockResolvedValue(null);

      const estimatedGas = '100000';
      const result = await getGasParams({
        rpcUrl: 'http://mock.rpc',
        estimatedGas,
        gasLimitBuffer: 25, // 25% buffer
      });

      // Buffer: 100000 * 1.25 = 125000
      expect(result.estimatedGas).toBe('125000');

      // Legacy branch
      expect('gasPrice' in result).toBe(true);
      if ('gasPrice' in result) {
        expect(result.gasPrice).toBe(gasPrice.toString());
        expect(BigInt(result.gasPrice) > 0n).toBe(true);
      }
    });

    it('Legacy: throws error when gasPrice is null', async () => {
      feeDataSpy.mockResolvedValue({
        gasPrice: null,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        toJSON: () => ({}),
      } as FeeData);

      blockSpy.mockResolvedValue(null);

      const estimatedGas = '50000';

      // Should throw an error when gas price cannot be determined
      await expect(
        getGasParams({
          rpcUrl: 'http://mock.rpc',
          estimatedGas,
        }),
      ).rejects.toThrow('Legacy transaction detected but gasPrice is missing in feeData');
    });

    it('throws error when EIP-1559 is detected but fields are missing', async () => {
      // Has baseFee but missing priority fee
      feeDataSpy.mockResolvedValue({
        gasPrice: null,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null, // missing
        toJSON: () => ({}),
      } as FeeData);

      blockSpy.mockResolvedValue({
        baseFeePerGas: 1_000_000_000n,
        number: 123456,
        hash: '0x123',
      } as Block);

      await expect(
        getGasParams({
          rpcUrl: 'http://mock.rpc',
          estimatedGas: '21000',
        }),
      ).rejects.toThrow('EIP-1559 detected but missing required fee fields');
    });
  });

  describe('edge cases', () => {
    let feeDataSpy: jest.SpyInstance<Promise<FeeData>>;
    let blockSpy: jest.SpyInstance;

    beforeEach(() => {
      feeDataSpy = jest.spyOn(JsonRpcProvider.prototype, 'getFeeData');
      blockSpy = jest.spyOn(JsonRpcProvider.prototype, 'getBlock');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('handles fractional buffer values correctly', async () => {
      feeDataSpy.mockResolvedValue({
        gasPrice: 10_000_000_000n,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        toJSON: () => ({}),
      } as FeeData);

      blockSpy.mockResolvedValue(null);

      const estimatedGas = '10000';
      const gasLimitBuffer = 37.5; // 37.5% buffer

      const result = await getGasParams({
        rpcUrl: 'http://mock.rpc',
        estimatedGas,
        gasLimitBuffer,
      });

      // 10000 * 1.375 = 13750
      expect(result.estimatedGas).toBe('13750');
    });

    it('handles very small gas estimates', async () => {
      feeDataSpy.mockResolvedValue({
        gasPrice: 1_000_000_000n,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        toJSON: () => ({}),
      } as FeeData);

      blockSpy.mockResolvedValue(null);

      const estimatedGas = '1';
      const result = await getGasParams({
        rpcUrl: 'http://mock.rpc',
        estimatedGas,
      });

      // 1 * 1.5 = 1.5, rounded down to 1
      expect(result.estimatedGas).toBe('1');
    });

    it('handles very large gas estimates', async () => {
      feeDataSpy.mockResolvedValue({
        gasPrice: 1_000_000_000n,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        toJSON: () => ({}),
      } as FeeData);

      blockSpy.mockResolvedValue(null);

      const estimatedGas = '10000000'; // 10 million
      const result = await getGasParams({
        rpcUrl: 'http://mock.rpc',
        estimatedGas,
      });

      // 10000000 * 1.5 = 15000000
      expect(result.estimatedGas).toBe('15000000');
    });
  });
});
