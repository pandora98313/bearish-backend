const logger = require('../utils/logger');

exports.getCurrentPrice = async (req, res) => {
  try {
    // This is just a REST endpoint for getting the current price
    // Real-time updates are handled through WebSocket
    res.json({ price: global.latestPrice || null });
  } catch (error) {
    logger.error('Price controller error:', error);
    res.status(500).json({ error: 'Failed to fetch price' });
  }
};