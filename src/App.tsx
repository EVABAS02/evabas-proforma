import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
// Landing et Auth restent en import direct : ce sont les pages vues par les visiteurs
// non connectés, elles doivent apparaître le plus vite possible (LCP).
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";

// Tout ce qui est derrière l'authentification est chargé à la demande.
// Ça évite qu'un visiteur de la landing page télécharge le code du Dashboard,
// des factures, des graphiques (recharts) etc. avant même de se connecter.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Factures = lazy(() => import("./pages/Factures"));
const InvoiceForm = lazy(() => import("./pages/InvoiceForm"));
const InvoiceView = lazy(() => import("./pages/InvoiceView"));
const Clients = lazy(() => import("./pages/Clients"));
const Produits = lazy(() => import("./pages/Produits"));
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
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/factures" element={<ProtectedRoute><Factures /></ProtectedRoute>} />
              <Route path="/factures/nouveau" element={<ProtectedRoute><InvoiceForm /></ProtectedRoute>} />
              <Route path="/factures/:id" element={<ProtectedRoute><InvoiceView /></ProtectedRoute>} />
              <Route path="/factures/:id/modifier" element={<ProtectedRoute><InvoiceForm /></ProtectedRoute>} />
              <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
              <Route path="/produits" element={<ProtectedRoute><Produits /></ProtectedRoute>} />
              <Route path="/parametres" element={<ProtectedRoute><Parametres /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;