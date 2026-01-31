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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Search, 
  Check,
  X,
  Clock,
  DollarSign,
  Loader2,
  TrendingUp,
  Percent,
  Link as LinkIcon,
  Instagram,
  Facebook,
  Eye
} from 'lucide-react';
import { useAffiliates } from '@/hooks/useAffiliates';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AffiliateStatus } from '@/types';

export default function AdminAfiliados() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [newCommission, setNewCommission] = useState<number>(10);
  
  const { 
    affiliates, 
    isLoadingAffiliates, 
    updateAffiliateStatus 
  } = useAffiliates();

  const filteredAffiliates = (affiliates || []).filter(affiliate => {
    const matchesSearch = affiliate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          affiliate.affiliate_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'all' || affiliate.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const metrics = {
    total: affiliates?.length || 0,
    pending: affiliates?.filter(a => a.status === 'pending').length || 0,
    approved: affiliates?.filter(a => a.status === 'approved').length || 0,
    totalSales: affiliates?.reduce((sum, a) => sum + Number(a.total_sales), 0) || 0,
    totalCommissions: affiliates?.reduce((sum, a) => sum + Number(a.total_commission), 0) || 0,
  };

  const getStatusBadge = (status: AffiliateStatus) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success"><Check className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive"><X className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      case 'suspended':
        return <Badge variant="secondary">Suspenso</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleApprove = async (affiliateId: string) => {
    await updateAffiliateStatus.mutateAsync({ 
      affiliateId, 
      status: 'approved',
      commission_percentage: newCommission
    });
    setSelectedAffiliate(null);
  };

  const handleReject = async (affiliateId: string) => {
    await updateAffiliateStatus.mutateAsync({ affiliateId, status: 'rejected' });
  };

  if (isLoadingAffiliates) {
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
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              Afiliados
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerenciamento do programa de afiliados
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{metrics.total}</p>
                </div>
                <Users className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-warning">{metrics.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aprovados</p>
                  <p className="text-2xl font-bold text-success">{metrics.approved}</p>
                </div>
                <Check className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vendas</p>
                  <p className="text-2xl font-bold">R$ {metrics.totalSales.toFixed(0)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Comissões</p>
                  <p className="text-2xl font-bold text-accent">R$ {metrics.totalCommissions.toFixed(0)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Affiliates List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Lista de Afiliados</CardTitle>
                <CardDescription>
                  {filteredAffiliates.length} afiliados encontrados
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="rejected">Rejeitados</SelectItem>
                  <SelectItem value="suspended">Suspensos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Afiliado</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Comissão Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAffiliates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum afiliado encontrado</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAffiliates.map((affiliate) => (
                      <TableRow key={affiliate.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={affiliate.avatar_url || ''} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {affiliate.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{affiliate.full_name}</p>
                              <p className="text-sm text-muted-foreground">{affiliate.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {affiliate.affiliate_code}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{affiliate.commission_percentage}%</span>
                        </TableCell>
                        <TableCell className="text-success font-semibold">
                          R$ {Number(affiliate.total_sales).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-accent font-semibold">
                          R$ {Number(affiliate.total_commission).toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setSelectedAffiliate(affiliate);
                                setNewCommission(affiliate.commission_percentage);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {affiliate.status === 'pending' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="text-success hover:text-success"
                                  onClick={() => handleApprove(affiliate.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleReject(affiliate.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Affiliate Details Dialog */}
        <Dialog open={!!selectedAffiliate} onOpenChange={() => setSelectedAffiliate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Afiliado</DialogTitle>
              <DialogDescription>
                Informações completas e configurações do afiliado
              </DialogDescription>
            </DialogHeader>

            {selectedAffiliate && (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="performance">Desempenho</TabsTrigger>
                  <TabsTrigger value="settings">Configurações</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedAffiliate.avatar_url || ''} />
                      <AvatarFallback className="text-xl bg-primary/10 text-primary">
                        {selectedAffiliate.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold">{selectedAffiliate.full_name}</h3>
                      <p className="text-muted-foreground">{selectedAffiliate.email}</p>
                      {getStatusBadge(selectedAffiliate.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">CPF</Label>
                      <p className="font-medium">{selectedAffiliate.cpf}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Telefone</Label>
                      <p className="font-medium">{selectedAffiliate.phone || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Endereço</Label>
                      <p className="font-medium">
                        {selectedAffiliate.address_street || '-'}, {selectedAffiliate.address_city || ''} - {selectedAffiliate.address_state || ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {selectedAffiliate.instagram && (
                      <a 
                        href={`https://instagram.com/${selectedAffiliate.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Instagram className="h-4 w-4" />
                        @{selectedAffiliate.instagram}
                      </a>
                    )}
                    {selectedAffiliate.facebook && (
                      <a 
                        href={selectedAffiliate.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </a>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Vendas Totais</p>
                        <p className="text-2xl font-bold text-success">
                          R$ {Number(selectedAffiliate.total_sales).toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Comissão Total</p>
                        <p className="text-2xl font-bold text-accent">
                          R$ {Number(selectedAffiliate.total_commission).toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Pendente</p>
                        <p className="text-2xl font-bold text-warning">
                          R$ {Number(selectedAffiliate.pending_commission).toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Pago</p>
                        <p className="text-2xl font-bold">
                          R$ {Number(selectedAffiliate.paid_commission).toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <LinkIcon className="h-4 w-4 text-primary" />
                      <span className="font-medium">Link de Afiliado</span>
                    </div>
                    <code className="text-sm bg-background p-2 rounded block">
                      {window.location.origin}/?ref={selectedAffiliate.affiliate_code}
                    </code>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div>
                    <Label>Percentual de Comissão</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        value={newCommission}
                        onChange={(e) => setNewCommission(Number(e.target.value))}
                        min={0}
                        max={100}
                        className="w-24"
                      />
                      <span>%</span>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedAffiliate(null)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={() => handleApprove(selectedAffiliate.id)}
                      disabled={updateAffiliateStatus.isPending}
                    >
                      {updateAffiliateStatus.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Salvar Alterações
                    </Button>
                  </DialogFooter>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
