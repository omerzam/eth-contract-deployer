const Web3 = require("web3");
const ethDeployer = require("../");

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

  // deploy bancor smart token
  const smartToken = await ethDeployer.deploy("SmartToken", ["test token", "TST", 18]);
  // deploy ERC20 token
  const reserveToken = await ethDeployer.deploy("ERC20Token", ["reserve token", "RSV", 18, "10000000000000000000000"]);

  // get self address
  const web3 = new Web3(config.node_address);
  const account = web3.eth.accounts.privateKeyToAccount(config.private_key);

  // issue new smartToken tokens
  const tx = await smartToken.methods.issue(account.address, "10000000000000000000000");
  await ethDeployer.execute(tx);

  // deploy bancor converter
  const contractRegistryAddress = "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab";
  const fee = 3000;
  const ratio = 100000;
  const converterParams = [smartToken._address, contractRegistryAddress, fee, reserveToken._address, ratio];
  const converter = await ethDeployer.deploy("BancorConverter", converterParams);

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

run().catch((error) => {
  console.log(error);
  process.exit(1);
});
