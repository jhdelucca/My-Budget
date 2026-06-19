import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Bloqueia o acesso às páginas internas caso não haja usuário logado.
export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
