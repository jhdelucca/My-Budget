const { query } = require('../db/database');

// Verifica se o orçamento e o centro de custo pertencem ao usuário logado.
async function validarVinculos(userId, orcamentoId, centroId) {
  const orcamento = await query('SELECT id FROM orcamento WHERE id = $1 AND usuario_id = $2', [
    orcamentoId,
    userId,
  ]);
  if (!orcamento.rows.length) return 'Orçamento inválido para este usuário.';

  const centro = await query('SELECT id FROM centrocusto WHERE id = $1 AND usuario_id = $2', [
    centroId,
    userId,
  ]);
  if (!centro.rows.length) return 'Centro de custo inválido para este usuário.';

  return null;
}

// GET /api/gastos
// Filtros: ?busca=&orcamento_id=&centro_custo_id=&mes=&ano=&ordenarPor=&ordem=
exports.listar = async (req, res) => {
  const { busca, orcamento_id, centro_custo_id, mes, ano, ordenarPor, ordem } = req.query;

  const params = [req.userId];
  let sql = `
    SELECT g.*,
           o.nome_categoria AS orcamento_nome,
           c.nome           AS centro_nome,
           c.tipo           AS centro_tipo
    FROM gasto g
    JOIN orcamento   o ON o.id = g.orcamento_id
    JOIN centrocusto c ON c.id = g.centro_custo_id
    WHERE o.usuario_id = $1
  `;

  if (busca) { params.push(`%${busca}%`); sql += ` AND g.nome_gasto ILIKE $${params.length}`; }
  if (orcamento_id) { params.push(orcamento_id); sql += ` AND g.orcamento_id = $${params.length}`; }
  if (centro_custo_id) { params.push(centro_custo_id); sql += ` AND g.centro_custo_id = $${params.length}`; }
  if (mes) { params.push(String(mes).padStart(2, '0')); sql += ` AND to_char(g.data, 'MM') = $${params.length}`; }
  if (ano) { params.push(String(ano)); sql += ` AND to_char(g.data, 'YYYY') = $${params.length}`; }

  // Whitelist para a cláusula ORDER BY (evita SQL injection).
  const colunas = { data: 'g.data', valor: 'g.valor', nome_gasto: 'g.nome_gasto' };
  const coluna = colunas[ordenarPor] || 'g.data';
  const dir = String(ordem).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  sql += ` ORDER BY ${coluna} ${dir}, g.id DESC`;

  const { rows } = await query(sql, params);
  res.json(rows);
};

// GET /api/gastos/:id
exports.obter = async (req, res) => {
  const { rows } = await query(
    `SELECT g.* FROM gasto g
     JOIN orcamento o ON o.id = g.orcamento_id
     WHERE g.id = $1 AND o.usuario_id = $2`,
    [req.params.id, req.userId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Gasto não encontrado.' });
  res.json(rows[0]);
};

// POST /api/gastos
exports.criar = async (req, res) => {
  const { orcamento_id, centro_custo_id, nome_gasto, valor, data } = req.body;
  if (!orcamento_id || !centro_custo_id || !nome_gasto || valor == null || !data) {
    return res.status(400).json({
      error: 'orcamento_id, centro_custo_id, nome_gasto, valor e data são obrigatórios.',
    });
  }

  const erro = await validarVinculos(req.userId, orcamento_id, centro_custo_id);
  if (erro) return res.status(400).json({ error: erro });

  const { rows } = await query(
    `INSERT INTO gasto (orcamento_id, centro_custo_id, nome_gasto, valor, data)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [orcamento_id, centro_custo_id, nome_gasto, Number(valor), data]
  );
  res.status(201).json(rows[0]);
};

// PUT /api/gastos/:id
exports.atualizar = async (req, res) => {
  const atual = await query(
    `SELECT g.* FROM gasto g
     JOIN orcamento o ON o.id = g.orcamento_id
     WHERE g.id = $1 AND o.usuario_id = $2`,
    [req.params.id, req.userId]
  );
  if (!atual.rows.length) return res.status(404).json({ error: 'Gasto não encontrado.' });
  const existente = atual.rows[0];

  const orcamentoId = req.body.orcamento_id ?? existente.orcamento_id;
  const centroId = req.body.centro_custo_id ?? existente.centro_custo_id;

  const erro = await validarVinculos(req.userId, orcamentoId, centroId);
  if (erro) return res.status(400).json({ error: erro });

  const { rows } = await query(
    `UPDATE gasto
     SET orcamento_id = $1, centro_custo_id = $2, nome_gasto = $3, valor = $4, data = $5
     WHERE id = $6
     RETURNING *`,
    [
      orcamentoId,
      centroId,
      req.body.nome_gasto ?? existente.nome_gasto,
      req.body.valor != null ? Number(req.body.valor) : existente.valor,
      req.body.data ?? existente.data,
      req.params.id,
    ]
  );
  res.json(rows[0]);
};

// DELETE /api/gastos/:id
exports.remover = async (req, res) => {
  const existente = await query(
    `SELECT g.id FROM gasto g
     JOIN orcamento o ON o.id = g.orcamento_id
     WHERE g.id = $1 AND o.usuario_id = $2`,
    [req.params.id, req.userId]
  );
  if (!existente.rows.length) return res.status(404).json({ error: 'Gasto não encontrado.' });

  await query('DELETE FROM gasto WHERE id = $1', [req.params.id]);
  res.status(204).end();
};
