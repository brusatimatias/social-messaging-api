const express = require('express');
const router = express.Router();
const { User } = require('../../models');
const HttpError = require('../../utils/HttpError');
const { sendData } = require('../../utils/apiResponse');

router.get('/users/:uuid', async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { uuid: req.params.uuid },
      attributes: ['id', 'uuid', 'name', 'lastname', 'fullName'],
    });

    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    sendData(res, user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
