const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');

class ConversationParticipant extends Model {
  static associate(models) {
    ConversationParticipant.belongsTo(models.Conversation, { foreignKey: 'conversationId' });
    ConversationParticipant.belongsTo(models.User, { foreignKey: 'userId' });
  }
}

ConversationParticipant.init(
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'ConversationParticipant',
    tableName: 'ConversationParticipants',
    indexes: [
      {
        unique: true,
        fields: ['conversationId', 'userId'],
      },
    ],
  }
);

module.exports = ConversationParticipant;
