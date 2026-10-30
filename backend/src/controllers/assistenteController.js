const { query } = require('../db/database');

// Modelo usado pelo assistente (configurável por variável de ambiente).
const MODELO = process.env.ASSISTENTE_MODELO || 'claude-haiku-5-5';

// Cliente da Anthropic criado sob demanda (lê ANTHROPIC_API_KEY do ambiente).
let _client = null;
function getClient() {
  if (_client) return _client;
  const SDK = require('@anthropic-ai/sdk');
  const Anthropic = SDK.default || SDK;
  _client = new Anthropic();
  return _client;
}

// Reúne os dados financeiros do usuário logado para dar contexto à IA.
async function coletarDados(userId) {
  const orcamentos = (
    await query(
      `SELECT o.id, o.nome_categoria, o.limite_mensal, o.mes, o.ano,
              COALESCE((SELECT SUM(g.valor) FROM gasto g WHERE g.orcamento_id = o.id), 0) AS total_gasto
       FROM orcamento o
       WHERE o.usuario_id = $1
       ORDER BY o.ano DESC, o.mes DESC`,
      [userId]
    )
  ).rows;

  const centros_custo = (
    await query(
      `SELECT id, nome, tipo, limite, saldo_disponivel
       FROM centrocusto WHERE usuario_id = $1 ORDER BY tipo, nome`,
      [userId]
    )
  ).rows;

  // Limita a 1000 gastos mais recentes para não estourar o contexto/custo.
  const gastos = (
    await query(
      `SELECT g.nome_gasto, g.valor, g.data,
              o.nome_categoria AS orcamento, o.mes, o.ano,
              c.nome AS centro_custo, c.tipo AS centro_tipo
       FROM gasto g
       JOIN orcamento   o ON o.id = g.orcamento_id
       JOIN centrocusto c ON c.id = g.centro_custo_id
       WHERE o.usuario_id = $1
       ORDER BY g.data DESC
       LIMIT 1000`,
      [userId]
    )
  ).rows;

  return { orcamentos, centros_custo, gastos };
}

// Extrai e valida o JSON retornado pela IA. Se falhar, trata como resposta simples.
function interpretarSaida(textoBruto) {
  let t = textoBruto.trim();

  // Remove cercas de código (```json ... ```), se vierem.
  const cerca = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (cerca) t = cerca[1].trim();

  // Recorta do primeiro "{" ao último "}".
  const ini = t.indexOf('{');
  const fim = t.lastIndexOf('}');
  if (ini !== -1 && fim !== -1) t = t.slice(ini, fim + 1);

  try {
    const obj = JSON.parse(t);
    if (obj && obj.tipo === 'relatorio') {
      return {
        tipo: 'relatorio',
        titulo: String(obj.titulo || 'Relatório financeiro'),
        periodo: obj.periodo ? String(obj.periodo) : '',
        resumo: obj.resumo ? String(obj.resumo) : '',
        secoes: Array.isArray(obj.secoes) ? obj.secoes : [],
      };
    }
    if (obj && typeof obj.resposta === 'string') {
      return { tipo: 'resposta', resposta: obj.resposta };
    }
  } catch {
    // cai no fallback abaixo
  }
  // Fallback: devolve o texto cru como resposta simples.
  return { tipo: 'resposta', resposta: textoBruto || 'Não consegui gerar uma resposta.' };
}

// POST /api/assistente  { pergunta: string }
exports.perguntar = async (req, res) => {
  const pergunta = String(req.body.pergunta || '').trim();
  if (!pergunta) return res.status(400).json({ error: 'Envie uma pergunta.' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: 'Assistente não configurado: defina ANTHROPIC_API_KEY no servidor.',
    });
  }

  const dados = await coletarDados(req.userId);
  const hoje = new Date().toISOString().slice(0, 10);

  const sistema = [
    'Você é o assistente financeiro do aplicativo "My Budget".',
    'Escreva todos os textos em português do Brasil.',
    'Use SOMENTE os dados fornecidos do usuário (orçamentos, centros de custo e gastos).',
    'Nunca invente valores. Se faltar dado, diga que não há dados suficientes.',
    'Valores monetários sempre em reais, no formato "R$ 1.234,56".',
    'Interprete meses por nome ou número (ex.: "junho" equivale ao mês 06).',
    '',
    'RESPONDA SEMPRE COM UM ÚNICO OBJETO JSON VÁLIDO, sem nenhum texto fora dele e sem crases/```.',
    '',
    'Se o usuário pedir um RELATÓRIO, extrato ou documento, use este formato:',
    '{"tipo":"relatorio","titulo":"...","periodo":"...","resumo":"...","secoes":[{"titulo":"...","texto":"(opcional)","tabela":{"colunas":["Coluna A","Coluna B"],"linhas":[["v1","v2"]]},"total":"(opcional, ex: Total: R$ 555,10)"}]}',
    'Monte tabelas de verdade (colunas e linhas), organize por categoria e/ou mês, e inclua totais quando fizer sentido. O "texto" e o "total" de cada seção são opcionais; a "tabela" é opcional mas recomendada em relatórios.',
    '',
    'Se for uma PERGUNTA PONTUAL (uma soma, um valor, uma dúvida rápida), use este formato:',
    '{"tipo":"resposta","resposta":"texto curto e direto, em uma ou poucas linhas"}',
    '',
    `A data de hoje é ${hoje}.`,
  ].join('\n');

  const conteudoUsuario =
    `Pergunta do usuário:\n"${pergunta}"\n\n` +
    `Dados financeiros do usuário (JSON):\n${JSON.stringify(dados)}`;

  try {
    const resp = await getClient().messages.create({
      model: MODELO,
      max_tokens: 4000,
      system: sistema,
      messages: [{ role: 'user', content: conteudoUsuario }],
    });

    const textoBruto = resp.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    res.json(interpretarSaida(textoBruto));
  } catch (err) {
    console.error('Erro no assistente:', err?.message || err);
    if (err && err.status === 401) {
      return res.status(401).json({ error: 'Chave da API inválida (ANTHROPIC_API_KEY).' });
    }
    res.status(502).json({ error: 'Não foi possível falar com o assistente agora. Tente novamente.' });
  }
};
