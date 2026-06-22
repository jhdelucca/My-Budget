const { query } = require('../db/database');

// GET /api/orcamentos  (opcional: ?mes=06&ano=2026)
exports.listar = async (req, res) => {
  const { mes, ano } = req.query;
  const params = [req.userId];
  let sql = `
    SELECT o.*,
           COALESCE((SELECT SUM(g.valor) FROM gasto g WHERE g.orcamento_id = o.id), 0) AS total_gasto
    FROM orcamento o
    WHERE o.usuario_id = $1
  `;

  if (mes) { params.push(mes); sql += ` AND o.mes = $${params.length}`; }
  if (ano) { params.push(ano); sql += ` AND o.ano = $${params.length}`; }
  sql += ' ORDER BY o.ano DESC, o.mes DESC, o.nome_categoria ASC';

  const { rows } = await query(sql, params);
  res.json(rows);
};

// GET /api/orcamentos/:id
exports.obter = async (req, res) => {
  const { rows } = await query('SELECT * FROM orcamento WHERE id = $1 AND usuario_id = $2', [
    req.params.id,
    req.userId,
  ]);
  if (!rows.length) return res.status(404).json({ error: 'Orçamento não encontrado.' });
  res.json(rows[0]);
};

// POST /api/orcamentos
exports.criar = async (req, res) => {
  const { nome_categoria, limite_mensal, mes, ano } = req.body;
  if (!nome_categoria || mes == null || ano == null) {
    return res.status(400).json({ error: 'Categoria, mês e ano são obrigatórios.' });
  }

  const { rows } = await query(
    `INSERT INTO orcamento (usuario_id, nome_categoria, limite_mensal, mes, ano)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.userId, nome_categoria, Number(limite_mensal) || 0, String(mes), String(ano)]
  );
  res.status(201).json(rows[0]);
};

// PUT /api/orcamentos/:id
exports.atualizar = async (req, res) => {
  const atual = await query('SELECT * FROM orcamento WHERE id = $1 AND usuario_id = $2', [
    req.params.id,
    req.userId,
  ]);
  if (!atual.rows.length) return res.status(404).json({ error: 'Orçamento não encontrado.' });
  const existente = atual.rows[0];

  const { nome_categoria, limite_mensal, mes, ano } = req.body;
  const { rows } = await query(
    `UPDATE orcamento
     SET nome_categoria = $1, limite_mensal = $2, mes = $3, ano = $4
     WHERE id = $5 AND usuario_id = $6
     RETURNING *`,
    [
      nome_categoria ?? existente.nome_categoria,
      limite_mensal != null ? Number(limite_mensal) : existente.limite_mensal,
      mes != null ? String(mes) : existente.mes,
      ano != null ? String(ano) : existente.ano,
      req.params.id,
      req.userId,
    ]
  );
  res.json(rows[0]);
};

// DELETE /api/orcamentos/:id
exports.remover = async (req, res) => {
  const result = await query('DELETE FROM orcamento WHERE id = $1 AND usuario_id = $2', [
    req.params.id,
    req.userId,
  ]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Orçamento não encontrado.' });
  res.status(204).end();
};
