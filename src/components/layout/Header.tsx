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
import { Wallet, User, LogOut, Settings, Trophy, Ticket, LayoutDashboard } from 'lucide-react';

export function Header() {
  const { user, profile, isAdmin, signOut, isLoading } = useAuth();
  const { balance } = useWallet();
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
        <Link to="/" className="flex items-center space-x-2">
          <Trophy className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Sorteio
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/sorteios" className="text-sm font-medium hover:text-primary transition-colors">
            Sorteios
          </Link>
          <Link to="/raspadinhas" className="text-sm font-medium hover:text-primary transition-colors">
            Raspadinhas
          </Link>
          <Link to="/ganhadores" className="text-sm font-medium hover:text-primary transition-colors">
            Ganhadores
          </Link>
        </nav>

        {/* User Section */}
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
          ) : user && profile ? (
            <>
              {/* Saldo da Carteira */}
              <Link to="/carteira">
                <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span className="font-semibold">R$ {balance.toFixed(2)}</span>
                </Button>
              </Link>

              {/* Menu do Usuário */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
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
              <Button variant="ghost" asChild>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild>
                <Link to="/cadastro">Cadastrar</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
