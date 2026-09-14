const { User } = require('../models');
const HttpError = require('../utils/HttpError');

async function upsertUser({ uuid, name, lastname, fullName }) {
  const [user, created] = await User.findOrCreate({
    where: { uuid },
    defaults: { name, lastname, fullName },
  });

  if (!created) {
    await user.update({ name, lastname, fullName });
  }

  return user;
}

async function deleteUser(uuid) {
  const deletedCount = await User.destroy({ where: { uuid } });

  if (deletedCount === 0) {
    throw new HttpError(404, 'User not found');
  }
}

module.exports = {
  upsertUser,
  deleteUser,
};
