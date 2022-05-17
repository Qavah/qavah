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
    alfajores: {
      url: 'https://alfajores-forno.celo-testnet.org',
      ...process.env.PRIVATE_KEY && { accounts: [`0x${process.env.PRIVATE_KEY}`] },
      chainId: 44787,
    },
  }
};
