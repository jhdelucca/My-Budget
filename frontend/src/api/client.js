import axios from 'axios';

// Em desenvolvimento, o Vite faz proxy de /api -> http://localhost:3001
const api = axios.create({ baseURL: '/api' });

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
