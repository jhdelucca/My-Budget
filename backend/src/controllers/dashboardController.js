const { query } = require('../db/database');

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/**
 * GET /api/dashboard?mes=06&ano=2026
 * Retorna dados consolidados: orçamentos (gasto vs limite + saldo diário/semanal),
 * resumo do período e centros de custo (débito/crédito).
 */
exports.getDashboard = async (req, res) => {
  const hoje = new Date();
  const mes = String(req.query.mes || hoje.getMonth() + 1).padStart(2, '0');
  const ano = String(req.query.ano || hoje.getFullYear());

  const mesNum = parseInt(mes, 10);
  const anoNum = parseInt(ano, 10);

  // Último dia do mês selecionado.
  const diasNoMes = new Date(anoNum, mesNum, 0).getDate();

  const ehMesCorrente = mesNum === hoje.getMonth() + 1 && anoNum === hoje.getFullYear();
  const diaAtual = ehMesCorrente ? hoje.getDate() : 1;
  const diasRestantes = ehMesCorrente ? diasNoMes - diaAtual + 1 : diasNoMes;

  // -------- Orçamentos do período --------
  const orcRes = await query(
    `SELECT o.id, o.nome_categoria, o.limite_mensal, o.mes, o.ano,
            COALESCE((SELECT SUM(g.valor) FROM gasto g WHERE g.orcamento_id = o.id), 0) AS total_gasto
     FROM orcamento o
     WHERE o.usuario_id = $1 AND o.mes = $2 AND o.ano = $3
     ORDER BY o.nome_categoria`,
    [req.userId, mes, ano]
  );
  const orcamentos = orcRes.rows.map((r) => ({
    ...r,
    limite_mensal: Number(r.limite_mensal),
    total_gasto: Number(r.total_gasto),
  }));

  const orcamentosCalculados = orcamentos.map((o) => {
    const saldoRestante = o.limite_mensal - o.total_gasto;
    const saldoDiario = diasRestantes > 0 ? saldoRestante / diasRestantes : 0;
    const saldoSemanal = saldoDiario * Math.min(7, diasRestantes);
    const percentualUsado = o.limite_mensal > 0 ? (o.total_gasto / o.limite_mensal) * 100 : 0;

    return {
      id: o.id,
      nome_categoria: o.nome_categoria,
      mes: o.mes,
      ano: o.ano,
      limite_mensal: round2(o.limite_mensal),
      total_gasto: round2(o.total_gasto),
      saldo_restante: round2(saldoRestante),
      percentual_usado: round2(percentualUsado),
      estourou: o.total_gasto > o.limite_mensal,
      saldo_diario_sugerido: round2(Math.max(saldoDiario, 0)),
      saldo_semanal_sugerido: round2(Math.max(saldoSemanal, 0)),
    };
  });

  // -------- Resumo do período --------
  const totalLimite = orcamentos.reduce((s, o) => s + o.limite_mensal, 0);
  const totalGasto = orcamentos.reduce((s, o) => s + o.total_gasto, 0);
  const saldoTotal = totalLimite - totalGasto;

  const resumo = {
    mes,
    ano,
    dias_no_mes: diasNoMes,
    dias_restantes: diasRestantes,
    total_limite: round2(totalLimite),
    total_gasto: round2(totalGasto),
    saldo_total: round2(saldoTotal),
    percentual_usado: totalLimite > 0 ? round2((totalGasto / totalLimite) * 100) : 0,
    saldo_diario_sugerido: round2(diasRestantes > 0 ? Math.max(saldoTotal / diasRestantes, 0) : 0),
    saldo_semanal_sugerido: round2(
      diasRestantes > 0 ? Math.max((saldoTotal / diasRestantes) * Math.min(7, diasRestantes), 0) : 0
    ),
  };

  // -------- Centros de custo --------
  const centrosRes = await query('SELECT * FROM centrocusto WHERE usuario_id = $1', [req.userId]);

  const centrosCusto = await Promise.all(
    centrosRes.rows.map(async (c) => {
      const g = await query(
        `SELECT COALESCE(SUM(valor), 0) AS gasto
         FROM gasto
         WHERE centro_custo_id = $1
           AND to_char(data, 'MM') = $2
           AND to_char(data, 'YYYY') = $3`,
        [c.id, mes, ano]
      );
      const gasto = Number(g.rows[0].gasto);
      const limite = Number(c.limite);
      const saldo = Number(c.saldo_disponivel);

      if (c.tipo === 'Crédito') {
        return {
          id: c.id,
          nome: c.nome,
          tipo: c.tipo,
          limite: round2(limite),
          gasto: round2(gasto),
          disponivel: round2(limite - gasto),
          percentual_usado: limite > 0 ? round2((gasto / limite) * 100) : 0,
          estourou: gasto > limite,
        };
      }
      return {
        id: c.id,
        nome: c.nome,
        tipo: c.tipo,
        saldo_disponivel: round2(saldo),
        gasto: round2(gasto),
        disponivel: round2(saldo - gasto),
      };
    })
  );

  res.json({ resumo, orcamentos: orcamentosCalculados, centrosCusto });
};
