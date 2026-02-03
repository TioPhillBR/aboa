import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationProvider } from "@/hooks/useNotifications";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MobileNav } from "@/components/layout/MobileNav";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Sorteios from "./pages/Sorteios";
import SorteioDetail from "./pages/SorteioDetail";
import Raspadinhas from "./pages/Raspadinhas";
import RaspadinhaDetail from "./pages/RaspadinhaDetail";
import Carteira from "./pages/Carteira";
import Perfil from "./pages/Perfil";
import Configuracoes from "./pages/Configuracoes";
import Ganhadores from "./pages/Ganhadores";
import MeusTickets from "./pages/MeusTickets";
import Estatisticas from "./pages/Estatisticas";
import Indicacoes from "./pages/Indicacoes";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminSorteios from "./pages/admin/Sorteios";
import AdminRaspadinhas from "./pages/admin/Raspadinhas";
import AdminUsuarios from "./pages/admin/Usuarios";
import AdminGanhadores from "./pages/admin/Ganhadores";
import AdminVendas from "./pages/admin/Vendas";
import AdminFinanceiro from "./pages/admin/Financeiro";
import AdminAfiliados from "./pages/admin/Afiliados";
import AdminCompartilhamentos from "./pages/admin/Compartilhamentos";
import AdminPremios from "./pages/admin/Premios";
import AdminRelatorios from "./pages/admin/Relatorios";
import AfiliadoDashboard from "./pages/afiliado/Index";
import AfiliadoCadastro from "./pages/afiliado/Cadastro";
import SorteioAoVivo from "./pages/SorteioAoVivo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to conditionally render MobileNav (hide on admin routes)
function ConditionalMobileNav() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  if (isAdminRoute) {
    return null;
  }
  
  return <MobileNav />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <NotificationProvider>
            <Toaster />
            <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <div className="pb-16 md:pb-0">
              <Routes>
                {/* Public Game Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/sorteios" element={<Sorteios />} />
                <Route path="/sorteio/:id" element={<SorteioDetail />} />
                <Route path="/ao-vivo/:id" element={<SorteioAoVivo />} />
                <Route path="/raspadinhas" element={<Raspadinhas />} />
                <Route path="/raspadinha/:id" element={<RaspadinhaDetail />} />
                <Route path="/carteira" element={<ProtectedRoute><Carteira /></ProtectedRoute>} />
                <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
                <Route path="/ganhadores" element={<Ganhadores />} />
                <Route path="/meus-tickets" element={<ProtectedRoute><MeusTickets /></ProtectedRoute>} />
                <Route path="/estatisticas" element={<ProtectedRoute><Estatisticas /></ProtectedRoute>} />
                <Route path="/indicacoes" element={<ProtectedRoute><Indicacoes /></ProtectedRoute>} />
                
                {/* Admin Routes - Completely Separate Area */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/vendas" element={<ProtectedRoute requireAdmin><AdminVendas /></ProtectedRoute>} />
                <Route path="/admin/financeiro" element={<ProtectedRoute requireAdmin><AdminFinanceiro /></ProtectedRoute>} />
                <Route path="/admin/sorteios" element={<ProtectedRoute requireAdmin><AdminSorteios /></ProtectedRoute>} />
                <Route path="/admin/raspadinhas" element={<ProtectedRoute requireAdmin><AdminRaspadinhas /></ProtectedRoute>} />
                <Route path="/admin/premios" element={<ProtectedRoute requireAdmin><AdminPremios /></ProtectedRoute>} />
                <Route path="/admin/afiliados" element={<ProtectedRoute requireAdmin><AdminAfiliados /></ProtectedRoute>} />
                <Route path="/admin/compartilhamentos" element={<ProtectedRoute requireAdmin><AdminCompartilhamentos /></ProtectedRoute>} />
                <Route path="/admin/usuarios" element={<ProtectedRoute requireAdmin><AdminUsuarios /></ProtectedRoute>} />
                <Route path="/admin/ganhadores" element={<ProtectedRoute requireAdmin><AdminGanhadores /></ProtectedRoute>} />
                <Route path="/admin/relatorios" element={<ProtectedRoute requireAdmin><AdminRelatorios /></ProtectedRoute>} />
                
                {/* Affiliate Routes */}
                <Route path="/afiliado" element={<ProtectedRoute><AfiliadoDashboard /></ProtectedRoute>} />
                <Route path="/afiliado/cadastro" element={<ProtectedRoute><AfiliadoCadastro /></ProtectedRoute>} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <ConditionalMobileNav />
          </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
