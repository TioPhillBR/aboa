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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  ShieldOff,
  History,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  RefreshCw,
  Phone,
  Calendar,
  Crown,
  ChevronDown,
  UserCheck,
  UserX,
  MoreHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserWithDetails extends Profile {
  wallet: Wallet | null;
  roles: UserRole[];
  isAdmin: boolean;
  affiliateStatus?: string | null;
  affiliateId?: string | null;
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
  
  // Action state
  const [actionUser, setActionUser] = useState<UserWithDetails | null>(null);
  const [actionType, setActionType] = useState<'promote_admin' | 'remove_admin' | 'approve_affiliate' | 'reject_affiliate' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

      // Para cada perfil, buscar wallet, roles e affiliate
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

          // Buscar affiliate status
          const { data: affiliateData } = await supabase
            .from('affiliates')
            .select('id, status')
            .eq('user_id', profile.id)
            .single();

          const roles = (rolesData || []) as UserRole[];
          const isAdmin = roles.some(r => r.role === 'admin');

          return {
            ...profile,
            wallet: walletData as Wallet | null,
            roles,
            isAdmin,
            affiliateStatus: affiliateData?.status || null,
            affiliateId: affiliateData?.id || null,
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

  const handleAction = async () => {
    if (!actionUser || !actionType || !user) return;
    
    setIsProcessing(true);
    
    try {
      switch (actionType) {
        case 'promote_admin':
          await supabase.from('user_roles').insert({
            user_id: actionUser.id,
            role: 'admin',
            created_by: user.id,
          });
          toast({ title: `${actionUser.full_name} agora é administrador!` });
          break;
          
        case 'remove_admin':
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', actionUser.id)
            .eq('role', 'admin');
          toast({ title: `Permissões de admin removidas de ${actionUser.full_name}` });
          break;
          
        case 'approve_affiliate':
          if (actionUser.affiliateId) {
            await supabase
              .from('affiliates')
              .update({
                status: 'approved',
                approved_by: user.id,
                approved_at: new Date().toISOString(),
              })
              .eq('id', actionUser.affiliateId);
          } else {
            // Create affiliate if doesn't exist
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, phone')
              .eq('id', actionUser.id)
              .single();
              
            await supabase.from('affiliates').insert({
              user_id: actionUser.id,
              full_name: profileData?.full_name || 'Afiliado',
              cpf: '00000000000', // Placeholder - user should update
              status: 'approved',
              approved_by: user.id,
              approved_at: new Date().toISOString(),
              affiliate_code: `AF${Date.now().toString(36).toUpperCase()}`,
            });
          }
          toast({ title: `${actionUser.full_name} aprovado como afiliado!` });
          break;
          
        case 'reject_affiliate':
          if (actionUser.affiliateId) {
            await supabase
              .from('affiliates')
              .update({ status: 'rejected' })
              .eq('id', actionUser.affiliateId);
          }
          toast({ title: `Afiliação de ${actionUser.full_name} rejeitada` });
          break;
      }
      
      fetchUsers();
    } catch (error) {
      console.error('Error performing action:', error);
      toast({ title: 'Erro ao executar ação', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
      setActionUser(null);
      setActionType(null);
    }
  };

  const getActionDialogContent = () => {
    if (!actionUser || !actionType) return { title: '', description: '' };
    
    switch (actionType) {
      case 'promote_admin':
        return {
          title: 'Promover a Administrador?',
          description: `${actionUser.full_name} terá acesso total ao painel administrativo.`,
        };
      case 'remove_admin':
        return {
          title: 'Remover Permissões de Admin?',
          description: `${actionUser.full_name} perderá acesso ao painel administrativo.`,
        };
      case 'approve_affiliate':
        return {
          title: 'Aprovar como Afiliado?',
          description: `${actionUser.full_name} poderá compartilhar links de indicação e receber comissões.`,
        };
      case 'reject_affiliate':
        return {
          title: 'Rejeitar/Suspender Afiliação?',
          description: `${actionUser.full_name} não poderá mais atuar como afiliado.`,
        };
      default:
        return { title: '', description: '' };
    }
  };

  const getRoleBadges = (userDetails: UserWithDetails) => {
    const badges = [];
    
    if (userDetails.isAdmin) {
      badges.push(
        <Badge key="admin" className="bg-primary/10 text-primary gap-1">
          <ShieldCheck className="h-3 w-3" />
          Admin
        </Badge>
      );
    }
    
    if (userDetails.affiliateStatus === 'approved') {
      badges.push(
        <Badge key="affiliate" className="bg-success/10 text-success gap-1">
          <UserCheck className="h-3 w-3" />
          Afiliado
        </Badge>
      );
    } else if (userDetails.affiliateStatus === 'pending') {
      badges.push(
        <Badge key="affiliate-pending" className="bg-warning/10 text-warning gap-1">
          Afiliado Pendente
        </Badge>
      );
    }
    
    if (badges.length === 0) {
      badges.push(<Badge key="user" variant="secondary">Usuário</Badge>);
    }
    
    return badges;
  };

  // Stats
  const totalUsers = users.length;
  const totalAdmins = users.filter(u => u.isAdmin).length;
  const totalAffiliates = users.filter(u => u.affiliateStatus === 'approved').length;
  const pendingAffiliates = users.filter(u => u.affiliateStatus === 'pending').length;
  const totalBalance = users.reduce((sum, u) => sum + (u.wallet?.balance || 0), 0);

  const dialogContent = getActionDialogContent();

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
              Gerencie usuários, permissões e afiliações
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
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
              <CardTitle className="text-sm font-medium">Afiliados Ativos</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{totalAffiliates}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Afiliados Pendentes</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{pendingAffiliates}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
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
                  <TableHead>Permissões</TableHead>
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
                        <div className="flex flex-wrap gap-1">
                          {getRoleBadges(userDetails)}
                        </div>
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
                          
                          {userDetails.id !== user?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="gap-1">
                                  <Crown className="h-3 w-3" />
                                  Gerenciar
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                {!userDetails.isAdmin ? (
                                  <DropdownMenuItem onClick={() => {
                                    setActionUser(userDetails);
                                    setActionType('promote_admin');
                                  }}>
                                    <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                                    Promover a Admin
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setActionUser(userDetails);
                                      setActionType('remove_admin');
                                    }}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <ShieldOff className="h-4 w-4 mr-2" />
                                    Remover Admin
                                  </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuSeparator />
                                
                                {!userDetails.affiliateStatus || userDetails.affiliateStatus === 'rejected' ? (
                                  <DropdownMenuItem onClick={() => {
                                    setActionUser(userDetails);
                                    setActionType('approve_affiliate');
                                  }}>
                                    <UserCheck className="h-4 w-4 mr-2 text-success" />
                                    Aprovar como Afiliado
                                  </DropdownMenuItem>
                                ) : userDetails.affiliateStatus === 'pending' ? (
                                  <>
                                    <DropdownMenuItem onClick={() => {
                                      setActionUser(userDetails);
                                      setActionType('approve_affiliate');
                                    }}>
                                      <UserCheck className="h-4 w-4 mr-2 text-success" />
                                      Aprovar Afiliação
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setActionUser(userDetails);
                                        setActionType('reject_affiliate');
                                      }}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <UserX className="h-4 w-4 mr-2" />
                                      Rejeitar Afiliação
                                    </DropdownMenuItem>
                                  </>
                                ) : userDetails.affiliateStatus === 'approved' ? (
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setActionUser(userDetails);
                                      setActionType('reject_affiliate');
                                    }}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <UserX className="h-4 w-4 mr-2" />
                                    Suspender Afiliado
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
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
              <DialogTitle>Histórico de Transações</DialogTitle>
              <DialogDescription>
                Transações de {selectedUser?.full_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-auto">
              {isLoadingTransactions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <WalletIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma transação encontrada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={t.type_color}>{t.type_icon}</div>
                        <div>
                          <p className="font-medium">{t.type_label}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.description || '-'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${t.type === 'purchase' ? 'text-red-600' : 'text-green-600'}`}>
                          {t.type === 'purchase' ? '-' : '+'}R$ {Math.abs(t.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(t.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Action Confirmation Dialog */}
        <AlertDialog open={actionType !== null} onOpenChange={(open) => !open && setActionType(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
              <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
            </AlertDialogHeader>
            {actionUser && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Avatar>
                  <AvatarImage src={actionUser.avatar_url || ''} />
                  <AvatarFallback>{actionUser.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{actionUser.full_name}</p>
                  <div className="flex gap-2 mt-1">
                    {getRoleBadges(actionUser)}
                  </div>
                </div>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAction}
                disabled={isProcessing}
                className={actionType?.includes('remove') || actionType?.includes('reject')
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
                }
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Confirmar'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
