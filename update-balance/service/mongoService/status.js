'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const btcStatusSchema = new Schema(
  {
    _id: Number,
    txnInserted: {
      block_height: Number,
      block_index: Number,
    },
    txnConsumed: {
      block_height: Number,
      block_index: Number,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

const Status = mongoose.model('btcBlockStatus', btcStatusSchema);
module.exports = Status;
