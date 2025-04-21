// src/models/UserParticipation.js
const mongoose = require('mongoose');

const userParticipationSchema = new mongoose.Schema({
  user: String, // Store user public key as a string
  roundIndex: Number,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserParticipation', userParticipationSchema);