import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationProvider } from "@/hooks/useNotifications";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MobileNav } from "@/components/layout/MobileNav";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { useUserSession } from "@/hooks/useUserSession";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import CadastroIndex from "./pages/cadastro/Index";
import CadastroDadosPessoais from "./pages/cadastro/DadosPessoais";
import CadastroEndereco from "./pages/cadastro/Endereco";
import CadastroConfirmacao from "./pages/cadastro/Confirmacao";
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
import AdminUsuariosOnline from "./pages/admin/UsuariosOnline";
import AdminGanhadores from "./pages/admin/Ganhadores";
import AdminVendas from "./pages/admin/Vendas";
import AdminFinanceiro from "./pages/admin/Financeiro";
import AdminAfiliados from "./pages/admin/Afiliados";
import AdminCompartilhamentos from "./pages/admin/Compartilhamentos";
import AdminPremios from "./pages/admin/Premios";
import AdminRelatorios from "./pages/admin/Relatorios";
import AdminConfiguracoes from "./pages/admin/Configuracoes";
import AdminSupporte from "./pages/admin/Suporte";
import AdminSuporteDetail from "./pages/admin/SuporteDetail";
import AfiliadoDashboard from "./pages/afiliado/Index";
import AfiliadoCadastro from "./pages/afiliado/Cadastro";
import Suporte from "./pages/Suporte";
import SuporteDetail from "./pages/SuporteDetail";
import SorteioAoVivo from "./pages/SorteioAoVivo";
import TermosUso from "./pages/TermosUso";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import NotFound from "./pages/NotFound";

// Component to track user session
function SessionTracker() {
  useUserSession();
  return null;
}

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
            <RegistrationProvider>
              <SessionTracker />
              <ScrollToTop />
              <div className="pb-16 md:pb-0">
                <Routes>
                  {/* Public Game Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  
                  {/* Registration Wizard Routes */}
                  <Route path="/cadastro" element={<CadastroIndex />} />
                  <Route path="/cadastro/dados-pessoais" element={<CadastroDadosPessoais />} />
                  <Route path="/cadastro/endereco" element={<CadastroEndereco />} />
                  <Route path="/cadastro/confirmacao" element={<CadastroConfirmacao />} />
                  
                  {/* Legacy redirect from /auth */}
                  <Route path="/auth" element={<Navigate to="/cadastro" replace />} />
                  
                  <Route path="/sorteios" element={<Sorteios />} />
                  <Route path="/sorteio/:id" element={<SorteioDetail />} />
                  <Route path="/ao-vivo/:id" element={<SorteioAoVivo />} />
                  <Route path="/raspadinhas" element={<Raspadinhas />} />
                  <Route path="/raspadinha/:id" element={<RaspadinhaDetail />} />
                  <Route path="/carteira" element={<ProtectedRoute><Carteira /></ProtectedRoute>} />
                  <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                  <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
                  <Route path="/ganhadores" element={<Ganhadores />} />
                  <Route path="/termos-de-uso" element={<TermosUso />} />
                  <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
                  <Route path="/meus-tickets" element={<ProtectedRoute><MeusTickets /></ProtectedRoute>} />
                  <Route path="/estatisticas" element={<ProtectedRoute><Estatisticas /></ProtectedRoute>} />
                  <Route path="/indicacoes" element={<ProtectedRoute><Indicacoes /></ProtectedRoute>} />
                  <Route path="/suporte" element={<ProtectedRoute><Suporte /></ProtectedRoute>} />
                  <Route path="/suporte/:id" element={<ProtectedRoute><SuporteDetail /></ProtectedRoute>} />
                  
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
                  <Route path="/admin/usuarios-online" element={<ProtectedRoute requireAdmin><AdminUsuariosOnline /></ProtectedRoute>} />
                  <Route path="/admin/ganhadores" element={<ProtectedRoute requireAdmin><AdminGanhadores /></ProtectedRoute>} />
                  <Route path="/admin/relatorios" element={<ProtectedRoute requireAdmin><AdminRelatorios /></ProtectedRoute>} />
                  <Route path="/admin/configuracoes" element={<ProtectedRoute requireAdmin><AdminConfiguracoes /></ProtectedRoute>} />
                  <Route path="/admin/suporte" element={<ProtectedRoute requireAdmin><AdminSupporte /></ProtectedRoute>} />
                  <Route path="/admin/suporte/:id" element={<ProtectedRoute requireAdmin><AdminSuporteDetail /></ProtectedRoute>} />
                  
                  {/* Affiliate Routes */}
                  <Route path="/afiliado" element={<ProtectedRoute><AfiliadoDashboard /></ProtectedRoute>} />
                  <Route path="/afiliado/cadastro" element={<ProtectedRoute><AfiliadoCadastro /></ProtectedRoute>} />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <ConditionalMobileNav />
            </RegistrationProvider>
          </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
