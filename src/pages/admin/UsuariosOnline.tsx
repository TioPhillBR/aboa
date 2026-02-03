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
  Activity
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

export default function UsuariosOnline() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
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
        .limit(100);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();

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
          fetchSessions();
        }
      )
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSessions, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const activeSessions = sessions.filter(s => s.is_active);
  const recentSessions = sessions.filter(s => !s.is_active);

  const filteredActiveSessions = activeSessions.filter(s => 
    s.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.profile?.phone?.includes(search)
  );

  const filteredRecentSessions = recentSessions.filter(s => 
    s.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.profile?.phone?.includes(search)
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Usuários Online</h1>
            <p className="text-muted-foreground">
              Monitoramento em tempo real de usuários conectados
            </p>
          </div>
          <Button onClick={fetchSessions} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeSessions.length}</p>
                  <p className="text-xs text-muted-foreground">Online Agora</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{sessions.length}</p>
                  <p className="text-xs text-muted-foreground">Sessões Totais</p>
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
                    {activeSessions.filter(s => !/mobile|android|iphone|ipad/i.test(s.user_agent || '')).length}
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
                    {activeSessions.filter(s => /mobile|android|iphone|ipad/i.test(s.user_agent || '')).length}
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
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="relative">
                <Activity className="h-5 w-5 text-green-500" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              Usuários Online ({filteredActiveSessions.length})
            </CardTitle>
            <CardDescription>
              Usuários atualmente conectados na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredActiveSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário online no momento
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Entrou em</TableHead>
                    <TableHead>Última Atividade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActiveSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={session.profile?.avatar_url || undefined} />
                              <AvatarFallback>
                                {session.profile?.full_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                          </div>
                          <div>
                            <p className="font-medium">{session.profile?.full_name || 'Usuário'}</p>
                            <p className="text-xs text-muted-foreground">{session.profile?.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(session.user_agent)}
                          <span className="text-sm">{getDeviceName(session.user_agent)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <LogIn className="h-3 w-3 text-green-500" />
                          {format(new Date(session.session_started_at), "dd/MM HH:mm", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(session.last_activity_at), { 
                            addSuffix: true,
                            locale: ptBR 
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                          Online
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Sessões Recentes ({filteredRecentSessions.length})
            </CardTitle>
            <CardDescription>
              Histórico de sessões encerradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRecentSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma sessão recente
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Entrou em</TableHead>
                    <TableHead>Saiu em</TableHead>
                    <TableHead>Duração</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecentSessions.slice(0, 20).map((session) => {
                    const start = new Date(session.session_started_at);
                    const end = session.session_ended_at ? new Date(session.session_ended_at) : new Date();
                    const durationMs = end.getTime() - start.getTime();
                    const durationMinutes = Math.round(durationMs / 60000);
                    
                    return (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={session.profile?.avatar_url || undefined} />
                              <AvatarFallback>
                                {session.profile?.full_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{session.profile?.full_name || 'Usuário'}</p>
                              <p className="text-xs text-muted-foreground">{session.profile?.phone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(session.user_agent)}
                            <span className="text-sm">{getDeviceName(session.user_agent)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <LogIn className="h-3 w-3 text-green-500" />
                            {format(start, "dd/MM HH:mm", { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <LogOut className="h-3 w-3 text-red-500" />
                            {session.session_ended_at 
                              ? format(end, "dd/MM HH:mm", { locale: ptBR })
                              : '-'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {durationMinutes < 60 
                              ? `${durationMinutes} min`
                              : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}min`
                            }
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}