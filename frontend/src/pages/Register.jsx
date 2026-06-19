import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', email: '', senha: '' });
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await register(form.nome, form.email, form.senha);
      navigate('/');
    } catch (err) {
      setErro(err.response?.data?.error || 'Não foi possível cadastrar.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-4xl">💰</div>
          <h1 className="mt-2 text-2xl font-bold text-brand-700 dark:text-brand-400">My Budget</h1>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4">
          <h2 className="text-lg font-semibold">Criar conta</h2>

          {erro && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{erro}</div>
          )}

          <div>
            <label className="label">Nome</label>
            <input name="nome" className="input" value={form.nome} onChange={onChange} required />
          </div>

          <div>
            <label className="label">E-mail</label>
            <input
              name="email"
              type="email"
              className="input"
              value={form.email}
              onChange={onChange}
              required
            />
          </div>

          <div>
            <label className="label">Senha</label>
            <input
              name="senha"
              type="password"
              className="input"
              value={form.senha}
              onChange={onChange}
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={carregando}>
            {carregando ? 'Criando...' : 'Cadastrar'}
          </button>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Já tem conta?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
