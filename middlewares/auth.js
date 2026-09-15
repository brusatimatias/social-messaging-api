const jwt = require('jsonwebtoken');
const HttpError = require('../utils/HttpError');

function auth(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Missing bearer token'));
  }

  try {
    const payload = jwt.verify(token, process.env.SECRET_KEY);

    if (payload.uuid) {
      req.userUuid = payload.uuid;
    } else if (payload.service) {
      req.service = payload.service;
    } else {
      return next(new HttpError(401, 'Invalid token payload'));
    }

    next();
  } catch (error) {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

module.exports = auth;
