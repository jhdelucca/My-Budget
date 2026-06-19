const express = require('express');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/authController');

const router = express.Router();

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', auth, ctrl.me);

module.exports = router;
