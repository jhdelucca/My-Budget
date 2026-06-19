const express = require('express');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/dashboardController');

const router = express.Router();

router.use(auth);
router.get('/', ctrl.getDashboard);

module.exports = router;
