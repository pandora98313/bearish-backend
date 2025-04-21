
require('dotenv').config();

module.exports = {
  port: process.env.PORT || '5000',
  binanceApiUrl: 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1s&limit=60',
  updateInterval: 1000, // 1 second
  solanaNetwork: 'https://api.mainnet-beta.solana.com',
  solanaContractAddress: process.env.SOLANA_CONTRACT_ADDRESS,
  backendWalletPrivateKey: process.env.BACKEND_WALLET_PRIVATE_KEY,
  mongoUri: process.env.MONGO_URI

};