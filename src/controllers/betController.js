const logger = require('../utils/logger');

exports.getBetHistory = async (req, res) => {
  try {
    // Implement bet history retrieval from Solana blockchain
    res.json({ history: [] });
  } catch (error) {
    logger.error('Bet history error:', error);
    res.status(500).json({ error: 'Failed to fetch bet history' });
  }
};