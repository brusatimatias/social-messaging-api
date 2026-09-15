require('dotenv').config();

var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var v1Router = require('./routes/v1');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/', (_, res) => res.json({ message: "Social Messaging API" }));

app.use('/api/v1', v1Router);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // A value that doesn't match its column type (bad uuid, date, integer, etc. in a route param
  // or body) reaches here as a raw Postgres error, not an HttpError thrown on purpose — treat it
  // as a 400, not a 500, without needing every route to validate each field's format itself.
  // 22P02 = invalid_text_representation, Postgres' generic "can't parse this as that type" code.
  if (err.name === 'SequelizeDatabaseError' && err.parent && err.parent.code === '22P02') {
    return res.status(400).json({ error: { message: 'Invalid value format' } });
  }

  const status = err.status || 500;
  const message = status < 500 ? err.message : 'Internal server error';
  res.status(status).json({ error: { message } });
});

module.exports = app;
