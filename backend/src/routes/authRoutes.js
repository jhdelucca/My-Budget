const express = require('express');
const auth = require('../middleware/auth');
const wrap = require('../utils/asyncHandler');
const ctrl = require('../controllers/authController');

const router = express.Router();

router.post('/register', wrap(ctrl.register));
router.post('/login', wrap(ctrl.login));
router.get('/me', auth, wrap(ctrl.me));

module.exports = router;
