const dotenv = require("dotenv");
dotenv.config({ path: __dirname + '/.env' });

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
