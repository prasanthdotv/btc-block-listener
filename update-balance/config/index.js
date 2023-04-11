'use strict';

const env = {
  NODE_ENV: process.env.NODE_ENV || 'dev',
  BLOCKCHAIN: {
    NETWORK: process.env.NETWORK || 'testnet',
    WSS_PROVIDER_URL: process.env.BLOCK_CYPHER_WSS_URL,
    HTTP_PROVIDER_URL: process.env.BLOCK_CYPHER_HTTP_URL,
    TOKEN: process.env.BLOCK_CYPHER_API_TOKEN,
    ADMIN_WALLET: process.env.ADMIN_WALLET,
    BLOCK_CONFIRMATIONS: process.env.BLOCK_CONFIRMATIONS || 1,
    BATCH_SIZE: process.env.BATCH_SIZE || 20,
    RETRIES: process.env.RETRIES || 3,
  },
  QUEUE: {
    CONN_URL: process.env.RMQ_CONN_URL || 'amqp://localhost:5672',
    TXNS_QUEUE: process.env.RMQ_TXNS_QUEUE || 'txns_queue',
  },
  DB: {
    URI: process.env.DB_URI || 'mongodb://mongo:27017/wallet_listener',
    BLOCK_HEIGHT: process.env.BLOCK_HEIGHT,
    BLOCK_INDEX: process.env.BLOCK_INDEX,
  },
  BACKEND: {
    URI: process.env.BACKEND_API_URI || 'http://localhost:3000/api',
    API_END_POINT: process.env.BACKEND_API_ENDPOINT,
    AUTH_END_POINT: process.env.BACKEND_AUTH_ENDPOINT,
    USERNAME: process.env.BACKEND_USERNAME,
    PASSWORD: process.env.BACKEND_PASSWORD,
  },
  S3: {
    bucket: process.env.S3_BUCKET,
    access_key_id: process.env.S3_ACCESS_KEY_ID,
    secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
    folder: process.env.S3_FOLDER,
  },
};
module.exports = env;
