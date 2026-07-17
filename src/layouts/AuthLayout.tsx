import { Outlet, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// Ce layout regroupe toutes les routes qui ont besoin de savoir si l'utilisateur
// est connecté (Auth, Dashboard, Factures, etc.). Comme ce fichier est chargé en
// lazy() depuis App.tsx, Supabase (le plus gros contributeur au JS inutilisé sur
// la landing page, ~115 Kio) n'est téléchargé que si quelqu'un navigue vers une
// de ces pages — jamais pour un simple visiteur de la page d'accueil.
export default function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

// Utilisé pour les routes qui exigent une session active (Dashboard, Factures...).
// Regroupé ici plutôt que dans un fichier séparé importé par App.tsx, pour que
// useAuth (et donc Supabase) ne soit jamais atteint depuis le bundle principal.
export function RequireAuth() {
  const { session, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}