const db = require('../db/database');

// Verifica se o orçamento e o centro de custo pertencem ao usuário logado.
function validarVinculos(userId, orcamentoId, centroId) {
  const orcamento = db
    .prepare('SELECT id FROM Orcamento WHERE id = ? AND usuario_id = ?')
    .get(orcamentoId, userId);
  if (!orcamento) return 'Orçamento inválido para este usuário.';

  const centro = db
    .prepare('SELECT id FROM CentroCusto WHERE id = ? AND usuario_id = ?')
    .get(centroId, userId);
  if (!centro) return 'Centro de custo inválido para este usuário.';

  return null;
}

// GET /api/gastos
// Filtros opcionais: ?busca=texto&orcamento_id=&centro_custo_id=&mes=&ano=
//                    &ordenarPor=data|valor|nome_gasto &ordem=asc|desc
exports.listar = (req, res) => {
  const { busca, orcamento_id, centro_custo_id, mes, ano, ordenarPor, ordem } = req.query;

  let sql = `
    SELECT g.*,
           o.nome_categoria AS orcamento_nome,
           c.nome           AS centro_nome,
           c.tipo           AS centro_tipo
    FROM Gasto g
    JOIN Orcamento   o ON o.id = g.orcamento_id
    JOIN CentroCusto c ON c.id = g.centro_custo_id
    WHERE o.usuario_id = ?
  `;
  const params = [req.userId];

  if (busca) { sql += ' AND g.nome_gasto LIKE ?'; params.push(`%${busca}%`); }
  if (orcamento_id) { sql += ' AND g.orcamento_id = ?'; params.push(orcamento_id); }
  if (centro_custo_id) { sql += ' AND g.centro_custo_id = ?'; params.push(centro_custo_id); }
  if (mes) { sql += " AND strftime('%m', g.data) = ?"; params.push(String(mes).padStart(2, '0')); }
  if (ano) { sql += " AND strftime('%Y', g.data) = ?"; params.push(String(ano)); }

  // Whitelist para evitar SQL injection na cláusula ORDER BY.
  const colunas = { data: 'g.data', valor: 'g.valor', nome_gasto: 'g.nome_gasto' };
  const coluna = colunas[ordenarPor] || 'g.data';
  const dir = String(ordem).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  sql += ` ORDER BY ${coluna} ${dir}, g.id DESC`;

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
};

// GET /api/gastos/:id
exports.obter = (req, res) => {
  const row = db
    .prepare(`SELECT g.* FROM Gasto g
              JOIN Orcamento o ON o.id = g.orcamento_id
              WHERE g.id = ? AND o.usuario_id = ?`)
    .get(req.params.id, req.userId);
  if (!row) return res.status(404).json({ error: 'Gasto não encontrado.' });
  res.json(row);
};

// POST /api/gastos
exports.criar = (req, res) => {
  const { orcamento_id, centro_custo_id, nome_gasto, valor, data } = req.body;
  if (!orcamento_id || !centro_custo_id || !nome_gasto || valor == null || !data) {
    return res.status(400).json({
      error: 'orcamento_id, centro_custo_id, nome_gasto, valor e data são obrigatórios.',
    });
  }

  const erro = validarVinculos(req.userId, orcamento_id, centro_custo_id);
  if (erro) return res.status(400).json({ error: erro });

  const info = db
    .prepare(`INSERT INTO Gasto (orcamento_id, centro_custo_id, nome_gasto, valor, data)
              VALUES (?, ?, ?, ?, ?)`)
    .run(orcamento_id, centro_custo_id, nome_gasto, Number(valor), data);

  const novo = db.prepare('SELECT * FROM Gasto WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(novo);
};

// PUT /api/gastos/:id
exports.atualizar = (req, res) => {
  const existente = db
    .prepare(`SELECT g.* FROM Gasto g
              JOIN Orcamento o ON o.id = g.orcamento_id
              WHERE g.id = ? AND o.usuario_id = ?`)
    .get(req.params.id, req.userId);
  if (!existente) return res.status(404).json({ error: 'Gasto não encontrado.' });

  const orcamentoId = req.body.orcamento_id ?? existente.orcamento_id;
  const centroId = req.body.centro_custo_id ?? existente.centro_custo_id;

  const erro = validarVinculos(req.userId, orcamentoId, centroId);
  if (erro) return res.status(400).json({ error: erro });

  db.prepare(`UPDATE Gasto
              SET orcamento_id = ?, centro_custo_id = ?, nome_gasto = ?, valor = ?, data = ?
              WHERE id = ?`)
    .run(
      orcamentoId,
      centroId,
      req.body.nome_gasto ?? existente.nome_gasto,
      req.body.valor != null ? Number(req.body.valor) : existente.valor,
      req.body.data ?? existente.data,
      req.params.id
    );

  const atualizado = db.prepare('SELECT * FROM Gasto WHERE id = ?').get(req.params.id);
  res.json(atualizado);
};

// DELETE /api/gastos/:id
exports.remover = (req, res) => {
  // Garante que o gasto pertence ao usuário antes de excluir.
  const existente = db
    .prepare(`SELECT g.id FROM Gasto g
              JOIN Orcamento o ON o.id = g.orcamento_id
              WHERE g.id = ? AND o.usuario_id = ?`)
    .get(req.params.id, req.userId);
  if (!existente) return res.status(404).json({ error: 'Gasto não encontrado.' });

  db.prepare('DELETE FROM Gasto WHERE id = ?').run(req.params.id);
  res.status(204).end();
};
