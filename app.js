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

module.exports = app;
