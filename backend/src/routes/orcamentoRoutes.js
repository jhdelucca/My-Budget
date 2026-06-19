const express = require('express');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/orcamentoController');

const router = express.Router();

router.use(auth); // todas as rotas abaixo exigem autenticação

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obter);
router.post('/', ctrl.criar);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.remover);

module.exports = router;
