/**
 * example of using the module to prepare a script to deploy a bancor smart token
 * the script deploys the bancor smart token and deploys a converter contract for the smart token
 * as well as deploys a new ERC20 token and add it as a reserve to the converter
 * finally, the script runs a conversion between both tokens to test if the whole thing worked
 */

const ethDeployer = require('../')

const PRIVATE_KEY = ''
const ARTIFACTS_DIR = ''
const NODE_ADDRESS = ''

async function run () {
  // config object for eth deployer
  const config = {
    node_address: NODE_ADDRESS, // node address
    artifacts_dir: ARTIFACTS_DIR, // path to contracts artifacts
    private_key: PRIVATE_KEY // private key
  }

  // configure eth deployer
  ethDeployer.config(config)

  // get self address
  const account = ethDeployer.getAccount()

  // get web3 instance
  const web3 = ethDeployer.getWeb3()

  // deploy bancor smart token
  const smartToken = await ethDeployer.deploy('SmartToken', ['test token', 'TST', 18])

  // deploy ERC20 token
  const reserveToken = await ethDeployer.deploy('ERC20Token', ['reserve token', 'RSV', 18, '10000000000000000000000'])

  // deploy bancor converter
  const contractRegistryAddress = '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab' // Bancor registry contract address goes here
  const fee = 3000
  const ratio = 100000
  const converterParams = [smartToken._address, contractRegistryAddress, fee, reserveToken._address, ratio]
  const converter = await ethDeployer.deploy('BancorConverter', converterParams)

  // issue new smartToken tokens
  const tx = smartToken.methods.issue(account.address, '10000000000000000000000')
  await ethDeployer.execute(tx)

  // transfer reserve tokens to converter
  await ethDeployer.execute(reserveToken.methods.transfer(converter._address, '1000000000000000000000'))

  // transfer smartToken ownership to converter
  await ethDeployer.execute(smartToken.methods.transferOwnership(converter._address))

  // accept smartToken ownership by converter
  await ethDeployer.execute(converter.methods.acceptTokenOwnership())

  // check tokens balance before conversion
  console.log('smartToken balance', web3.utils.fromWei(await smartToken.methods.balanceOf(account.address).call()))
  console.log('reserve balance', web3.utils.fromWei(await reserveToken.methods.balanceOf(account.address).call()))

  // perform conversion smartToken -> reserve token
  const conversionPath = [smartToken._address, smartToken._address, reserveToken._address]
  await ethDeployer.execute(await converter.methods.quickConvert(conversionPath, '1000000000000000000', '1'))

  // check tokens balance after conversion
  console.log('smartToken balance', web3.utils.fromWei(await smartToken.methods.balanceOf(account.address).call()))
  console.log('reserve balance', web3.utils.fromWei(await reserveToken.methods.balanceOf(account.address).call()))
}

run()
  .then((t) => {
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
