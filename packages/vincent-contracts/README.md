## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

## Vincent Deployment

To deploy the Vincent Diamond contract:

1. Copy `.env.example` to `.env`
2. Set the following **required** environment variables in `.env`:
   - `VINCENT_DEPLOYMENT_RPC_URL` - RPC URL for deployment
   - `VINCENT_DEPLOYER_PRIVATE_KEY` - Private key of the deployer account
   - `DATIL_DEV_PKP_NFT_CONTRACT_ADDRESS` - PKP NFT contract address for Datil Dev network
   - `DATIL_TEST_PKP_NFT_CONTRACT_ADDRESS` - PKP NFT contract address for Datil Test network
   - `DATIL_PKP_NFT_CONTRACT_ADDRESS` - PKP NFT contract address for Datil network
   - `APPROVED_TOOLS_MANAGER_ADDRESS` - Address of the approved tools manager (required)

3. Run one of the following commands:
   - `$ make deploy-vincent` - Deploy to all networks
   - `$ make deploy-vincent-datil-dev` - Deploy to Datil Dev only
   - `$ make deploy-vincent-datil-test` - Deploy to Datil Test only
   - `$ make deploy-vincent-datil` - Deploy to Datil only

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
