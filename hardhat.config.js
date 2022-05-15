require('dotenv').config()
require("@nomiclabs/hardhat-waffle");
require('@openzeppelin/hardhat-upgrades');
require("hardhat-gas-reporter");

module.exports = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
      }
    }
  },
  networks: {
    hardhat: { chainId: 1337 },
    localhost: { chainId: 1337 },
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 4,
    },
    bsctestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 97,
    },
    alfajores: {
      url: `https://celo-alfajores--rpc.datahub.figment.io/apikey/${process.env.DATAHUB_CELO_API_KEY}/`,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 44787,
    },
  }
};
