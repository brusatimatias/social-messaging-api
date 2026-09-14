const HttpError = require('../utils/HttpError');

// Run after `auth`. A valid user token is authenticated but not authorized here —
// only tokens carrying a `service` claim (no `uuid`) may reach internal routes.
function requireService(req, res, next) {
  if (!req.service) {
    return next(new HttpError(403, 'Forbidden'));
  }

  next();
}

module.exports = requireService;
