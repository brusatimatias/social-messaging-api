const express = require('express');
const router = express.Router();
const { User } = require('../../models');

router.get('/users/:uuid', async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { uuid: req.params.uuid },
      attributes: ['id', 'uuid', 'name', 'lastname', 'fullName'],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
