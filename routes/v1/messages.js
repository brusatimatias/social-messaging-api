const express = require('express');
const router = express.Router();
const MessageService = require('../../services/MessageService');
const HttpError = require('../../utils/HttpError');
const { sendData } = require('../../utils/apiResponse');

router.get('/conversations/:conversationId/messages', async (req, res, next) => {
  try {
    const messages = await MessageService.getMessagesByConversation(req.params.conversationId);
    sendData(res, messages);
  } catch (error) {
    next(error);
  }
});

router.post('/conversations/:conversationId/messages', async (req, res, next) => {
  try {
    const { senderId, content } = req.body;

    if (!senderId || !content) {
      throw new HttpError(400, 'senderId and content are required');
    }

    const message = await MessageService.createMessage({
      conversationId: req.params.conversationId,
      senderId,
      content,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(String(req.params.conversationId)).emit('newMessage', message);
    }

    sendData(res, message, 201);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
