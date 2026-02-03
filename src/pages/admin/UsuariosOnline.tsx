import { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  RefreshCw, 
  Search, 
  Clock,
  Monitor,
  Smartphone,
  LogIn,
  LogOut,
  Activity,
  UserCheck,
  UserX
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

export default function UsuariosOnline() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('online');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all users and sessions in parallel
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

      // Map users with their online status
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

    // Set up real-time subscription
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

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const onlineUsers = allUsers.filter(u => u.isOnline);
  const offlineUsers = allUsers.filter(u => !u.isOnline);

  const filteredOnlineUsers = onlineUsers.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search) ||
    u.cpf?.includes(search)
  );

  const filteredOfflineUsers = offlineUsers.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search) ||
    u.cpf?.includes(search)
  );

  const filteredAllUsers = allUsers.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search) ||
    u.cpf?.includes(search)
  );

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
      {showDevice && user.lastSession && (
        <TableCell>
          <div className="flex items-center gap-2">
            {getDeviceIcon(user.lastSession.user_agent)}
            <span className="text-sm">{getDeviceName(user.lastSession.user_agent)}</span>
          </div>
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

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
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
                      {filteredOnlineUsers.map((user) => (
                        <UserRow key={user.id} user={user} showDevice />
                      ))}
                    </TableBody>
                  </Table>
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
                      {filteredOfflineUsers.slice(0, 50).map((user) => (
                        <UserRow key={user.id} user={user} />
                      ))}
                    </TableBody>
                  </Table>
                )}
                {filteredOfflineUsers.length > 50 && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Mostrando 50 de {filteredOfflineUsers.length} usuários offline
                  </p>
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
                      {filteredAllUsers.slice(0, 100).map((user) => (
                        <UserRow key={user.id} user={user} />
                      ))}
                    </TableBody>
                  </Table>
                )}
                {filteredAllUsers.length > 100 && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Mostrando 100 de {filteredAllUsers.length} usuários
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}