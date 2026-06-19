import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

function temaInicial() {
  const salvo = localStorage.getItem('mb_theme');
  if (salvo === 'dark' || salvo === 'light') return salvo;
  // Sem preferência salva: segue o tema do sistema operacional.
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(temaInicial);

  // Sempre que o tema muda, reflete na tag <html> e salva a preferência.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('mb_theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
