const db = require('../db/database');

const TIPOS_VALIDOS = ['Crédito', 'Débito'];

// GET /api/centros-custo
exports.listar = (req, res) => {
  const rows = db
    .prepare('SELECT * FROM CentroCusto WHERE usuario_id = ? ORDER BY tipo, nome')
    .all(req.userId);
  res.json(rows);
};

// GET /api/centros-custo/:id
exports.obter = (req, res) => {
  const row = db
    .prepare('SELECT * FROM CentroCusto WHERE id = ? AND usuario_id = ?')
    .get(req.params.id, req.userId);
  if (!row) return res.status(404).json({ error: 'Centro de custo não encontrado.' });
  res.json(row);
};

// POST /api/centros-custo
exports.criar = (req, res) => {
  const { nome, tipo, limite, saldo_disponivel } = req.body;
  if (!nome || !tipo) {
    return res.status(400).json({ error: 'Nome e tipo são obrigatórios.' });
  }
  if (!TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ error: "Tipo deve ser 'Crédito' ou 'Débito'." });
  }

  const info = db
    .prepare(`INSERT INTO CentroCusto (usuario_id, nome, tipo, limite, saldo_disponivel)
              VALUES (?, ?, ?, ?, ?)`)
    .run(
      req.userId,
      nome,
      tipo,
      tipo === 'Crédito' ? Number(limite) || 0 : 0,
      tipo === 'Débito' ? Number(saldo_disponivel) || 0 : 0
    );

  const novo = db.prepare('SELECT * FROM CentroCusto WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(novo);
};

// PUT /api/centros-custo/:id
exports.atualizar = (req, res) => {
  const existente = db
    .prepare('SELECT * FROM CentroCusto WHERE id = ? AND usuario_id = ?')
    .get(req.params.id, req.userId);
  if (!existente) return res.status(404).json({ error: 'Centro de custo não encontrado.' });

  const { nome, tipo, limite, saldo_disponivel } = req.body;
  const novoTipo = tipo ?? existente.tipo;
  if (!TIPOS_VALIDOS.includes(novoTipo)) {
    return res.status(400).json({ error: "Tipo deve ser 'Crédito' ou 'Débito'." });
  }

  db.prepare(`UPDATE CentroCusto
              SET nome = ?, tipo = ?, limite = ?, saldo_disponivel = ?
              WHERE id = ? AND usuario_id = ?`)
    .run(
      nome ?? existente.nome,
      novoTipo,
      limite != null ? Number(limite) : existente.limite,
      saldo_disponivel != null ? Number(saldo_disponivel) : existente.saldo_disponivel,
      req.params.id,
      req.userId
    );

  const atualizado = db.prepare('SELECT * FROM CentroCusto WHERE id = ?').get(req.params.id);
  res.json(atualizado);
};

// DELETE /api/centros-custo/:id
exports.remover = (req, res) => {
  const info = db
    .prepare('DELETE FROM CentroCusto WHERE id = ? AND usuario_id = ?')
    .run(req.params.id, req.userId);
  if (info.changes === 0) return res.status(404).json({ error: 'Centro de custo não encontrado.' });
  res.status(204).end();
};
