const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  result: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', resultSchema); 