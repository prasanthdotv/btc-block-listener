require('./service/mongoService');
const BN = require('bignumber.js');

const Status = require('./service/mongoService/status');
const env = require('./config');
const { consumeQueue } = require('./service/queueService/rabbitMQ');
const logger = require('./utils/logger');
const {
  insertToDB,
  updateTransactionDetails,
  processPendingRequests,
} = require('./service/transactionService');

const { RETRIES, ADMIN_WALLET } = env.BLOCKCHAIN;

const getPushedTxnStatus = async () => {
  const status = await Status.findById(1);
  return status.txnConsumed;
};

const updateStatusInDb = async ({ block_height, block_index }) => {
  await Status.findOneAndUpdate(
    { _id: 1 },
    {
      $set: {
        txnConsumed: {
          block_height: block_height,
          block_index: block_index,
        },
      },
    }
  );
  logger.info(`Block ${block_height} and Index ${block_index} updated on DB.`);
};

const removeDuplicate = (list) => {
  list = list.filter((value, index) => list.indexOf(value) === index);
  return list[0];
};

const pushTransactionDetails = async (txn) => {
  const { inputs, outputs } = txn;
  const toAddress = ADMIN_WALLET;
  let fromAddresses = [];
  let value = 0;
  let paymentType;
  inputs.forEach((input) => {
    fromAddresses = [...fromAddresses, ...input.addresses];
  });
  outputs.forEach((output) => {
    if (output.addresses && output.addresses.includes(toAddress)) {
      value += output.value;
      paymentType = output.script_type;
    } else if (!output.addresses) {
      unknown++;
    }
  });
  if (value > 0 && !fromAddresses.includes(ADMIN_WALLET)) {
    const payload = {
      code: 'BTC',
      toAddress,
      fromAddress: removeDuplicate(fromAddresses),
      paymentType,
      value: BN(value)
        .div(BN(10).pow(BN(8)))
        .toString(),
      txHash: txn.hash,
      blockHash: txn.block_hash.toString(),
      blockHeight: txn.block_height.toString(),
    };
    await insertToDB(payload);
    return updateTransactionDetails(payload);
  } else {
    return;
  }
};

const pushTransferDetails = async (txn) => {
  await processPendingRequests();
  let { block_height, block_index } = await getPushedTxnStatus();
  if (
    txn.block_height > block_height ||
    (txn.block_height === block_height && txn.block_index > block_index)
  ) {
    let retryIter = 0;
    while (true) {
      try {
        await pushTransactionDetails(txn);
        break;
      } catch (err) {
        logger.error(err);
        if (retryIter < RETRIES) {
          retryIter++;
          logger.warn(`Error: ${err},"\n retry attempt ${retryIter}`);
        } else {
          logger.error('All attempts failed, Exiting...');
          process.exit();
        }
      }
    }
  }
  await updateStatusInDb(txn);
  return;
};

const main = async () => {
  consumeQueue(pushTransferDetails);
};

main();
