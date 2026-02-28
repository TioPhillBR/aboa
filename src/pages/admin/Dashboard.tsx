import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  LayoutDashboard, 
  Ticket, 
  Sparkles, 
  Users, 
  Trophy,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Calendar,
  Loader2,
  Gift,
  Banknote,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Percent,
  UserPlus,
  Shield,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardData {
  // Bloco 1: Caixa Real
  totalDeposits: number;
  totalUserWithdrawals: number;
  totalAdminWithdrawals: number;
  caixaReal: number;
  saldoPrincipalTotal: number;
  disponivelAdmin: number;

  // Bloco 2: Resultado Operacional
  receitaSorteios: number;
  receitaRaspadinhas: number;
  premiosSorteios: number;
  premiosRaspadinhas: number;
  margemSorteios: number;
  margemRaspadinhas: number;
  margemTotal: number;

  // Bloco 3: Saldos Carteiras
  saldoPrincipal: number;
  saldoBonus: number;
  saldoAfiliados: number;
  percentualBonus: number;

  // Bloco 4: Programa Bônus/Indicações
  totalIndicados: number;
  custoBonusIndicacao: number;
  comissoesAfiliados: number;
  custoTotalPrograma: number;
  custoPercentualReceita: number;

  // Bloco 5: Performance Jogos
  raspadinhaJogadas: number;
  raspadinhaReceita: number;
  raspadinhaPremios: number;
  raspadinhaTaxaVitoria: number;
  raspadinhaRTP: number;
  raspadinhaMargemCasa: number;
  sorteiosAtivos: number;
  sorteiosFinalizados: number;
  sorteiosTotal: number;

  // Bloco 6: Usuários e Engajamento
  totalUsuarios: number;
  usuariosComDeposito: number;
  taxaConversao: number;
  ticketMedioDeposito: number;
  gastoMedioJogos: number;

  // Bloco 7: Alertas
  alertaCaixaInsuficiente: boolean;
  alertaBonusAlto: boolean;
  alertaRTPBaixo: boolean;
}

