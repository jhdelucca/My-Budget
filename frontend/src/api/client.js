import axios from 'axios';

// Em desenvolvimento (sem VITE_API_URL), usa /api e o Vite faz proxy p/ :3001.
// Em produção (frontend separado, ex.: Vercel), defina VITE_API_URL com a URL
// pública do backend, ex.: https://meu-backend.onrender.com/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Injeta o token JWT (se houver) em toda requisição.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Se o token expirar/for inválido, derruba a sessão.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('mb_token');
      localStorage.removeItem('mb_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
