import { Account, WalletClient } from 'viem';
import { createVincentNetworkContext } from '../networks/vDatil/shared/VincentChainClient/vincentNetworkContext';

// Import all the APIs
import * as VincentAppFacet from '../networks/vDatil/shared/VincentChainClient/apis/rawContractApis/VincentAppFacet';
import * as VincentAppViewFacet from '../networks/vDatil/shared/VincentChainClient/apis/rawContractApis/VincentAppViewFacet';
import * as VincentToolFacet from '../networks/vDatil/shared/VincentChainClient/apis/rawContractApis/VincentToolFacet';
import * as VincentToolViewFacet from '../networks/vDatil/shared/VincentChainClient/apis/rawContractApis/VincentToolViewFacet';
import * as VincentUserFacet from '../networks/vDatil/shared/VincentChainClient/apis/rawContractApis/VincentUserFacet';
import * as VincentUserViewFacet from '../networks/vDatil/shared/VincentChainClient/apis/rawContractApis/VincentUserViewFacet';
import { privateKeyToAccount } from 'viem/accounts';

/**
 * Configuration for creating a Datil Chain Manager
 */
export interface DatilChainManagerConfig {
  /**
   * The account or wallet client to use for transactions
   */
  account: Account | WalletClient;

  /**
   * The network to connect to
   */
  network: 'datil-dev' | 'datil-test' | 'datil-mainnet';
}

/**
 * Creates a Datil Chain Manager for interacting with Vincent network APIs
 * @param config Configuration including account and network
 * @returns An object with categorized API methods
 */
