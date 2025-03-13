import { VincentContracts } from "./contracts";

async function main() {
    const contracts = new VincentContracts('datil');
    const apps = await contracts.getAppVersion(1, 0);
    console.log('meow meow', apps);
}

main();