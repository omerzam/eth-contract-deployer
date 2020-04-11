const Web3 = require("web3");
const ethDeployer = require("../");

const PRIVATE_KEY = "";
const ARTIFACTS_DIR = "";
const NODE_ADDRESS = "";

async function run() {
  // const nodeAddress = config.node_address;
  // const privateKey = config.private_key;
  const config = {
    node_address: NODE_ADDRESS,
    artifacts_dir: ARTIFACTS_DIR,
    private_key: PRIVATE_KEY,
  }
  // const web3 = new Web3(node_address);

  // const gasPrice = await getGasPrice(web3);
  // const account = web3.eth.accounts.privateKeyToAccount(privateKey);

  // console.log(ethDeployer.config);
  ethDeployer.config(config);

  const smartToken = await ethDeployer.deploy(null, "SmartToken", ["test token", "TST", 18]);
  console.log(await smartToken.methods.totalSupply().call());
  
  const web3 = new Web3(config.node_address);
  const account = web3.eth.accounts.privateKeyToAccount(config.private_key);
  const tx = await smartToken.methods.issue(account.address, "1000000000000000000000000");
  // console.log(tx);
  const res = await ethDeployer.execute(tx)
  console.log(await smartToken.methods.totalSupply().call());
  // console.log(res);
  

  // const web3Func = (func, ...args) => func(web3, account, gasPrice, ...args);
  // let phase = 0;
  // const execute = async (transaction, ...args) => {
  //   const receipt = await web3Func(send, transaction, ...args);
  //   phase++;
  //   console.log(`phase ${phase} executed`);
  //   return receipt;
  // };

  // const web3        = new Web3(NODE_ADDRESS);
  // const account     = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
  //   const path = "/home/omerz/dev/contracts/solidity/build";
  //   const smartTokenParams = {
  //     name: "Seedbed Smart Token",
  //     symbol: "SDB",
  //     decimals: 18,
  //     supply: "100000000000000000000000",
  //   };

  // const converterParams = {
  //   fee: 0,
  //   ratio1: 1000000,
  //   reserve1: "100000000000000000000000",
  // };

  // const smartToken = await web3Func(deploy, "smartToken", "SmartToken", [smartTokenParams.name, smartTokenParams.symbol, smartTokenParams.decimals]);
  // const bancorConverter = await web3Func(deploy, "bancorConverter", "BancorConverter", [
  //   smartToken._address,
  //   "0x1fD601f5D70D294Da7768baF96643d8f9d70AD29",
  //   converterParams.fee,
  //   "0xb9a3A5A19b7E6CEb07c767F4F94f292bF4398FD6",
  //   converterParams.ratio1,
  // ]);
  // const convertWrapper = await web3Func(deploy, "convertWrapper", "ConvertWrapper", [smartToken._address]);

  // await execute(smartToken.methods.issue(account.address, smartTokenParams.supply));
  // const ERC20abi = fs.readFileSync(ARTIFACTS_DIR + "ERC20" + ".abi", { encoding: "utf8" });

  // const reserve = new web3.eth.Contract(JSON.parse(ERC20abi), "0xb9a3A5A19b7E6CEb07c767F4F94f292bF4398FD6");
  // let reserveAccountBalance = await reserve.methods.balanceOf(account.address).call();

  // console.log(web3.utils.fromWei(reserveAccountBalance));

  // if (reserveAccountBalance < converterParams.reserve1) throw new Error("not enough funds");
  // // const res = web3.utils.fromWei(reserveAccountBalance)
  // const BN = web3.utils.BN;
  // reserveAccountBalance = new BN(reserveAccountBalance);
  // const test = reserveAccountBalance.div(new BN(2));
  // console.log(web3.utils.fromWei(test.toString()));

  // await execute(reserve.methods.transfer(bancorConverter._address, converterParams.reserve1));
  // await execute(smartToken.methods.transferOwnership(bancorConverter._address));
  // await execute(bancorConverter.methods.acceptTokenOwnership());
  // await execute(convertWrapper.methods.setConverter(bancorConverter._address));
  // await execute(convertWrapper.methods.setERC677TokenAddress("0xb9a3A5A19b7E6CEb07c767F4F94f292bF4398FD6"));
  // await execute(convertWrapper.methods.setBancorNetworkAddress("0xdC7D7D5B7133F78ef4F3363b708430938a38320f"));

  // const abi         = fs.readFileSync(path + ".abi", {encoding: "utf8"});
  // const bin         = fs.readFileSync(path + ".bin", {encoding: "utf8"});
  // const contract    = new web3.eth.Contract(JSON.parse(abi));
  // const options     = {data: "0x" + bin, arguments: CONTRACT_ARGS};
  // const transaction = contract.deploy(options);
  // const receipt     = await send(web3, account, transaction);
  // console.log(JSON.stringify({
  //     [CONTRACT_NAME]: {
  //         name: CONTRACT_NAME,
  //         addr: receipt.contractAddress,
  //         args: transaction.encodeABI().slice(options.data.length)
  //     }
  // }));
  // if (web3.currentProvider.constructor.name == "WebsocketProvider")
  //     web3.currentProvider.connection.close();
}

run().catch((error) => {
  console.log(error);
  process.exit(1);
});
