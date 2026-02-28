import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
  Eye,
  MoreHorizontal,
  Pause,
  Ban,
  Pencil,
  Trash2,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Hash,
  Globe,
} from 'lucide-react';
import { useAffiliates } from '@/hooks/useAffiliates';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { AffiliateStatus } from '@/types';

export default function AdminAfiliados() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [viewAffiliate, setViewAffiliate] = useState<any>(null);
  const [viewAffiliateEmail, setViewAffiliateEmail] = useState<string | null>(null);
  const [editAffiliate, setEditAffiliate] = useState<any>(null);
  const [deleteAffiliate, setDeleteAffiliate] = useState<any>(null);
  const [newCommission, setNewCommission] = useState<number>(10);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch email from auth.users when viewing affiliate
  useEffect(() => {
    if (!viewAffiliate?.user_id) {
      setViewAffiliateEmail(null);
      return;
    }
    setViewAffiliateEmail(null);
    supabase.functions.invoke('get-user-email', {
      body: { user_id: viewAffiliate.user_id },
    }).then(({ data, error }) => {
      if (!error && data?.email) {
        setViewAffiliateEmail(data.email);
      }
    });
  }, [viewAffiliate?.user_id]);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    commission_percentage: 10,
    instagram: '',
    facebook: '',
    tiktok: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
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
        return <Badge variant="secondary"><Pause className="h-3 w-3 mr-1" />Suspenso</Badge>;
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

  const handleSuspend = async (affiliateId: string) => {
    await updateAffiliateStatus.mutateAsync({ affiliateId, status: 'suspended' });
  };

  const handleDelete = async () => {
    if (!deleteAffiliate) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('affiliates')
        .delete()
        .eq('id', deleteAffiliate.id);
      if (error) throw error;
      toast.success('Afiliado excluído com sucesso');
      setDeleteAffiliate(null);
      // Refetch handled by react-query
    } catch (error) {
      console.error('Error deleting affiliate:', error);
      toast.error('Erro ao excluir afiliado');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (affiliate: any) => {
    setEditForm({
      full_name: affiliate.full_name || '',
      email: affiliate.email || '',
      phone: affiliate.phone || '',
      commission_percentage: affiliate.commission_percentage || 10,
      instagram: affiliate.instagram || '',
      facebook: affiliate.facebook || '',
      tiktok: affiliate.tiktok || '',
      address_street: affiliate.address_street || '',
      address_city: affiliate.address_city || '',
      address_state: affiliate.address_state || '',
      address_zip: affiliate.address_zip || '',
    });
    setEditAffiliate(affiliate);
  };

  const handleSaveEdit = async () => {
    if (!editAffiliate) return;
    setIsSavingEdit(true);
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({
          full_name: editForm.full_name,
          email: editForm.email || null,
          phone: editForm.phone || null,
          commission_percentage: editForm.commission_percentage,
          instagram: editForm.instagram || null,
          facebook: editForm.facebook || null,
          tiktok: editForm.tiktok || null,
          address_street: editForm.address_street || null,
          address_city: editForm.address_city || null,
          address_state: editForm.address_state || null,
          address_zip: editForm.address_zip || null,
        })
        .eq('id', editAffiliate.id);
      if (error) throw error;
      toast.success('Afiliado atualizado com sucesso');
      setEditAffiliate(null);
    } catch (error) {
      console.error('Error updating affiliate:', error);
      toast.error('Erro ao atualizar afiliado');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
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
                    <TableHead className="text-right">Ações</TableHead>
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
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewAffiliate(affiliate)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(affiliate)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {affiliate.status === 'pending' && (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedAffiliate(affiliate);
                                    setNewCommission(affiliate.commission_percentage);
                                  }}
                                  className="text-success"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Aprovar
                                </DropdownMenuItem>
                              )}
                              {affiliate.status === 'approved' && (
                                <DropdownMenuItem 
                                  onClick={() => handleSuspend(affiliate.id)}
                                  className="text-warning"
                                >
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pausar
                                </DropdownMenuItem>
                              )}
                              {affiliate.status !== 'rejected' && affiliate.status !== 'suspended' && (
                                <DropdownMenuItem 
                                  onClick={() => handleReject(affiliate.id)}
                                  className="text-destructive"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Desativar
                                </DropdownMenuItem>
                              )}
                              {(affiliate.status === 'suspended' || affiliate.status === 'rejected') && (
                                <DropdownMenuItem 
                                  onClick={() => handleApprove(affiliate.id)}
                                  className="text-success"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Reativar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeleteAffiliate(affiliate)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ===== VIEW AFFILIATE MODAL ===== */}
        <Dialog open={!!viewAffiliate} onOpenChange={() => setViewAffiliate(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Afiliado</DialogTitle>
              <DialogDescription>
                Informações completas do afiliado cadastrado no sistema
              </DialogDescription>
            </DialogHeader>

            {viewAffiliate && (
              <div className="space-y-6">
                {/* Header with avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={viewAffiliate.avatar_url || ''} />
                    <AvatarFallback className="text-xl bg-primary/10 text-primary">
                      {viewAffiliate.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{viewAffiliate.full_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(viewAffiliate.status)}
                      <Badge variant="outline" className="font-mono">
                        {viewAffiliate.affiliate_code}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Personal Info */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Dados Pessoais
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">CPF</p>
                        <p className="font-medium">{viewAffiliate.cpf || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">E-mail</p>
                        <p className="font-medium">{viewAffiliateEmail || viewAffiliate.email || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Telefone</p>
                        <p className="font-medium">{viewAffiliate.phone || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Código de Afiliado</p>
                        <p className="font-medium font-mono">{viewAffiliate.affiliate_code}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Address */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Endereço
                  </h4>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {viewAffiliate.address_street || 'Não informado'}
                      </p>
                      {(viewAffiliate.address_city || viewAffiliate.address_state) && (
                        <p className="text-sm text-muted-foreground">
                          {[viewAffiliate.address_city, viewAffiliate.address_state].filter(Boolean).join(' - ')}
                        </p>
                      )}
                      {viewAffiliate.address_zip && (
                        <p className="text-sm text-muted-foreground">CEP: {viewAffiliate.address_zip}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Social Media */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Redes Sociais
                  </h4>
                  <div className="flex flex-wrap items-center gap-4">
                    {viewAffiliate.instagram ? (
                      <a 
                        href={`https://instagram.com/${viewAffiliate.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Instagram className="h-4 w-4" />
                        @{viewAffiliate.instagram}
                      </a>
                    ) : null}
                    {viewAffiliate.facebook ? (
                      <a 
                        href={viewAffiliate.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </a>
                    ) : null}
                    {viewAffiliate.tiktok ? (
                      <a
                        href={`https://tiktok.com/@${viewAffiliate.tiktok}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                        TikTok
                      </a>
                    ) : null}
                    {!viewAffiliate.instagram && !viewAffiliate.facebook && !viewAffiliate.tiktok && (
                      <p className="text-sm text-muted-foreground">Nenhuma rede social cadastrada</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Financial */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Financeiro
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Comissão</p>
                      <p className="text-lg font-bold text-primary">{viewAffiliate.commission_percentage}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Vendas</p>
                      <p className="text-lg font-bold text-success">R$ {Number(viewAffiliate.total_sales).toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Pendente</p>
                      <p className="text-lg font-bold text-warning">R$ {Number(viewAffiliate.pending_commission).toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Pago</p>
                      <p className="text-lg font-bold">R$ {Number(viewAffiliate.paid_commission).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Dates & Meta */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Datas
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Cadastro</p>
                        <p className="font-medium">{formatDate(viewAffiliate.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Última atualização</p>
                        <p className="font-medium">{formatDate(viewAffiliate.updated_at)}</p>
                      </div>
                    </div>
                    {viewAffiliate.approved_at && (
                      <div className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-success mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Aprovado em</p>
                          <p className="font-medium">{formatDate(viewAffiliate.approved_at)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Affiliate Link */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <LinkIcon className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Link de Afiliado</span>
                  </div>
                  <code className="text-sm bg-background p-2 rounded block break-all">
                    {window.location.origin}/?ref={viewAffiliate.affiliate_code}
                  </code>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ===== EDIT AFFILIATE MODAL ===== */}
        <Dialog open={!!editAffiliate} onOpenChange={() => setEditAffiliate(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Afiliado</DialogTitle>
              <DialogDescription>
                Altere os dados do afiliado
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Nome completo</Label>
                <Input value={editForm.full_name} onChange={(e) => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>E-mail</Label>
                  <Input value={editForm.email} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Comissão (%)</Label>
                <Input type="number" min={0} max={100} value={editForm.commission_percentage} onChange={(e) => setEditForm(f => ({ ...f, commission_percentage: Number(e.target.value) }))} className="w-28" />
              </div>
              <Separator />
              <div>
                <Label>Endereço</Label>
                <Input value={editForm.address_street} onChange={(e) => setEditForm(f => ({ ...f, address_street: e.target.value }))} placeholder="Rua" className="mb-2" />
                <div className="grid grid-cols-3 gap-2">
                  <Input value={editForm.address_city} onChange={(e) => setEditForm(f => ({ ...f, address_city: e.target.value }))} placeholder="Cidade" />
                  <Input value={editForm.address_state} onChange={(e) => setEditForm(f => ({ ...f, address_state: e.target.value }))} placeholder="Estado" />
                  <Input value={editForm.address_zip} onChange={(e) => setEditForm(f => ({ ...f, address_zip: e.target.value }))} placeholder="CEP" />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Instagram</Label>
                  <Input value={editForm.instagram} onChange={(e) => setEditForm(f => ({ ...f, instagram: e.target.value }))} placeholder="@usuario" />
                </div>
                <div>
                  <Label>Facebook</Label>
                  <Input value={editForm.facebook} onChange={(e) => setEditForm(f => ({ ...f, facebook: e.target.value }))} placeholder="URL" />
                </div>
                <div>
                  <Label>TikTok</Label>
                  <Input value={editForm.tiktok} onChange={(e) => setEditForm(f => ({ ...f, tiktok: e.target.value }))} placeholder="@usuario" />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditAffiliate(null)}>Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
                {isSavingEdit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===== APPROVE DIALOG (existing) ===== */}
        <Dialog open={!!selectedAffiliate} onOpenChange={() => setSelectedAffiliate(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Aprovar Afiliado</DialogTitle>
              <DialogDescription>
                Defina o percentual de comissão e aprove o afiliado
              </DialogDescription>
            </DialogHeader>

            {selectedAffiliate && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedAffiliate.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedAffiliate.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedAffiliate.full_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedAffiliate.email}</p>
                  </div>
                </div>

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
                  <Button variant="outline" onClick={() => setSelectedAffiliate(null)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => handleApprove(selectedAffiliate.id)}
                    disabled={updateAffiliateStatus.isPending}
                  >
                    {updateAffiliateStatus.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Aprovar
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ===== DELETE CONFIRMATION ===== */}
        <AlertDialog open={!!deleteAffiliate} onOpenChange={() => setDeleteAffiliate(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir afiliado</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o afiliado <strong>{deleteAffiliate?.full_name}</strong>? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
