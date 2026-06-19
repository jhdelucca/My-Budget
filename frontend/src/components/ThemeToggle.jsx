import { useTheme } from '../context/ThemeContext';

// Botão que alterna entre claro e escuro (sol / lua).
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const escuro = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 ring-1 ring-slate-300 transition hover:bg-slate-100 dark:text-slate-300 dark:ring-slate-600 dark:hover:bg-slate-700"
      title={escuro ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      aria-label="Alternar tema"
    >
      {escuro ? '☀️' : '🌙'}
    </button>
  );
}
