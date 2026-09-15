const jwt = require('jsonwebtoken');

function authHeader(uuid = 'test-user-uuid') {
  return { Authorization: `Bearer ${jwt.sign({ uuid }, process.env.SECRET_KEY)}` };
}

module.exports = authHeader;
