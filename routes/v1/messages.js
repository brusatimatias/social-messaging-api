const express = require('express');
const router = express.Router();
const Service = require('../../services/Service');

router.get('/conversations/:conversationId/messages', async (req, res, next) => {
  try {
    const messages = await Service.getMessagesByConversation(req.params.conversationId);
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
