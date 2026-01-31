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
  Share2, 
  Search, 
  MousePointer,
  UserPlus,
  ShoppingCart,
  DollarSign,
  Loader2,
  TrendingUp,
  Link as LinkIcon,
  Download,
  Percent
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
  LineChart,
  Line
} from 'recharts';

export default function AdminCompartilhamentos() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { allShareTrackings, isLoadingAll, shareMetrics } = useShareTracking();
  const { exportToCSV, exportToExcel } = useExport();

  const filteredShares = (allShareTrackings || []).filter(share => 
    share.share_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Prepare chart data
  const topSharers = [...(allShareTrackings || [])]
    .sort((a, b) => b.signups - a.signups)
    .slice(0, 10)
    .map(s => ({
      code: s.share_code,
      clicks: s.clicks,
      signups: s.signups,
      purchases: s.purchases,
    }));

  const handleExport = () => {
    exportToExcel(
      filteredShares.map(s => ({
        Código: s.share_code,
        Cliques: s.clicks,
        Cadastros: s.signups,
        Compras: s.purchases,
        Créditos: `R$ ${Number(s.credits_earned).toFixed(2)}`,
        Status: s.is_active ? 'Ativo' : 'Inativo',
        Criado: format(new Date(s.created_at), 'dd/MM/yyyy'),
      })),
      { filename: 'compartilhamentos', title: 'Compartilhamentos' }
    );
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
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
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
                  <p className="text-sm text-muted-foreground">Cliques</p>
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
                  <p className="text-sm text-muted-foreground">Compras</p>
                  <p className="text-2xl font-bold">{shareMetrics.totalPurchases}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Créditos</p>
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
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Compartilhadores</CardTitle>
            <CardDescription>Links com maior número de conversões</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSharers}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="code" 
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
                  />
                  <Bar dataKey="clicks" name="Cliques" fill="hsl(var(--muted-foreground))" />
                  <Bar dataKey="signups" name="Cadastros" fill="hsl(var(--primary))" />
                  <Bar dataKey="purchases" name="Compras" fill="hsl(var(--success))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Share Tracking List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Links de Compartilhamento</CardTitle>
                <CardDescription>
                  {filteredShares.length} links encontrados
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código..."
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
                    <TableHead>Código</TableHead>
                    <TableHead>Cliques</TableHead>
                    <TableHead>Cadastros</TableHead>
                    <TableHead>Compras</TableHead>
                    <TableHead>Créditos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShares.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <Share2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum link de compartilhamento encontrado</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredShares.map((share) => (
                      <TableRow key={share.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {share.share_code}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MousePointer className="h-4 w-4 text-muted-foreground" />
                            {share.clicks}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4 text-success" />
                            <span className="text-success font-semibold">{share.signups}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-primary" />
                            {share.purchases}
                          </div>
                        </TableCell>
                        <TableCell className="text-accent font-semibold">
                          R$ {Number(share.credits_earned).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {share.is_active ? (
                            <Badge className="bg-success/10 text-success">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(share.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))
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
