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
    'celo-alfajores': {
      chainId: 44787,
      url: 'https://alfajores-forno.celo-testnet.org',
      ...process.env.PRIVATE_KEY && { accounts: [`0x${process.env.PRIVATE_KEY}`] },
    },
    'celo': {
      chainId: 42220,
      url: 'https://forno.celo.org',
      ...process.env.PRIVATE_KEY && { accounts: [`0x${process.env.PRIVATE_KEY}`] },
    },
  }
}
