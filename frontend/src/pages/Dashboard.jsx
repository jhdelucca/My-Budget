import { useEffect, useState } from 'react';
import api from '../api/client';
import ProgressBar from '../components/ProgressBar';
import { brl, MESES, nomeMes } from '../utils/format';

const hoje = new Date();
const anoAtual = hoje.getFullYear();
const anos = [anoAtual - 1, anoAtual, anoAtual + 1].map(String);

export default function Dashboard() {
  const [mes, setMes] = useState(String(hoje.getMonth() + 1).padStart(2, '0'));
  const [ano, setAno] = useState(String(anoAtual));
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    api
      .get('/dashboard', { params: { mes, ano } })
      .then((res) => setDados(res.data))
      .finally(() => setCarregando(false));
  }, [mes, ano]);

  const resumo = dados?.resumo;
  const orcamentos = dados?.orcamentos || [];
  const centros = dados?.centrosCusto || [];
  const debitos = centros.filter((c) => c.tipo === 'Débito');
  const creditos = centros.filter((c) => c.tipo === 'Crédito');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <select className="input w-auto" value={mes} onChange={(e) => setMes(e.target.value)}>
            {MESES.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.nome}
              </option>
            ))}
          </select>
          <select className="input w-auto" value={ano} onChange={(e) => setAno(e.target.value)}>
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {carregando && <p className="text-slate-500 dark:text-slate-400">Carregando...</p>}

      {!carregando && resumo && (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ResumoCard
              titulo="Limite total"
              valor={brl(resumo.total_limite)}
              cor="text-slate-800 dark:text-slate-100"
            />
            <ResumoCard titulo="Total gasto" valor={brl(resumo.total_gasto)} cor="text-red-600 dark:text-red-400" />
            <ResumoCard
              titulo="Saldo restante"
              valor={brl(resumo.saldo_total)}
              cor={resumo.saldo_total < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}
            />
            <ResumoCard
              titulo={`Pode gastar/dia (${resumo.dias_restantes}d restantes)`}
              valor={brl(resumo.saldo_diario_sugerido)}
              cor="text-brand-700 dark:text-brand-400"
              sub={`~ ${brl(resumo.saldo_semanal_sugerido)} por semana`}
            />
          </div>

          {/* Orçamentos */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">
              Orçamentos · {nomeMes(mes)}/{ano}
            </h2>
            {orcamentos.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nenhum orçamento neste período. Cadastre em “Orçamentos”.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {orcamentos.map((o) => (
                  <div key={o.id} className="card space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{o.nome_categoria}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          o.estourou
                            ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                        }`}
                      >
                        {o.percentual_usado.toFixed(0)}%
                      </span>
                    </div>

                    <ProgressBar percent={o.percentual_usado} />

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Gasto</span>
                      <span className="font-medium">{brl(o.total_gasto)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Limite</span>
                      <span className="font-medium">{brl(o.limite_mensal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Saldo</span>
                      <span
                        className={`font-semibold ${
                          o.saldo_restante < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {brl(o.saldo_restante)}
                      </span>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-700/50 dark:text-slate-300">
                      Para não estourar, gaste até{' '}
                      <strong className="text-slate-800 dark:text-slate-100">{brl(o.saldo_diario_sugerido)}/dia</strong>{' '}
                      ou <strong className="text-slate-800 dark:text-slate-100">{brl(o.saldo_semanal_sugerido)}/semana</strong>.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Centros de custo */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h2 className="mb-3 text-lg font-semibold">Contas (Débito)</h2>
              {debitos.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma conta cadastrada.</p>
              ) : (
                <div className="space-y-3">
                  {debitos.map((c) => (
                    <div key={c.id} className="card">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{c.nome}</h3>
                        <span className="text-sm text-slate-500 dark:text-slate-400">Conta corrente</span>
                      </div>
                      <div className="mt-2 flex items-end justify-between">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Disponível</p>
                          <p
                            className={`text-xl font-bold ${
                              c.disponivel < 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {brl(c.disponivel)}
                          </p>
                        </div>
                        <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                          <p>Saldo inicial: {brl(c.saldo_disponivel)}</p>
                          <p>Gasto no mês: {brl(c.gasto)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold">Cartões (Crédito)</h2>
              {creditos.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum cartão cadastrado.</p>
              ) : (
                <div className="space-y-3">
                  {creditos.map((c) => (
                    <div key={c.id} className="card space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{c.nome}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            c.estourou
                              ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {c.percentual_usado.toFixed(0)}%
                        </span>
                      </div>
                      <ProgressBar percent={c.percentual_usado} />
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Fatura (mês)</span>
                        <span className="font-medium">{brl(c.gasto)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Limite</span>
                        <span className="font-medium">{brl(c.limite)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Limite disponível</span>
                        <span
                          className={`font-semibold ${
                            c.disponivel < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {brl(c.disponivel)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function ResumoCard({ titulo, valor, cor, sub }) {
  return (
    <div className="card">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{titulo}</p>
      <p className={`mt-1 text-2xl font-bold ${cor}`}>{valor}</p>
      {sub && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}
