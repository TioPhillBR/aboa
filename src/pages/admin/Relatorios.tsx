import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  FileText, 
  Download,
  FileSpreadsheet,
  File,
  Calendar as CalendarIcon,
  Users,
  Ticket,
  Sparkles,
  DollarSign,
  Trophy,
  Share2,
  Loader2
} from 'lucide-react';
import { useFinancial } from '@/hooks/useFinancial';
import { useAffiliates } from '@/hooks/useAffiliates';
import { useShareTracking } from '@/hooks/useShareTracking';
import { useExport } from '@/hooks/useExport';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const reportTypes: ReportType[] = [
  {
    id: 'sales',
    name: 'Vendas',
    description: 'Relatório completo de vendas de rifas e raspadinhas',
    icon: <Ticket className="h-6 w-6" />,
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 'financial',
    name: 'Financeiro',
    description: 'Transações, receitas, taxas e saldo líquido',
    icon: <DollarSign className="h-6 w-6" />,
    color: 'bg-success/10 text-success',
  },
  {
    id: 'users',
    name: 'Usuários',
    description: 'Lista completa de usuários cadastrados',
    icon: <Users className="h-6 w-6" />,
    color: 'bg-accent/10 text-accent',
  },
  {
    id: 'affiliates',
    name: 'Afiliados',
    description: 'Comissões, vendas e desempenho de afiliados',
    icon: <Users className="h-6 w-6" />,
    color: 'bg-warning/10 text-warning',
  },
  {
    id: 'prizes',
    name: 'Prêmios',
    description: 'Prêmios entregues e pendentes',
    icon: <Trophy className="h-6 w-6" />,
    color: 'bg-destructive/10 text-destructive',
  },
  {
    id: 'shares',
    name: 'Compartilhamentos',
    description: 'Links de compartilhamento e conversões',
    icon: <Share2 className="h-6 w-6" />,
    color: 'bg-muted text-muted-foreground',
  },
];

