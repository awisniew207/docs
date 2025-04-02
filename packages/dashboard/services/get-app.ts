import { AppView } from "./types";
import { VincentContracts } from "./contract/contracts";
import { BigNumber } from "ethers";

export async function formCompleteVincentAppForDev(address: string): Promise<AppView[]> {
    const contracts = new VincentContracts('datil');
    console.log("in formCompleteVincentAppForDev");
    const apps = await contracts.getAppsByManager(address);


    return apps.map((appData: any) => {
        // Extract the app data from the structured response
        const { app, versions } = appData;
        
        // Convert BigNumber ID values to regular numbers safely to avoid overflow
        const appId = app.id ? app.id.toString() : "0";
        const latestVersion = app.latestVersion ? app.latestVersion.toString() : "0";
        
        // Handle deploymentStatus which could be a BigNumber
        let deploymentStatus = 0;
        if (app.deploymentStatus !== undefined) {
            if (typeof app.deploymentStatus === 'object' && app.deploymentStatus._isBigNumber) {
                deploymentStatus = parseInt(app.deploymentStatus.toString());
            } else {
                deploymentStatus = app.deploymentStatus;
            }
        }
        
        return {
            appId: parseInt(appId),
            appName: app.name,
            description: app.description,
            authorizedRedirectUris: app.authorizedRedirectUris || [],
            delegatees: app.delegatees || [],
            toolPolicies: versions || [],
            managementWallet: app.manager,
            currentVersion: parseInt(latestVersion),
            deploymentStatus
        };
    });
}