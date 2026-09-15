const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');

class Conversation extends Model {
  static associate(models) {
    Conversation.hasMany(models.Message, { foreignKey: 'conversationId', as: 'messages' });
    Conversation.hasMany(models.ConversationParticipant, {
      foreignKey: 'conversationId',
      as: 'participants',
    });
    Conversation.belongsToMany(models.User, {
      through: models.ConversationParticipant,
      foreignKey: 'conversationId',
      otherKey: 'userId',
      as: 'members',
    });
  }
}

Conversation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // Optional: group chats can be named, 1:1 conversations are usually left unnamed.
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },
    isGroup: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Conversation',
    tableName: 'Conversations',
  }
);

module.exports = Conversation;
