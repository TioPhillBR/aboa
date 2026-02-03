import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Users, 
  DollarSign,
  TrendingUp,
  Clock,
  LinkIcon,
  Copy,
  ExternalLink,
  Wallet,
  ShoppingCart,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Banknote,
  Share2,
  BarChart3
} from 'lucide-react';
import { useAffiliates } from '@/hooks/useAffiliates';
import { toast } from 'sonner';
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
} from 'recharts';

export default function AfiliadoDashboard() {
  const { 
    myAffiliateProfile, 
    isLoadingMyProfile, 
    affiliateSales,
    affiliateWithdrawals,
    requestWithdrawal
  } = useAffiliates();

  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);

  const copyAffiliateLink = () => {
    if (myAffiliateProfile) {
      navigator.clipboard.writeText(`${window.location.origin}/?ref=${myAffiliateProfile.affiliate_code}`);
      toast.success('Link copiado!');
    }
  };

  const shareAffiliateLink = async () => {
    if (myAffiliateProfile && navigator.share) {
      try {
        await navigator.share({
          title: 'A Boa - Sorteios e Raspadinhas',
          text: 'Participe dos melhores sorteios e raspadinhas online!',
          url: `${window.location.origin}/?ref=${myAffiliateProfile.affiliate_code}`
        });
      } catch {
        copyAffiliateLink();
      }
    } else {
      copyAffiliateLink();
    }
  };

  const handleWithdrawalRequest = async () => {
    const amount = parseFloat(withdrawalAmount);
    
    if (!amount || amount <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    if (amount > Number(myAffiliateProfile?.pending_commission || 0)) {
      toast.error('Saldo insuficiente');
      return;
    }

    if (!pixKey.trim()) {
      toast.error('Digite sua chave PIX');
      return;
    }

    try {
      await requestWithdrawal.mutateAsync({ amount, pix_key: pixKey });
      setWithdrawDialogOpen(false);
      setWithdrawalAmount('');
      setPixKey('');
    } catch {
      // Error handled in hook
    }
  };

  // Prepare chart data
  const salesByDay = (affiliateSales || []).reduce((acc, sale) => {
    const date = format(new Date(sale.created_at), 'dd/MM');
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.value += Number(sale.commission_amount);
    } else {
      acc.push({ date, value: Number(sale.commission_amount) });
    }
    return acc;
  }, [] as { date: string; value: number }[]).slice(-30);

  const pendingWithdrawals = affiliateWithdrawals?.filter(w => w.status === 'pending') || [];
  const paidWithdrawals = affiliateWithdrawals?.filter(w => w.status === 'paid') || [];

  const getWithdrawalStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30"><CheckCircle2 className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30"><CheckCircle2 className="h-3 w-3 mr-1" />Pago</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoadingMyProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  // User is not an affiliate yet
  if (!myAffiliateProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-primary rounded-full blur-2xl opacity-30" />
              <div className="relative p-8 rounded-full bg-gradient-primary/10">
                <Users className="h-16 w-16 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">Seja um Afiliado!</h1>
            <p className="text-muted-foreground mb-8">
              Ganhe comissões indicando nossa plataforma. Compartilhe seu link único e receba uma porcentagem de todas as vendas realizadas através dele.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6 text-center">
                  <LinkIcon className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold">Link Único</p>
                  <p className="text-sm text-muted-foreground">Seu código exclusivo</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <DollarSign className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="font-semibold">Comissões</p>
                  <p className="text-sm text-muted-foreground">Ganhe em cada venda</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Wallet className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="font-semibold">Saques</p>
                  <p className="text-sm text-muted-foreground">Via PIX</p>
                </CardContent>
              </Card>
            </div>
            <Button size="lg" asChild>
              <Link to="/afiliado/cadastro">
                Cadastrar como Afiliado
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Affiliate is pending approval
  if (myAffiliateProfile.status === 'pending') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-warning/20 rounded-full blur-2xl" />
              <div className="relative p-8 rounded-full bg-warning/10">
                <Clock className="h-16 w-16 text-warning" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">Aguardando Aprovação</h1>
            <p className="text-muted-foreground mb-6">
              Seu cadastro de afiliado está em análise. Você será notificado assim que for aprovado.
            </p>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Seu código de afiliado</p>
                    <p className="font-mono text-lg font-bold">{myAffiliateProfile.affiliate_code}</p>
                  </div>
                  <Badge className="bg-warning/10 text-warning">
                    <Clock className="h-3 w-3 mr-1" />
                    Pendente
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Affiliate is rejected
  if (myAffiliateProfile.status === 'rejected') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-destructive/20 rounded-full blur-2xl" />
              <div className="relative p-8 rounded-full bg-destructive/10">
                <AlertCircle className="h-16 w-16 text-destructive" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">Cadastro Rejeitado</h1>
            <p className="text-muted-foreground mb-6">
              Infelizmente seu cadastro de afiliado não foi aprovado. Entre em contato com o suporte para mais informações.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Approved affiliate dashboard
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Painel do Afiliado</h1>
              <p className="text-muted-foreground">
                Bem-vindo, {myAffiliateProfile.full_name}!
              </p>
            </div>
            <Badge className="bg-success/10 text-success w-fit">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Afiliado Aprovado
            </Badge>
          </div>

          {/* Affiliate Link */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Seu Link de Afiliado</p>
                  <code className="text-sm sm:text-base font-mono bg-background/50 px-3 py-1.5 rounded block truncate">
                    {window.location.origin}/?ref={myAffiliateProfile.affiliate_code}
                  </code>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="secondary" onClick={copyAffiliateLink} size="sm">
                    <Copy className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Copiar</span>
                  </Button>
                  <Button variant="outline" onClick={shareAffiliateLink} size="sm">
                    <Share2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Compartilhar</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Comissão</p>
                    <p className="text-xl sm:text-2xl font-bold">{myAffiliateProfile.commission_percentage}%</p>
                  </div>
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Vendas</p>
                    <p className="text-xl sm:text-2xl font-bold text-success">
                      R$ {Number(myAffiliateProfile.total_sales).toFixed(2)}
                    </p>
                  </div>
                  <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-success opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Ganhos</p>
                    <p className="text-xl sm:text-2xl font-bold text-accent">
                      R$ {Number(myAffiliateProfile.total_commission).toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-accent opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/30">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Disponível</p>
                    <p className="text-xl sm:text-2xl font-bold text-warning">
                      R$ {Number(myAffiliateProfile.pending_commission).toFixed(2)}
                    </p>
                  </div>
                  <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-warning opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Withdrawal Button */}
          <div className="flex justify-end">
            <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-primary hover:opacity-90"
                  disabled={Number(myAffiliateProfile.pending_commission) <= 0}
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Solicitar Saque
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Solicitar Saque</DialogTitle>
                  <DialogDescription>
                    Saldo disponível: <span className="font-semibold text-warning">R$ {Number(myAffiliateProfile.pending_commission).toFixed(2)}</span>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="amount">Valor do Saque</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      max={Number(myAffiliateProfile.pending_commission)}
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pix">Chave PIX</Label>
                    <Input
                      id="pix"
                      placeholder="CPF, Email, Telefone ou Chave Aleatória"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleWithdrawalRequest}
                    disabled={requestWithdrawal.isPending}
                  >
                    {requestWithdrawal.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Banknote className="h-4 w-4 mr-2" />
                    )}
                    Confirmar Saque
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger value="sales" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Vendas</span>
              </TabsTrigger>
              <TabsTrigger value="withdrawals" className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                <span className="hidden sm:inline">Saques</span>
                {pendingWithdrawals.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {pendingWithdrawals.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Comissões por Dia</CardTitle>
                  <CardDescription>Evolução das suas comissões nos últimos 30 dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {salesByDay.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesByDay}>
                          <defs>
                            <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" className="text-xs fill-muted-foreground" />
                          <YAxis className="text-xs fill-muted-foreground" tickFormatter={(v) => `R$${v}`} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Comissão']}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="hsl(var(--primary))" 
                            fillOpacity={1} 
                            fill="url(#colorCommission)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Nenhuma venda registrada ainda</p>
                          <p className="text-sm">Compartilhe seu link para começar!</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-primary">{affiliateSales?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Vendas Realizadas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-success">R$ {Number(myAffiliateProfile.paid_commission).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Já Sacado</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-warning">{affiliateWithdrawals?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Saques Solicitados</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="sales">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Vendas</CardTitle>
                  <CardDescription>Todas as vendas realizadas através do seu link</CardDescription>
                </CardHeader>
                <CardContent>
                  {!affiliateSales || affiliateSales.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">Nenhuma venda registrada</p>
                      <p className="text-sm">Compartilhe seu link para começar a ganhar!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {affiliateSales.map((sale) => (
                        <div 
                          key={sale.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div>
                            <p className="font-medium capitalize">{sale.product_type}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(sale.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Venda: R$ {Number(sale.sale_amount).toFixed(2)}
                            </p>
                            <p className="font-semibold text-success">
                              +R$ {Number(sale.commission_amount).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="withdrawals">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Saques</CardTitle>
                  <CardDescription>Suas solicitações de saque e status</CardDescription>
                </CardHeader>
                <CardContent>
                  {!affiliateWithdrawals || affiliateWithdrawals.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Banknote className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">Nenhum saque solicitado</p>
                      <p className="text-sm">Acumule comissões e solicite seu saque</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {affiliateWithdrawals.map((withdrawal) => (
                        <div 
                          key={withdrawal.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                        >
                          <div>
                            <p className="font-semibold">R$ {Number(withdrawal.amount).toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(withdrawal.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                            {withdrawal.pix_key && (
                              <p className="text-xs text-muted-foreground mt-1">
                                PIX: {withdrawal.pix_key}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {getWithdrawalStatusBadge(withdrawal.status)}
                            {withdrawal.processed_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(withdrawal.processed_at), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}