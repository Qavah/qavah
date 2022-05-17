const { ethers, upgrades, artifacts, network } = require('hardhat')
const fs = require('fs').promises

async function main (usdTokenAddress) {
  const Contract = await ethers.getContractFactory('Contract')
  const contract = await upgrades.deployProxy(Contract, network.name === 'localhost'
    ? [usdTokenAddress, 'http://localhost:3000/1337/', 5]
    : ['0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', 'https://qavah.me/44787/', 10])
  await contract.deployed()
  console.log('Contract deployed to:', contract.address)
  await saveFrontendFiles(contract)
  await saveSubgraphFiles(contract)
  return contract
}

async function saveFrontendFiles (contract) {
  await fs.access(`${__dirname}/../frontend/src/contracts`)
    .catch(() => fs.mkdir(`${__dirname}/../frontend/src/contracts`))

  const contractAddresses = await fs.readFile(`${__dirname}/../frontend/src/contracts/contract-address.json`)
    .catch(() => '{}')
  await fs.writeFile(
    `${__dirname}/../frontend/src/contracts/contract-address.json`,
    JSON.stringify({
      ...JSON.parse(contractAddresses),
      [network.config.chainId]: contract.address,
    }, undefined, 2)
  )

  const contractArtifact = await artifacts.readArtifact('Contract')
  await fs.writeFile(
    `${__dirname}/../frontend/src/contracts/Contract.json`,
    JSON.stringify(contractArtifact, null, 2)
  )

  const qavahArtifact = await artifacts.readArtifact('Qavah')
  await fs.writeFile(
    `${__dirname}/../frontend/src/contracts/Qavah.json`,
    JSON.stringify(qavahArtifact, null, 2)
  )

  const cUSDArtifact = await artifacts.readArtifact('CUSD')
  await fs.writeFile(
    `${__dirname}/../frontend/src/contracts/CUSD.json`,
    JSON.stringify(cUSDArtifact, null, 2)
  )
}

async function saveSubgraphFiles (contract) {
  const networks = await fs.readFile(`${__dirname}/../subgraph/networks.json`)
  const name = network.name === 'localhost' ? 'mainnet' : `celo-${network.name}`
  await fs.writeFile(
    `${__dirname}/../subgraph/networks.json`,
    JSON.stringify({
      ...JSON.parse(networks),
      [name]: {
        'Contract': {
          ...JSON.parse(networks)[name].Contract,
          address: contract.address,
        }
      },
    }, undefined, 2)
  )
  const contractArtifact = await artifacts.readArtifact('Contract')
  await fs.writeFile(
    `${__dirname}/../subgraph/abis/Contract.json`,
    JSON.stringify(contractArtifact, null, 2)
  )
  const qavahArtifact = await artifacts.readArtifact('Qavah')
  await fs.writeFile(
    `${__dirname}/../subgraph/abis/Qavah.json`,
    JSON.stringify(qavahArtifact, null, 2)
  )
}

module.exports = main

if (require.main === module) {
  main()
}
