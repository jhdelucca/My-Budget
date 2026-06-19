import { useEffect, useState } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import { brl } from '../utils/format';

const vazio = { nome: '', tipo: 'Débito', limite: '', saldo_disponivel: '' };

export default function CentrosCusto() {
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(vazio);
  const [editId, setEditId] = useState(null);
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    const { data } = await api.get('/centros-custo');
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

  function abrirEdicao(c) {
    setForm({
      nome: c.nome,
      tipo: c.tipo,
      limite: c.limite,
      saldo_disponivel: c.saldo_disponivel,
    });
    setEditId(c.id);
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
      if (editId) await api.put(`/centros-custo/${editId}`, form);
      else await api.post('/centros-custo', form);
      setAberto(false);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao salvar.');
    }
  }

  async function excluir(id) {
    if (!confirm('Excluir este centro de custo? Os gastos vinculados também serão removidos.'))
      return;
    await api.delete(`/centros-custo/${id}`);
    carregar();
  }

  const ehCredito = form.tipo === 'Crédito';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Centros de Custo</h1>
        <button className="btn-primary" onClick={abrirNovo}>
          + Novo centro
        </button>
      </div>

      {carregando ? (
        <p className="text-slate-500">Carregando...</p>
      ) : lista.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum centro de custo cadastrado.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((c) => (
            <div key={c.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{c.nome}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.tipo === 'Crédito'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                  }`}
                >
                  {c.tipo}
                </span>
              </div>
              {c.tipo === 'Crédito' ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Limite: <span className="font-medium text-slate-700 dark:text-slate-200">{brl(c.limite)}</span>
                </p>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Saldo: <span className="font-medium text-slate-700 dark:text-slate-200">{brl(c.saldo_disponivel)}</span>
                </p>
              )}
              <div className="flex gap-3 pt-1 text-sm">
                <button className="text-brand-600 hover:underline" onClick={() => abrirEdicao(c)}>
                  Editar
                </button>
                <button className="text-red-600 hover:underline" onClick={() => excluir(c.id)}>
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={aberto}
        title={editId ? 'Editar centro de custo' : 'Novo centro de custo'}
        onClose={() => setAberto(false)}
      >
        <form onSubmit={salvar} className="space-y-4">
          {erro && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>}

          <div>
            <label className="label">Nome</label>
            <input
              name="nome"
              className="input"
              placeholder="Ex: Nubank, Conta Corrente..."
              value={form.nome}
              onChange={onChange}
              required
            />
          </div>

          <div>
            <label className="label">Tipo</label>
            <select name="tipo" className="input" value={form.tipo} onChange={onChange}>
              <option value="Débito">Débito (conta corrente)</option>
              <option value="Crédito">Crédito (cartão)</option>
            </select>
          </div>

          {ehCredito ? (
            <div>
              <label className="label">Limite do cartão (R$)</label>
              <input
                name="limite"
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={form.limite}
                onChange={onChange}
                required
              />
            </div>
          ) : (
            <div>
              <label className="label">Saldo disponível (R$)</label>
              <input
                name="saldo_disponivel"
                type="number"
                step="0.01"
                className="input"
                value={form.saldo_disponivel}
                onChange={onChange}
                required
              />
            </div>
          )}

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
