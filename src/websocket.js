const axios = require('axios');
const config = require('./config');
const logger = require('./utils/logger');
const Result = require('./models/Result');
const {
  backendWallet,
  handleBetTransaction,
  getPlatformConfig,
  getPlatformConfigAccount,
  getRound,
  getRoundAccount,
  getUsersInRound
} = require('./services/solanaService.js');
const { log } = require('winston');
const anchor = require('@coral-xyz/anchor');
const { Connection, clusterApiUrl, PublicKey, Keypair } = require('@solana/web3.js');
const idl = require('../idl.json');
const UserParticipation = require('./models/UserParticipation');

const connection = new Connection(clusterApiUrl("devnet"), {
  commitment: "confirmed",
  confirmTransactionInitialTimeout: 60 * 1000,
});
// console.log(">>> connection : \n", connection)
const provider = new anchor.AnchorProvider(connection, backendWallet, {});
// console.log(">>> provider : \n", provider)
const program = new anchor.Program(idl, provider);
// console.log(">>> program : \n", program)

let latestPrice = null;
let cycleStartPrice = 0;
let remainingTime = 30;
let startFlag = false
let endFlag = false
let prices = []
async function fetchBitcoinPrices() {
  try {
    const response = await axios.get(config.binanceApiUrl);
    const prices = response.data.map(price => parseFloat(price[4]));
    return prices;
  } catch (error) {
    logger.error('Error fetching Bitcoin price:', error.message);
    return null;
  }
}

async function saveUserParticipation(program, roundIndex) {
  const users = await getUsersInRound(program, roundIndex);
  console.log(users);
  
  const userParticipations = users.map(user => ({
    user: user.toBase58(),
    roundIndex
  }));

  await UserParticipation.insertMany(userParticipations);
}

function setupWebSocket(io) {
  io.on('connection', async (socket) => {
    logger.info('Client connected');

    // Handle betting
    socket.on('bet', async (data) => {
      logger.info('Bet received:', data);
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
      // logger.info('Client disconnected');
    });
  });

  // Start price updates
  setInterval(async () => {
    prices = await fetchBitcoinPrices();
    if (latestPrice) latestPrice = prices[prices?.length - 1]
    else latestPrice = 0;

  }, 200);
  // Start price updates
  setInterval(async () => {
    const prices = await fetchBitcoinPrices();
    io.emit('prices', prices);

    latestPrice = prices[prices?.length - 1]
    console.log(latestPrice);
    
    io.emit('updateRemainingTime', { remainingTime }); // Send as an integer
    console.log("remainingTime:", remainingTime);

  }, 1000);
  setInterval(async () => {
    const data = await Result.find().sort({ timestamp: -1 }).limit(10).select('result');
    const betResult = data.map(item => item.result);
    io.emit('betResultStartPrice', {betResult, cycleStartPrice});
  }, 1000);
  //frontend update with price and remaningTime
  setInterval(async () => {
    io.emit('prices', prices);
    io.emit('updateRemainingTime', { remainingTime }); // Send as an integer
  }, 200);
  //round calculation
  setInterval(async () => {
    
    if (remainingTime == 30 && !startFlag) {
      logger.info("--- start Period ---");
      startFlag = true;
      // Start new round and wait for response
      const platformConfig = await getPlatformConfigAccount(program);
      const priceAccount = platformConfig.globalRoundInfo?.priceAccount;
      const roundIndex = platformConfig.globalRoundInfo?.round.toNumber() + 1;
      console.log(">>> roundIndex : ", platformConfig.globalRoundInfo?.round.toNumber());
      const round = await getRound(program, roundIndex);
      console.log(">>> round : ", round.toBase58());

      try {
        const txSignature = await program.methods
          .startRound()
          .accounts({
            user: backendWallet.publicKey,
            round: await getRound(program, roundIndex),
            priceAccount: priceAccount
          })
          .signers([backendWallet.payer])
          .rpc();

        console.log("startRound txSignature : ", txSignature);

        // Proceed with time count after receiving response
        startFlag = false;
        remainingTime--
      } catch (error) {
        console.error("Error in startRound:", error);
      }
    }

    if (remainingTime == 0 && !endFlag) {
      logger.info("--- end Period ---");
      endFlag = true;
      const result = latestPrice >= cycleStartPrice ? 'up' : 'down';
      const newResult = new Result({ result });
      newResult.save()
        .then(() => logger.info('Result saved to MongoDB'))
        .catch(err => logger.error('Error saving result to MongoDB', err));

      // Save user participation
      const platformConfig = await getPlatformConfigAccount(program);
      const roundIndex = platformConfig.globalRoundInfo?.round.toNumber() + 1;
      console.log(">>> roundIndex : ", platformConfig.globalRoundInfo?.round.toNumber());
      // End round
      const priceAccount = platformConfig.globalRoundInfo?.priceAccount;
      const round = await getRound(program, roundIndex);
      console.log(">>> round : ", round.toBase58());

      if (priceAccount) {
        const txSignature = await program.methods
          .endRound()
          .accounts({
            user: backendWallet.publicKey,
            round: await getRound(program, roundIndex),
            priceAccount: priceAccount
          })
          .signers([backendWallet.payer])
          .rpc();
        console.log("endRound txSignature : ", txSignature);
      }

      io.emit('periodEnded', { remainingTime: 0, result });
      // Reset for the next period
      console.log(latestPrice);
      
      cycleStartPrice = latestPrice;
      endFlag = false;
      remainingTime = 30;
    }
    if (remainingTime != 30 && remainingTime != 0)
      remainingTime--
  }, 1000); // Set interval to 800 milliseconds
}

module.exports = setupWebSocket;