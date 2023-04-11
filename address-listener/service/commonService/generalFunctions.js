const env = require('../../config');
const Status = require('../mongoService/status');
const { get } = require('../../utils/httpRequest');
const logger = require('../../utils/logger');

const getPushedTxnStatus = async () => {
  let status = await Status.findById(1);
  return status.txnInserted;
};

const getCurrentTxnStatus = async (queryParams) => {
  const { HTTP_PROVIDER_URL, ADMIN_WALLET, TOKEN } = env.BLOCKCHAIN;
  const baseUrl = `${HTTP_PROVIDER_URL}/addrs/${ADMIN_WALLET}/full?token=${TOKEN}&limit=50`;
  const url = queryParams ? `${baseUrl}&${queryParams}` : baseUrl;
  let walletData = await get(url);
  return walletData;
};

const updateStatusInDb = async (block_height, block_index) => {
  await Status.findOneAndUpdate(
    { _id: 1 },
    {
      $set: {
        txnInserted: {
          block_height: block_height,
          block_index: block_index,
        },
      },
    }
  );
  logger.info(`Block ${block_height} and Index ${block_index} updated on DB.`);
};

const sortTxnList = (txnList) => {
  return txnList.sort((a, b) => {
    if (a.block_height === b.block_height) {
      return a.block_index - b.block_index;
    }
    return a.block_height > b.block_height ? 1 : -1;
  });
};

module.exports = {
  getPushedTxnStatus,
  getCurrentTxnStatus,
  updateStatusInDb,
  sortTxnList,
};
