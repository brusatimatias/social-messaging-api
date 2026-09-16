require('dotenv').config();

const username = process.env.POSTGRES_USER || 'default-username';
const password = process.env.POSTGRES_PASSWORD || 'default-password';
const host = process.env.DB_HOST || 'localhost';

module.exports = {
  development: {
    database: 'social-messaging-api-development',
    username,
    password,
    host,
    dialect: 'postgres',
  },
  test: {
    database: 'social-messaging-api-test',
    username,
    password,
    host,
    dialect: 'postgres',
  },
  production: {
    database: 'social-messaging-api-production',
    username,
    password,
    host,
    dialect: 'postgres',
  },
};
