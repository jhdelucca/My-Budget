const db = require('../db/database');

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/**
 * GET /api/dashboard?mes=06&ano=2026
 *
 * Retorna os dados consolidados:
 *  - orcamentos: gasto vs limite, com indicativos de saldo diário e semanal;
 *  - resumo: totais do período;
 *  - centrosCusto: disponível em conta (débito) e limite vs gasto (crédito).
 */
exports.getDashboard = (req, res) => {
  const hoje = new Date();
  const mes = String(req.query.mes || hoje.getMonth() + 1).padStart(2, '0');
  const ano = String(req.query.ano || hoje.getFullYear());

  const mesNum = parseInt(mes, 10);
  const anoNum = parseInt(ano, 10);

  // Quantos dias tem o mês selecionado (dia 0 do mês seguinte = último dia do mês atual).
  const diasNoMes = new Date(anoNum, mesNum, 0).getDate();

  // Se o período selecionado é o mês corrente, os "dias restantes" partem de hoje.
  const ehMesCorrente =
    mesNum === hoje.getMonth() + 1 && anoNum === hoje.getFullYear();
  const diaAtual = ehMesCorrente ? hoje.getDate() : 1;
  const diasRestantes = ehMesCorrente ? diasNoMes - diaAtual + 1 : diasNoMes;

  // -------- Orçamentos do período --------
  const orcamentos = db
    .prepare(
      `SELECT o.id, o.nome_categoria, o.limite_mensal, o.mes, o.ano,
              COALESCE((SELECT SUM(g.valor) FROM Gasto g WHERE g.orcamento_id = o.id), 0) AS total_gasto
       FROM Orcamento o
       WHERE o.usuario_id = ? AND o.mes = ? AND o.ano = ?
       ORDER BY o.nome_categoria`
    )
    .all(req.userId, mes, ano);

  const orcamentosCalculados = orcamentos.map((o) => {
    const saldoRestante = o.limite_mensal - o.total_gasto;
    const saldoDiario = diasRestantes > 0 ? saldoRestante / diasRestantes : 0;
    const saldoSemanal = saldoDiario * Math.min(7, diasRestantes);
    const percentualUsado =
      o.limite_mensal > 0 ? (o.total_gasto / o.limite_mensal) * 100 : 0;

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
      // Quanto ainda dá para gastar por dia / por semana sem estourar o limite.
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
  // Gasto considerado por centro = gastos lançados dentro do mês/ano selecionado.
  const centros = db.prepare('SELECT * FROM CentroCusto WHERE usuario_id = ?').all(req.userId);
  const gastoPorCentroStmt = db.prepare(
    `SELECT COALESCE(SUM(valor), 0) AS gasto
     FROM Gasto
     WHERE centro_custo_id = ?
       AND strftime('%m', data) = ?
       AND strftime('%Y', data) = ?`
  );

  const centrosCusto = centros.map((c) => {
    const { gasto } = gastoPorCentroStmt.get(c.id, mes, ano);
    if (c.tipo === 'Crédito') {
      return {
        id: c.id,
        nome: c.nome,
        tipo: c.tipo,
        limite: round2(c.limite),
        gasto: round2(gasto),
        disponivel: round2(c.limite - gasto),
        percentual_usado: c.limite > 0 ? round2((gasto / c.limite) * 100) : 0,
        estourou: gasto > c.limite,
      };
    }
    // Débito (conta corrente): saldo disponível menos o que já foi gasto.
    return {
      id: c.id,
      nome: c.nome,
      tipo: c.tipo,
      saldo_disponivel: round2(c.saldo_disponivel),
      gasto: round2(gasto),
      disponivel: round2(c.saldo_disponivel - gasto),
    };
  });

  res.json({ resumo, orcamentos: orcamentosCalculados, centrosCusto });
};
