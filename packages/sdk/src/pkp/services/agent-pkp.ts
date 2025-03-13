import { getSignerOrProvider, Network } from "../contract/contracts";

class VinceContracts {
    private network: Network;   

    constructor(network: Network) {
        this.network = network;
    }

    async fetchDelegatedAgentPKPs(appId: number, version: number) {
        const contract = await getSignerOrProvider(this.network, true);
        const pkps = await contract.getAppVersion(appId, version);
        return pkps;
    }
    
    async setDelegateeWallet(network: Network, appId: number, version: number) {
        const contract = await getSignerOrProvider(network, true);
        const pkps = await contract.setDelegateeWallet(appId, version);
        return pkps;
    }
    
    async updateDelegateeWallet() {}
}   