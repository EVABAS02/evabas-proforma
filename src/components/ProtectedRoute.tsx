import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
