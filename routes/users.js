var express = require('express');
var router = express.Router();

router.get('/v1/users/:id', (req, res) => {
  const userId = req.params.id;

  const userData = {
    id: userId,
    username: 'exampleUser',
    email: 'user@example.com',
  };


  res.json(userData);
});

module.exports = router;