export default function AdminRelatorios() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  const { salesData, salesMetrics } = useFinancial();
  const { affiliates } = useAffiliates();
  const { allShareTrackings, shareMetrics } = useShareTracking();
  const { exportToCSV, exportToExcel, exportToPDF } = useExport();

  const handleGenerateReport = async (reportId: string, exportFormat: 'csv' | 'excel' | 'pdf') => {
    setGeneratingReport(reportId);

    try {
      let data: Record<string, unknown>[] = [];
      let columns: { header: string; key: string }[] = [];
      let filename = '';
      let title = '';

      switch (reportId) {
        case 'sales':
          data = (salesData || []).map(s => ({
            ID: s.id,
            Tipo: s.product_type === 'raffle' ? 'Rifa' : 'Raspadinha',
            Produto: s.product_name || '',
            Valor: s.amount,
            Data: format(new Date(s.created_at), 'dd/MM/yyyy HH:mm'),
          }));
          columns = [
            { header: 'ID', key: 'ID' },
            { header: 'Tipo', key: 'Tipo' },
            { header: 'Produto', key: 'Produto' },
            { header: 'Valor', key: 'Valor' },
            { header: 'Data', key: 'Data' },
          ];
          filename = `vendas_${format(new Date(), 'yyyyMMdd')}`;
          title = 'Relatório de Vendas';
          break;

        case 'users':
          const { data: usersData } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
          
          data = (usersData || []).map(u => ({
            ID: u.id,
            Nome: u.full_name,
            Telefone: u.phone || '-',
            Origem: u.registration_source || 'Direto',
            Cadastro: format(new Date(u.created_at), 'dd/MM/yyyy HH:mm'),
          }));
          columns = [
            { header: 'ID', key: 'ID' },
            { header: 'Nome', key: 'Nome' },
            { header: 'Telefone', key: 'Telefone' },
            { header: 'Origem', key: 'Origem' },
            { header: 'Cadastro', key: 'Cadastro' },
          ];
          filename = `usuarios_${format(new Date(), 'yyyyMMdd')}`;
          title = 'Relatório de Usuários';
          break;

        case 'affiliates':
          data = (affiliates || []).map(a => ({
            Nome: a.full_name,
            Código: a.affiliate_code,
            Comissão: `${a.commission_percentage}%`,
            Vendas: `R$ ${Number(a.total_sales).toFixed(2)}`,
            ComissãoTotal: `R$ ${Number(a.total_commission).toFixed(2)}`,
            Pendente: `R$ ${Number(a.pending_commission).toFixed(2)}`,
            Pago: `R$ ${Number(a.paid_commission).toFixed(2)}`,
            Status: a.status,
          }));
          columns = [
            { header: 'Nome', key: 'Nome' },
            { header: 'Código', key: 'Código' },
            { header: 'Comissão %', key: 'Comissão' },
            { header: 'Vendas', key: 'Vendas' },
            { header: 'Comissão Total', key: 'ComissãoTotal' },
            { header: 'Pendente', key: 'Pendente' },
            { header: 'Pago', key: 'Pago' },
            { header: 'Status', key: 'Status' },
          ];
          filename = `afiliados_${format(new Date(), 'yyyyMMdd')}`;
          title = 'Relatório de Afiliados';
          break;

        case 'prizes':
          const { data: prizesData } = await supabase
            .from('raffle_prizes')
            .select(`*, raffles(title)`)
            .order('created_at', { ascending: false });
          
          data = (prizesData || []).map((p: any) => ({
            Prêmio: p.name,
            Rifa: p.raffles?.title || '-',
            Valor: p.estimated_value ? `R$ ${Number(p.estimated_value).toFixed(2)}` : '-',
            Status: p.status,
            Entrega: p.delivered_at ? format(new Date(p.delivered_at), 'dd/MM/yyyy') : '-',
          }));
          columns = [
            { header: 'Prêmio', key: 'Prêmio' },
            { header: 'Rifa', key: 'Rifa' },
            { header: 'Valor', key: 'Valor' },
            { header: 'Status', key: 'Status' },
            { header: 'Entrega', key: 'Entrega' },
          ];
          filename = `premios_${format(new Date(), 'yyyyMMdd')}`;
          title = 'Relatório de Prêmios';
          break;

        case 'shares':
          data = (allShareTrackings || []).map(s => ({
            Código: s.share_code,
            Cliques: s.clicks,
            Cadastros: s.signups,
            Compras: s.purchases,
            Créditos: `R$ ${Number(s.credits_earned).toFixed(2)}`,
            Status: s.is_active ? 'Ativo' : 'Inativo',
          }));
          columns = [
            { header: 'Código', key: 'Código' },
            { header: 'Cliques', key: 'Cliques' },
            { header: 'Cadastros', key: 'Cadastros' },
            { header: 'Compras', key: 'Compras' },
            { header: 'Créditos', key: 'Créditos' },
            { header: 'Status', key: 'Status' },
          ];
          filename = `compartilhamentos_${format(new Date(), 'yyyyMMdd')}`;
          title = 'Relatório de Compartilhamentos';
          break;

        case 'financial':
          data = (salesData || []).map(s => ({
            Tipo: s.product_type === 'raffle' ? 'Rifa' : 'Raspadinha',
            Produto: s.product_name || '',
            Valor: `R$ ${s.amount.toFixed(2)}`,
            Data: format(new Date(s.created_at), 'dd/MM/yyyy'),
          }));
          columns = [
            { header: 'Tipo', key: 'Tipo' },
            { header: 'Produto', key: 'Produto' },
            { header: 'Valor', key: 'Valor' },
            { header: 'Data', key: 'Data' },
          ];
          filename = `financeiro_${format(new Date(), 'yyyyMMdd')}`;
          title = 'Relatório Financeiro';
          break;
      }

      if (data.length === 0) {
        toast.error('Nenhum dado para exportar');
        return;
      }

      switch (exportFormat) {
        case 'csv':
          exportToCSV(data, { filename, title });
          break;
        case 'excel':
          exportToExcel(data, { filename, title });
          break;
        case 'pdf':
          exportToPDF(data, columns, { filename, title });
          break;
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setGeneratingReport(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-primary">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              Relatórios
            </h1>
            <p className="text-muted-foreground mt-1">
              Exporte dados em CSV, Excel ou PDF
            </p>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                locale={ptBR}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Report Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report) => (
            <Card key={report.id} className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={cn("p-3 rounded-xl", report.color)}>
                    {report.icon}
                  </div>
                </div>
                <CardTitle className="mt-4">{report.name}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateReport(report.id, 'csv')}
                    disabled={generatingReport === report.id}
                  >
                    {generatingReport === report.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        CSV
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateReport(report.id, 'excel')}
                    disabled={generatingReport === report.id}
                  >
                    {generatingReport === report.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateReport(report.id, 'pdf')}
                    disabled={generatingReport === report.id}
                  >
                    {generatingReport === report.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <File className="h-4 w-4 mr-2" />
                        PDF
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Período</CardTitle>
            <CardDescription>
              {format(dateRange.from, "dd 'de' MMMM", { locale: ptBR })} até{' '}
              {format(dateRange.to, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Vendas</p>
                <p className="text-2xl font-bold">{salesMetrics.totalSales}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Receita</p>
                <p className="text-2xl font-bold text-success">
                  R$ {salesMetrics.totalValue.toFixed(0)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Afiliados</p>
                <p className="text-2xl font-bold">{affiliates?.length || 0}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Compartilhamentos</p>
                <p className="text-2xl font-bold">{shareMetrics.totalShares}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
