try {
  require('dotenv').config();
  console.log('imported env variables from .env using dotenv');
} catch(e) {
  console.log('did not find dotenv');
}

const seedPhrase = process.env.SEED_PHRASE ||
  (
    console.log('SEED_PHRASE not set, using default'),
    'myth like bonus scare over problem client lizard pioneer submit female collect'
  );
const privateKey = process.env.PRIVATE_KEY;
const privateKeys = privateKey ? [privateKey] : null;
if (!privateKeys) {
  console.log('PRIVATE_KEY not set');
}
// Support both MetaMask Developer API key and legacy Infura project ID
const apiKey = process.env.METAMASK_API_KEY || process.env.INFURA_PROJECT_ID ||
  (console.log('METAMASK_API_KEY or INFURA_PROJECT_ID not set'), '');
const etherscanApiKey = process.env.ETHERSCAN_API_KEY ||
  (console.log('ETHERSCAN_API_KEY not set'), '');

let gasPrice;
if (process.env.GAS_PRICE != null) {
  console.log('setting gas price to', process.env.GAS_PRICE, 'gwei');
  gasPrice = process.env.GAS_PRICE * 1e9;
}

const networksInfo = [
  { name: 'mainnet', id: '1', url: `wss://mainnet.infura.io/ws/v3/${apiKey}` },
  { name: 'sepolia', id: '11155111', url: `wss://sepolia.infura.io/ws/v3/${apiKey}` },
  { name: 'polygon', id: '137', url: `wss://polygon-mainnet.infura.io/ws/v3/${apiKey}` },
  { name: 'polygon-amoy', id: '80002', url: `wss://polygon-amoy.infura.io/ws/v3/${apiKey}` },
  { name: 'arbitrum', id: '42161', url: `wss://arbitrum-mainnet.infura.io/ws/v3/${apiKey}` },
  { name: 'optimism', id: '10', url: `wss://optimism-mainnet.infura.io/ws/v3/${apiKey}` },
  { name: 'xdai', id: '100', url: 'wss://rpc.xdaichain.com/wss' },
];

let HDWalletProvider;
try {
  HDWalletProvider = require('@truffle/hdwallet-provider');
  console.log('found HDWalletProvider');
} catch (e) {
  console.log('not using HDWalletProvider');
}

const networks = {};
for (const { name, id, url } of networksInfo) {
  let walletProvider = null;

  if (HDWalletProvider) {
    if (privateKeys) {
      console.log('Using private key for network:', name);
      walletProvider = new HDWalletProvider(privateKeys, url, 0, 1);
    } else if (seedPhrase) {
      console.log('Using seed phrase for network:', name);
      walletProvider = new HDWalletProvider({
        mnemonic: { phrase: seedPhrase },
        providerOrUrl: url,
      });
    }
  }

  if (walletProvider) {
    networks[name] = {
      provider: () => walletProvider,
      network_id: id,
    };
  } else {
    networks[name] = {
      host: "localhost",
      port: 8545,
      network_id: id,
    };
  }

  if (gasPrice) {
    networks[name].gasPrice = gasPrice;
  }
}

networks.local = {
  host: "localhost",
  port: 8545,
  network_id: "*"
};
if (gasPrice) {
  networks.local.gasPrice = gasPrice;
}

module.exports = {
  networks,
  compilers: {
    solc: {
      version: "0.6.12",
    },
  },
  plugins: [
    "truffle-plugin-verify",
    "truffle-plugin-networks",
  ],
  api_keys: {
    etherscan: etherscanApiKey,
    polygonscan: process.env.POLYGONSCAN_API_KEY || ''
  },
}
