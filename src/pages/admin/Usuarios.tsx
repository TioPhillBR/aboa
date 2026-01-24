import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Profile, Wallet, WalletTransaction, UserRole } from '@/types';
import { 
  Users, 
  Search,
  Wallet as WalletIcon,
  Shield,
  ShieldCheck,
  History,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  RefreshCw,
  Phone,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserWithDetails extends Profile {
  wallet: Wallet | null;
  roles: UserRole[];
  isAdmin: boolean;
}

interface TransactionWithType extends WalletTransaction {
  type_label: string;
  type_icon: React.ReactNode;
  type_color: string;
}

export default function AdminUsuarios() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Transaction dialog
  const [transactionsDialogOpen, setTransactionsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [transactions, setTransactions] = useState<TransactionWithType[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  
  // Promote dialog
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [userToPromote, setUserToPromote] = useState<UserWithDetails | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(u => 
          u.full_name.toLowerCase().includes(query) ||
          u.phone?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);

      // Buscar todos os perfis
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Para cada perfil, buscar wallet e roles
      const usersWithDetails = await Promise.all(
        (profilesData || []).map(async (profile) => {
          // Buscar wallet
          const { data: walletData } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', profile.id)
            .single();

          // Buscar roles
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', profile.id);

          const roles = (rolesData || []) as UserRole[];
          const isAdmin = roles.some(r => r.role === 'admin');

          return {
            ...profile,
            wallet: walletData as Wallet | null,
            roles,
            isAdmin,
          } as UserWithDetails;
        })
      );

      setUsers(usersWithDetails);
      setFilteredUsers(usersWithDetails);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro ao carregar usuários',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionDetails = (type: string): { label: string; icon: React.ReactNode; color: string } => {
    switch (type) {
      case 'deposit':
        return { 
          label: 'Depósito', 
          icon: <ArrowDownLeft className="h-4 w-4" />, 
          color: 'text-green-600' 
        };
      case 'purchase':
        return { 
          label: 'Compra', 
          icon: <ArrowUpRight className="h-4 w-4" />, 
          color: 'text-red-600' 
        };
      case 'prize':
        return { 
          label: 'Prêmio', 
          icon: <Gift className="h-4 w-4" />, 
          color: 'text-yellow-600' 
        };
      case 'refund':
        return { 
          label: 'Reembolso', 
          icon: <RefreshCw className="h-4 w-4" />, 
          color: 'text-blue-600' 
        };
      default:
        return { 
          label: type, 
          icon: <WalletIcon className="h-4 w-4" />, 
          color: 'text-muted-foreground' 
        };
    }
  };

  const openTransactionsDialog = async (userDetails: UserWithDetails) => {
    setSelectedUser(userDetails);
    setTransactionsDialogOpen(true);
    setIsLoadingTransactions(true);

    try {
      if (!userDetails.wallet) {
        setTransactions([]);
        return;
      }

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', userDetails.wallet.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const transactionsWithDetails = (data || []).map(t => {
        const details = getTransactionDetails(t.type);
        return {
          ...t,
          type_label: details.label,
          type_icon: details.icon,
          type_color: details.color,
        } as TransactionWithType;
      });

      setTransactions(transactionsWithDetails);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Erro ao carregar transações',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const openPromoteDialog = (userDetails: UserWithDetails) => {
    setUserToPromote(userDetails);
    setPromoteDialogOpen(true);
  };

  const handlePromoteToAdmin = async () => {
    if (!userToPromote || !user) return;

    setIsPromoting(true);

    try {
      // Verificar se já é admin
      if (userToPromote.isAdmin) {
        toast({
          title: 'Usuário já é administrador',
          variant: 'destructive',
        });
        return;
      }

      // Adicionar role de admin
      const { error } = await supabase.from('user_roles').insert({
        user_id: userToPromote.id,
        role: 'admin',
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: 'Usuário promovido!',
        description: `${userToPromote.full_name} agora é administrador.`,
      });

      setPromoteDialogOpen(false);
      setUserToPromote(null);
      fetchUsers();
    } catch (error) {
      console.error('Error promoting user:', error);
      toast({
        title: 'Erro ao promover usuário',
        description: 'Não foi possível promover o usuário.',
        variant: 'destructive',
      });
    } finally {
      setIsPromoting(false);
    }
  };

  const handleRemoveAdmin = async (userDetails: UserWithDetails) => {
    if (!confirm('Tem certeza que deseja remover as permissões de admin deste usuário?')) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userDetails.id)
        .eq('role', 'admin');

      if (error) throw error;

      toast({
        title: 'Permissão removida',
        description: `${userDetails.full_name} não é mais administrador.`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast({
        title: 'Erro ao remover permissão',
        variant: 'destructive',
      });
    }
  };

  // Stats
  const totalUsers = users.length;
  const totalAdmins = users.filter(u => u.isAdmin).length;
  const totalBalance = users.reduce((sum, u) => sum + (u.wallet?.balance || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8" />
              Usuários
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie usuários, visualize saldos e histórico
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAdmins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total em Carteiras</CardTitle>
              <WalletIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {totalBalance.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={fetchUsers} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((userDetails) => (
                    <TableRow key={userDetails.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={userDetails.avatar_url || ''} />
                            <AvatarFallback>
                              {userDetails.full_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{userDetails.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {userDetails.phone ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {userDetails.phone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">
                          R$ {(userDetails.wallet?.balance || 0).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {userDetails.isAdmin ? (
                          <Badge className="bg-primary gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Usuário</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(userDetails.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openTransactionsDialog(userDetails)}
                            className="gap-1"
                          >
                            <History className="h-3 w-3" />
                            Histórico
                          </Button>
                          {userDetails.isAdmin ? (
                            userDetails.id !== user?.id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveAdmin(userDetails)}
                                className="gap-1 text-destructive hover:text-destructive"
                              >
                                <Shield className="h-3 w-3" />
                                Remover Admin
                              </Button>
                            )
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPromoteDialog(userDetails)}
                              className="gap-1"
                            >
                              <ShieldCheck className="h-3 w-3" />
                              Promover
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Transactions Dialog */}
        <Dialog open={transactionsDialogOpen} onOpenChange={setTransactionsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Transações
              </DialogTitle>
              <DialogDescription>
                {selectedUser?.full_name} - Saldo atual: R$ {(selectedUser?.wallet?.balance || 0).toFixed(2)}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-auto">
              {isLoadingTransactions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <WalletIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma transação encontrada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className={`p-2 rounded-full bg-background ${transaction.type_color}`}>
                        {transaction.type_icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {transaction.type_label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(transaction.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        {transaction.description && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {transaction.description}
                          </p>
                        )}
                      </div>
                      <div className={`font-bold ${
                        transaction.type === 'purchase' 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {transaction.type === 'purchase' ? '-' : '+'}
                        R$ {Math.abs(transaction.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Promote Dialog */}
        <AlertDialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Promover a Administrador</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja promover <strong>{userToPromote?.full_name}</strong> a administrador?
                <br /><br />
                Administradores têm acesso total ao painel de controle, incluindo gerenciamento de usuários, sorteios e raspadinhas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handlePromoteToAdmin} disabled={isPromoting}>
                {isPromoting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Promovendo...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Promover
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
