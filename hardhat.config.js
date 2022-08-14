require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan") 
require("hardhat-deploy")
require("solidity-coverage")
// require("hardhat-gas-reporter")
require("hardhat-contract-sizer") //Outputs contract sizes with Hardhat
require("dotenv").config()


const { RINKEBY_RPC_URL, PRIVATE_KEY, COINMARKETCAP_API_KEY, ETHERSCAN_API_KEY } = process.env;

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      blockConfirmations: 1,
    },
    rinkeby: {
      chainId: 4,
      blockConfirmations: 6,
      url: RINKEBY_RPC_URL,
      account: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : []
    }
  },
  namedAccounts: {
    deployer: {
        default: 0, // here this will by default take the first account as deployer
    },
  },
  solidity: {
    compilers: [
        {
            version: "0.8.7",
        },
        {
            version: "0.4.24",
        },
    ],
  },
  mocha: {
    timeout: 200000, //200 seconds max
  }
};
