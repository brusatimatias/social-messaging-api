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
  const status = err.status || 500;
  res.status(status).json({ message: status < 500 ? err.message : 'Internal server error' });
});

module.exports = app;
