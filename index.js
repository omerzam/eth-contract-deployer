/**
 * wrapper module to deploy contracts as well as prepare and send transactions to the blockchain
 * using this wrapper you can deploy multiple contracts and perform transactions with the new contracts easly
 *
 * TODO: move to typescript
 * TODO: add tests
 * TODO: get config values from env vars
 */

const fs = require('fs')
const Web3 = require('web3')

let nodeAddress = ''
let privateKey = ''
let artifactsDir = ''
let web3
let min_gas_limit = 100000
let account
let gasPrice

/**
 * @param  {string} message
 */
async function scan (message) {
  process.stdout.write(message)
  return await new Promise(function (resolve, reject) {
    process.stdin.resume()
    process.stdin.once('data', function (data) {
      process.stdin.pause()
      resolve(data.toString().trim())
    })
  })
}

/**
 * @param  {object} web3
 */
async function getGasPrice (web3) {
  while (true) {
    const nodeGasPrice = await web3.eth.getGasPrice()
    const userGasPrice = await scan(`Enter gas-price or leave empty to use ${nodeGasPrice}: `)
    if (/^\d+$/.test(userGasPrice)) return userGasPrice
    if (userGasPrice === '') return nodeGasPrice
    console.log('Illegal gas-price')
  }
}

/**
 * @param  {*} web3
 */
async function getTransactionReceipt (web3) {
  while (true) {
    const hash = await scan('Enter transaction-hash or leave empty to retry: ')
    if (/^0x([0-9A-Fa-f]{64})$/.test(hash)) {
      const receipt = await web3.eth.getTransactionReceipt(hash)
      if (receipt) return receipt
      console.log('Invalid transaction-hash')
    } else if (hash) {
      console.log('Illegal transaction-hash')
    } else {
      return null
    }
  }
}

/**
 * prepares, sign and sends the transaction to the node
 *
 * @param {*} web3
 * @param {*} account
 * @param {*} minGasLimit
 * @param {*} transaction
 * @param {*} value
 */
async function send (web3, account, minGasLimit, transaction, value = 0) {
  gasPrice = gasPrice || (await getGasPrice(web3))
  while (true) {
    try {
      const options = {
        to: transaction._parent._address,
        data: transaction.encodeABI(),
        gas: Math.max(await transaction.estimateGas({ from: account.address }), minGasLimit),
        gasPrice: gasPrice || await getGasPrice(web3),
        value: value
      }

      const signed = await web3.eth.accounts.signTransaction(options, account.privateKey)
      const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction)
      return receipt
    } catch (error) {
      const receipt = await getTransactionReceipt(web3)
      if (receipt) return receipt
    }
  }
}

/**
 * deploy contract
 *
 * @param {*} contractName
 * @param {*} contractArgs
 */
const deploy = async (contractName, contractArgs) => {
  // read contract abi and binary from the artifacts dir
  const abi = getContractData(artifactsDir, contractName, 'abi')
  const bin = getContractData(artifactsDir, contractName, 'bin')

  // instantiate contract
  const contract = new web3.eth.Contract(abi)

  // prepare object for contract deployment
  const options = { data: '0x' + bin, arguments: contractArgs }

  // prepare contract deployment transaction
  const transaction = contract.deploy(options)

  // send transaction to blockchain
  const receipt = await send(web3, account, min_gas_limit, transaction)
  console.log(`${contractName} deployed at ${receipt.contractAddress}`)

  // return contract instance
  return deployed(web3, contractName, receipt.contractAddress)
}

/**
 * create contract instance after contract deployment
 *
 * @param {*} web3
 * @param {*} contractName
 * @param {*} contractAddr
 */
function deployed (web3, contractName, contractAddr) {
  // read abi from path
  const abi = getContractData(artifactsDir, contractName, 'abi')
  // instantiate contract
  return new web3.eth.Contract(abi, contractAddr)
}

/**
 * send transaction to blockchain
 *
 * @param {*} transaction
 */
const execute = async (transaction) => {
  const receipt = await send(web3, account, min_gas_limit, transaction)
  return receipt
}

/**
 * get instance of existing contract
 *
 * @param {*} contractName
 * @param {*} contractAddr
 */
const getInstance = (contractName, contractAddr) => {
  const abi = getContractData(artifactsDir, contractName, 'abi')
  return new web3.eth.Contract(abi, contractAddr)
}

/**
 * Get account by private key
 */
const getAccount = () => {
  const account = web3.eth.accounts.privateKeyToAccount(privateKey)
  return account
}

/**
 * Get account by private key
 */
const getWeb3 = () => {
  return web3
}

/**
 * module configuration
 *
 * @param {*} options
 */
const config = (options) => {
  nodeAddress = options.nodeAddress
  artifactsDir = options.artifactsDir
  privateKey = options.privateKey

  min_gas_limit = options.min_gas_limit ? options.min_gas_limit : 100000
  web3 = new Web3(nodeAddress)
  account = web3.eth.accounts.privateKeyToAccount(privateKey)
}

const getContractData = (dir, contractName, type) => {
  let contractData = null
  try {
    // console.log('artifactsDir + contractName + "." + type', artifactsDir + contractName + "." + type);
    contractData = fs.readFileSync(artifactsDir + contractName + '.' + type, { encoding: 'utf8' })
    contractData = type === 'abi' ? JSON.parse(contractData) : contractData
    // console.log('contractData', contractData);
  } catch (error) {
    console.log(`failed to read ${type} file trying json`)
  }

  if (!contractData) {
    try {
      const contract = fs.readFileSync(artifactsDir + contractName + '.json', { encoding: 'utf8' })
      contractData = JSON.parse(contract)[type]
    } catch (error) {
      throw new Error(`Failed to get ${type} for contract ${contractName}`)
    }
  }

  return contractData
}

module.exports = {
  config,
  deploy,
  execute,
  getInstance,
  getAccount,
  getWeb3
}
