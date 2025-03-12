const axios = require('axios');
const { handleBetTransaction } = require('./services/solanaService');
const config = require('./config');
const logger = require('./utils/logger');

let latestPrice = null;
let periodStartTime = Date.now();
let cycleStartPrice = 0;
const periodDuration = 30000; // 30 seconds
let remainingTime = periodDuration / 1000;
async function fetchBitcoinPrices() {
  try {
    const response = await axios.get(config.binanceApiUrl);
    const prices = response.data.map(price => parseFloat(price[4]));
    return prices;
  } catch (error) {
    logger.error('Error fetching Bitcoin price:', error);
    return null;
  }
}

function setupWebSocket(io) {
  io.on('connection', async (socket) => {
    logger.info('Client connected');
    
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

    socket.on('startNewPeriod', (currentPrice) => {
      cycleStartPrice = currentPrice;
      periodStartTime = Date.now();
      socket.emit('periodStarted', { remainingTime: periodDuration / 1000, result: null }); // Send initial remaining time and result
    });

    socket.on('disconnect', () => {
      logger.info('Client disconnected');
    });
  });
  setInterval(async () => {
    const prices = await fetchBitcoinPrices();
    io.emit('prices', prices);
    latestPrice = prices[prices?.length - 1];
    if(remainingTime > 0){
      io.emit('updateRemainingTime', { remainingTime: Math.floor(remainingTime) }); // Send as an integer
    }
  }, 100);
  // Start price updates
  setInterval(() => {
  
      const timeElapsed = Date.now() - periodStartTime;
      remainingTime = Math.max((periodDuration - timeElapsed) / 1000, 0);

      // Emit remaining time every second
      // if (remainingTime > 0) {
      //   io.emit('updateRemainingTime', { remainingTime: Math.floor(remainingTime) }); // Send as an integer
      // }

      if (remainingTime <= 0) {
        const result = latestPrice >= cycleStartPrice ? 'up' : 'down';
        io.emit('periodEnded', { remainingTime: 0, result });
        // Reset for the next period
        cycleStartPrice = latestPrice;
        periodStartTime = Date.now();
      }
  }, 1000); // Set interval to 1000 milliseconds (1 second)
  
}

module.exports = { setupWebSocket };