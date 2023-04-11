require('./service/mongoService');

const WebSocket = require('ws');

const { publishToQueue, publishBatchToQueue } = require('./service/queueService/rabbitMQ');
const {
  getPushedTxnStatus,
  getCurrentTxnStatus,
  updateStatusInDb,
  sortTxnList,
} = require('./service/commonService/generalFunctions');
const logger = require('./utils/logger');
const env = require('./config');
const { WSS_PROVIDER_URL, TOKEN, ADMIN_WALLET, BATCH_SIZE, RETRIES } = env.BLOCKCHAIN;
let MUTEX = false;

const executer = async (txn) => {
  if (!MUTEX) {
    let retryIter = 0;
    while (true) {
      try {
        await publishToQueue(txn);
        const { block_height, block_index } = txn;
        await updateStatusInDb(block_height, block_index);
        break;
      } catch (err) {
        if (retryIter < RETRIES) {
          retryIter++;
          logger.error(err);
          logger.warn(`Error: ${err},"\n retry attempt ${retryIter}`);
        } else {
          logger.error('All attempts failed, exiting...');
          process.exit();
        }
      }
    }
  }
};

const batchExecuter = async (txnList) => {
  if (txnList) {
    try {
      sortTxnList(txnList);
      await publishBatchToQueue(txnList);
      const { block_height, block_index } = txnList[txnList.length - 1];
      await updateStatusInDb(block_height, block_index);
    } catch (error) {
      logger.error(error);
    }
  }
};

const batchProcessor = async (txnList) => {
  MUTEX = true;
  let txnInit = 0;
  let count = txnList.length;
  let retryIter = 0;
  while (txnInit + (BATCH_SIZE - 1) <= count) {
    try {
      const batch = txnList.slice(txnInit, txnInit + BATCH_SIZE);
      await batchExecuter(batch);
      if (retryIter) retryIter = 0;
      txnInit += BATCH_SIZE;
    } catch (err) {
      if (retryIter < RETRIES) {
        retryIter++;
        logger.error(err);
        logger.warn(`Error: ${err},"\n retry attempt ${retryIter}`);
      } else {
        logger.error('All attempts failed, exiting...');
        process.exit();
      }
    }
  }
  while (true) {
    try {
      await batchExecuter(txnList);
      break;
    } catch (err) {
      if (retryIter < RETRIES) {
        retryIter++;
        logger.error(err);
        logger.warn(`Error: ${err},"\n retry attempt ${retryIter}`);
      } else {
        logger.error('All attempts failed, exiting...');
        process.exit();
      }
    }
  }
  logger.info(`Transactions are upto date.`);
  MUTEX = false;
};

const getAllTxns = async () => {
  let txnData;
  let txns = [];
  let retryIter = 0;
  do {
    try {
      if (txns.length === 0) {
        txnData = await getCurrentTxnStatus();
      } else {
        txnData = await getCurrentTxnStatus(`before=${txns[0].block_height}`);
      }
      let filteredTxns = txnData.txs.filter((txn) => {
        if (txn.block_height > 0) {
          return txn;
        }
      });
      txns = [...txns, ...filteredTxns];
      txns = sortTxnList(txns);
    } catch (err) {
      if (retryIter < RETRIES) {
        retryIter++;
        logger.error(err);
        logger.warn(`Error: ${err},"\n retry attempt ${retryIter}`);
      } else {
        logger.error('All attempts failed, exiting...');
        process.exit();
      }
    }
  } while (txnData['hasMore']);
  return txns;
};

const catchUp = async () => {
  logger.info(`Catching up transactions..`);
  let { block_height, block_index } = await getPushedTxnStatus();
  let allTxnData = await getAllTxns();
  let unpushedTxns = [];
  allTxnData.map(async (txn) => {
    if (
      txn.block_height < block_height ||
      (txn.block_height === block_height && txn.block_index <= block_index)
    ) {
      return false;
    }
    unpushedTxns.push(txn);
  });
  logger.warn(`${unpushedTxns.length} transactions are pending...`);
  if (unpushedTxns.length > 1) {
    await batchProcessor(unpushedTxns);
  } else if (unpushedTxns.length === 1) {
    await executer(unpushedTxns[0]);
  }
};

const initSocket = () => {
  const URL = WSS_PROVIDER_URL + TOKEN;
  const socket = new WebSocket(URL);

  socket.on('message', (event) => {
    const txn = JSON.parse(event);
    if (txn['confirmed']) {
      logger.info('New transaction received');
      executer(txn);
    }
  });

  socket.on('error', (err) => {
    logger.error(`Socket Error: %s ${err}`);
  });

  socket.on('close', (code) => {
    logger.warn(`Socket connection closed: %s ${code}`);
    socket.terminate();
    clearInterval(this.interval);
    logger.warn('Reconnecting socket..');
    initSocket();
  });

  socket.on('open', () => {
    logger.info('Socket connection established with Blockcypher');
    socket.send(JSON.stringify({ event: 'confirmed-tx', address: ADMIN_WALLET }));
    logger.info('Listening for new transactions');
    //keeping socket conn alive for 20s
    this.interval = setInterval(() => {
      socket.send(JSON.stringify({ event: 'ping' }));
    }, 15000);
  });
};

const main = async () => {
  await catchUp();
  initSocket();
};

main();
