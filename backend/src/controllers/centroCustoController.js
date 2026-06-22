const { query } = require('../db/database');

const TIPOS_VALIDOS = ['Crédito', 'Débito'];

// GET /api/centros-custo
exports.listar = async (req, res) => {
  const { rows } = await query(
    'SELECT * FROM centrocusto WHERE usuario_id = $1 ORDER BY tipo, nome',
    [req.userId]
  );
  res.json(rows);
};

// GET /api/centros-custo/:id
exports.obter = async (req, res) => {
  const { rows } = await query('SELECT * FROM centrocusto WHERE id = $1 AND usuario_id = $2', [
    req.params.id,
    req.userId,
  ]);
  if (!rows.length) return res.status(404).json({ error: 'Centro de custo não encontrado.' });
  res.json(rows[0]);
};

// POST /api/centros-custo
exports.criar = async (req, res) => {
  const { nome, tipo, limite, saldo_disponivel } = req.body;
  if (!nome || !tipo) {
    return res.status(400).json({ error: 'Nome e tipo são obrigatórios.' });
  }
  if (!TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ error: "Tipo deve ser 'Crédito' ou 'Débito'." });
  }

  const { rows } = await query(
    `INSERT INTO centrocusto (usuario_id, nome, tipo, limite, saldo_disponivel)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      req.userId,
      nome,
      tipo,
      tipo === 'Crédito' ? Number(limite) || 0 : 0,
      tipo === 'Débito' ? Number(saldo_disponivel) || 0 : 0,
    ]
  );
  res.status(201).json(rows[0]);
};

// PUT /api/centros-custo/:id
exports.atualizar = async (req, res) => {
  const atual = await query('SELECT * FROM centrocusto WHERE id = $1 AND usuario_id = $2', [
    req.params.id,
    req.userId,
  ]);
  if (!atual.rows.length) return res.status(404).json({ error: 'Centro de custo não encontrado.' });
  const existente = atual.rows[0];

  const { nome, tipo, limite, saldo_disponivel } = req.body;
  const novoTipo = tipo ?? existente.tipo;
  if (!TIPOS_VALIDOS.includes(novoTipo)) {
    return res.status(400).json({ error: "Tipo deve ser 'Crédito' ou 'Débito'." });
  }

  const { rows } = await query(
    `UPDATE centrocusto
     SET nome = $1, tipo = $2, limite = $3, saldo_disponivel = $4
     WHERE id = $5 AND usuario_id = $6
     RETURNING *`,
    [
      nome ?? existente.nome,
      novoTipo,
      limite != null ? Number(limite) : existente.limite,
      saldo_disponivel != null ? Number(saldo_disponivel) : existente.saldo_disponivel,
      req.params.id,
      req.userId,
    ]
  );
  res.json(rows[0]);
};

// DELETE /api/centros-custo/:id
exports.remover = async (req, res) => {
  const result = await query('DELETE FROM centrocusto WHERE id = $1 AND usuario_id = $2', [
    req.params.id,
    req.userId,
  ]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Centro de custo não encontrado.' });
  res.status(204).end();
};
