const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../btc.env') });
require('../service/mongoService');

const env = require('../config');
const Status = require('../service/mongoService/status');
const logger = require('../utils/logger');

const initStatusCollection = async () => {
  const status = await Status.findById(1);
  const BLOCK_HEIGHT = parseInt(env.DB.BLOCK_HEIGHT);
  const BLOCK_INDEX = parseInt(env.DB.BLOCK_INDEX);
  const updateNeeded = !status || env.DB.CURRENT_BLOCK_OVERRIDE;
  if (updateNeeded !== 'false') {
    const data = {
      txnInserted: {
        block_height: BLOCK_HEIGHT,
        block_index: BLOCK_INDEX,
      },
      txnConsumed: {
        block_height: BLOCK_HEIGHT,
        block_index: BLOCK_INDEX,
      },
    };
    await Status.findOneAndUpdate({ _id: 1 }, { $set: data }, { upsert: true });
    logger.info('Set status on DB.');
  } else {
    logger.info('Status already available on DB.');
  }
};

const main = async () => {
  logger.info('Adding initial status to DB.');
  await initStatusCollection();

  process.exit();
};

main();
