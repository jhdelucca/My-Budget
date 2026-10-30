import { useState, useRef, useEffect } from 'react';
import api from '../api/client';

const SUGESTOES = [
  'Gere um relatório dos meus gastos deste mês.',
  'Qual a soma total de despesas de junho?',
  'Em qual categoria eu mais gastei este mês?',
  'Gere um relatório comparando meus cartões de crédito.',
  'Quanto ainda posso gastar para não estourar meus orçamentos?',
];

// ---- Geração do documento (relatório) para impressão / PDF ----
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function tabelaHtml(tabela) {
  if (!tabela || !Array.isArray(tabela.colunas) || !Array.isArray(tabela.linhas)) return '';
  const ths = tabela.colunas
    .map((c, i) => `<th class="${i === 0 ? 'l' : 'r'}">${esc(c)}</th>`)
    .join('');
  const trs = tabela.linhas
    .map((linha) => {
      const tds = (Array.isArray(linha) ? linha : [])
        .map((cel, i) => `<td class="${i === 0 ? 'l' : 'r'}">${esc(cel)}</td>`)
        .join('');
      return `<tr>${tds}</tr>`;
    })
    .join('');
  return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

function secaoHtml(s) {
  const texto = s.texto ? `<p class="sec-texto">${esc(s.texto)}</p>` : '';
  const total = s.total ? `<p class="total">${esc(s.total)}</p>` : '';
  return `<section><h2>${esc(s.titulo || '')}</h2>${texto}${tabelaHtml(s.tabela)}${total}</section>`;
}

function gerarHtmlRelatorio(r) {
  const dataStr = new Date().toLocaleDateString('pt-BR');
  const periodo = r.periodo ? ` &middot; ${esc(r.periodo)}` : '';
  const resumo = r.resumo ? `<div class="resumo">${esc(r.resumo)}</div>` : '';
  const secoes = (r.secoes || []).map(secaoHtml).join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${esc(r.titulo)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; margin: 0; padding: 40px; }
  .top { display: flex; justify-content: space-between; align-items: baseline;
         border-bottom: 3px solid #4f46e5; padding-bottom: 10px; }
  .marca { font-size: 15px; font-weight: 800; color: #4f46e5; letter-spacing: .5px; }
  .data { font-size: 12px; color: #64748b; }
  h1 { font-size: 22px; margin: 18px 0 2px; }
  .periodo { font-size: 13px; color: #64748b; margin-bottom: 16px; }
  .resumo { background: #f1f5f9; border-left: 4px solid #4f46e5; padding: 10px 14px;
            font-size: 13px; border-radius: 4px; margin-bottom: 22px; }
  section { margin-bottom: 24px; page-break-inside: avoid; }
  h2 { font-size: 15px; color: #334155; border-bottom: 1px solid #e2e8f0;
       padding-bottom: 5px; margin: 0 0 10px; }
  .sec-texto { font-size: 13px; margin: 0 0 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
  th { background: #f8fafc; text-align: left; font-weight: 700; color: #475569; }
  th.r, td.r { text-align: right; }
  tbody tr:nth-child(even) { background: #fafafa; }
  .total { text-align: right; font-weight: 700; margin: 8px 0 0; font-size: 13px; }
  footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;
           font-size: 11px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 18mm; } }
</style>
</head>
<body>
  <div class="top">
    <span class="marca">&#128176; MY BUDGET</span>
    <span class="data">Gerado em ${dataStr}</span>
  </div>
  <h1>${esc(r.titulo)}</h1>
  <div class="periodo">${periodo}</div>
  ${resumo}
  ${secoes}
  <footer>Relatório gerado automaticamente pelo My Budget.</footer>
</body>
</html>`;
}

function imprimirRelatorio(r) {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Permita pop-ups neste site para gerar o PDF do relatório.');
    return;
  }
  win.document.write(gerarHtmlRelatorio(r));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 350);
}

export default function Assistente() {
  const [pergunta, setPergunta] = useState('');
  const [mensagens, setMensagens] = useState([]); // {autor, texto?, tipo?, report?, erro?}
  const [carregando, setCarregando] = useState(false);
  const fimRef = useRef(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, carregando]);

  async function enviar(texto) {
    const q = (texto ?? pergunta).trim();
    if (!q || carregando) return;

    setMensagens((m) => [...m, { autor: 'user', texto: q }]);
    setPergunta('');
    setCarregando(true);

    try {
      const { data } = await api.post('/assistente', { pergunta: q });
      if (data.tipo === 'relatorio') {
        setMensagens((m) => [...m, { autor: 'bot', tipo: 'relatorio', report: data }]);
      } else {
        setMensagens((m) => [...m, { autor: 'bot', texto: data.resposta }]);
      }
    } catch (err) {
      const msg =
        err.response?.data?.error || 'Erro ao falar com o assistente. Tente novamente.';
      setMensagens((m) => [...m, { autor: 'bot', texto: msg, erro: true }]);
    } finally {
      setCarregando(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    enviar();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col" style={{ minHeight: 'calc(100vh - 160px)' }}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">🤖 Assistente</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Peça um <strong>relatório</strong> para gerar um PDF imprimível, ou pergunte um valor
          para uma resposta rápida.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {mensagens.length === 0 && (
          <div className="card">
            <p className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">
              Experimente perguntar:
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  onClick={() => enviar(s)}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-left text-sm text-slate-700 transition hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensagens.map((m, i) => {
          if (m.autor === 'bot' && m.tipo === 'relatorio') {
            const r = m.report;
            return (
              <div key={i} className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📄</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
                        Relatório gerado
                      </p>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{r.titulo}</p>
                      {r.periodo && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{r.periodo}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => imprimirRelatorio(r)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
                  >
                    📄 Abrir / Imprimir PDF
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={i} className={`flex ${m.autor === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                  m.autor === 'user'
                    ? 'bg-brand-600 text-white'
                    : m.erro
                    ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                    : 'bg-white text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700'
                }`}
              >
                {m.texto}
              </div>
            </div>
          );
        })}

        {carregando && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
              Pensando…
            </div>
          </div>
        )}
        <div ref={fimRef} />
      </div>

      <form onSubmit={onSubmit} className="sticky bottom-0 mt-4 flex gap-2 bg-transparent py-2">
        <input
          className="input"
          placeholder="Digite sua pergunta..."
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          disabled={carregando}
        />
        <button type="submit" className="btn-primary" disabled={carregando || !pergunta.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}
