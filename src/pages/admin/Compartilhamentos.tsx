import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Share2, 
  Search, 
  MousePointer,
  UserPlus,
  DollarSign,
  Loader2,
  Link as LinkIcon,
  Download,
  Percent,
  ChevronDown,
  ChevronRight,
  Gift
} from 'lucide-react';
import { useShareTracking } from '@/hooks/useShareTracking';
import { useExport } from '@/hooks/useExport';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';

export default function AdminCompartilhamentos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const { allReferralCodes, isLoadingAll, shareMetrics } = useShareTracking();
  const { exportToExcel } = useExport();

  const filteredCodes = (allReferralCodes || []).filter(rc => 
    rc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rc.owner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Prepare chart data - top 10 by signups
  const topSharers = [...(allReferralCodes || [])]
    .map(rc => ({
      name: rc.owner?.full_name?.split(' ')[0] || rc.code,
      code: rc.code,
      clicks: rc.uses_count,
      signups: rc.referrals?.length || 0,
      bonus: rc.referrals?.reduce((sum, r) => sum + Number(r.bonus_awarded), 0) || 0,
    }))
    .sort((a, b) => b.signups - a.signups)
    .slice(0, 10);

  const handleExport = () => {
    const exportData = filteredCodes.flatMap(rc => {
      const baseRow = {
        Usuário: rc.owner?.full_name || 'Desconhecido',
        Código: rc.code,
        'Usos do Link': rc.uses_count,
        Cadastros: rc.referrals?.length || 0,
        'Bônus Total': `R$ ${(rc.referrals?.reduce((sum, r) => sum + Number(r.bonus_awarded), 0) || 0).toFixed(2)}`,
        Status: rc.is_active ? 'Ativo' : 'Inativo',
        Criado: format(new Date(rc.created_at), 'dd/MM/yyyy'),
      };
      return [baseRow];
    });
    
    exportToExcel(exportData, { filename: 'compartilhamentos', title: 'Compartilhamentos e Indicações' });
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  if (isLoadingAll) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-primary">
                <Share2 className="h-6 w-6 text-primary-foreground" />
              </div>
              Compartilhamentos
            </h1>
            <p className="text-muted-foreground mt-1">
              Sistema de indicação e compartilhamento
            </p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Links</p>
                  <p className="text-2xl font-bold">{shareMetrics.totalShares}</p>
                </div>
                <LinkIcon className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Usos</p>
                  <p className="text-2xl font-bold">{shareMetrics.totalClicks}</p>
                </div>
                <MousePointer className="h-8 w-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cadastros</p>
                  <p className="text-2xl font-bold text-success">{shareMetrics.totalSignups}</p>
                </div>
                <UserPlus className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bônus Pagos</p>
                  <p className="text-2xl font-bold text-accent">
                    R$ {shareMetrics.totalCredits.toFixed(0)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversão</p>
                  <p className="text-2xl font-bold">{shareMetrics.conversionRate}%</p>
                </div>
                <Percent className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {topSharers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Indicadores</CardTitle>
              <CardDescription>Usuários com maior número de indicações bem-sucedidas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSharers}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value, name) => {
                        if (name === 'bonus') return [`R$ ${Number(value).toFixed(2)}`, 'Bônus'];
                        return [value, name === 'clicks' ? 'Usos' : 'Cadastros'];
                      }}
                    />
                    <Bar dataKey="clicks" name="clicks" fill="hsl(var(--muted-foreground))" />
                    <Bar dataKey="signups" name="signups" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Referral Codes List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Códigos de Indicação</CardTitle>
                <CardDescription>
                  {filteredCodes.length} códigos encontrados
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Cadastros</TableHead>
                    <TableHead>Bônus Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCodes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        <Share2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum código de indicação encontrado</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCodes.map((rc) => {
                      const isExpanded = expandedRows.has(rc.id);
                      const referralCount = rc.referrals?.length || 0;
                      const totalBonus = rc.referrals?.reduce((sum, r) => sum + Number(r.bonus_awarded), 0) || 0;
                      
                      return (
                        <Collapsible key={rc.id} open={isExpanded} onOpenChange={() => toggleRow(rc.id)} asChild>
                          <>
                            <TableRow className="cursor-pointer hover:bg-muted/50">
                              <TableCell>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" disabled={referralCount === 0}>
                                    {referralCount > 0 && (
                                      isExpanded ? 
                                        <ChevronDown className="h-4 w-4" /> : 
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={rc.owner?.avatar_url || ''} />
                                    <AvatarFallback className="text-xs">
                                      {rc.owner?.full_name?.slice(0, 2).toUpperCase() || '??'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium truncate max-w-[150px]">
                                    {rc.owner?.full_name || 'Usuário desconhecido'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-mono">
                                  {rc.code}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                                  {rc.uses_count}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <UserPlus className="h-4 w-4 text-success" />
                                  <span className="text-success font-semibold">{referralCount}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-accent font-semibold">
                                R$ {totalBonus.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {rc.is_active ? (
                                  <Badge className="bg-success/10 text-success">Ativo</Badge>
                                ) : (
                                  <Badge variant="secondary">Inativo</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {format(new Date(rc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </TableCell>
                            </TableRow>
                            
                            {/* Expanded content - list of referred users */}
                            <CollapsibleContent asChild>
                              <TableRow className="bg-muted/30">
                                <TableCell colSpan={8} className="p-0">
                                  <div className="px-6 py-4">
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                      <Gift className="h-4 w-4 text-primary" />
                                      Usuários Indicados ({referralCount})
                                    </h4>
                                    <div className="space-y-2">
                                      {rc.referrals?.map((referral) => (
                                        <div 
                                          key={referral.id} 
                                          className="flex items-center justify-between p-3 rounded-lg bg-background border"
                                        >
                                          <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                              <AvatarImage src={referral.referred?.avatar_url || ''} />
                                              <AvatarFallback className="text-xs">
                                                {referral.referred?.full_name?.slice(0, 2).toUpperCase() || '??'}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div>
                                              <p className="font-medium">
                                                {referral.referred?.full_name || 'Usuário'}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                Cadastrado em {format(new Date(referral.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                              + R$ {Number(referral.bonus_awarded).toFixed(2)}
                                            </Badge>
                                            {referral.bonus_awarded_at && (
                                              <p className="text-xs text-muted-foreground mt-1">
                                                Pago em {format(new Date(referral.bonus_awarded_at), "dd/MM/yyyy", { locale: ptBR })}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            </CollapsibleContent>
                          </>
                        </Collapsible>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
