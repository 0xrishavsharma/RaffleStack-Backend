const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL || "https://eth-rinkeby.alchemyapi.io/v2/LvnRUn7s2ipfmZJ55mIHNO2Oa9uTTGpZ";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

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
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : []
    }
  },
  solidity: "0.8.9",
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    }
  }
};
