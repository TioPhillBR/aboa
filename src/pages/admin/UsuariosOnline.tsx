import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  RefreshCw, 
  Search, 
  Clock,
  Monitor,
  Smartphone,
  Activity,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserSession {
  id: string;
  user_id: string;
  session_started_at: string;
  last_activity_at: string;
  session_ended_at: string | null;
  is_active: boolean;
  user_agent: string | null;
  profile?: {
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
  };
}

interface UserWithStatus {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  cpf: string | null;
  created_at: string;
  last_login_at: string | null;
  isOnline: boolean;
  lastSession?: UserSession;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export default function UsuariosOnline() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('online');
  
  // Pagination state for each tab
  const [onlinePage, setOnlinePage] = useState(1);
  const [offlinePage, setOfflinePage] = useState(1);
  const [allPage, setAllPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersResult, sessionsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, avatar_url, phone, cpf, created_at, last_login_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('user_sessions')
          .select(`
            *,
            profile:profiles!user_sessions_user_id_fkey (
              full_name,
              avatar_url,
              phone
            )
          `)
          .order('last_activity_at', { ascending: false })
          .limit(500)
      ]);

      if (sessionsResult.error) throw sessionsResult.error;
      if (usersResult.error) throw usersResult.error;

      const sessionsData = sessionsResult.data || [];
      setSessions(sessionsData);

      const usersData = usersResult.data || [];
      const activeSessionsByUser = new Map<string, UserSession>();
      
      sessionsData.forEach(session => {
        if (session.is_active) {
          const existing = activeSessionsByUser.get(session.user_id);
          if (!existing || new Date(session.last_activity_at) > new Date(existing.last_activity_at)) {
            activeSessionsByUser.set(session.user_id, session);
          }
        }
      });

      const usersWithStatus: UserWithStatus[] = usersData.map(user => ({
        ...user,
        isOnline: activeSessionsByUser.has(user.id),
        lastSession: activeSessionsByUser.get(user.id) || 
          sessionsData.find(s => s.user_id === user.id)
      }));

      setAllUsers(usersWithStatus);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('user_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sessions',
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    const interval = setInterval(fetchData, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setOnlinePage(1);
    setOfflinePage(1);
    setAllPage(1);
  }, [search]);

  const onlineUsers = useMemo(() => allUsers.filter(u => u.isOnline), [allUsers]);
  const offlineUsers = useMemo(() => allUsers.filter(u => !u.isOnline), [allUsers]);

  const filteredOnlineUsers = useMemo(() => 
    onlineUsers.filter(u => 
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search) ||
      u.cpf?.includes(search)
    ), [onlineUsers, search]
  );

  const filteredOfflineUsers = useMemo(() =>
    offlineUsers.filter(u => 
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search) ||
      u.cpf?.includes(search)
    ), [offlineUsers, search]
  );

  const filteredAllUsers = useMemo(() =>
    allUsers.filter(u => 
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search) ||
      u.cpf?.includes(search)
    ), [allUsers, search]
  );

  // Pagination calculations
  const getPaginatedData = <T,>(data: T[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalItems: number) => Math.ceil(totalItems / itemsPerPage);

  const paginatedOnlineUsers = getPaginatedData(filteredOnlineUsers, onlinePage);
  const paginatedOfflineUsers = getPaginatedData(filteredOfflineUsers, offlinePage);
  const paginatedAllUsers = getPaginatedData(filteredAllUsers, allPage);

  const totalOnlinePages = getTotalPages(filteredOnlineUsers.length);
  const totalOfflinePages = getTotalPages(filteredOfflineUsers.length);
  const totalAllPages = getTotalPages(filteredAllUsers.length);

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />;
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    return isMobile ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />;
  };

  const getDeviceName = (userAgent: string | null) => {
    if (!userAgent) return 'Desconhecido';
    if (/iphone/i.test(userAgent)) return 'iPhone';
    if (/ipad/i.test(userAgent)) return 'iPad';
    if (/android/i.test(userAgent)) return 'Android';
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/mac/i.test(userAgent)) return 'Mac';
    if (/linux/i.test(userAgent)) return 'Linux';
    return 'Outro';
  };

  const Pagination = ({ 
    currentPage, 
    totalPages, 
    totalItems,
    onPageChange 
  }: { 
    currentPage: number; 
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  }) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    if (totalItems === 0) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <p className="text-sm text-muted-foreground">
          Mostrando {startItem} a {endItem} de {totalItems} usuários
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2">
            Página {currentPage} de {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const UserRow = ({ user, showDevice = false }: { user: UserWithStatus; showDevice?: boolean }) => (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback>
                {user.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            {user.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
            )}
          </div>
          <div>
            <p className="font-medium">{user.full_name || 'Usuário'}</p>
            <p className="text-xs text-muted-foreground">{user.phone || '-'}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {user.cpf || '-'}
      </TableCell>
      {showDevice && (
        <TableCell>
          {user.lastSession ? (
            <div className="flex items-center gap-2">
              {getDeviceIcon(user.lastSession.user_agent)}
              <span className="text-sm">{getDeviceName(user.lastSession.user_agent)}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </TableCell>
      )}
      <TableCell>
        <div className="text-sm">
          {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
        </div>
      </TableCell>
      <TableCell>
        {user.last_login_at ? (
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(user.last_login_at), { 
              addSuffix: true,
              locale: ptBR 
            })}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Nunca</span>
        )}
      </TableCell>
      <TableCell>
        {user.isOnline ? (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
            Online
          </Badge>
        ) : (
          <Badge variant="secondary">
            Offline
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Usuários da Plataforma</h1>
            <p className="text-muted-foreground">
              Monitoramento de todos os usuários e suas atividades
            </p>
          </div>
          <Button onClick={fetchData} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allUsers.length}</p>
                  <p className="text-xs text-muted-foreground">Total Usuários</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{onlineUsers.length}</p>
                  <p className="text-xs text-muted-foreground">Online Agora</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Monitor className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {onlineUsers.filter(u => 
                      u.lastSession && !/mobile|android|iphone|ipad/i.test(u.lastSession.user_agent || '')
                    ).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Desktop</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Smartphone className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {onlineUsers.filter(u => 
                      u.lastSession && /mobile|android|iphone|ipad/i.test(u.lastSession.user_agent || '')
                    ).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Mobile</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Items Per Page */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setOnlinePage(1);
              setOfflinePage(1);
              setAllPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option} por página
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="online" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Online ({filteredOnlineUsers.length})
            </TabsTrigger>
            <TabsTrigger value="offline" className="gap-2">
              <UserX className="h-4 w-4" />
              Offline ({filteredOfflineUsers.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <Users className="h-4 w-4" />
              Todos ({filteredAllUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="online" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="relative">
                    <Activity className="h-5 w-5 text-green-500" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  Usuários Online ({filteredOnlineUsers.length})
                </CardTitle>
                <CardDescription>
                  Usuários atualmente conectados na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredOnlineUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum usuário online no momento
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>CPF</TableHead>
                          <TableHead>Dispositivo</TableHead>
                          <TableHead>Cadastro</TableHead>
                          <TableHead>Último Acesso</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedOnlineUsers.map((user) => (
                          <UserRow key={user.id} user={user} showDevice />
                        ))}
                      </TableBody>
                    </Table>
                    <Pagination
                      currentPage={onlinePage}
                      totalPages={totalOnlinePages}
                      totalItems={filteredOnlineUsers.length}
                      onPageChange={setOnlinePage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offline" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="h-5 w-5 text-muted-foreground" />
                  Usuários Offline ({filteredOfflineUsers.length})
                </CardTitle>
                <CardDescription>
                  Usuários que não estão conectados no momento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredOfflineUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum usuário offline encontrado
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>CPF</TableHead>
                          <TableHead>Cadastro</TableHead>
                          <TableHead>Último Acesso</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedOfflineUsers.map((user) => (
                          <UserRow key={user.id} user={user} />
                        ))}
                      </TableBody>
                    </Table>
                    <Pagination
                      currentPage={offlinePage}
                      totalPages={totalOfflinePages}
                      totalItems={filteredOfflineUsers.length}
                      onPageChange={setOfflinePage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Todos os Usuários ({filteredAllUsers.length})
                </CardTitle>
                <CardDescription>
                  Lista completa de usuários da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredAllUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>CPF</TableHead>
                          <TableHead>Cadastro</TableHead>
                          <TableHead>Último Acesso</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedAllUsers.map((user) => (
                          <UserRow key={user.id} user={user} />
                        ))}
                      </TableBody>
                    </Table>
                    <Pagination
                      currentPage={allPage}
                      totalPages={totalAllPages}
                      totalItems={filteredAllUsers.length}
                      onPageChange={setAllPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}