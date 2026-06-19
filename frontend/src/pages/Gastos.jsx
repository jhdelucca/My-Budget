import { useEffect, useState } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import { brl, dataBR } from '../utils/format';

const hojeISO = new Date().toISOString().slice(0, 10);
const vazio = {
  nome_gasto: '',
  valor: '',
  data: hojeISO,
  orcamento_id: '',
  centro_custo_id: '',
};

export default function Gastos() {
  const [lista, setLista] = useState([]);
  const [orcamentos, setOrcamentos] = useState([]);
  const [centros, setCentros] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // filtros / ordenação
  const [busca, setBusca] = useState('');
  const [filtroOrcamento, setFiltroOrcamento] = useState('');
  const [filtroCentro, setFiltroCentro] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('data');
  const [ordem, setOrdem] = useState('desc');

  // modal
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(vazio);
  const [editId, setEditId] = useState(null);
  const [erro, setErro] = useState('');

  async function carregarAuxiliares() {
    const [o, c] = await Promise.all([api.get('/orcamentos'), api.get('/centros-custo')]);
    setOrcamentos(o.data);
    setCentros(c.data);
  }

  async function carregarGastos() {
    setCarregando(true);
    const params = { ordenarPor, ordem };
    if (busca) params.busca = busca;
    if (filtroOrcamento) params.orcamento_id = filtroOrcamento;
    if (filtroCentro) params.centro_custo_id = filtroCentro;
    const { data } = await api.get('/gastos', { params });
    setLista(data);
    setCarregando(false);
  }

  useEffect(() => {
    carregarAuxiliares();
  }, []);

  useEffect(() => {
    const t = setTimeout(carregarGastos, 250); // debounce da busca
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, filtroOrcamento, filtroCentro, ordenarPor, ordem]);

  function abrirNovo() {
    setForm(vazio);
    setEditId(null);
    setErro('');
    setAberto(true);
  }

  function abrirEdicao(g) {
    setForm({
      nome_gasto: g.nome_gasto,
      valor: g.valor,
      data: g.data,
      orcamento_id: g.orcamento_id,
      centro_custo_id: g.centro_custo_id,
    });
    setEditId(g.id);
    setErro('');
    setAberto(true);
  }

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      if (editId) await api.put(`/gastos/${editId}`, form);
      else await api.post('/gastos', form);
      setAberto(false);
      carregarGastos();
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao salvar.');
    }
  }

  async function excluir(id) {
    if (!confirm('Excluir este gasto?')) return;
    await api.delete(`/gastos/${id}`);
    carregarGastos();
  }

  function alternarOrdenacao(coluna) {
    if (ordenarPor === coluna) {
      setOrdem(ordem === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenarPor(coluna);
      setOrdem('desc');
    }
  }

  const seta = (coluna) => (ordenarPor === coluna ? (ordem === 'asc' ? ' ▲' : ' ▼') : '');
  const total = lista.reduce((s, g) => s + g.valor, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gastos</h1>
        <button className="btn-primary" onClick={abrirNovo} disabled={orcamentos.length === 0 || centros.length === 0}>
          + Lançar gasto
        </button>
      </div>

      {(orcamentos.length === 0 || centros.length === 0) && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          Para lançar gastos, cadastre ao menos um orçamento e um centro de custo.
        </div>
      )}

      {/* Filtros */}
      <div className="card grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className="input"
          placeholder="Buscar por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select className="input" value={filtroOrcamento} onChange={(e) => setFiltroOrcamento(e.target.value)}>
          <option value="">Todos os orçamentos</option>
          {orcamentos.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome_categoria} ({o.mes}/{o.ano})
            </option>
          ))}
        </select>
        <select className="input" value={filtroCentro} onChange={(e) => setFiltroCentro(e.target.value)}>
          <option value="">Todos os centros</option>
          {centros.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <div className="flex items-center justify-end text-sm text-slate-500 dark:text-slate-400">
          Total: <span className="ml-2 text-base font-semibold text-slate-800 dark:text-slate-100">{brl(total)}</span>
        </div>
      </div>

      {carregando ? (
        <p className="text-slate-500">Carregando...</p>
      ) : lista.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum gasto encontrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-700/50 dark:text-slate-400">
              <tr>
                <th className="cursor-pointer px-4 py-3 select-none" onClick={() => alternarOrdenacao('nome_gasto')}>
                  Gasto{seta('nome_gasto')}
                </th>
                <th className="px-4 py-3">Orçamento</th>
                <th className="px-4 py-3">Centro</th>
                <th className="cursor-pointer px-4 py-3 select-none" onClick={() => alternarOrdenacao('data')}>
                  Data{seta('data')}
                </th>
                <th className="cursor-pointer px-4 py-3 text-right select-none" onClick={() => alternarOrdenacao('valor')}>
                  Valor{seta('valor')}
                </th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {lista.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-medium">{g.nome_gasto}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{g.orcamento_nome}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{g.centro_nome}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{dataBR(g.data)}</td>
                  <td className="px-4 py-3 text-right font-medium">{brl(g.valor)}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="mr-2 text-brand-600 hover:underline" onClick={() => abrirEdicao(g)}>
                      Editar
                    </button>
                    <button className="text-red-600 hover:underline" onClick={() => excluir(g.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={aberto} title={editId ? 'Editar gasto' : 'Lançar gasto'} onClose={() => setAberto(false)}>
        <form onSubmit={salvar} className="space-y-4">
          {erro && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>}

          <div>
            <label className="label">Descrição do gasto</label>
            <input
              name="nome_gasto"
              className="input"
              placeholder='Ex: "Viagem de Uber 21/05"'
              value={form.nome_gasto}
              onChange={onChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor (R$)</label>
              <input
                name="valor"
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={form.valor}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label className="label">Data</label>
              <input name="data" type="date" className="input" value={form.data} onChange={onChange} required />
            </div>
          </div>

          <div>
            <label className="label">Orçamento</label>
            <select name="orcamento_id" className="input" value={form.orcamento_id} onChange={onChange} required>
              <option value="">Selecione...</option>
              {orcamentos.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome_categoria} ({o.mes}/{o.ano})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Centro de custo</label>
            <select name="centro_custo_id" className="input" value={form.centro_custo_id} onChange={onChange} required>
              <option value="">Selecione...</option>
              {centros.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.tipo})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setAberto(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
