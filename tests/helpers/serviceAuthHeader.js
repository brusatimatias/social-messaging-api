const jwt = require('jsonwebtoken');

function serviceAuthHeader(service = 'social-api') {
  return { Authorization: `Bearer ${jwt.sign({ service }, process.env.SECRET_KEY)}` };
}

module.exports = serviceAuthHeader;
