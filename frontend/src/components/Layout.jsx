import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/orcamentos', label: 'Orçamentos' },
  { to: '/centros-custo', label: 'Centros de Custo' },
  { to: '/gastos', label: 'Gastos' },
  { to: '/assistente', label: 'Assistente' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function sair() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <span className="text-lg font-bold text-brand-700 dark:text-brand-400">My Budget</span>
          </div>

          <nav className="hidden gap-1 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 dark:text-slate-400 sm:inline">
              Olá, {user?.nome?.split(' ')[0]}
            </span>
            <ThemeToggle />
            <button onClick={sair} className="btn-secondary">
              Sair
            </button>
          </div>
        </div>

        {/* Navegação para telas pequenas */}
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 dark:border-slate-700 md:hidden">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                    : 'text-slate-600 dark:text-slate-300'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
