const express = require('express');
const auth = require('../middleware/auth');
const wrap = require('../utils/asyncHandler');
const ctrl = require('../controllers/orcamentoController');

const router = express.Router();

router.use(auth); // todas as rotas abaixo exigem autenticação

router.get('/', wrap(ctrl.listar));
router.get('/:id', wrap(ctrl.obter));
router.post('/', wrap(ctrl.criar));
router.put('/:id', wrap(ctrl.atualizar));
router.delete('/:id', wrap(ctrl.remover));

module.exports = router;
