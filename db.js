const { Sequelize } = require('sequelize');

const username = process.env.POSTGRES_USER || 'default-username';
const password = process.env.POSTGRES_PASSWORD || 'default-password';
const host = process.env.DB_HOST || 'localhost';


const developmentConfig = {
  database: 'social-messaging-api-development',
  username,
  password,
  host,
  dialect: 'postgres',
};

const testConfig = {
  database: 'social-messaging-api-test',
  username,
  password,
  host,
  dialect: 'postgres',
};

const productionConfig = {
  database: 'social-messaging-api-production',
  username,
  password,
  host,
  dialect: 'postgres',
};

const env = process.env.NODE_ENV || 'development';

const config = {
  development: developmentConfig,
  test: testConfig,
  production: productionConfig,
};

const sequelize = new Sequelize(config[env]);

module.exports = sequelize;
