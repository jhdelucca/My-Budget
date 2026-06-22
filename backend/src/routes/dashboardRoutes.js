const express = require('express');
const auth = require('../middleware/auth');
const wrap = require('../utils/asyncHandler');
const ctrl = require('../controllers/dashboardController');

const router = express.Router();

router.use(auth);
router.get('/', wrap(ctrl.getDashboard));

module.exports = router;
