const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');

class User extends Model {
  static associate(models) {
    User.hasMany(models.Message, { foreignKey: 'senderId', as: 'sentMessages' });
    User.hasMany(models.ConversationParticipant, { foreignKey: 'userId', as: 'participations' });
    User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
    User.belongsToMany(models.Conversation, {
      through: models.ConversationParticipant,
      foreignKey: 'userId',
      otherKey: 'conversationId',
      as: 'conversations',
    });
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // Identity is owned by the Social API; this mirrors its user by uuid.
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      validate: {
        isUUID: 4,
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    paranoid: true,
  }
);

module.exports = User;
