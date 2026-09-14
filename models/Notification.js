const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');

class Notification extends Model {
  static associate(models) {
    Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'recipient' });
    Notification.belongsTo(models.Message, { foreignKey: 'messageId', as: 'message' });
  }
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    messageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'Notifications',
  }
);

module.exports = Notification;
