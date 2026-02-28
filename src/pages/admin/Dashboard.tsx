import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  LayoutDashboard, Ticket, Sparkles, Users, Trophy, TrendingUp, TrendingDown,
  DollarSign, Wallet, Calendar, Loader2, Gift, Banknote, RefreshCw,
  AlertTriangle, CheckCircle, XCircle, ArrowUpRight, ArrowDownRight, Target,
  Percent, UserPlus, Shield, Activity, Download, ChevronLeft, ChevronRight,
  Medal, Crown, Star,
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, startOfWeek, startOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

type DateFilter = 'today' | '7days' | '30days' | 'all' | 'custom';

interface DashboardData {
  totalDeposits: number;
  totalUserWithdrawals: number;
  totalAdminWithdrawals: number;
  caixaReal: number;
  saldoPrincipalTotal: number;
  disponivelAdmin: number;
  receitaSorteios: number;
  receitaRaspadinhas: number;
  premiosSorteios: number;
  premiosRaspadinhas: number;
  margemSorteios: number;
  margemRaspadinhas: number;
  margemTotal: number;
  saldoPrincipal: number;
  saldoBonus: number;
  saldoAfiliados: number;
  percentualBonus: number;
  totalIndicados: number;
  custoBonusIndicacao: number;
  comissoesAfiliados: number;
  custoTotalPrograma: number;
  custoPercentualReceita: number;
  raspadinhaJogadas: number;
  raspadinhaReceita: number;
  raspadinhaPremios: number;
  raspadinhaTaxaVitoria: number;
  raspadinhaRTP: number;
  raspadinhaMargemCasa: number;
  sorteiosAtivos: number;
  sorteiosFinalizados: number;
  sorteiosTotal: number;
  totalUsuarios: number;
  usuariosComDeposito: number;
  taxaConversao: number;
  ticketMedioDeposito: number;
  gastoMedioJogos: number;
  alertaCaixaInsuficiente: boolean;
  alertaBonusAlto: boolean;
  alertaRTPBaixo: boolean;
  depositCount: number;
}

interface RankingUser {
  id: string;
  name: string;
  value: number;
  extra?: string;
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
  depositCount: 0,
};