export function createDatilChainManager(config: DatilChainManagerConfig) {
  // Create network context based on the provided account and network
  const networkType = config.network.replace('datil-', '') as
    | 'dev'
    | 'test'
    | 'mainnet';
  const networkContext = createVincentNetworkContext({
    accountOrWalletClient: config.account,
    network:
      networkType === 'mainnet'
        ? 'datil'
        : networkType === 'test'
          ? 'datil-test'
          : 'datil-dev',
  });

  // Helper to bind the network context to an API function
  const bindContext = <T extends (req: any, ctx: any) => any>(fn: T) => {
    return (req: Parameters<T>[0]) => fn(req, networkContext);
  };

  switch (config.network) {
    case 'datil-mainnet':
    case 'datil-test':
    case 'datil-dev':
      return {
        vincentApi: {
          consentPage: {
            getAppById: bindContext(VincentAppViewFacet.getAppById),
            getAppVersion: bindContext(VincentAppViewFacet.getAppVersion),
            isToolApproved: bindContext(VincentToolViewFacet.isToolApproved),
            permitAppVersion: bindContext(VincentUserFacet.permitAppVersion),
            removeToolPolicyParameters: bindContext(
              VincentUserFacet.removeToolPolicyParameters,
            ),
            setToolPolicyParameters: bindContext(
              VincentUserFacet.setToolPolicyParameters,
            ),
            unPermitAppVersion: bindContext(
              VincentUserFacet.unPermitAppVersion,
            ),
          },
          appManagerDashboard: {
            addAuthorizedRedirectUri: bindContext(
              VincentAppFacet.addAuthorizedRedirectUri,
            ),
            addDelegatee: bindContext(VincentAppFacet.addDelegatee),
            enableAppVersion: bindContext(VincentAppFacet.enableAppVersion),
            getAppsByManager: bindContext(VincentAppViewFacet.getAppsByManager),
            isToolApproved: bindContext(VincentToolViewFacet.isToolApproved),
            registerApp: bindContext(VincentAppFacet.registerApp),
            registerNextAppVersion: bindContext(
              VincentAppFacet.registerNextAppVersion,
            ),
            registerTools: bindContext(VincentToolFacet.registerTools),
            removeAuthorizedRedirectUri: bindContext(
              VincentAppFacet.removeAuthorizedRedirectUri,
            ),
            removeDelegatee: bindContext(VincentAppFacet.removeDelegatee),
          },
          toolLitActions: {
            validateToolExecutionAndGetPolicies: bindContext(
              VincentUserViewFacet.validateToolExecutionAndGetPolicies,
            ),
          },
          litManager: {
            approveTools: bindContext(VincentToolFacet.approveTools),
            getAllApprovedTools: VincentToolViewFacet.getAllApprovedTools,
            getApprovedToolsManager:
              VincentToolViewFacet.getApprovedToolsManager,
            registerTools: bindContext(VincentToolFacet.registerTools),
            removeToolApprovals: bindContext(
              VincentToolFacet.removeToolApprovals,
            ),
            updateApprovedToolsManager: bindContext(
              VincentToolFacet.updateApprovedToolsManager,
            ),
          },
          userDashboard: {
            getAllPermittedAppIdsForPkp: bindContext(
              VincentUserViewFacet.getAllPermittedAppIdsForPkp,
            ),
            getAllRegisteredAgentPkps: bindContext(
              VincentUserViewFacet.getAllRegisteredAgentPkps,
            ),
            getAllToolsAndPoliciesForApp: bindContext(
              VincentUserViewFacet.getAllToolsAndPoliciesForApp,
            ),
            getAppById: bindContext(VincentAppViewFacet.getAppById),
            getAppVersion: bindContext(VincentAppViewFacet.getAppVersion),
            getPermittedAppVersionForPkp: bindContext(
              VincentUserViewFacet.getPermittedAppVersionForPkp,
            ),
            permitAppVersion: bindContext(VincentUserFacet.permitAppVersion),
            removeToolPolicyParameters: bindContext(
              VincentUserFacet.removeToolPolicyParameters,
            ),
            setToolPolicyParameters: bindContext(
              VincentUserFacet.setToolPolicyParameters,
            ),
            unPermitAppVersion: bindContext(
              VincentUserFacet.unPermitAppVersion,
            ),
          },
          unknown: {
            getAppByDelegatee: bindContext(
              VincentAppViewFacet.getAppByDelegatee,
            ),
            getAuthorizedRedirectUriByHash: bindContext(
              VincentAppViewFacet.getAuthorizedRedirectUriByHash,
            ),
            getAuthorizedRedirectUrisByAppId: bindContext(
              VincentAppViewFacet.getAuthorizedRedirectUrisByAppId,
            ),
            getTotalAppCount: bindContext(VincentAppViewFacet.getTotalAppCount),
            getToolIpfsCidByHash: bindContext(
              VincentToolViewFacet.getToolIpfsCidByHash,
            ),
          },
        },
      };
    default:
      throw new Error(`Unsupported network: ${config.network}`);
  }
}

// if (import.meta.main) {
//   // Setup a wallet client
//   const privateKey =
//     '0xa2fcb1ba1ca9832c64e5e7afa616a5837da0bef84d0e1b0debbbdebce013547e';
//   const account = privateKeyToAccount(privateKey);

//   const chainManager = createDatilChainManager({
//     account,
//     network: 'datil-mainnet',
//   });

//   const result = await chainManager.vincentApi.appManagerDashboard.registerApp({
//     appName: 'My New App',
//     appDescription: 'A description of my application',
//     authorizedRedirectUris: ['https://myapp.com/callback'],
//     delegatees: ['0x1234567890abcdef1234567890abcdef12345678'],
//     toolIpfsCids: ['QmUT4Ke8cPtJYRZiWrkoG9RZc77hmRETNQjvDYfLtrMUEY'],
//     toolPolicies: [['QmcLbQPohPURMuNdhYYa6wyDp9pm6eHPdHv9TRgFkPVebE']],
//     toolPolicyParameterNames: [[['param1']]],
//     toolPolicyParameterTypes: [[['INT256']]],
//   });

//   console.log('App registered successfully:', result);
// }
