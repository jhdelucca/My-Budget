import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await login(email, senha);
      navigate('/');
    } catch (err) {
      setErro(err.response?.data?.error || 'Não foi possível entrar.');
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
          <p className="text-sm text-slate-500 dark:text-slate-400">Controle seus gastos com tranquilidade</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4">
          <h2 className="text-lg font-semibold">Entrar</h2>

          {erro && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{erro}</div>
          )}

          <div>
            <label className="label">E-mail</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Senha</label>
            <input
              type="password"
              className="input"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Não tem conta?{' '}
            <Link to="/cadastro" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
              Cadastre-se
            </Link>
          </p>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
          Conta de teste: demo@mybudget.com / 1234
        </p>
      </div>
    </div>
  );
}