const RANKING_PAGE_SIZE = 10;

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Rankings
  const [topReferrers, setTopReferrers] = useState<RankingUser[]>([]);
  const [topAffiliates, setTopAffiliates] = useState<RankingUser[]>([]);
  const [topPlayers, setTopPlayers] = useState<RankingUser[]>([]);
  const [rankingPage, setRankingPage] = useState({ referrers: 0, affiliates: 0, players: 0 });

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (dateFilter) {
      case 'today': return { from: startOfDay(now), to: endOfDay(now) };
      case '7days': return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
      case '30days': return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
      case 'custom': return customRange?.from && customRange?.to 
        ? { from: startOfDay(customRange.from), to: endOfDay(customRange.to) } 
        : null;
      default: return null;
    }
  }, [dateFilter, customRange]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, [dateRange]);

  const applyDateFilter = (query: any, dateCol: string = 'created_at') => {
    if (dateRange) {
      query = query.gte(dateCol, dateRange.from.toISOString()).lte(dateCol, dateRange.to.toISOString());
    }
    return query;
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Build queries with date filters
      let pixDepositsQ = supabase.from('pix_deposits').select('amount, user_id, created_at, status').eq('status', 'paid').limit(50000);
      let userWithdrawalsQ = supabase.from('user_withdrawals').select('amount, status, created_at').limit(10000);
      let walletsQ = supabase.from('wallets').select('id, balance, user_id').limit(50000);
      let allTxQ = supabase.from('wallet_transactions').select('wallet_id, amount, source_type, type, created_at').limit(50000);
      let scratchPlaysQ = supabase.from('scratch_chances').select('prize_won, is_revealed, created_at, user_id').eq('is_revealed', true).limit(50000);
      let scratchRevenueQ = supabase.from('scratch_chances').select('scratch_card_id, created_at, scratch_cards(price)').limit(50000);
      let ticketsQ = supabase.from('raffle_tickets').select('raffle_id, purchased_at, user_id, raffles(price)').limit(50000);
      let referralsQ = supabase.from('referrals').select('bonus_awarded, referrer_id, created_at').limit(50000);
      let affiliateSalesQ = supabase.from('affiliate_sales').select('commission_amount, commission_status, affiliate_id, created_at').limit(50000);
      let scratchPrizesQ = supabase.from('scratch_chances').select('prize_won, created_at').not('prize_won', 'is', null).gt('prize_won', 0).limit(50000);

      // Apply date filters
      pixDepositsQ = applyDateFilter(pixDepositsQ, 'created_at');
      userWithdrawalsQ = applyDateFilter(userWithdrawalsQ, 'created_at');
      allTxQ = applyDateFilter(allTxQ, 'created_at');
      scratchPlaysQ = applyDateFilter(scratchPlaysQ, 'created_at');
      scratchRevenueQ = applyDateFilter(scratchRevenueQ, 'created_at');
      ticketsQ = applyDateFilter(ticketsQ, 'purchased_at');
      referralsQ = applyDateFilter(referralsQ, 'created_at');
      affiliateSalesQ = applyDateFilter(affiliateSalesQ, 'created_at');
      scratchPrizesQ = applyDateFilter(scratchPrizesQ, 'created_at');

      const [
        pixDepositsResult,
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
        profilesResult,
      ] = await Promise.all([
        pixDepositsQ,
        userWithdrawalsQ,
        walletsQ,
        allTxQ,
        scratchPlaysQ,
        scratchRevenueQ,
        ticketsQ,
        supabase.from('raffles').select('*', { count: 'exact', head: true }),
        supabase.from('raffles').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        referralsQ,
        affiliateSalesQ,
        scratchPrizesQ,
        supabase.from('profiles').select('id, full_name').limit(50000),
      ]);

      const profileMap = new Map<string, string>();
      for (const p of (profilesResult.data || [])) {
        profileMap.set(p.id, p.full_name || 'Sem nome');
      }

      // === BLOCO 1: CAIXA REAL (using pix_deposits with status=paid) ===
      const paidDeposits = pixDepositsResult.data || [];
      const totalDeposits = paidDeposits.reduce((s, d) => s + Number(d.amount || 0), 0);
      const depositCount = paidDeposits.length;
      const depositUserIds = new Set(paidDeposits.map(d => d.user_id));
      
      const approvedWithdrawals = (userWithdrawalsResult.data || []).filter(w => w.status === 'approved' || w.status === 'paid');
      const totalUserWithdrawals = approvedWithdrawals.reduce((s, w) => s + Number(w.amount || 0), 0);
      const totalAdminWithdrawals = 0;
      const caixaReal = totalDeposits - totalUserWithdrawals - totalAdminWithdrawals;

      // === Balance breakdown ===
      const wallets = walletsResult.data || [];
      const allTx = allTransactionsResult.data || [];
      const txByWallet = new Map<string, any[]>();
      for (const tx of allTx) {
        const list = txByWallet.get(tx.wallet_id) || [];
        list.push(tx);
        txByWallet.set(tx.wallet_id, list);
      }

      let platformMain = 0, platformBonus = 0, platformAfiliados = 0;

      for (const w of wallets) {
        const walletTotal = Number(w.balance || 0);
        const walletTx = txByWallet.get(w.id) || [];
        let principal = 0, bonus = 0, afiliado = 0;

        for (const tx of walletTx) {
          const amount = Number(tx.amount ?? 0);
          const sourceType = tx.source_type;
          if (amount > 0) {
            if (sourceType === 'referral' || sourceType === 'admin_bonus') bonus += amount;
            else if (sourceType === 'affiliate_commission') afiliado += amount;
            else principal += amount;
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
      const receitaSorteios = (ticketsResult.data || []).reduce((s: number, t: any) => s + Number(t.raffles?.price || 0), 0);
      const receitaRaspadinhas = (scratchRevenueResult.data || []).reduce((s: number, c: any) => s + Number(c.scratch_cards?.price || 0), 0);
      const premiosRaspadinhas = (scratchPrizesResult.data || []).reduce((s, p) => s + Number(p.prize_won || 0), 0);
      const premiosSorteios = 0;
      const margemSorteios = receitaSorteios > 0 ? ((receitaSorteios - premiosSorteios) / receitaSorteios) * 100 : 0;
      const margemRaspadinhas = receitaRaspadinhas > 0 ? ((receitaRaspadinhas - premiosRaspadinhas) / receitaRaspadinhas) * 100 : 0;
      const receitaTotal = receitaSorteios + receitaRaspadinhas;
      const premiosTotal = premiosSorteios + premiosRaspadinhas;
      const margemTotal = receitaTotal > 0 ? ((receitaTotal - premiosTotal) / receitaTotal) * 100 : 0;

      // === BLOCO 3 ===
      const saldoTotal = platformMain + platformBonus + platformAfiliados;
      const percentualBonus = saldoTotal > 0 ? (platformBonus / saldoTotal) * 100 : 0;

      // === BLOCO 4 ===
      const referrals = referralsResult.data || [];
      const totalIndicados = referrals.length;
      const custoBonusIndicacao = referrals.reduce((s, r) => s + Number(r.bonus_awarded || 0), 0);
      const affiliateSales = affiliateSalesResult.data || [];
      const comissoesAfiliados = affiliateSales.reduce((s, a) => s + Number(a.commission_amount || 0), 0);
      const custoTotalPrograma = custoBonusIndicacao + comissoesAfiliados;
      const custoPercentualReceita = receitaTotal > 0 ? (custoTotalPrograma / receitaTotal) * 100 : 0;

      // === BLOCO 5 ===
      const scratchPlays = scratchPlaysResult.data || [];
      const raspadinhaJogadas = scratchPlays.length;
      const raspadinhaVitorias = scratchPlays.filter(p => p.prize_won && p.prize_won > 0).length;
      const raspadinhaTaxaVitoria = raspadinhaJogadas > 0 ? (raspadinhaVitorias / raspadinhaJogadas) * 100 : 0;
      const raspadinhaRTP = receitaRaspadinhas > 0 ? (premiosRaspadinhas / receitaRaspadinhas) * 100 : 0;
      const raspadinhaMargemCasa = 100 - raspadinhaRTP;

      // === BLOCO 6 ===
      const totalUsuarios = usersResult.count || 0;
      const usuariosComDeposito = depositUserIds.size;
      const taxaConversao = totalUsuarios > 0 ? (usuariosComDeposito / totalUsuarios) * 100 : 0;
      const ticketMedioDeposito = depositCount > 0 ? totalDeposits / depositCount : 0;
      const gastoMedioJogos = totalUsuarios > 0 ? receitaTotal / totalUsuarios : 0;

      // === BLOCO 7 ===
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
        depositCount,
      });

      // === RANKINGS ===
      // Top referrers
      const referrerCount = new Map<string, number>();
      for (const r of referrals) {
        referrerCount.set(r.referrer_id, (referrerCount.get(r.referrer_id) || 0) + 1);
      }
      const topRef = Array.from(referrerCount.entries())
        .map(([id, count]) => ({ id, name: profileMap.get(id) || 'Desconhecido', value: count }))
        .sort((a, b) => b.value - a.value);
      setTopReferrers(topRef);

      // Top affiliates
      const affCommission = new Map<string, number>();
      for (const a of affiliateSales) {
        affCommission.set(a.affiliate_id, (affCommission.get(a.affiliate_id) || 0) + Number(a.commission_amount || 0));
      }
      const topAff = Array.from(affCommission.entries())
        .map(([id, total]) => ({ id, name: id.slice(0, 8), value: total }))
        .sort((a, b) => b.value - a.value);
      setTopAffiliates(topAff);

      // Top players (most scratch + raffle purchases)
      const playerActivity = new Map<string, { scratches: number; raffles: number }>();
      for (const s of scratchPlays) {
        const curr = playerActivity.get(s.user_id) || { scratches: 0, raffles: 0 };
        curr.scratches++;
        playerActivity.set(s.user_id, curr);
      }
      for (const t of (ticketsResult.data || [])) {
        const curr = playerActivity.get(t.user_id) || { scratches: 0, raffles: 0 };
        curr.raffles++;
        playerActivity.set(t.user_id, curr);
      }
      const topPlay = Array.from(playerActivity.entries())
        .map(([id, act]) => ({
          id,
          name: profileMap.get(id) || 'Desconhecido',
          value: act.scratches + act.raffles,
          extra: `${act.scratches} rasp. | ${act.raffles} sort.`,
        }))
        .sort((a, b) => b.value - a.value);
      setTopPlayers(topPlay);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date());
    }
  };

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  const exportCSV = () => {
    const rows = [
      ['Métrica', 'Valor'],
      ['Total Depositado (PIX)', data.totalDeposits.toFixed(2)],
      ['Qtd. Depósitos', String(data.depositCount)],
      ['Saques Usuários', data.totalUserWithdrawals.toFixed(2)],
      ['Saques Admin', data.totalAdminWithdrawals.toFixed(2)],
      ['Caixa Real', data.caixaReal.toFixed(2)],
      ['Compromisso Usuários (Saldo Principal)', data.saldoPrincipalTotal.toFixed(2)],
      ['Disponível Admin', data.disponivelAdmin.toFixed(2)],
      ['Receita Sorteios', data.receitaSorteios.toFixed(2)],
      ['Receita Raspadinhas', data.receitaRaspadinhas.toFixed(2)],
      ['Prêmios Sorteios', data.premiosSorteios.toFixed(2)],
      ['Prêmios Raspadinhas', data.premiosRaspadinhas.toFixed(2)],
      ['Margem Total (%)', data.margemTotal.toFixed(2)],
      ['Saldo Principal Total', data.saldoPrincipal.toFixed(2)],
      ['Saldo Bônus Total', data.saldoBonus.toFixed(2)],
      ['Saldo Afiliados Total', data.saldoAfiliados.toFixed(2)],
      ['% Bônus', data.percentualBonus.toFixed(2)],
      ['Usuários Indicados', String(data.totalIndicados)],
      ['Custo Bônus Indicação', data.custoBonusIndicacao.toFixed(2)],
      ['Comissões Afiliados', data.comissoesAfiliados.toFixed(2)],
      ['Custo Total Programa', data.custoTotalPrograma.toFixed(2)],
      ['Raspadinhas Jogadas', String(data.raspadinhaJogadas)],
      ['RTP (%)', data.raspadinhaRTP.toFixed(2)],
      ['Total Usuários', String(data.totalUsuarios)],
      ['Usuários com Depósito', String(data.usuariosComDeposito)],
      ['Taxa Conversão (%)', data.taxaConversao.toFixed(2)],
      ['Ticket Médio Depósito', data.ticketMedioDeposito.toFixed(2)],
    ];
    const csv = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filterLabel = dateFilter === 'custom' && customRange?.from
      ? `${format(customRange.from, 'dd-MM-yyyy')}_${format(customRange.to || new Date(), 'dd-MM-yyyy')}`
      : dateFilter;
    a.download = `dashboard_${filterLabel}_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado com sucesso!');
  };

  const dateFilterLabel = () => {
    switch (dateFilter) {
      case 'today': return 'Hoje';
      case '7days': return 'Últimos 7 dias';
      case '30days': return 'Últimos 30 dias';
      case 'custom': return customRange?.from
        ? `${format(customRange.from, 'dd/MM/yy')} - ${format(customRange.to || new Date(), 'dd/MM/yy')}`
        : 'Personalizado';
      default: return 'Todo período';
    }
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
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              Gestão financeira consolidada da plataforma
              {lastUpdated && (
                <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                  <Activity className="h-3 w-3 text-green-500 animate-pulse" />
                  Atualizado às {format(lastUpdated, 'HH:mm:ss')}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(), "d 'de' MMMM", { locale: ptBR })}
            </div>
            {/* Date Filters */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {(['all', 'today', '7days', '30days'] as DateFilter[]).map(f => (
                <Button
                  key={f}
                  variant={dateFilter === f ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => { setDateFilter(f); setCalendarOpen(false); }}
                >
                  {f === 'all' ? 'Tudo' : f === 'today' ? 'Hoje' : f === '7days' ? '7d' : '30d'}
                </Button>
              ))}
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateFilter === 'custom' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 text-xs px-2"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {dateFilter === 'custom' && customRange?.from
                      ? `${format(customRange.from, 'dd/MM')}-${format(customRange.to || new Date(), 'dd/MM')}`
                      : 'Custom'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="range"
                    selected={customRange}
                    onSelect={(range) => {
                      setCustomRange(range);
                      if (range?.from && range?.to) {
                        setDateFilter('custom');
                        setCalendarOpen(false);
                      }
                    }}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={exportCSV}>
              <Download className="h-3 w-3" />
              CSV
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 h-7 text-xs">
                  <RefreshCw className="h-3 w-3" />
                  Reload
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Forçar recarregamento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá recarregar a página de todos os usuários conectados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={async () => {
                    const channel = supabase.channel('force-reload');
                    await channel.send({ type: 'broadcast', event: 'force-reload', payload: { timestamp: Date.now() } });
                    supabase.removeChannel(channel);
                    toast.success('Comando de recarregamento enviado!');
                  }}>
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Active filter badge */}
        {dateFilter !== 'all' && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              Filtro: {dateFilterLabel()}
            </Badge>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setDateFilter('all')}>
              Limpar filtro
            </Button>
          </div>
        )}

        {/* BLOCO 7: Alertas */}
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
                        <p className="text-xs text-muted-foreground">Caixa real não cobre saldo principal</p>
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
                        <p className="text-xs text-muted-foreground">Acima de 30% ({data.percentualBonus.toFixed(1)}%)</p>
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
                        <p className="text-xs text-muted-foreground">Abaixo de 30% ({data.raspadinhaRTP.toFixed(1)}%)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* BLOCO 1: Caixa Real */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            Caixa Real e Compromissos
            <Badge variant="outline" className="text-[10px] ml-1">Depósitos PIX confirmados via Gatebox</Badge>
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard title="Total Depositado (PIX)" value={formatCurrency(data.totalDeposits)} icon={<ArrowUpRight className="h-4 w-4" />} iconBg="bg-green-500/10" iconColor="text-green-600" valueColor="text-green-600" subtitle={`${data.depositCount} depósitos confirmados`} />
            <StatCard title="Saques Usuários" value={formatCurrency(data.totalUserWithdrawals)} icon={<ArrowDownRight className="h-4 w-4" />} iconBg="bg-red-500/10" iconColor="text-red-500" />
            <StatCard title="Saques Admin" value={formatCurrency(data.totalAdminWithdrawals)} icon={<ArrowDownRight className="h-4 w-4" />} iconBg="bg-orange-500/10" iconColor="text-orange-500" />
            <StatCard title="Caixa Real Atual" value={formatCurrency(data.caixaReal)} icon={<DollarSign className="h-4 w-4" />} iconBg="bg-blue-500/10" iconColor="text-blue-500" valueColor={data.caixaReal >= 0 ? "text-blue-600" : "text-destructive"} highlighted />
            <StatCard title="Compromisso Usuários" value={formatCurrency(data.saldoPrincipalTotal)} icon={<Wallet className="h-4 w-4" />} iconBg="bg-amber-500/10" iconColor="text-amber-500" subtitle="Saldo principal sacável" />
            <StatCard title="Disponível p/ Admin" value={formatCurrency(data.disponivelAdmin)} icon={<Banknote className="h-4 w-4" />} iconBg={data.disponivelAdmin >= 0 ? "bg-green-500/10" : "bg-red-500/10"} iconColor={data.disponivelAdmin >= 0 ? "text-green-600" : "text-red-500"} valueColor={data.disponivelAdmin >= 0 ? "text-green-600" : "text-destructive font-bold"} highlighted alert={data.disponivelAdmin < 0} />
          </div>
        </div>

        {/* BLOCO 2: Resultado Operacional */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Resultado Operacional dos Jogos
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Sorteios</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm"><span>Receita bruta</span><span className="font-medium text-green-600">{formatCurrency(data.receitaSorteios)}</span></div>
                <div className="flex justify-between text-sm"><span>Prêmios pagos</span><span className="font-medium text-red-500">{formatCurrency(data.premiosSorteios)}</span></div>
                <div className="border-t pt-2 flex justify-between text-sm font-semibold"><span>Margem</span><span className={data.margemSorteios >= 0 ? "text-green-600" : "text-destructive"}>{data.margemSorteios.toFixed(1)}%</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Raspadinhas</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm"><span>Receita bruta</span><span className="font-medium text-green-600">{formatCurrency(data.receitaRaspadinhas)}</span></div>
                <div className="flex justify-between text-sm"><span>Prêmios pagos</span><span className="font-medium text-red-500">{formatCurrency(data.premiosRaspadinhas)}</span></div>
                <div className="border-t pt-2 flex justify-between text-sm font-semibold"><span>Margem</span><span className={data.margemRaspadinhas >= 0 ? "text-green-600" : "text-destructive"}>{data.margemRaspadinhas.toFixed(1)}%</span></div>
              </CardContent>
            </Card>
            <Card className="sm:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Consolidado</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-2xl font-bold text-green-600">{formatCurrency(data.receitaSorteios + data.receitaRaspadinhas)}</p><p className="text-xs text-muted-foreground">Receita Total</p></div>
                  <div><p className="text-2xl font-bold text-red-500">{formatCurrency(data.premiosSorteios + data.premiosRaspadinhas)}</p><p className="text-xs text-muted-foreground">Prêmios Total</p></div>
                  <div><p className={`text-2xl font-bold ${data.margemTotal >= 0 ? "text-green-600" : "text-destructive"}`}>{data.margemTotal.toFixed(1)}%</p><p className="text-xs text-muted-foreground">Margem Total</p></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* BLOCO 3: Saldos */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" />Saldos nas Carteiras</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Saldo Principal" value={formatCurrency(data.saldoPrincipal)} icon={<DollarSign className="h-4 w-4" />} iconBg="bg-blue-500/10" iconColor="text-blue-500" subtitle="Depósitos + Prêmios" />
            <StatCard title="Saldo Bônus" value={formatCurrency(data.saldoBonus)} icon={<Gift className="h-4 w-4" />} iconBg="bg-amber-500/10" iconColor="text-amber-500" subtitle="Indicações + Bônus admin" />
            <StatCard title="Saldo Afiliados" value={formatCurrency(data.saldoAfiliados)} icon={<Users className="h-4 w-4" />} iconBg="bg-purple-500/10" iconColor="text-purple-500" subtitle="Comissões" />
            <StatCard title="% Bônus sobre Total" value={`${data.percentualBonus.toFixed(1)}%`} icon={<Percent className="h-4 w-4" />} iconBg={data.alertaBonusAlto ? "bg-yellow-500/10" : "bg-green-500/10"} iconColor={data.alertaBonusAlto ? "text-yellow-500" : "text-green-500"} alert={data.alertaBonusAlto} />
          </div>
        </div>

        {/* BLOCO 4: Programa Bônus */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" />Programa de Bônus, Indicações e Afiliados</h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard title="Usuários Indicados" value={String(data.totalIndicados)} icon={<UserPlus className="h-4 w-4" />} iconBg="bg-indigo-500/10" iconColor="text-indigo-500" />
            <StatCard title="Custo Bônus Indicação" value={formatCurrency(data.custoBonusIndicacao)} icon={<Gift className="h-4 w-4" />} iconBg="bg-amber-500/10" iconColor="text-amber-500" subtitle="R$ 5,00 por indicação" />
            <StatCard title="Comissões Afiliados" value={formatCurrency(data.comissoesAfiliados)} icon={<Percent className="h-4 w-4" />} iconBg="bg-purple-500/10" iconColor="text-purple-500" />
            <StatCard title="Custo Total Programa" value={formatCurrency(data.custoTotalPrograma)} icon={<DollarSign className="h-4 w-4" />} iconBg="bg-red-500/10" iconColor="text-red-500" highlighted />
            <StatCard title="% da Receita" value={`${data.custoPercentualReceita.toFixed(1)}%`} icon={<TrendingDown className="h-4 w-4" />} iconBg="bg-orange-500/10" iconColor="text-orange-500" subtitle="Custo / Receita" />
          </div>
        </div>

        {/* RANKINGS SECTION */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Rankings da Plataforma
          </h2>
          <Tabs defaultValue="referrers" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="referrers" className="gap-1 text-xs sm:text-sm">
                <Medal className="h-3 w-3 sm:h-4 sm:w-4" />
                Top Indicadores
              </TabsTrigger>
              <TabsTrigger value="affiliates" className="gap-1 text-xs sm:text-sm">
                <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                Top Afiliados
              </TabsTrigger>
              <TabsTrigger value="players" className="gap-1 text-xs sm:text-sm">
                <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                Top Jogadores
              </TabsTrigger>
            </TabsList>
            <TabsContent value="referrers">
              <RankingTable
                data={topReferrers}
                page={rankingPage.referrers}
                onPageChange={(p) => setRankingPage(prev => ({ ...prev, referrers: p }))}
                valueLabel="Indicações"
                formatValue={(v) => `${v} indicações`}
              />
            </TabsContent>
            <TabsContent value="affiliates">
              <RankingTable
                data={topAffiliates}
                page={rankingPage.affiliates}
                onPageChange={(p) => setRankingPage(prev => ({ ...prev, affiliates: p }))}
                valueLabel="Comissão Total"
                formatValue={(v) => formatCurrency(v)}
              />
            </TabsContent>
            <TabsContent value="players">
              <RankingTable
                data={topPlayers}
                page={rankingPage.players}
                onPageChange={(p) => setRankingPage(prev => ({ ...prev, players: p }))}
                valueLabel="Participações"
                formatValue={(v) => `${v} jogadas`}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* BLOCO 5: Performance */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Performance dos Jogos</h2>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" />Raspadinhas</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><p className="text-xs text-muted-foreground">Total de Jogadas</p><p className="text-xl font-bold">{data.raspadinhaJogadas}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground">Receita Total</p><p className="text-xl font-bold text-green-600">{formatCurrency(data.raspadinhaReceita)}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground">Prêmios Pagos</p><p className="text-xl font-bold text-red-500">{formatCurrency(data.raspadinhaPremios)}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground">Taxa de Vitória</p><p className="text-xl font-bold">{data.raspadinhaTaxaVitoria.toFixed(1)}%</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground">RTP</p><p className={`text-xl font-bold ${data.alertaRTPBaixo ? "text-yellow-500" : ""}`}>{data.raspadinhaRTP.toFixed(1)}%</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground">Margem da Casa</p><p className="text-xl font-bold text-green-600">{data.raspadinhaMargemCasa.toFixed(1)}%</p></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Ticket className="h-4 w-4 text-primary" />Sorteios</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold">{data.sorteiosTotal}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground">Ativos</p><div className="flex items-center gap-2"><p className="text-xl font-bold text-green-600">{data.sorteiosAtivos}</p><Badge variant="secondary" className="text-xs">abertos</Badge></div></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground">Finalizados</p><p className="text-xl font-bold">{data.sorteiosFinalizados}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground">Receita Total</p><p className="text-xl font-bold text-green-600">{formatCurrency(data.receitaSorteios)}</p></div>
                </div>
                <div className="mt-4"><Button variant="outline" size="sm" asChild className="w-full"><Link to="/admin/sorteios">Ver detalhes</Link></Button></div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* BLOCO 6: Usuários */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Usuários e Engajamento</h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard title="Total Cadastrados" value={String(data.totalUsuarios)} icon={<Users className="h-4 w-4" />} iconBg="bg-blue-500/10" iconColor="text-blue-500" />
            <StatCard title="Com Depósito" value={String(data.usuariosComDeposito)} icon={<Wallet className="h-4 w-4" />} iconBg="bg-green-500/10" iconColor="text-green-600" />
            <StatCard title="Taxa de Conversão" value={`${data.taxaConversao.toFixed(1)}%`} icon={<Target className="h-4 w-4" />} iconBg="bg-indigo-500/10" iconColor="text-indigo-500" subtitle="Cadastro → Depósito" />
            <StatCard title="Ticket Médio Depósito" value={formatCurrency(data.ticketMedioDeposito)} icon={<DollarSign className="h-4 w-4" />} iconBg="bg-amber-500/10" iconColor="text-amber-500" />
            <StatCard title="Gasto Médio/Usuário" value={formatCurrency(data.gastoMedioJogos)} icon={<Activity className="h-4 w-4" />} iconBg="bg-purple-500/10" iconColor="text-purple-500" subtitle="Em jogos (média)" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/sorteios">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-gradient-primary group-hover:scale-110 transition-transform"><Ticket className="h-6 w-6 text-primary-foreground" /></div><div><p className="font-semibold">Sorteios</p><p className="text-sm text-muted-foreground">Gerenciar</p></div></div></CardContent>
            </Card>
          </Link>
          <Link to="/admin/raspadinhas">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-gradient-gold group-hover:scale-110 transition-transform"><Sparkles className="h-6 w-6 text-accent-foreground" /></div><div><p className="font-semibold">Raspadinhas</p><p className="text-sm text-muted-foreground">Configurar</p></div></div></CardContent>
            </Card>
          </Link>
          <Link to="/admin/usuarios">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-gradient-ocean group-hover:scale-110 transition-transform"><Users className="h-6 w-6 text-primary-foreground" /></div><div><p className="font-semibold">Usuários</p><p className="text-sm text-muted-foreground">Gerenciar</p></div></div></CardContent>
            </Card>
          </Link>
          <Link to="/admin/financeiro">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-gradient-sunset group-hover:scale-110 transition-transform"><Trophy className="h-6 w-6 text-primary-foreground" /></div><div><p className="font-semibold">Financeiro</p><p className="text-sm text-muted-foreground">Relatórios</p></div></div></CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}

// Ranking Table Component
function RankingTable({
  data, page, onPageChange, valueLabel, formatValue,
}: {
  data: RankingUser[];
  page: number;
  onPageChange: (p: number) => void;
  valueLabel: string;
  formatValue: (v: number) => string;
}) {
  const totalPages = Math.max(1, Math.ceil(data.length / RANKING_PAGE_SIZE));
  const paged = data.slice(page * RANKING_PAGE_SIZE, (page + 1) * RANKING_PAGE_SIZE);

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          Nenhum dado disponível para o período selecionado.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="py-2 px-4 text-left font-medium text-muted-foreground w-12">#</th>
                <th className="py-2 px-4 text-left font-medium text-muted-foreground">Usuário</th>
                <th className="py-2 px-4 text-right font-medium text-muted-foreground">{valueLabel}</th>
                {data[0]?.extra && <th className="py-2 px-4 text-right font-medium text-muted-foreground">Detalhes</th>}
              </tr>
            </thead>
            <tbody>
              {paged.map((item, i) => {
                const rank = page * RANKING_PAGE_SIZE + i + 1;
                return (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-4">
                      {rank <= 3 ? (
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                          rank === 2 ? 'bg-gray-100 text-gray-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          {rank}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{rank}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-medium truncate max-w-[200px]">{item.name}</td>
                    <td className="py-2.5 px-4 text-right font-semibold">{formatValue(item.value)}</td>
                    {item.extra && <td className="py-2.5 px-4 text-right text-muted-foreground text-xs">{item.extra}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2 border-t">
            <p className="text-xs text-muted-foreground">{data.length} registros</p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2">{page + 1} / {totalPages}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Stat Card Component
function StatCard({ 
  title, value, icon, iconBg, iconColor, valueColor, subtitle, highlighted, alert 
}: { 
  title: string; value: string; icon: React.ReactNode; iconBg: string; iconColor: string;
  valueColor?: string; subtitle?: string; highlighted?: boolean; alert?: boolean;
}) {
  return (
    <Card className={`relative overflow-hidden ${alert ? 'border-destructive' : ''} ${highlighted ? 'ring-1 ring-primary/20' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-1.5 rounded-lg ${iconBg}`}><span className={iconColor}>{icon}</span></div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className={`text-xl font-bold ${valueColor || ''}`}>{value}</div>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
