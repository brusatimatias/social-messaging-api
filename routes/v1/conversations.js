const express = require('express');
const router = express.Router();
const ConversationService = require('../../services/ConversationService');
const HttpError = require('../../utils/HttpError');
const { sendData } = require('../../utils/apiResponse');

router.get('/conversations', async (req, res, next) => {
  try {
    const conversations = await ConversationService.getConversationsForUser(req.userUuid);
    sendData(res, conversations);
  } catch (error) {
    next(error);
  }
});

router.post('/conversations', async (req, res, next) => {
  try {
    const { isGroup = false, name, participantUuids } = req.body;

    if (!Array.isArray(participantUuids) || participantUuids.length < 2) {
      throw new HttpError(400, 'participantUuids must be an array with at least 2 uuids');
    }

    const conversation = await ConversationService.createConversation({
      isGroup,
      name,
      participantUuids,
    });
    sendData(res, conversation, 201);
  } catch (error) {
    next(error);
  }
});

router.get('/conversations/:id', async (req, res, next) => {
  try {
    const conversation = await ConversationService.getConversationById(req.params.id);
    sendData(res, conversation);
  } catch (error) {
    next(error);
  }
});

router.post('/conversations/:id/participants', async (req, res, next) => {
  try {
    const { userUuid } = req.body;

    if (!userUuid) {
      throw new HttpError(400, 'userUuid is required');
    }

    const participant = await ConversationService.addParticipant(req.params.id, userUuid);
    sendData(res, participant, 201);
  } catch (error) {
    next(error);
  }
});

router.delete('/conversations/:id/participants/:userUuid', async (req, res, next) => {
  try {
    await ConversationService.removeParticipant(req.params.id, req.params.userUuid);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
