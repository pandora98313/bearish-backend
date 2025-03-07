const axios = require('axios');
const { handleBetTransaction } = require('./services/solanaService');
const config = require('./config');
const logger = require('./utils/logger');

let latestPrice = null;

async function fetchBitcoinPrice() {
  try {
    const response = await axios.get(config.binanceApiUrl);
    return parseFloat(response.data.price);
  } catch (error) {
    logger.error('Error fetching Bitcoin price:', error);
    return null;
  }
}

function setupWebSocket(io) {
  io.on('connection', (socket) => {
    logger.info('Client connected');

    // Send current price on connection
    if (latestPrice) {
      socket.emit('price', latestPrice);
    }

    // Handle betting
    socket.on('bet', async (data) => {
      try {
        const { direction, amount, wallet } = data;
        const result = await handleBetTransaction(direction, amount, wallet);
        socket.emit('betResult', result);
      } catch (error) {
        logger.error('Bet error:', error);
        socket.emit('betError', { message: 'Failed to process bet' });
      }
    });

    socket.on('disconnect', () => {
      logger.info('Client disconnected');
    });
  });

  // Start price updates
  setInterval(async () => {
    const newPrice = await fetchBitcoinPrice();
    if (newPrice && newPrice !== latestPrice) {
      latestPrice = newPrice;
      
      io.emit('price', latestPrice);
    }
  }, config.updateInterval);
}

module.exports = { setupWebSocket };