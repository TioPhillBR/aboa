import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wallet, User, LogOut, Settings, Ticket, LayoutDashboard, Menu, Trophy, Gift } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import logoABoa from '@/assets/logo-a-boa.png';

export function Header() {
  const { user, profile, isAdmin, signOut, isLoading } = useAuth();
  const { balance, bonusBalance } = useWallet();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img 
            src={logoABoa} 
            alt="A Boa - Vai na Certa, Vai na Boa" 
            className="h-10 md:h-12 w-auto"
          />
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link 
            to="/sorteios" 
            className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
          >
            Sorteios
          </Link>
          <Link 
            to="/raspadinhas" 
            className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
          >
            Raspadinhas
          </Link>
          <Link 
            to="/ganhadores" 
            className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
          >
            Ganhadores
          </Link>
        </nav>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Notifications */}
          {user && <NotificationCenter />}
          {isLoading ? (
            <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
          ) : user && profile ? (
            <>
              {/* Saldo da Carteira */}
              <Link to="/carteira" className="hidden sm:flex items-center gap-1">
                <Button variant="outline" size="sm" className="gap-2 font-semibold">
                  <Wallet className="h-4 w-4" />
                  <span>R$ {balance.toFixed(2)}</span>
                </Button>
                {bonusBalance > 0 && (
                  <Button variant="ghost" size="sm" className="gap-1 text-primary font-semibold px-2">
                    <Gift className="h-4 w-4" />
                    <span>+R$ {bonusBalance.toFixed(2)}</span>
                  </Button>
                )}
              </Link>

              {/* Menu do Usuário */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                      <AvatarFallback className="bg-gradient-primary text-white text-sm">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{profile.full_name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link to="/carteira" className="flex items-center">
                      <Wallet className="mr-2 h-4 w-4" />
                      Carteira
                      <span className="ml-auto text-xs text-muted-foreground">
                        R$ {balance.toFixed(2)}
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/meus-tickets" className="flex items-center">
                      <Ticket className="mr-2 h-4 w-4" />
                      Meus Tickets
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/perfil" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/configuracoes" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>

                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center text-primary">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Painel Admin
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild className="hidden sm:flex">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild className="hidden sm:flex bg-gradient-primary hover:opacity-90">
                <Link to="/cadastro">Cadastrar</Link>
              </Button>
              <Button asChild className="sm:hidden bg-gradient-primary hover:opacity-90">
                <Link to="/login">Entrar</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                <Link 
                  to="/sorteios" 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <Ticket className="h-5 w-5 text-primary" />
                  <span className="font-medium">Sorteios</span>
                </Link>
                <Link 
                  to="/raspadinhas" 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <span className="text-xl">✨</span>
                  <span className="font-medium">Raspadinhas</span>
                </Link>
                <Link 
                  to="/ganhadores" 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <Trophy className="h-5 w-5 text-warning" />
                  <span className="font-medium">Ganhadores</span>
                </Link>
                {!user && (
                  <>
                    <div className="h-px bg-border my-2" />
                    <Link 
                      to="/login" 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors"
                    >
                      <User className="h-5 w-5" />
                      <span className="font-medium">Entrar</span>
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
