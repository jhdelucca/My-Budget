import { useEffect, useState } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import { brl, MESES, nomeMes } from '../utils/format';

const hoje = new Date();
const vazio = {
  nome_categoria: '',
  limite_mensal: '',
  mes: String(hoje.getMonth() + 1).padStart(2, '0'),
  ano: String(hoje.getFullYear()),
};

export default function Orcamentos() {
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(vazio);
  const [editId, setEditId] = useState(null);
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    const { data } = await api.get('/orcamentos');
    setLista(data);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirNovo() {
    setForm(vazio);
    setEditId(null);
    setErro('');
    setAberto(true);
  }

  function abrirEdicao(o) {
    setForm({
      nome_categoria: o.nome_categoria,
      limite_mensal: o.limite_mensal,
      mes: o.mes,
      ano: o.ano,
    });
    setEditId(o.id);
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
      if (editId) {
        await api.put(`/orcamentos/${editId}`, form);
      } else {
        await api.post('/orcamentos', form);
      }
      setAberto(false);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao salvar.');
    }
  }

  async function excluir(id) {
    if (!confirm('Excluir este orçamento? Os gastos vinculados também serão removidos.')) return;
    await api.delete(`/orcamentos/${id}`);
    carregar();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orçamentos</h1>
        <button className="btn-primary" onClick={abrirNovo}>
          + Novo orçamento
        </button>
      </div>

      {carregando ? (
        <p className="text-slate-500">Carregando...</p>
      ) : lista.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum orçamento cadastrado ainda.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-700/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Período</th>
                <th className="px-4 py-3 text-right">Limite mensal</th>
                <th className="px-4 py-3 text-right">Gasto</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {lista.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-medium">{o.nome_categoria}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {nomeMes(o.mes)}/{o.ano}
                  </td>
                  <td className="px-4 py-3 text-right">{brl(o.limite_mensal)}</td>
                  <td className="px-4 py-3 text-right">{brl(o.total_gasto)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="mr-2 text-brand-600 hover:underline"
                      onClick={() => abrirEdicao(o)}
                    >
                      Editar
                    </button>
                    <button className="text-red-600 hover:underline" onClick={() => excluir(o.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={aberto}
        title={editId ? 'Editar orçamento' : 'Novo orçamento'}
        onClose={() => setAberto(false)}
      >
        <form onSubmit={salvar} className="space-y-4">
          {erro && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>}

          <div>
            <label className="label">Categoria</label>
            <input
              name="nome_categoria"
              className="input"
              placeholder="Ex: Alimentação, Transporte..."
              value={form.nome_categoria}
              onChange={onChange}
              required
            />
          </div>

          <div>
            <label className="label">Limite mensal (R$)</label>
            <input
              name="limite_mensal"
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={form.limite_mensal}
              onChange={onChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Mês</label>
              <select name="mes" className="input" value={form.mes} onChange={onChange}>
                {MESES.map((m) => (
                  <option key={m.valor} value={m.valor}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Ano</label>
              <input name="ano" className="input" value={form.ano} onChange={onChange} required />
            </div>
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
