const { User, Notification } = require('../models');
const HttpError = require('../utils/HttpError');

async function getNotificationsForUser(userUuid) {
  const user = await User.findOne({ where: { uuid: userUuid } });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  return Notification.findAll({
    where: { userId: user.id },
    order: [['createdAt', 'DESC']],
  });
}

module.exports = {
  getNotificationsForUser,
};
