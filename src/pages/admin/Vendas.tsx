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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ShoppingCart, 
  Search, 
  Download, 
  TrendingUp,
  Ticket,
  Sparkles,
  DollarSign,
  Loader2,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { useFinancial } from '@/hooks/useFinancial';
import { useExport } from '@/hooks/useExport';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminVendas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState<string>('all');
  const { salesData, isLoadingSales, salesMetrics } = useFinancial();
  const { exportToCSV, exportToExcel, exportToPDF } = useExport();

  const filteredSales = (salesData || []).filter(sale => {
    const matchesSearch = sale.product_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = productFilter === 'all' || sale.product_type === productFilter;
    return matchesSearch && matchesFilter;
  });

  const handleExportCSV = () => {
    exportToCSV(
      filteredSales.map(s => ({
        ID: s.id,
        Tipo: s.product_type === 'raffle' ? 'Rifa' : 'Raspadinha',
        Produto: s.product_name || '',
        Valor: `R$ ${s.amount.toFixed(2)}`,
        Data: format(new Date(s.created_at), 'dd/MM/yyyy HH:mm'),
      })),
      { filename: 'vendas', title: 'Relatório de Vendas' }
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      filteredSales.map(s => ({
        ID: s.id,
        Tipo: s.product_type === 'raffle' ? 'Rifa' : 'Raspadinha',
        Produto: s.product_name || '',
        Valor: s.amount,
        Data: format(new Date(s.created_at), 'dd/MM/yyyy HH:mm'),
      })),
      { filename: 'vendas', title: 'Vendas' }
    );
  };

  const handleExportPDF = () => {
    exportToPDF(
      filteredSales.map(s => ({
        id: s.id.substring(0, 8),
        tipo: s.product_type === 'raffle' ? 'Rifa' : 'Raspadinha',
        produto: s.product_name || '',
        valor: `R$ ${s.amount.toFixed(2)}`,
        data: format(new Date(s.created_at), 'dd/MM/yyyy HH:mm'),
      })),
      [
        { header: 'ID', key: 'id' },
        { header: 'Tipo', key: 'tipo' },
        { header: 'Produto', key: 'produto' },
        { header: 'Valor', key: 'valor' },
        { header: 'Data', key: 'data' },
      ],
      { filename: 'vendas', title: 'Relatório de Vendas' }
    );
  };

  if (isLoadingSales) {
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
                <ShoppingCart className="h-6 w-6 text-primary-foreground" />
              </div>
              Vendas
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerenciamento de vendas de rifas e raspadinhas
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Vendas</p>
                  <p className="text-2xl font-bold">{salesMetrics.totalSales}</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold text-success">
                    R$ {salesMetrics.totalValue.toFixed(0)}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-success/10">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold">
                    R$ {salesMetrics.averageTicket.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-accent/20">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-primary" />
                  <span className="text-sm">{salesMetrics.raffleSales} rifas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="text-sm">{salesMetrics.scratchSales} raspadinhas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Lista de Vendas</CardTitle>
                <CardDescription>
                  {filteredSales.length} vendas encontradas
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="raffle">Rifas</SelectItem>
                  <SelectItem value="scratch_card">Raspadinhas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhuma venda encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSales.slice(0, 50).map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {sale.product_type === 'raffle' ? (
                              <Ticket className="h-4 w-4 text-primary" />
                            ) : (
                              <Sparkles className="h-4 w-4 text-accent" />
                            )}
                            <span className="text-sm">
                              {sale.product_type === 'raffle' ? 'Rifa' : 'Raspadinha'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {sale.product_name || '-'}
                        </TableCell>
                        <TableCell className="text-success font-semibold">
                          R$ {sale.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-success/10 text-success">
                            Aprovado
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(sale.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
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
