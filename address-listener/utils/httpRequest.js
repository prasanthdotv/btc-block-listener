const axios = require('axios');

const env = require('../config');

const { URI } = env.BACKEND;

const get = async (url) => {
  const result = await axios.get(url);
  return result.data;
};

const post = async (url, query) => {
  const result = await axios.post(url, { ...query });
  return result;
};

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
  get,
  post,
  sendHttpRequest,
};
