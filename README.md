# Ethereum Contract Deployer
> Deploy contracts and execute transactions on Ethereum with ease

A simple package for deploying contracts and executing transactions to any ethereum chain you want with just a few simple lines of code. 


## Installation

OS X & Linux:

```sh
npm install eth-contract-deployer --save
```

Windows:

```sh
npm install eth-contract-deployer --save
```

## Usage example
### Usage

require eth-contract-deployer in your script
```javascript
const ethDeployer = require("eth-contract-deployer");
```

configure eth-contract-deployer 
```javascript
// config object for eth deployer
  const config = {
    node_address: 'http://127.0.0.1:8545', // node address
    artifacts_dir: '/path/to/artifacts/dir', // path to contracts artifacts (abi/bin files)
    private_key: '0x000...', // private key
  };

  // configure eth deployer
  ethDeployer.config(config);
```

### Deploy a contract
the deploy function needs 2 arguments, 
* contract name - the contract abi filename as it is on the artifacts dir provided
* constructor arguments - an array containing the values needed for the contract constructor 
  
```javascript
// deploy some contract
  const token = await ethDeployer.deploy("ContractName", ["value1", "value2", 'value3']);

```

### Get contract instance
getInstance needs 2 arguments
* contract name - the contract abi filename as it is on the artifacts dir provided
* contract address - the address of the existing contract
```javascript
const contractInstance = ethDeployer.getInstance("ContractName", "0x000...");
```

### Execute a transaction
execute needs just one argument, a transaction object
```javascript
// execute transaction
  const tx = token.methods.transfer("0x000...", "10000000000000000000000");
  await ethDeployer.execute(tx);
```

### Get account
get account object
```javascript
// get self address
  const account = ethDeployer.getAccount();
  account.address // public address
```

### Get web3 instance
get a web3 instance
```javascript
// get web3 instance
  const web3 = ethDeployer.getWeb3Instance();
```

### example of using the module to prepare a deploy script for a bancor smart token:
 * deploys the bancor smart token
 * deploys a converter contract for the smart token
 * deploys a new ERC20 token 
 * issue smart tokens
 * transfer the new ERC20 token to the converter
 * transfer smart token owner ship to the converter
 * accept smart token ownership by the converter
 * run a conversion between both tokens to test if the whole thing worked

```javascript
const ethDeployer = require("eth-contract-deployer");

const PRIVATE_KEY = "";
const ARTIFACTS_DIR = "";
const NODE_ADDRESS = "";

async function run() {
  // config object for eth deployer
  const config = {
    node_address: NODE_ADDRESS, // node address
    artifacts_dir: ARTIFACTS_DIR, // path to contracts artifacts
    private_key: PRIVATE_KEY, // private key
  };

  // configure eth deployer
  ethDeployer.config(config);

  // get self address
  const account = ethDeployer.getAccount();

  // get web3 instance
  const web3 = ethDeployer.getWeb3();

  // deploy bancor smart token
  const smartToken = await ethDeployer.deploy("SmartToken", ["test token", "TST", 18]);

  // deploy ERC20 token
  const reserveToken = await ethDeployer.deploy("ERC20Token", ["reserve token", "RSV", 18, "10000000000000000000000"]);

  // deploy bancor converter
  const contractRegistryAddress = "0x000..."; // Bancor registry contract address goes here
  const fee = 3000;
  const ratio = 100000;
  const converterParams = [smartToken._address, contractRegistryAddress, fee, reserveToken._address, ratio];
  const converter = await ethDeployer.deploy("BancorConverter", converterParams);

  // issue new smartToken tokens
  const tx = smartToken.methods.issue(account.address, "10000000000000000000000");
  await ethDeployer.execute(tx);

  // transfer reserve tokens to converter
  await ethDeployer.execute(reserveToken.methods.transfer(converter._address, "1000000000000000000000"));

  // transfer smartToken ownership to converter
  await ethDeployer.execute(smartToken.methods.transferOwnership(converter._address));

  // accept smartToken ownership by converter
  await ethDeployer.execute(converter.methods.acceptTokenOwnership());

  // check tokens balance before conversion
  console.log("smartToken balance", web3.utils.fromWei(await smartToken.methods.balanceOf(account.address).call()));
  console.log("reserve balance", web3.utils.fromWei(await reserveToken.methods.balanceOf(account.address).call()));

  // perform conversion smartToken -> reserve token
  const conversionPath = [smartToken._address, smartToken._address, reserveToken._address];
  await ethDeployer.execute(await converter.methods.quickConvert(conversionPath, "1000000000000000000", "1"));

  // check tokens balance after conversion
  console.log("smartToken balance", web3.utils.fromWei(await smartToken.methods.balanceOf(account.address).call()));
  console.log("reserve balance", web3.utils.fromWei(await reserveToken.methods.balanceOf(account.address).call()));
}

run()
  .then((t) => {
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });

```

## Meta

Your Name – [@ozam15](https://twitter.com/ozam15) – omer@seedbed.io

[https://github.com/omerzam/eth-contract-deployer](https://github.com/omerzam/eth-contract-deployer)
