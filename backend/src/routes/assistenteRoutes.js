const express = require('express');
const auth = require('../middleware/auth');
const wrap = require('../utils/asyncHandler');
const ctrl = require('../controllers/assistenteController');

const router = express.Router();

router.use(auth);
router.post('/', wrap(ctrl.perguntar));

module.exports = router;
