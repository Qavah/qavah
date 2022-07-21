# Qavah

https://qavah.me is a decentralized and free-of-charge crowdfunding platform running on [Celo](https://celo.org)

## How does it work?
[Check out the FAQ](docs/FAQ.md)

## Running the project locally

First, you need to clone this repository and install a few dependencies for smart contract development:
```sh
git clone https://github.com/Qavah/qavah.git
cd qavah
npm install
```

Once installed, you can start a local Ethereum network using [Hardhat](https://github.com/NomicFoundation/hardhat):
```sh
npx hardhat node
```

Then, on a new terminal, run this to deploy the contract to your development network:
```sh
npx hardhat run scripts/deploy_upgradeable.js --network localhost

# Alternatively, you can run this command to preseed the network with mock data:
npx hardhat test --network localhost
```

You may also want to set up your own local [TheGraph](https://github.com/graphprotocol/graph-node) node:
```sh
git clone https://github.com/graphprotocol/graph-node.git
cd graph-node/docker
docker-compose up

# Now, back to this repository, you'll need to run:
cd subgraph
npm install
npm run codegen
npm run build -- --network mainnet
npm run deploy-local # do `npm run create-local` first if you didn't
```

Finally, start the frontend with:
```sh
cd frontend
npm install
npm start
```

## For more information
Drop me a message on [Discord](https://discord.com) at Theo dort#9495
