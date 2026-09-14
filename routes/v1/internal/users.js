const express = require('express');
const router = express.Router();
const UserService = require('../../../services/UserService');
const HttpError = require('../../../utils/HttpError');
const { sendData } = require('../../../utils/apiResponse');

router.put('/users/:uuid', async (req, res, next) => {
  try {
    const { name, lastname, fullName } = req.body;

    if (!name || !lastname || !fullName) {
      throw new HttpError(400, 'name, lastname and fullName are required');
    }

    const user = await UserService.upsertUser({ uuid: req.params.uuid, name, lastname, fullName });
    sendData(res, user);
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:uuid', async (req, res, next) => {
  try {
    await UserService.deleteUser(req.params.uuid);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
