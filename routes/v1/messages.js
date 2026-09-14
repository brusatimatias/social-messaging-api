const express = require('express');
const router = express.Router();
const Service = require('../../services/Service');

router.get('/conversations/:roomId/messages', async (req, res, next) => {
  try {
    const messages = await Service.getMessagesByRoom(req.params.roomId);
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