const initialData: DashboardData = {
  totalDeposits: 0, totalUserWithdrawals: 0, totalAdminWithdrawals: 0,
  caixaReal: 0, saldoPrincipalTotal: 0, disponivelAdmin: 0,
  receitaSorteios: 0, receitaRaspadinhas: 0, premiosSorteios: 0,
  premiosRaspadinhas: 0, margemSorteios: 0, margemRaspadinhas: 0, margemTotal: 0,
  saldoPrincipal: 0, saldoBonus: 0, saldoAfiliados: 0, percentualBonus: 0,
  totalIndicados: 0, custoBonusIndicacao: 0, comissoesAfiliados: 0,
  custoTotalPrograma: 0, custoPercentualReceita: 0,
  raspadinhaJogadas: 0, raspadinhaReceita: 0, raspadinhaPremios: 0,
  raspadinhaTaxaVitoria: 0, raspadinhaRTP: 0, raspadinhaMargemCasa: 0,
  sorteiosAtivos: 0, sorteiosFinalizados: 0, sorteiosTotal: 0,
  totalUsuarios: 0, usuariosComDeposito: 0, taxaConversao: 0,
  ticketMedioDeposito: 0, gastoMedioJogos: 0,
  alertaCaixaInsuficiente: false, alertaBonusAlto: false, alertaRTPBaixo: false,
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData>(initialData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        depositsResult,
        userWithdrawalsResult,
        walletsResult,
        allTransactionsResult,
        scratchPlaysResult,
        scratchRevenueResult,
        ticketsResult,
        rafflesResult,
        openRafflesResult,
        usersResult,
        referralsResult,
        affiliateSalesResult,
        scratchPrizesResult,
      ] = await Promise.all([
        // Total deposits
        supabase.from('wallet_transactions').select('amount').eq('type', 'deposit').limit(50000),
        // User withdrawals (approved)
        supabase.from('user_withdrawals').select('amount, status').limit(10000),
        // All wallets
        supabase.from('wallets').select('id, balance, user_id').limit(50000),
        // All wallet transactions for balance breakdown
        supabase.from('wallet_transactions').select('wallet_id, amount, source_type, type').limit(50000),
        // Scratch plays (revealed)
        supabase.from('scratch_chances').select('prize_won, is_revealed').eq('is_revealed', true).limit(50000),
        // Scratch revenue (price per play)
        supabase.from('scratch_chances').select('scratch_card_id, scratch_cards(price)').limit(50000),
        // Raffle tickets with price
        supabase.from('raffle_tickets').select('raffle_id, raffles(price)').limit(50000),
        // All raffles
        supabase.from('raffles').select('*', { count: 'exact', head: true }),
        // Open raffles
        supabase.from('raffles').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        // Total users
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        // Referrals
        supabase.from('referrals').select('bonus_awarded').limit(50000),
        // Affiliate sales
        supabase.from('affiliate_sales').select('commission_amount, commission_status').limit(50000),
        // Scratch prizes (raspadinhas)
        supabase.from('scratch_chances').select('prize_won').not('prize_won', 'is', null).gt('prize_won', 0).limit(50000),
      ]);

      // === BLOCO 1: CAIXA REAL ===
      const totalDeposits = (depositsResult.data || []).reduce((s, d) => s + Number(d.amount || 0), 0);
      
      const approvedWithdrawals = (userWithdrawalsResult.data || []).filter(w => w.status === 'approved' || w.status === 'paid');
      const totalUserWithdrawals = approvedWithdrawals.reduce((s, w) => s + Number(w.amount || 0), 0);
      
      // Admin withdrawals: não temos tabela específica, assumimos 0 por ora
      const totalAdminWithdrawals = 0;
      
      const caixaReal = totalDeposits - totalUserWithdrawals - totalAdminWithdrawals;

      // === Balance breakdown por carteira ===
      const wallets = walletsResult.data || [];
      const allTx = allTransactionsResult.data || [];
      const txByWallet = new Map<string, any[]>();
      for (const tx of allTx) {
        const list = txByWallet.get(tx.wallet_id) || [];
        list.push(tx);
        txByWallet.set(tx.wallet_id, list);
      }

      let platformMain = 0;
      let platformBonus = 0;
      let platformAfiliados = 0;
      const walletsWithDeposits = new Set<string>();

      for (const w of wallets) {
        const walletTotal = Number(w.balance || 0);
        const walletTx = txByWallet.get(w.id) || [];
        
        let principal = 0;
        let bonus = 0;
        let afiliado = 0;
        let hasDeposit = false;

        for (const tx of walletTx) {
          const amount = Number(tx.amount ?? 0);
          const sourceType = tx.source_type;
          
          if (tx.type === 'deposit') hasDeposit = true;

          if (amount > 0) {
            if (sourceType === 'referral' || sourceType === 'admin_bonus') {
              bonus += amount;
            } else if (sourceType === 'affiliate_commission') {
              afiliado += amount;
            } else {
              principal += amount;
            }
          } else if (amount < 0) {
            const debit = Math.abs(amount);
            if (sourceType === 'bonus_used') {
              bonus = Math.max(0, bonus - debit);
            } else {
              const fromBonus = Math.min(bonus, debit);
              bonus -= fromBonus;
              principal = Math.max(0, principal - (debit - fromBonus));
            }
          }
        }

        if (hasDeposit) walletsWithDeposits.add(w.user_id);

        const normalizedBonus = Math.max(0, Math.min(bonus, walletTotal));
        const normalizedAfiliado = Math.max(0, Math.min(afiliado, walletTotal - normalizedBonus));
        const normalizedPrincipal = Math.max(0, walletTotal - normalizedBonus - normalizedAfiliado);

        platformMain += normalizedPrincipal;
        platformBonus += normalizedBonus;
        platformAfiliados += normalizedAfiliado;
      }

      const saldoPrincipalTotal = platformMain;
      const disponivelAdmin = caixaReal - saldoPrincipalTotal;

      // === BLOCO 2: RESULTADO OPERACIONAL ===
      // Receita Sorteios = soma dos preços dos tickets vendidos
      const receitaSorteios = (ticketsResult.data || []).reduce((s: number, t: any) => {
        return s + Number(t.raffles?.price || 0);
      }, 0);

      // Receita Raspadinhas
      const receitaRaspadinhas = (scratchRevenueResult.data || []).reduce((s: number, c: any) => {
        return s + Number(c.scratch_cards?.price || 0);
      }, 0);

      // Prêmios raspadinhas
      const premiosRaspadinhas = (scratchPrizesResult.data || []).reduce((s, p) => s + Number(p.prize_won || 0), 0);

      // Prêmios sorteios: valor dos prêmios pagos em sorteios (via raffle_prizes não temos valor direto, usamos 0 por ora)
      const premiosSorteios = 0; // TODO: implementar quando houver rastreamento

      const margemSorteios = receitaSorteios > 0 ? ((receitaSorteios - premiosSorteios) / receitaSorteios) * 100 : 0;
      const margemRaspadinhas = receitaRaspadinhas > 0 ? ((receitaRaspadinhas - premiosRaspadinhas) / receitaRaspadinhas) * 100 : 0;
      const receitaTotal = receitaSorteios + receitaRaspadinhas;
      const premiosTotal = premiosSorteios + premiosRaspadinhas;
      const margemTotal = receitaTotal > 0 ? ((receitaTotal - premiosTotal) / receitaTotal) * 100 : 0;

      // === BLOCO 3: SALDOS NAS CARTEIRAS ===
      const saldoTotal = platformMain + platformBonus + platformAfiliados;
      const percentualBonus = saldoTotal > 0 ? (platformBonus / saldoTotal) * 100 : 0;

      // === BLOCO 4: PROGRAMA BÔNUS/INDICAÇÕES ===
      const referrals = referralsResult.data || [];
      const totalIndicados = referrals.length;
      const custoBonusIndicacao = referrals.reduce((s, r) => s + Number(r.bonus_awarded || 0), 0);
      const affiliateSales = affiliateSalesResult.data || [];
      const comissoesAfiliados = affiliateSales.reduce((s, a) => s + Number(a.commission_amount || 0), 0);
      const custoTotalPrograma = custoBonusIndicacao + comissoesAfiliados;
      const custoPercentualReceita = receitaTotal > 0 ? (custoTotalPrograma / receitaTotal) * 100 : 0;

      // === BLOCO 5: PERFORMANCE JOGOS ===
      const scratchPlays = scratchPlaysResult.data || [];
      const raspadinhaJogadas = scratchPlays.length;
      const raspadinhaVitorias = scratchPlays.filter(p => p.prize_won && p.prize_won > 0).length;
      const raspadinhaTaxaVitoria = raspadinhaJogadas > 0 ? (raspadinhaVitorias / raspadinhaJogadas) * 100 : 0;
      const raspadinhaRTP = receitaRaspadinhas > 0 ? (premiosRaspadinhas / receitaRaspadinhas) * 100 : 0;
      const raspadinhaMargemCasa = 100 - raspadinhaRTP;

      // === BLOCO 6: USUÁRIOS ===
      const totalUsuarios = usersResult.count || 0;
      const usuariosComDeposito = walletsWithDeposits.size;
      const taxaConversao = totalUsuarios > 0 ? (usuariosComDeposito / totalUsuarios) * 100 : 0;
      
      const depositTxCount = (depositsResult.data || []).length;
      const ticketMedioDeposito = depositTxCount > 0 ? totalDeposits / depositTxCount : 0;
      
      const gastoMedioJogos = totalUsuarios > 0 ? receitaTotal / totalUsuarios : 0;

      // === BLOCO 7: ALERTAS ===
      const alertaCaixaInsuficiente = disponivelAdmin < 0;
      const alertaBonusAlto = percentualBonus > 30;
      const alertaRTPBaixo = raspadinhaRTP < 30 && raspadinhaJogadas > 0;

      setData({
        totalDeposits, totalUserWithdrawals, totalAdminWithdrawals,
        caixaReal, saldoPrincipalTotal, disponivelAdmin,
        receitaSorteios, receitaRaspadinhas, premiosSorteios, premiosRaspadinhas,
        margemSorteios, margemRaspadinhas, margemTotal,
        saldoPrincipal: platformMain, saldoBonus: platformBonus,
        saldoAfiliados: platformAfiliados, percentualBonus,
        totalIndicados, custoBonusIndicacao, comissoesAfiliados,
        custoTotalPrograma, custoPercentualReceita,
        raspadinhaJogadas, raspadinhaReceita: receitaRaspadinhas,
        raspadinhaPremios: premiosRaspadinhas, raspadinhaTaxaVitoria,
        raspadinhaRTP, raspadinhaMargemCasa,
        sorteiosAtivos: openRafflesResult.count || 0,
        sorteiosFinalizados: (rafflesResult.count || 0) - (openRafflesResult.count || 0),
        sorteiosTotal: rafflesResult.count || 0,
        totalUsuarios, usuariosComDeposito, taxaConversao,
        ticketMedioDeposito, gastoMedioJogos,
        alertaCaixaInsuficiente, alertaBonusAlto, alertaRTPBaixo,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const hasAlerts = data.alertaCaixaInsuficiente || data.alertaBonusAlto || data.alertaRTPBaixo;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-primary">
                <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
              </div>
              Dashboard Financeiro
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestão financeira consolidada da plataforma
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Forçar Reload
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Forçar recarregamento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá recarregar a página de todos os usuários conectados imediatamente. Deseja continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={async () => {
                    const channel = supabase.channel('force-reload');
                    await channel.send({
                      type: 'broadcast',
                      event: 'force-reload',
                      payload: { timestamp: Date.now() },
                    });
                    supabase.removeChannel(channel);
                    toast.success('Comando de recarregamento enviado a todos os usuários!');
                  }}>
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* BLOCO 7: Alertas (Semáforo de Saúde) - No topo para visibilidade */}
        {hasAlerts && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Alertas de Saúde
            </h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {data.alertaCaixaInsuficiente && (
                <Card className="border-destructive bg-destructive/5">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-destructive shrink-0" />
                      <div>
                        <p className="font-semibold text-destructive text-sm">Caixa Insuficiente</p>
                        <p className="text-xs text-muted-foreground">
                          Caixa real não cobre saldo principal dos usuários
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {data.alertaBonusAlto && (
                <Card className="border-yellow-500 bg-yellow-500/5">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                      <div>
                        <p className="font-semibold text-yellow-600 text-sm">Bônus Elevado</p>
                        <p className="text-xs text-muted-foreground">
                          Saldo bônus acima de 30% do saldo total ({data.percentualBonus.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {data.alertaRTPBaixo && (
                <Card className="border-yellow-500 bg-yellow-500/5">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                      <div>
                        <p className="font-semibold text-yellow-600 text-sm">RTP Baixo</p>
                        <p className="text-xs text-muted-foreground">
                          Retorno ao jogador abaixo de 30% ({data.raspadinhaRTP.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {!data.alertaCaixaInsuficiente && !data.alertaBonusAlto && !data.alertaRTPBaixo && (
                <Card className="border-green-500 bg-green-500/5">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <p className="font-semibold text-green-600 text-sm">Tudo em ordem</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* BLOCO 1: Caixa Real e Compromissos */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            Caixa Real e Compromissos
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              title="Total Depositado"
              value={formatCurrency(data.totalDeposits)}
              icon={<ArrowUpRight className="h-4 w-4" />}
              iconBg="bg-green-500/10"
              iconColor="text-green-600"
              valueColor="text-green-600"
            />
            <StatCard
              title="Saques Usuários"
              value={formatCurrency(data.totalUserWithdrawals)}
              icon={<ArrowDownRight className="h-4 w-4" />}
              iconBg="bg-red-500/10"
              iconColor="text-red-500"
            />
            <StatCard
              title="Saques Admin"
              value={formatCurrency(data.totalAdminWithdrawals)}
              icon={<ArrowDownRight className="h-4 w-4" />}
              iconBg="bg-orange-500/10"
              iconColor="text-orange-500"
            />
            <StatCard
              title="Caixa Real Atual"
              value={formatCurrency(data.caixaReal)}
              icon={<DollarSign className="h-4 w-4" />}
              iconBg="bg-blue-500/10"
              iconColor="text-blue-500"
              valueColor={data.caixaReal >= 0 ? "text-blue-600" : "text-destructive"}
              highlighted
            />
            <StatCard
              title="Compromisso Usuários"
              value={formatCurrency(data.saldoPrincipalTotal)}
              icon={<Wallet className="h-4 w-4" />}
              iconBg="bg-amber-500/10"
              iconColor="text-amber-500"
              subtitle="Saldo principal sacável"
            />
            <StatCard
              title="Disponível p/ Saque Admin"
              value={formatCurrency(data.disponivelAdmin)}
              icon={<Banknote className="h-4 w-4" />}
              iconBg={data.disponivelAdmin >= 0 ? "bg-green-500/10" : "bg-red-500/10"}
              iconColor={data.disponivelAdmin >= 0 ? "text-green-600" : "text-red-500"}
              valueColor={data.disponivelAdmin >= 0 ? "text-green-600" : "text-destructive font-bold"}
              highlighted
              alert={data.disponivelAdmin < 0}
            />
          </div>
        </div>

        {/* BLOCO 2: Resultado Operacional dos Jogos */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Resultado Operacional dos Jogos
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sorteios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Receita bruta</span>
                  <span className="font-medium text-green-600">{formatCurrency(data.receitaSorteios)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Prêmios pagos</span>
                  <span className="font-medium text-red-500">{formatCurrency(data.premiosSorteios)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-sm font-semibold">
                  <span>Margem</span>
                  <span className={data.margemSorteios >= 0 ? "text-green-600" : "text-destructive"}>
                    {data.margemSorteios.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Raspadinhas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Receita bruta</span>
                  <span className="font-medium text-green-600">{formatCurrency(data.receitaRaspadinhas)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Prêmios pagos</span>
                  <span className="font-medium text-red-500">{formatCurrency(data.premiosRaspadinhas)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-sm font-semibold">
                  <span>Margem</span>
                  <span className={data.margemRaspadinhas >= 0 ? "text-green-600" : "text-destructive"}>
                    {data.margemRaspadinhas.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Consolidado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(data.receitaSorteios + data.receitaRaspadinhas)}</p>
                    <p className="text-xs text-muted-foreground">Receita Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-500">{formatCurrency(data.premiosSorteios + data.premiosRaspadinhas)}</p>
                    <p className="text-xs text-muted-foreground">Prêmios Total</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${data.margemTotal >= 0 ? "text-green-600" : "text-destructive"}`}>
                      {data.margemTotal.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Margem Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* BLOCO 3: Saldos nas Carteiras */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Saldos nas Carteiras
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Saldo Principal"
              value={formatCurrency(data.saldoPrincipal)}
              icon={<DollarSign className="h-4 w-4" />}
              iconBg="bg-blue-500/10"
              iconColor="text-blue-500"
              subtitle="Depósitos + Prêmios"
            />
            <StatCard
              title="Saldo Bônus"
              value={formatCurrency(data.saldoBonus)}
              icon={<Gift className="h-4 w-4" />}
              iconBg="bg-amber-500/10"
              iconColor="text-amber-500"
              subtitle="Indicações + Bônus admin"
            />
            <StatCard
              title="Saldo Afiliados"
              value={formatCurrency(data.saldoAfiliados)}
              icon={<Users className="h-4 w-4" />}
              iconBg="bg-purple-500/10"
              iconColor="text-purple-500"
              subtitle="Comissões de afiliados"
            />
            <StatCard
              title="% Bônus sobre Total"
              value={`${data.percentualBonus.toFixed(1)}%`}
              icon={<Percent className="h-4 w-4" />}
              iconBg={data.alertaBonusAlto ? "bg-yellow-500/10" : "bg-green-500/10"}
              iconColor={data.alertaBonusAlto ? "text-yellow-500" : "text-green-500"}
              alert={data.alertaBonusAlto}
            />
          </div>
        </div>

        {/* BLOCO 4: Programa de Bônus/Indicações/Afiliados */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Programa de Bônus, Indicações e Afiliados
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Usuários Indicados"
              value={String(data.totalIndicados)}
              icon={<UserPlus className="h-4 w-4" />}
              iconBg="bg-indigo-500/10"
              iconColor="text-indigo-500"
            />
            <StatCard
              title="Custo Bônus Indicação"
              value={formatCurrency(data.custoBonusIndicacao)}
              icon={<Gift className="h-4 w-4" />}
              iconBg="bg-amber-500/10"
              iconColor="text-amber-500"
              subtitle="R$ 5,00 por indicação"
            />
            <StatCard
              title="Comissões Afiliados"
              value={formatCurrency(data.comissoesAfiliados)}
              icon={<Percent className="h-4 w-4" />}
              iconBg="bg-purple-500/10"
              iconColor="text-purple-500"
              subtitle="20% das vendas"
            />
            <StatCard
              title="Custo Total Programa"
              value={formatCurrency(data.custoTotalPrograma)}
              icon={<DollarSign className="h-4 w-4" />}
              iconBg="bg-red-500/10"
              iconColor="text-red-500"
              highlighted
            />
            <StatCard
              title="% da Receita"
              value={`${data.custoPercentualReceita.toFixed(1)}%`}
              icon={<TrendingDown className="h-4 w-4" />}
              iconBg="bg-orange-500/10"
              iconColor="text-orange-500"
              subtitle="Custo / Receita total"
            />
          </div>
        </div>

        {/* BLOCO 5: Performance dos Jogos */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Performance dos Jogos
          </h2>
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Raspadinhas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Raspadinhas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total de Jogadas</p>
                    <p className="text-xl font-bold">{data.raspadinhaJogadas}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Receita Total</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(data.raspadinhaReceita)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Prêmios Pagos</p>
                    <p className="text-xl font-bold text-red-500">{formatCurrency(data.raspadinhaPremios)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Taxa de Vitória</p>
                    <p className="text-xl font-bold">{data.raspadinhaTaxaVitoria.toFixed(1)}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">RTP (Retorno ao Jogador)</p>
                    <p className={`text-xl font-bold ${data.alertaRTPBaixo ? "text-yellow-500" : ""}`}>
                      {data.raspadinhaRTP.toFixed(1)}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Margem da Casa</p>
                    <p className="text-xl font-bold text-green-600">{data.raspadinhaMargemCasa.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sorteios */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-primary" />
                  Sorteios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total de Sorteios</p>
                    <p className="text-xl font-bold">{data.sorteiosTotal}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Ativos</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold text-green-600">{data.sorteiosAtivos}</p>
                      <Badge variant="secondary" className="text-xs">abertos</Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Finalizados</p>
                    <p className="text-xl font-bold">{data.sorteiosFinalizados}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Receita Total</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(data.receitaSorteios)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to="/admin/sorteios">
                      Ver detalhes dos sorteios
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* BLOCO 6: Usuários e Engajamento */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Usuários e Engajamento
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total Cadastrados"
              value={String(data.totalUsuarios)}
              icon={<Users className="h-4 w-4" />}
              iconBg="bg-blue-500/10"
              iconColor="text-blue-500"
            />
            <StatCard
              title="Com Depósito"
              value={String(data.usuariosComDeposito)}
              icon={<Wallet className="h-4 w-4" />}
              iconBg="bg-green-500/10"
              iconColor="text-green-600"
            />
            <StatCard
              title="Taxa de Conversão"
              value={`${data.taxaConversao.toFixed(1)}%`}
              icon={<Target className="h-4 w-4" />}
              iconBg="bg-indigo-500/10"
              iconColor="text-indigo-500"
              subtitle="Cadastro → Depósito"
            />
            <StatCard
              title="Ticket Médio Depósito"
              value={formatCurrency(data.ticketMedioDeposito)}
              icon={<DollarSign className="h-4 w-4" />}
              iconBg="bg-amber-500/10"
              iconColor="text-amber-500"
            />
            <StatCard
              title="Gasto Médio/Usuário"
              value={formatCurrency(data.gastoMedioJogos)}
              icon={<Activity className="h-4 w-4" />}
              iconBg="bg-purple-500/10"
              iconColor="text-purple-500"
              subtitle="Em jogos (média)"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/sorteios">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-primary group-hover:scale-110 transition-transform">
                    <Ticket className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Sorteios</p>
                    <p className="text-sm text-muted-foreground">Gerenciar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/raspadinhas">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-gold group-hover:scale-110 transition-transform">
                    <Sparkles className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Raspadinhas</p>
                    <p className="text-sm text-muted-foreground">Configurar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/usuarios">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-ocean group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Usuários</p>
                    <p className="text-sm text-muted-foreground">Gerenciar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/financeiro">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-sunset group-hover:scale-110 transition-transform">
                    <Trophy className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Financeiro</p>
                    <p className="text-sm text-muted-foreground">Relatórios</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}

// Componente reutilizável para cards de estatísticas
function StatCard({ 
  title, value, icon, iconBg, iconColor, valueColor, subtitle, highlighted, alert 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  iconBg: string; 
  iconColor: string; 
  valueColor?: string;
  subtitle?: string;
  highlighted?: boolean;
  alert?: boolean;
}) {
  return (
    <Card className={`relative overflow-hidden ${alert ? 'border-destructive' : ''} ${highlighted ? 'ring-1 ring-primary/20' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-1.5 rounded-lg ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className={`text-xl font-bold ${valueColor || ''}`}>{value}</div>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
