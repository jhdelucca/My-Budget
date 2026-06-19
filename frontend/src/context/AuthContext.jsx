import { createContext, useContext, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('mb_user');
    return raw ? JSON.parse(raw) : null;
  });

  function persist(token, usuario) {
    localStorage.setItem('mb_token', token);
    localStorage.setItem('mb_user', JSON.stringify(usuario));
    setUser(usuario);
  }

  async function login(email, senha) {
    const { data } = await api.post('/auth/login', { email, senha });
    persist(data.token, data.usuario);
  }

  async function register(nome, email, senha) {
    const { data } = await api.post('/auth/register', { nome, email, senha });
    persist(data.token, data.usuario);
  }

  function logout() {
    localStorage.removeItem('mb_token');
    localStorage.removeItem('mb_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
