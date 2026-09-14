const { sequelize, Conversation, ConversationParticipant, User } = require('../models');
const HttpError = require('../utils/HttpError');

async function createConversation({ isGroup, name, participantUuids }) {
  const users = await User.findAll({ where: { uuid: participantUuids } });

  if (users.length !== participantUuids.length) {
    const foundUuids = users.map((user) => user.uuid);
    const missing = participantUuids.filter((uuid) => !foundUuids.includes(uuid));
    throw new HttpError(422, `Unknown participant uuid(s): ${missing.join(', ')}`);
  }

  return sequelize.transaction(async (transaction) => {
    const conversation = await Conversation.create({ isGroup, name }, { transaction });

    await ConversationParticipant.bulkCreate(
      users.map((user) => ({ conversationId: conversation.id, userId: user.id })),
      { transaction }
    );

    return conversation;
  });
}

async function getConversationsForUser(userUuid) {
  const user = await User.findOne({ where: { uuid: userUuid } });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  return Conversation.findAll({
    include: [
      {
        model: ConversationParticipant,
        as: 'participants',
        where: { userId: user.id },
        required: true,
      },
    ],
  });
}

async function getConversationById(id) {
  const conversation = await Conversation.findByPk(id, {
    include: [{ model: ConversationParticipant, as: 'participants', include: [{ model: User }] }],
  });

  if (!conversation) {
    throw new HttpError(404, 'Conversation not found');
  }

  return conversation;
}

async function addParticipant(conversationId, userUuid) {
  const conversation = await Conversation.findByPk(conversationId);
  if (!conversation) {
    throw new HttpError(404, 'Conversation not found');
  }

  const user = await User.findOne({ where: { uuid: userUuid } });
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const existing = await ConversationParticipant.findOne({
    where: { conversationId, userId: user.id },
  });
  if (existing) {
    throw new HttpError(409, 'User is already a participant');
  }

  return ConversationParticipant.create({ conversationId, userId: user.id });
}

async function removeParticipant(conversationId, userUuid) {
  const user = await User.findOne({ where: { uuid: userUuid } });
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const deletedCount = await ConversationParticipant.destroy({
    where: { conversationId, userId: user.id },
  });

  if (deletedCount === 0) {
    throw new HttpError(404, 'Participant not found');
  }
}

module.exports = {
  createConversation,
  getConversationsForUser,
  getConversationById,
  addParticipant,
  removeParticipant,
};
