import {
  createVincentAbility,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';

import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  abilityParamsSchema,
  MorphoOperation,
} from './schemas';

import {
  ERC20_ABI,
  ERC4626_VAULT_ABI,
  executeMorphoOperation,
  getMorphoVaultByAddress,
  validateOperationRequirements,
} from './helpers';
import { ethers } from 'ethers';

export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/vincent-ability-morpho' as const,
  abilityDescription: 'Approve, deposit, or redeem from a Morpho Vault.' as const,
  abilityParamsSchema,
  supportedPolicies: supportedPoliciesForAbility([]),

  precheckSuccessSchema,
  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    try {
      console.log('[@lit-protocol/vincent-ability-morpho/precheck]');
      console.log('[@lit-protocol/vincent-ability-morpho/precheck] params:', {
        abilityParams,
      });

      const { alchemyGasSponsor, operation, vaultAddress, amount, rpcUrl } = abilityParams;

      console.log(
        '[@lit-protocol/vincent-ability-morpho/precheck] Starting Morpho Ability precheck validation...',
      );

      if (!rpcUrl) {
        return fail({
          error: '[@lit-protocol/vincent-ability-morpho/precheck] RPC URL is required for precheck',
        });
      }

      // Get provider
      const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);
      const { chainId } = await provider.getNetwork();

      // Get vault info and validate vault exists
      const morphoVaultInfo = await getMorphoVaultByAddress(vaultAddress, chainId);
      if (!morphoVaultInfo) {
        return fail({
          error:
            '[@lit-protocol/vincent-ability-morpho/precheck] Could not get Vault info from Morpho API. Please check the vault address and chain.',
        });
      }

      // Get addresses
      const pkpAddress = delegatorPkpInfo.ethAddress;
      const vaultAssetAddress = morphoVaultInfo.asset.address;

      // Get vault info and validate vault exists
      const vaultContract = new ethers.Contract(vaultAddress, ERC4626_VAULT_ABI, provider);
      const assetContract = new ethers.Contract(vaultAssetAddress, ERC20_ABI, provider);
      let userBalance: ethers.BigNumber;
      let allowance: ethers.BigNumber;
      let vaultShares: ethers.BigNumber;
      try {
        [vaultShares, userBalance, allowance] = await Promise.all([
          vaultContract.balanceOf(pkpAddress),
          assetContract.balanceOf(pkpAddress),
          assetContract.allowance(pkpAddress, vaultAddress),
        ]);
      } catch (error) {
        return fail({
          error: `[@lit-protocol/vincent-ability-morpho/precheck] Invalid vault or its asset chain or address: ${error}`,
        });
      }

      const requestedAmount = ethers.BigNumber.from(amount);

      // Operation-specific validations
      const operationChecks = await validateOperationRequirements(
        operation,
        userBalance,
        allowance,
        vaultShares,
        requestedAmount,
      );

      if (!operationChecks.valid) {
        return fail({
          error: `[@lit-protocol/vincent-ability-morpho/precheck] ${operationChecks.error}`,
        });
      }

      // Estimate gas for the operation
      let estimatedGas = ethers.BigNumber.from(0);
      if (!alchemyGasSponsor) {
        try {
          switch (operation) {
            case MorphoOperation.APPROVE:
              estimatedGas = await assetContract.estimateGas.approve(
                vaultAddress,
                requestedAmount,
                {
                  from: pkpAddress,
                },
              );
              break;
            case MorphoOperation.DEPOSIT:
              estimatedGas = await vaultContract.estimateGas.deposit(requestedAmount, pkpAddress, {
                from: pkpAddress,
              });
              break;
            case MorphoOperation.REDEEM:
              estimatedGas = await vaultContract.estimateGas.redeem(
                requestedAmount,
                pkpAddress,
                pkpAddress,
                {
                  from: pkpAddress,
                },
              );
              break;
          }
        } catch (error) {
          return fail({
            error: `[@lit-protocol/vincent-ability-morpho/precheck] Gas estimation failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
          });
        }
      }

      // Validation passed
      const successResult = {
        operationValid: true,
        vaultValid: true,
        amountValid: true,
        userBalance: userBalance.toString(),
        allowance: allowance.toString(),
        vaultShares: vaultShares.toString(),
        estimatedGas: estimatedGas.toString(),
      };

      console.log(
        '[@lit-protocol/vincent-ability-morpho/precheck] Validation successful:',
        successResult,
      );

      return succeed(successResult);
    } catch (error) {
      console.error('[@lit-protocol/vincent-ability-morpho/precheck] Error:', error);
      return fail({
        error: `[@lit-protocol/vincent-ability-morpho/precheck] Validation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      });
    }
  },

  execute: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    try {
      const {
        operation,
        vaultAddress,
        amount,
        chain,
        rpcUrl,
        alchemyGasSponsor,
        alchemyGasSponsorApiKey,
        alchemyGasSponsorPolicyId,
      } = abilityParams;

      console.log('[@lit-protocol/vincent-ability-morpho/execute] Executing Morpho Ability', {
        operation,
        vaultAddress,
        amount,
        chain,
      });

      if (rpcUrl) {
        return fail({
          error:
            '[@lit-protocol/vincent-ability-morpho/execute] RPC URL is not permitted for execute. Use the `chain` parameter, and the Lit Nodes will provide the RPC URL for you with the Lit.Actions.getRpcUrl() function',
        });
      }

      if (alchemyGasSponsor && (!alchemyGasSponsorApiKey || !alchemyGasSponsorPolicyId)) {
        return fail({
          error:
            '[@lit-protocol/vincent-ability-morpho/execute] Alchemy gas sponsor is enabled, but missing Alchemy API key or policy ID',
        });
      }

      // Get provider
      const provider = new ethers.providers.StaticJsonRpcProvider(
        await Lit.Actions.getRpcUrl({ chain }),
      );
      const { chainId } = await provider.getNetwork();

      // Get vault info and validate vault exists
      const morphoVaultInfo = await getMorphoVaultByAddress(vaultAddress, chainId);
      if (!morphoVaultInfo) {
        return fail({
          error:
            '[@lit-protocol/vincent-ability-morpho/execute] Could not get Vault info from Morpho API. Please check the vault address and chain.',
        });
      }

      // Get address and public key
      const pkpEthAddress = delegatorPkpInfo.ethAddress;
      const vaultAssetAddress = morphoVaultInfo.asset.address;

      // Prepare transaction based on operation
      let abi: typeof ERC20_ABI | typeof ERC4626_VAULT_ABI;
      let contractAddress: string;
      let functionName: string;
      let args: any[];
      switch (operation) {
        case MorphoOperation.APPROVE:
          abi = ERC20_ABI;
          contractAddress = vaultAssetAddress;
          functionName = 'approve';
          args = [vaultAddress, amount];
          break;
        case MorphoOperation.DEPOSIT:
          abi = ERC4626_VAULT_ABI;
          contractAddress = vaultAddress;
          functionName = 'deposit';
          args = [amount, pkpEthAddress];
          break;
        case MorphoOperation.REDEEM:
          abi = ERC4626_VAULT_ABI;
          contractAddress = vaultAddress;
          functionName = 'redeem';
          args = [amount, pkpEthAddress, pkpEthAddress];
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      const txHash = await executeMorphoOperation({
        abi,
        alchemyGasSponsor,
        alchemyGasSponsorApiKey,
        alchemyGasSponsorPolicyId,
        args,
        chainId,
        contractAddress,
        functionName,
        provider,
        pkpInfo: delegatorPkpInfo,
      });

      const result = {
        txHash,
        amount,
        vaultAddress,
      };

      console.log(
        '[@lit-protocol/vincent-ability-morpho/execute] Morpho operation successful',
        result,
      );

      return succeed(result);
    } catch (error) {
      console.error(
        '[@lit-protocol/vincent-ability-morpho/execute] Morpho operation failed',
        error,
      );

      return fail({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  },
});
