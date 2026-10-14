import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// Seule Landing reste en import direct : c'est la seule page qu'un visiteur
// voit sans avoir cliqué sur rien, elle doit s'afficher le plus vite possible.
// Auth utilise useAuth (donc Supabase) : elle doit être lazy comme le reste,
// sinon Supabase revient dans le bundle principal par la porte de derrière.
import Landing from "./pages/Landing";
const Auth = lazy(() => import("./pages/Auth"));

// AuthLayout regroupe AuthProvider (donc Supabase) et n'est chargé que si on
// navigue vers une route qui en a besoin — jamais pour la Landing seule.
// RequireAuth (garde d'accès) vit dans le même fichier pour éviter tout import
// de useAuth/Supabase ailleurs dans le bundle principal.
const AuthLayout = lazy(() => import("./layouts/AuthLayout"));
const RequireAuth = lazy(() =>
  import("./layouts/AuthLayout").then((m) => ({ default: m.RequireAuth }))
);

// Tout ce qui est derrière l'authentification est chargé à la demande.
// Ça évite qu'un visiteur de la landing page télécharge le code du Dashboard,
// des factures, des graphiques (recharts), et surtout Supabase (~115 Kio),
// avant même de se connecter.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Factures = lazy(() => import("./pages/Factures"));
const InvoiceForm = lazy(() => import("./pages/InvoiceForm"));
const InvoiceView = lazy(() => import("./pages/InvoiceView"));
const Clients = lazy(() => import("./pages/Clients"));
const Produits = lazy(() => import("./pages/Produits"));
const Assistant = lazy(() => import("./pages/Assistant"));
const Parametres = lazy(() => import("./pages/Parametres"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Landing : aucun besoin de savoir si l'utilisateur est connecté,
                donc pas de AuthProvider ici, donc pas de Supabase téléchargé. */}
            <Route path="/" element={<Landing />} />

            {/* Routes publiques mais qui doivent quand même connaître l'état
                de connexion (ex: rediriger si déjà connecté). Supabase se
                charge ici, uniquement quand on visite ces pages. */}
            <Route element={<AuthLayout />}>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/login" element={<Navigate to="/auth" replace />} />

              {/* Routes protégées : en plus d'AuthProvider, RequireAuth vérifie
                  la session et redirige vers /login si absente. */}
              <Route element={<RequireAuth />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/factures" element={<Factures />} />
                <Route path="/factures/nouveau" element={<InvoiceForm />} />
                <Route path="/factures/:id" element={<InvoiceView />} />
                <Route path="/factures/:id/modifier" element={<InvoiceForm />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/produits" element={<Produits />} />
                <Route path="/assistant" element={<Assistant />} />
                <Route path="/parametres" element={<Parametres />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;