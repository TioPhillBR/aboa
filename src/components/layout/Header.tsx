import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useAffiliates } from '@/hooks/useAffiliates';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wallet, User, LogOut, Settings, Ticket, Menu, Trophy, Gift, Users } from 'lucide-react';
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
  const { user, profile, signOut, isLoading, isAffiliate } = useAuth();
  const { balance, bonusBalance } = useWallet();
  const { myAffiliateProfile } = useAffiliates();
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

  const pendingCommission = myAffiliateProfile?.pending_commission || 0;

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
              {/* Saldo da Carteira - Desktop */}
              <Link to="/carteira" className="hidden md:flex items-center gap-1">
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

              {/* Menu do Usuário - Desktop */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="hidden md:flex">
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                      <AvatarFallback className="bg-gradient-primary text-white text-sm">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    {isAffiliate && pendingCommission > 0 && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-warning rounded-full border-2 border-background animate-pulse" />
                    )}
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

                  {isAffiliate && (
                    <DropdownMenuItem asChild>
                      <Link to="/afiliado" className="flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        Painel Afiliado
                        {pendingCommission > 0 && (
                          <Badge variant="secondary" className="ml-auto bg-warning/20 text-warning text-xs px-1.5">
                            R$ {Number(pendingCommission).toFixed(0)}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
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
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild className="bg-gradient-primary hover:opacity-90">
                <Link to="/cadastro">Cadastrar</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden relative">
                {user && profile ? (
                  <>
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                      <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                      <AvatarFallback className="bg-gradient-primary text-white text-xs">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    {isAffiliate && pendingCommission > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-warning rounded-full border-2 border-background animate-pulse" />
                    )}
                  </>
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>
                  {user && profile ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                        <AvatarFallback className="bg-gradient-primary text-white text-sm">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium text-sm">{profile.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  ) : (
                    'Menu'
                  )}
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                {/* Saldo - Apenas logado */}
                {user && profile && (
                  <>
                    <Link 
                      to="/carteira" 
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-primary/10 border border-primary/20"
                    >
                      <div className="flex items-center gap-3">
                        <Wallet className="h-5 w-5 text-primary" />
                        <span className="font-medium">Carteira</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-primary">R$ {balance.toFixed(2)}</span>
                        {bonusBalance > 0 && (
                          <p className="text-xs text-muted-foreground">+R$ {bonusBalance.toFixed(2)} bônus</p>
                        )}
                      </div>
                    </Link>
                    <div className="h-px bg-border my-2" />
                  </>
                )}

                {/* Links principais */}
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

                {/* Menu do usuário logado */}
                {user && profile ? (
                  <>
                    <div className="h-px bg-border my-2" />
                    <Link 
                      to="/meus-tickets" 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors"
                    >
                      <Ticket className="h-5 w-5" />
                      <span className="font-medium">Meus Tickets</span>
                    </Link>
                    <Link 
                      to="/perfil" 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors"
                    >
                      <User className="h-5 w-5" />
                      <span className="font-medium">Meu Perfil</span>
                    </Link>
                    <Link 
                      to="/configuracoes" 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors"
                    >
                      <Settings className="h-5 w-5" />
                      <span className="font-medium">Configurações</span>
                    </Link>

                    {isAffiliate && (
                      <Link 
                        to="/afiliado" 
                        className="flex items-center justify-between px-4 py-3 rounded-xl bg-warning/10 border border-warning/20 hover:bg-warning/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-warning" />
                          <span className="font-medium">Painel Afiliado</span>
                        </div>
                        {pendingCommission > 0 && (
                          <Badge variant="secondary" className="bg-warning/20 text-warning text-xs">
                            R$ {Number(pendingCommission).toFixed(2)}
                          </Badge>
                        )}
                      </Link>
                    )}

                    <div className="h-px bg-border my-2" />
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 transition-colors text-destructive w-full text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">Sair</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="h-px bg-border my-2" />
                    <Link 
                      to="/login" 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors"
                    >
                      <User className="h-5 w-5" />
                      <span className="font-medium">Entrar</span>
                    </Link>
                    <Button asChild className="mx-4 bg-gradient-primary hover:opacity-90">
                      <Link to="/cadastro">Criar conta</Link>
                    </Button>
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