const fs = require("fs");
const Web3 = require("web3");

let node_address = "";
let private_key = "";
let artifacts_dir = "";
let web3;
let min_gas_limit = 100000;
let account;
let gasPrice;

async function scan(message) {
  process.stdout.write(message);
  return await new Promise(function (resolve, reject) {
    process.stdin.resume();
    process.stdin.once("data", function (data) {
      process.stdin.pause();
      resolve(data.toString().trim());
    });
  });
}

async function getGasPrice(web3) {
  while (true) {
    const nodeGasPrice = await web3.eth.getGasPrice();
    const userGasPrice = await scan(`Enter gas-price or leave empty to use ${nodeGasPrice}: `);
    if (/^\d+$/.test(userGasPrice)) return userGasPrice;
    if (userGasPrice == "") return nodeGasPrice;
    console.log("Illegal gas-price");
  }
}

async function getTransactionReceipt(web3) {
  while (true) {
    const hash = await scan("Enter transaction-hash or leave empty to retry: ");
    if (/^0x([0-9A-Fa-f]{64})$/.test(hash)) {
      const receipt = await web3.eth.getTransactionReceipt(hash);
      if (receipt) return receipt;
      console.log("Invalid transaction-hash");
    } else if (hash) {
      console.log("Illegal transaction-hash");
    } else {
      return null;
    }
  }
}

async function send(web3, account, minGasLimit, transaction, value = 0) {
  gasPrice = gasPrice || (await getGasPrice(web3));
  while (true) {
    try {
      const options = {
        to: transaction._parent._address,
        data: transaction.encodeABI(),
        gas: Math.max(await transaction.estimateGas({ from: account.address }), minGasLimit),
        gasPrice: gasPrice ? gasPrice : await getGasPrice(web3),
        value: value,
      };

      const signed = await web3.eth.accounts.signTransaction(options, account.privateKey);
      const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
      return receipt;
    } catch (error) {
      console.log(error.message);
      const receipt = await getTransactionReceipt(web3);
      if (receipt) return receipt;
    }
  }
}

const deploy = async (contractName, contractArgs) => {
  const abi = fs.readFileSync(artifacts_dir + contractName + ".abi", { encoding: "utf8" });
  const bin = fs.readFileSync(artifacts_dir + contractName + ".bin", { encoding: "utf8" });

  const contract = new web3.eth.Contract(JSON.parse(abi));
  const options = { data: "0x" + bin, arguments: contractArgs };

  const transaction = contract.deploy(options);
  const receipt = await send(web3, account, min_gas_limit, transaction);
  console.log(`${contractName} deployed at ${receipt.contractAddress}`);
  return deployed(web3, contractName, receipt.contractAddress);
};

function deployed(web3, contractName, contractAddr) {
  const abi = fs.readFileSync(artifacts_dir + contractName + ".abi", { encoding: "utf8" });
  return new web3.eth.Contract(JSON.parse(abi), contractAddr);
}

const execute = async (transaction, ...args) => {
  const receipt = await send(web3, account, min_gas_limit, transaction);
  return receipt;
};

const config = (options) => {
  (node_address = options.node_address), (artifacts_dir = options.artifacts_dir), (private_key = options.private_key);
  min_gas_limit = options.min_gas_limit ? options.min_gas_limit : 100000;
  web3 = new Web3(node_address);
  account = web3.eth.accounts.privateKeyToAccount(private_key);
};

module.exports = {
  config,
  deploy,
  execute,
};
