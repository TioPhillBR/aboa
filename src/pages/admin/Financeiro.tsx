import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Wallet, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Percent
} from 'lucide-react';
import { useFinancial } from '@/hooks/useFinancial';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))'];

export default function AdminFinanceiro() {
  const [periodFilter, setPeriodFilter] = useState('30');
  const { transactions, isLoadingTransactions, summary, salesData, salesMetrics } = useFinancial();

  // Prepare chart data
  const salesByDay = (salesData || []).reduce((acc, sale) => {
    const date = format(new Date(sale.created_at), 'dd/MM');
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.value += sale.amount;
      existing.count += 1;
    } else {
      acc.push({ date, value: sale.amount, count: 1 });
    }
    return acc;
  }, [] as { date: string; value: number; count: number }[]).slice(-30);

  const revenueByType = [
    { name: 'Rifas', value: salesMetrics.raffleSales, color: 'hsl(var(--primary))' },
    { name: 'Raspadinhas', value: salesMetrics.scratchSales, color: 'hsl(var(--accent))' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'cancelled':
        return <Badge className="bg-destructive/10 text-destructive"><XCircle className="h-3 w-3 mr-1" />Cancelado</Badge>;
      case 'refunded':
        return <Badge className="bg-muted text-muted-foreground"><RefreshCw className="h-3 w-3 mr-1" />Reembolsado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoadingTransactions) {
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
              <div className="p-2 rounded-xl bg-gradient-success">
                <Wallet className="h-6 w-6 text-primary-foreground" />
              </div>
              Financeiro
            </h1>
            <p className="text-muted-foreground mt-1">
              Visão geral das finanças da plataforma
            </p>
          </div>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-success opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receita Total</p>
                  <p className="text-2xl font-bold text-success">
                    R$ {salesMetrics.totalValue.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-success">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>+12% vs período anterior</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendente</p>
                  <p className="text-2xl font-bold text-warning">
                    R$ {summary.totalPending.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aguardando confirmação
                  </p>
                </div>
                <div className="p-3 rounded-full bg-warning/10">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-fire opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxas Gateway</p>
                  <p className="text-2xl font-bold text-destructive">
                    R$ {summary.totalFees.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.totalRevenue > 0 
                      ? ((summary.totalFees / summary.totalRevenue) * 100).toFixed(1) 
                      : 0}% do total
                  </p>
                </div>
                <div className="p-3 rounded-full bg-destructive/10">
                  <Percent className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-gold opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Líquido</p>
                  <p className="text-2xl font-bold">
                    R$ {(salesMetrics.totalValue - summary.totalFees).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Após taxas
                  </p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Receita por Dia</CardTitle>
              <CardDescription>Evolução da receita nos últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesByDay}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `R$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vendas por Tipo</CardTitle>
              <CardDescription>Distribuição de vendas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {revenueByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>
              Últimas transações de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Taxa</TableHead>
                    <TableHead>Líquido</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!transactions || transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma transação registrada</p>
                        <p className="text-sm">As transações aparecerão aqui quando houver pagamentos</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.slice(0, 20).map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="capitalize">{tx.transaction_type}</TableCell>
                        <TableCell className="font-semibold">
                          R$ {Number(tx.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-destructive">
                          R$ {Number(tx.gateway_fee).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-success font-semibold">
                          R$ {Number(tx.net_amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {tx.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(tx.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(tx.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
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
