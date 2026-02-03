import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  Ticket, 
  Sparkles, 
  Users, 
  Trophy,
  ChevronLeft,
  Shield,
  Menu,
  Bell,
  Settings,
  LogOut,
  Moon,
  Sun,
  ShoppingCart,
  Wallet,
  Gift,
  UserCheck,
  Share2,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/vendas', label: 'Vendas', icon: ShoppingCart },
  { href: '/admin/financeiro', label: 'Financeiro', icon: Wallet },
  { href: '/admin/sorteios', label: 'Sorteios', icon: Ticket },
  { href: '/admin/raspadinhas', label: 'Raspadinhas', icon: Sparkles },
  { href: '/admin/premios', label: 'Prêmios', icon: Gift },
  { href: '/admin/afiliados', label: 'Afiliados', icon: UserCheck },
  { href: '/admin/compartilhamentos', label: 'Compartilhamentos', icon: Share2 },
  { href: '/admin/usuarios', label: 'Usuários', icon: Users },
  { href: '/admin/ganhadores', label: 'Ganhadores', icon: Trophy },
  { href: '/admin/relatorios', label: 'Relatórios', icon: FileText },
];

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const { profile } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Link to="/admin" className="flex items-center gap-3" onClick={onLinkClick}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary rounded-xl blur-md opacity-50" />
            <div className="relative p-2 rounded-xl bg-gradient-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <div>
            <span className="font-bold text-lg">Admin Panel</span>
            <p className="text-xs text-sidebar-foreground/60">Gerenciamento</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-4 px-3">
            Menu Principal
          </p>
          {adminLinks.map((link) => {
            const isActive = link.exact 
              ? location.pathname === link.href
              : location.pathname.startsWith(link.href) && (link.href !== '/admin' || location.pathname === '/admin');

            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={onLinkClick}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <link.icon className={cn("h-5 w-5", isActive && "animate-pulse")} />
                {link.label}
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-primary-foreground animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-8 space-y-2">
          <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-4 px-3">
            Sistema
          </p>
          <Link
            to="/admin/configuracoes"
            onClick={onLinkClick}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
          >
            <Settings className="h-5 w-5" />
            Configurações
          </Link>
        </div>
      </ScrollArea>

      {/* User Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-sidebar-accent/50">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
              {profile?.full_name?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{profile?.full_name}</p>
            <p className="text-xs text-sidebar-foreground/60 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Administrador
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, isAdmin, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-destructive/20 rounded-full blur-2xl" />
            <div className="relative p-6 rounded-full bg-destructive/10">
              <Shield className="h-16 w-16 text-destructive" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-6">
            Você não tem permissão para acessar o painel administrativo. Entre em contato com um administrador se precisar de acesso.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link to="/">
              <ChevronLeft className="h-4 w-4" />
              Voltar ao Início
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden lg:block h-screen w-72 border-r border-sidebar-border bg-sidebar-background">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-full items-center justify-between px-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-sidebar-background">
              <SidebarContent onLinkClick={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">Admin</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {profile?.full_name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                {theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Top Bar - Desktop */}
      <header className="hidden lg:flex fixed top-0 left-72 right-0 z-30 h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-8">
        <div>
          {/* Breadcrumb could go here */}
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-3 pr-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {profile?.full_name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">Admin</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-72 pt-16">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
