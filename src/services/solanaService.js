const bs58 = require('bs58');
const config = require('../config.js');
const anchor = require('@coral-xyz/anchor');
const { Connection, clusterApiUrl, PublicKey, Keypair } = require('@solana/web3.js');
const idl = require('../../idl.json');
const logger = require('../utils/logger');

function getKeypairFromSecretKey(secretKeyString) {
  try {
    const secretKey = bs58.decode(secretKeyString);
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    throw new Error("Invalid secret key format");
  }
}

const keypair = getKeypairFromSecretKey(config.backendWalletPrivateKey);
const backendWallet = new anchor.Wallet(keypair);

const getPlatformConfig = async (program) => {
  const [platformConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("platform_config")],
    program.programId
  );
  return platformConfig;
};

const getPlatformConfigAccount = async (program) => {
  return await program.account.platformConfig.fetch(
    await getPlatformConfig(program)
  )
};

const getRound = async (program, roundIndex) => {
  const [round] = PublicKey.findProgramAddressSync(
    [Buffer.from("round"), new anchor.BN(roundIndex).toArrayLike(Buffer, "be", 8)],
    program.programId
  );
  return round;
};

const getRoundAccount = async (program, roundIndex) => {
  return await program.account.round.fetch(
    await getRound(program, roundIndex)
  );
};

const getUserBet = async (program, user, roundIndex) => {
  const [userBet] = PublicKey.findProgramAddressSync(
    [Buffer.from("user_bet"), user.toBuffer(), new anchor.BN(roundIndex).toArrayLike(Buffer, "be", 8)],
    program.programId
  );
  return userBet;
};

const getUsersInRound = async (program, roundIndex) => {
  const users = [];
  const filters = [
    {
      memcmp: {
        offset: 0, // Adjust this offset based on the structure of your user_bet account
        bytes: Buffer.from("user_bet").toString('base64')
      }
    },
    {
      memcmp: {
        offset: 8, // Adjust this offset to match the position of the roundIndex in your account data
        bytes: new anchor.BN(roundIndex).toArrayLike(Buffer, "be", 8).toString('base64')
      }
    }
  ];

  const userBetAccounts = await program.provider.connection.getProgramAccounts(
    program.programId,
    { filters }
  );

  for (const account of userBetAccounts) {
    const userPublicKey = new PublicKey(account.account.data.slice(0, 32)); // Assuming the user public key is at the start
    users.push(userPublicKey);
  }

  return users;
};

async function handleBetTransaction(direction, amount, wallet) {
  try {
    // Implement your Solana smart contract interaction here
    // This is a placeholder for the actual implementation
    logger.info(`Processing bet: ${direction} ${amount} from ${wallet}`);

    return {
      success: true,
      transaction: 'dummy_transaction_id'
    };
  } catch (error) {
    logger.error('Solana transaction error:', error);
    throw error;
  }
}

module.exports = {
  backendWallet,
  handleBetTransaction,
  getPlatformConfig,
  getPlatformConfigAccount,
  getRound,
  getRoundAccount,
  getUserBet,
  getUsersInRound
};