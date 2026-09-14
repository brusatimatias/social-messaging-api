const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');

class Message extends Model {
  static associate(models) {
    Message.belongsTo(models.Conversation, { foreignKey: 'conversationId', as: 'conversation' });
    Message.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });
    Message.hasMany(models.Notification, { foreignKey: 'messageId', as: 'notifications' });
  }
}

Message.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 5000],
      },
    },
  },
  {
    sequelize,
    modelName: 'Message',
    tableName: 'Messages',
  }
);

module.exports = Message;
