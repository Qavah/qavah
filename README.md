# Qavah

Decentralized and free of charge crowdfunding platform running on [Celo](https://celo.org)

## Running the project locally

First, you need to clone this repository and install a few dependencies for smart contract development:
```sh
git clone https://github.com/Qavah/qavah.git
cd qavah
npm install
```

Once installed, you can start a local Ethereum network by using [Hardhat](https://github.com/NomicFoundation/hardhat):
```sh
npx hardhat node
```

Then, on a new terminal, run this to deploy the contract to your development network:
```sh
npx hardhat run scripts/deploy_upgradeable.js --network localhost

# Alternatively, you can run this command to preseed the network with mock data:
npx hardhat test --network localhost
```

You may also want to set up your own local [The Graph](https://github.com/graphprotocol/graph-node) node:
```sh
git clone https://github.com/graphprotocol/graph-node.git
cd graph-node/docker
docker-compose up

# Now, back to this repository, you'll need to run:
cd subgraph
npm install
npm run codegen
npm run build -- --network mainnet
npm run deploy-local
```

Finally, start the frontend with:
```sh
cd frontend
npm install
npm start
```

## For further information
> Don't hesitate to drop an email at contact@qavah.me
