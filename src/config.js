require('dotenv').config();

module.exports = {
  port: process.env.PORT || 'localhost:3000',
  binanceApiUrl: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
  updateInterval: 1000, // 1 second
  solanaNetwork: 'https://api.mainnet-beta.solana.com',
  solanaContractAddress: process.env.SOLANA_CONTRACT_ADDRESS
};