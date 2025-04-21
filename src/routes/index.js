const express = require('express');
const router = express.Router();
const { getCurrentPrice } = require('../controllers/priceController');
const { getBetHistory } = require('../controllers/betController');

router.get('/price', getCurrentPrice);
router.get('/history', getBetHistory);

module.exports = router;