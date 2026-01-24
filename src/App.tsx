import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Sorteios from "./pages/Sorteios";
import SorteioDetail from "./pages/SorteioDetail";
import Raspadinhas from "./pages/Raspadinhas";
import RaspadinhaDetail from "./pages/RaspadinhaDetail";
import Carteira from "./pages/Carteira";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/sorteios" element={<Sorteios />} />
            <Route path="/sorteio/:id" element={<SorteioDetail />} />
            <Route path="/raspadinhas" element={<Raspadinhas />} />
            <Route path="/raspadinha/:id" element={<RaspadinhaDetail />} />
            <Route path="/carteira" element={<ProtectedRoute><Carteira /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
