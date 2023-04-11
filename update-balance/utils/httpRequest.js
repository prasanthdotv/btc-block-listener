const axios = require('axios');

const env = require('../config');

const { URI } = env.BACKEND;

const sendHttpRequest = async (method, endpoint, token, payload) => {
  const config = {
    method,
    url: URI + endpoint,
    headers: {
      'Content-Type': 'application/json',
    },
    data: payload,
  };
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return axios(config);
};

module.exports = {
  sendHttpRequest,
};
