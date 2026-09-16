const express = require('express');
const router = express.Router();
const NotificationService = require('../../services/NotificationService');
const { sendData } = require('../../utils/apiResponse');

router.get('/notifications', async (req, res, next) => {
  try {
    const notifications = await NotificationService.getNotificationsForUser(req.userUuid);
    sendData(res, notifications);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
