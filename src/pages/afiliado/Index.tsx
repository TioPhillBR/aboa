import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  ArrowRight
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
    affiliateWithdrawals 
  } = useAffiliates();

  const copyAffiliateLink = () => {
    if (myAffiliateProfile) {
      navigator.clipboard.writeText(`${window.location.origin}/?ref=${myAffiliateProfile.affiliate_code}`);
      toast.success('Link copiado!');
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
      <main className="container mx-auto px-4 py-8">
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
              Afiliado Aprovado
            </Badge>
          </div>

          {/* Affiliate Link */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Seu Link de Afiliado</p>
                  <code className="text-lg font-mono bg-background/50 px-3 py-1 rounded">
                    {window.location.origin}/?ref={myAffiliateProfile.affiliate_code}
                  </code>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={copyAffiliateLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Compartilhar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Comissão</p>
                    <p className="text-2xl font-bold">{myAffiliateProfile.commission_percentage}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Vendas Totais</p>
                    <p className="text-2xl font-bold text-success">
                      R$ {Number(myAffiliateProfile.total_sales).toFixed(2)}
                    </p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-success opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Comissão Total</p>
                    <p className="text-2xl font-bold text-accent">
                      R$ {Number(myAffiliateProfile.total_commission).toFixed(2)}
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
                    <p className="text-sm text-muted-foreground">Disponível</p>
                    <p className="text-2xl font-bold text-warning">
                      R$ {Number(myAffiliateProfile.pending_commission).toFixed(2)}
                    </p>
                  </div>
                  <Wallet className="h-8 w-8 text-warning opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Comissões por Dia</CardTitle>
              <CardDescription>Evolução das suas comissões</CardDescription>
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

          {/* Recent Sales */}
          <Card>
            <CardHeader>
              <CardTitle>Vendas Recentes</CardTitle>
              <CardDescription>Suas últimas vendas como afiliado</CardDescription>
            </CardHeader>
            <CardContent>
              {!affiliateSales || affiliateSales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma venda registrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {affiliateSales.slice(0, 10).map((sale) => (
                    <div 
                      key={sale.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
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
                          Comissão: R$ {Number(sale.commission_amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
