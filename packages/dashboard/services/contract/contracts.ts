import { getContract, Network } from './config';

export interface VincentContractsConfig {
  network?: Network;
}

export class VincentContracts {
  private network: Network;

  constructor(network: Network) {
    this.network = network;
  }

  async fetchDelegatedAgentPKPs(appId: number, version: number) {
    const contract = await getContract(this.network, 'AppView');
    const appView = await contract.getAppVersion(appId, version);
    return appView.delegatedAgentPkpTokenIds;
  }

  async registerApp(
    appName: string,
    appDescription: string,
    authorizedDomains: any,
    authorizedRedirectUris: any,
    delegatees: any
  ) {
    const contract = await getContract(this.network, 'App');
    const tx = await contract.registerApp(
      appName,
      appDescription,
      authorizedDomains,
      authorizedRedirectUris,
      delegatees
    );
    await tx.wait();
    return tx;
  }

  async addDelegatee(appId: number, delegatee: number) {
    const contract = await getContract(this.network, 'App', true);
    const tx = await contract.addDelegatee(appId, delegatee);
    await tx.wait();
    return tx;
  }

  async removeDelegatee(appId: number, delegatee: number) {
    const contract = await getContract(this.network, 'App', true);
    const tx = await contract.removeDelegatee(appId, delegatee);
    await tx.wait();
    return tx;
  }
}
