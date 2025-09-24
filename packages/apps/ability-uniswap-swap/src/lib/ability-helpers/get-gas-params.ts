import { formatUnits, JsonRpcProvider } from 'ethers-v6';

export type GasParams = LegacyGasParams | Eip1559GasParams;

interface LegacyGasParams {
  gasPrice: string; // in wei
  estimatedGas: string;
}

interface Eip1559GasParams {
  maxFeePerGas: string; // in wei
  maxPriorityFeePerGas: string; // in wei
  estimatedGas: string;
}

const DEFAULT_GAS_LIMIT_BUFFER = 50; // adding 50% buffer to the estimated gas
const DEFAULT_BASE_FEE_PER_GAS_MULTIPLIER = 2; // maxFee = base * 2 + tip

export const getGasParams = async ({
  rpcUrl,
  estimatedGas,
  gasLimitBuffer = DEFAULT_GAS_LIMIT_BUFFER,
  baseFeePerGasMultiplier = DEFAULT_BASE_FEE_PER_GAS_MULTIPLIER,
}: {
  rpcUrl: string;
  estimatedGas: string;
  gasLimitBuffer?: number;
  baseFeePerGasMultiplier?: number;
}): Promise<GasParams> => {
  const provider = new JsonRpcProvider(rpcUrl);

  try {
    const [feeData, block] = await Promise.all([
      provider.getFeeData(),
      provider.getBlock('latest'),
    ]);

    /**
     * BigInt doesn't support decimals, so we scale percentage/multiplier inputs by 100 and work entirely in integers.
     * When applying, we divide by SCALE to get the correct decimal.
     *
     * For example:
     *  gasLimitBuffer = 50 → 5000 (meaning 50.00%)
     *  baseFeePerGasMultiplier = 1.5 → 150 (meaning 1.50×)
     */
    const gasLimitBufferScaled = BigInt(Math.round(gasLimitBuffer * 100)); // e.g. 50 -> 5000
    const baseFeePerGasMultiplierScaled = BigInt(Math.round(baseFeePerGasMultiplier * 100)); // e.g. 1.5 -> 150
    const SCALE = 100n;

    /**
     * We scale everything by SCALE so floats like 37.5% become integers (e.g. 3750).
     * (100n * SCALE + gasLimitBufferScaled) gives us (100% + buffer%).
     *
     * Multiplying estimatedGas by that factor and dividing by (100 * SCALE)
     * applies the percentage increase while staying in integer math with BigInt.
     *
     * Example: estimatedGas=21000, buffer=50 → (21000 * 15000) / 10000 = 31500.
     */
    const estimatedGasWithBuffer =
      (BigInt(estimatedGas) * (100n * SCALE + gasLimitBufferScaled)) / (100n * SCALE);

    const gasPrice = feeData.gasPrice ?? null;
    const maxFee = feeData.maxFeePerGas ?? null;
    const priority = feeData.maxPriorityFeePerGas ?? null;
    const baseFee = block?.baseFeePerGas ?? null;

    console.log('[getGasParams] v6 feeData:', {
      gasPrice: gasPrice ? `${formatUnits(gasPrice, 'gwei')} gwei` : null,
      maxFeePerGas: maxFee ? `${formatUnits(maxFee, 'gwei')} gwei` : null,
      maxPriorityFeePerGas: priority ? `${formatUnits(priority, 'gwei')} gwei` : null,
    });
    console.log(
      '[getGasParams] v6 block baseFeePerGas:',
      baseFee ? `${formatUnits(baseFee, 'gwei')} gwei` : null,
    );
    console.log('[getGasParams] estimatedGasWithBuffer:', estimatedGasWithBuffer.toString());

    // Check if this is an EIP-1559 network (has baseFee or EIP-1559 fee data)
    const isEip1559Network = baseFee != null || maxFee != null || priority != null;

    if (isEip1559Network) {
      // Prefer maxFee provided by the provider, otherwise compute with baseFeePerGasMultiplier: base * baseFeePerGasMultiplier + tip
      let computedMaxFee = maxFee;
      if (!computedMaxFee && baseFee != null && priority != null) {
        computedMaxFee = (baseFee * baseFeePerGasMultiplierScaled) / SCALE + priority;
      }

      if (priority == null || computedMaxFee == null) {
        throw new Error('EIP-1559 detected but missing required fee fields');
      }

      return {
        maxFeePerGas: computedMaxFee.toString(),
        maxPriorityFeePerGas: priority.toString(),
        estimatedGas: estimatedGasWithBuffer.toString(),
      };
    }

    // Legacy transaction path
    if (gasPrice == null) {
      throw new Error('Legacy transaction detected but gasPrice is missing in feeData');
    }

    return {
      gasPrice: gasPrice.toString(),
      estimatedGas: estimatedGasWithBuffer.toString(),
    };
  } finally {
    // Clean up provider to prevent open handles
    provider.destroy();
  }
};
