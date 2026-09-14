const express = require('express');
const router = express.Router();
const NotificationService = require('../../services/NotificationService');

router.get('/notifications', async (req, res, next) => {
  try {
    const notifications = await NotificationService.getNotificationsForUser(req.userUuid);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
