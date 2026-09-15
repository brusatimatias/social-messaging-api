const sequelize = require('../db');
const User = require('./User');
const Conversation = require('./Conversation');
const ConversationParticipant = require('./ConversationParticipant');
const Message = require('./Message');
const Notification = require('./Notification');

const models = { User, Conversation, ConversationParticipant, Message, Notification };

Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

module.exports = { sequelize, ...models };
