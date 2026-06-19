const db = require('../db/database');

// GET /api/orcamentos  (opcional: ?mes=06&ano=2026)
exports.listar = (req, res) => {
  const { mes, ano } = req.query;
  let sql = `
    SELECT o.*,
           COALESCE((SELECT SUM(g.valor) FROM Gasto g WHERE g.orcamento_id = o.id), 0) AS total_gasto
    FROM Orcamento o
    WHERE o.usuario_id = ?
  `;
  const params = [req.userId];

  if (mes) { sql += ' AND o.mes = ?'; params.push(mes); }
  if (ano) { sql += ' AND o.ano = ?'; params.push(ano); }
  sql += ' ORDER BY o.ano DESC, o.mes DESC, o.nome_categoria ASC';

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
};

// GET /api/orcamentos/:id
exports.obter = (req, res) => {
  const row = db
    .prepare('SELECT * FROM Orcamento WHERE id = ? AND usuario_id = ?')
    .get(req.params.id, req.userId);
  if (!row) return res.status(404).json({ error: 'Orçamento não encontrado.' });
  res.json(row);
};

// POST /api/orcamentos
exports.criar = (req, res) => {
  const { nome_categoria, limite_mensal, mes, ano } = req.body;
  if (!nome_categoria || mes == null || ano == null) {
    return res.status(400).json({ error: 'Categoria, mês e ano são obrigatórios.' });
  }

  const info = db
    .prepare(`INSERT INTO Orcamento (usuario_id, nome_categoria, limite_mensal, mes, ano)
              VALUES (?, ?, ?, ?, ?)`)
    .run(req.userId, nome_categoria, Number(limite_mensal) || 0, String(mes), String(ano));

  const novo = db.prepare('SELECT * FROM Orcamento WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(novo);
};

// PUT /api/orcamentos/:id
exports.atualizar = (req, res) => {
  const existente = db
    .prepare('SELECT * FROM Orcamento WHERE id = ? AND usuario_id = ?')
    .get(req.params.id, req.userId);
  if (!existente) return res.status(404).json({ error: 'Orçamento não encontrado.' });

  const { nome_categoria, limite_mensal, mes, ano } = req.body;
  db.prepare(`UPDATE Orcamento
              SET nome_categoria = ?, limite_mensal = ?, mes = ?, ano = ?
              WHERE id = ? AND usuario_id = ?`)
    .run(
      nome_categoria ?? existente.nome_categoria,
      limite_mensal != null ? Number(limite_mensal) : existente.limite_mensal,
      mes != null ? String(mes) : existente.mes,
      ano != null ? String(ano) : existente.ano,
      req.params.id,
      req.userId
    );

  const atualizado = db.prepare('SELECT * FROM Orcamento WHERE id = ?').get(req.params.id);
  res.json(atualizado);
};

// DELETE /api/orcamentos/:id
exports.remover = (req, res) => {
  const info = db
    .prepare('DELETE FROM Orcamento WHERE id = ? AND usuario_id = ?')
    .run(req.params.id, req.userId);
  if (info.changes === 0) return res.status(404).json({ error: 'Orçamento não encontrado.' });
  res.status(204).end();
};
