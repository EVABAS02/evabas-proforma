import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Factures from "./pages/Factures";
import InvoiceForm from "./pages/InvoiceForm";
import InvoiceView from "./pages/InvoiceView";
import Clients from "./pages/Clients";
import Produits from "./pages/Produits";
import Parametres from "./pages/Parametres";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
