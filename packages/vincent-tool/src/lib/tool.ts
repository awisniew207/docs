import { z } from 'zod';
import { LIT_NETWORK } from '@lit-protocol/constants';

/**
 * Represents the supported Lit networks for the tool.
 * @typedef {string} SupportedLitNetwork
 * @description Can be one of the following:
 * - `LIT_NETWORK.Datil` (production environment)
 */
export type SupportedLitNetwork = (typeof LIT_NETWORK)['Datil'];

/**
 * Represents the configuration for a specific Lit network.
 * @typedef {Object} NetworkConfig
 * @property {string} litNetwork - The Lit network identifier (e.g., 'datil-dev', 'datil-test', 'datil').
 * @property {string} ipfsCid - The IPFS CID (Content Identifier) associated with the network configuration.
 */
export interface NetworkConfig {
  litNetwork: string;
  ipfsCid: string;
}

/**
 * Network-specific configurations for the Tool.
 * @type {Record<string, NetworkConfig>}
 * @description A mapping of network names to their respective configurations.
 */
export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  datil: {
    litNetwork: 'datil', // Lit network identifier for the production environment
    ipfsCid: '', // IPFS CID for the production environment (to be populated if needed)
  },
};

/**
 * Zod schema for validating Ethereum addresses.
 * @type {z.ZodString}
 * @description Ensures the address is a valid Ethereum address (0x followed by 40 hexadecimal characters).
 */
export const BaseEthereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format');

/**
 * Represents a validated Ethereum address.
 * @typedef {z.infer<typeof BaseEthereumAddressSchema>} EthereumAddress
 */
export type EthereumAddress = z.infer<typeof BaseEthereumAddressSchema>;

/**
 * Represents a generic AW (Function-as-a-Service) tool.
 * @template TParams - The type of the tool's parameters.
 * @template TPolicy - The type of the tool's policy.
 */
export interface VincentTool<
  TParams extends Record<string, any> = Record<string, any>,
  TPolicy extends { type: string } = { type: string }
> {
  /**
   * The name of the tool. This should be a unique identifier that clearly describes the tool's purpose.
   */
  name: string;

  /**
   * A detailed description of the tool's functionality, including its purpose, use cases, and any important notes.
   */
  description: string;

  /**
   * The IPFS Content Identifier (CID) that points to the tool's Lit Action implementation.
   * This is used to locate and execute the tool's code.
   */
  ipfsCid: string;

  /**
   * The chain of the tool.
   */
  chain: string;

  /**
   * Configuration for the tool's parameters.
   * Defines the structure, validation, and documentation of the tool's input parameters.
   */
  parameters: {
    /**
     * The TypeScript type definition for the tool's parameters.
     * This serves as a compile-time type check for parameter values.
     */
    type: TParams;

    /**
     * Zod schema for runtime validation of parameter values.
     * Ensures that parameters meet the required format and constraints.
     */
    schema: z.ZodType<TParams>;

    /**
     * Human-readable descriptions of each parameter.
     * Provides documentation about what each parameter does and how it should be used.
     */
    descriptions: Readonly<Record<keyof TParams, string>>;

    /**
     * Function to validate parameter values at runtime.
     * @param params - The parameters to validate.
     * @returns true if validation succeeds, or an array of validation errors if it fails.
     */
    validate: (
      params: unknown
    ) => true | Array<{ param: string; error: string }>;
  };
}