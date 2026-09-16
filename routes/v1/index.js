const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const requireService = require('../../middlewares/requireService');

// Everything under /api/v1 requires a valid Bearer JWT (user or service claim).
router.use(auth);

// Internal sync additionally requires a service token, not just any authenticated caller.
router.use('/internal', requireService, require('./internal'));

router.use(require('./users'));
router.use(require('./conversations'));
router.use(require('./messages'));
router.use(require('./notifications'));

module.exports = router;
