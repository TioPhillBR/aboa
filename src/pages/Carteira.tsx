import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackButton } from '@/components/ui/back-button';
import { Header } from '@/components/layout/Header';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PixPayment } from '@/components/payment/PixPayment';
import { supabase } from '@/integrations/supabase/client';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trophy,
  Ticket,
  Sparkles,
  Clock,
  QrCode,
  Gift,
  Banknote,
  AlertCircle,
  Send,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TransactionType } from '@/types';

const CREDIT_OPTIONS = [10, 25, 50, 100, 200, 500];

type PaymentStep = 'select-amount' | 'pix-payment';
type WithdrawStep = 'form' | 'confirm';

export default function Carteira() {
  const { user } = useAuth();
  const { wallet, transactions, balance, bonusBalance, isLoading, deposit, refetch } = useWallet();
  const { toast } = useToast();
  
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('select-amount');
  
  // Withdraw modal state
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState<WithdrawStep>('form');
  const [userPixKey, setUserPixKey] = useState<string | null>(null);
  const [userPixKeyType, setUserPixKeyType] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string>('');

  // Fetch user PIX key from profile
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('pix_key, pix_key_type, full_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setUserPixKey(data.pix_key);
            setUserPixKeyType(data.pix_key_type);
            setUserFullName(data.full_name || '');
          }
        });
    }
  }, [user]);


  const handleContinueToPayment = () => {
    const amount = selectedAmount || parseFloat(customAmount);
    
    if (!amount || amount <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Selecione ou digite um valor válido',
        variant: 'destructive',
      });
      return;
    }

    if (amount < 5) {
      toast({
        title: 'Valor mínimo',
        description: 'O valor mínimo para depósito é R$ 5,00',
        variant: 'destructive',
      });
      return;
    }

    setPaymentStep('pix-payment');
  };

  const handlePaymentSuccess = () => {
    setSelectedAmount(null);
    setCustomAmount('');
    setDialogOpen(false);
    setPaymentStep('select-amount');
    refetch();
  };

  const handlePaymentCancel = () => {
    setPaymentStep('select-amount');
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setPaymentStep('select-amount');
      setSelectedAmount(null);
      setCustomAmount('');
    }
  };

  const getPaymentAmount = () => {
    return selectedAmount || parseFloat(customAmount) || 0;
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount < 1) {
      toast({ title: 'Valor mínimo R$ 1,00', description: 'O valor mínimo para saque é R$ 1,00', variant: 'destructive' });
      return;
    }

    if (amount > balance) {
      toast({ title: 'Saldo insuficiente', description: `Seu saldo principal é R$ ${balance.toFixed(2)}`, variant: 'destructive' });
      return;
    }

    if (!userPixKey || !userPixKeyType) {
      toast({ title: 'Chave PIX não cadastrada', description: 'Cadastre sua chave PIX no perfil antes de sacar', variant: 'destructive' });
      return;
    }

    setWithdrawLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-withdrawal', {
        body: {
          amount,
          pixKey: userPixKey,
          pixKeyType: userPixKeyType,
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao processar saque');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({ title: data?.automatic ? 'PIX enviado!' : 'Saque registrado!', description: data?.message || `R$ ${amount.toFixed(2)} será processado em até 24 horas.` });
      setWithdrawOpen(false);
      setWithdrawAmount('');
      setWithdrawStep('form');
      refetch();
    } catch (err: any) {
      toast({ title: 'Erro no saque', description: err.message, variant: 'destructive' });
    } finally {
      setWithdrawLoading(false);
    }
  };


  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'purchase':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'prize':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'refund':
        return <ArrowDownLeft className="h-4 w-4 text-blue-500" />;
      case 'withdrawal':
        return <Send className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTransactionLabel = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return 'Depósito';
      case 'purchase':
        return 'Compra';
      case 'prize':
        return 'Prêmio';
      case 'refund':
        return 'Reembolso';
      case 'withdrawal':
        return 'Saque';
      default:
        return type;
    }
  };

  const getTransactionColor = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return 'bg-green-500/10 text-green-600';
      case 'purchase':
        return 'bg-red-500/10 text-red-600';
      case 'prize':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'refund':
        return 'bg-blue-500/10 text-blue-600';
      case 'withdrawal':
        return 'bg-orange-500/10 text-orange-600';
      default:
        return 'bg-muted';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 text-center">
          <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acesse sua Carteira</h1>
          <p className="text-muted-foreground mb-6">
            Faça login para ver seu saldo e histórico de transações
          </p>
          <Button asChild>
            <Link to="/login">Fazer Login</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <BackButton className="mb-4" />
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Minha Carteira</h1>
            <p className="text-muted-foreground">
              Gerencie seus créditos e veja seu histórico
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cards de Saldo */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Card de Saldo Principal */}
              <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                
                <CardHeader className="relative pb-2">
                  <CardDescription className="text-primary-foreground/70 flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Saldo Principal
                  </CardDescription>
                  <CardTitle className="text-4xl font-bold">
                    R$ {balance.toFixed(2)}
                  </CardTitle>
                  <p className="text-xs text-primary-foreground/60 mt-1">
                    Disponível para compras
                  </p>
                </CardHeader>
                
                <CardContent className="relative pt-2 flex flex-wrap gap-2">
                  <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Depositar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      {paymentStep === 'select-amount' ? (
                        <>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <QrCode className="h-5 w-5 text-[#32BCAD]" />
                              Adicionar Créditos via PIX
                            </DialogTitle>
                            <DialogDescription>
                              Escolha um valor para adicionar à sua carteira
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-6 py-4">
                            {/* Valores pré-definidos */}
                            <div className="grid grid-cols-3 gap-3">
                              {CREDIT_OPTIONS.map((amount) => (
                                <Button
                                  key={amount}
                                  variant={selectedAmount === amount ? 'default' : 'outline'}
                                  className="h-16 text-lg font-semibold"
                                  onClick={() => {
                                    setSelectedAmount(amount);
                                    setCustomAmount('');
                                  }}
                                >
                                  R$ {amount}
                                </Button>
                              ))}
                            </div>

                            {/* Valor customizado */}
                            <div className="space-y-2">
                              <Label htmlFor="customAmount">Ou digite outro valor</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  R$
                                </span>
                                <Input
                                  id="customAmount"
                                  type="number"
                                  min="5"
                                  step="0.01"
                                  placeholder="0,00"
                                  value={customAmount}
                                  onChange={(e) => {
                                    setCustomAmount(e.target.value);
                                    setSelectedAmount(null);
                                  }}
                                  className="pl-10 text-lg h-12"
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Valor mínimo: R$ 5,00
                              </p>
                            </div>

                            {/* Total */}
                            {(selectedAmount || parseFloat(customAmount) > 0) && (
                              <div className="p-4 rounded-lg bg-muted">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Valor a adicionar:</span>
                                  <span className="text-2xl font-bold text-primary">
                                    R$ {(selectedAmount || parseFloat(customAmount) || 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Botão continuar */}
                            <Button 
                              onClick={handleContinueToPayment}
                              disabled={!selectedAmount && !parseFloat(customAmount)}
                              className="w-full gap-2 bg-[#32BCAD] hover:bg-[#2aa99b]"
                              size="lg"
                            >
                              <QrCode className="h-5 w-5" />
                              Continuar com PIX
                            </Button>
                          </div>
                        </>
                      ) : (
                        <PixPayment
                          amount={getPaymentAmount()}
                          onSuccess={handlePaymentSuccess}
                          onCancel={handlePaymentCancel}
                        />
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* Botão Sacar */}
                  <Dialog open={withdrawOpen} onOpenChange={(open) => {
                    setWithdrawOpen(open);
                    if (!open) { setWithdrawAmount(''); setWithdrawStep('form'); }
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="gap-2"
                        disabled={balance <= 0}
                      >
                        <Send className="h-4 w-4" />
                        Sacar agora
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Send className="h-5 w-5 text-primary" />
                          Sacar Saldo Principal
                        </DialogTitle>
                        <DialogDescription>
                          Transfira seu saldo principal para sua chave PIX
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        {/* User info card */}
                        <Card className="border-primary/20 bg-primary/5">
                          <CardContent className="py-4 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Wallet className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{userFullName || 'Usuário'}</p>
                                <p className="text-xs text-muted-foreground">ID: {user?.id?.slice(0, 8)}...</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-2.5 rounded-lg bg-background border">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Saldo disponível</p>
                                <p className="text-lg font-bold text-primary">R$ {balance.toFixed(2)}</p>
                              </div>
                              <div className="p-2.5 rounded-lg bg-background border">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Data da solicitação</p>
                                <p className="text-sm font-semibold text-foreground mt-0.5">
                                  {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {format(new Date(), "HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Chave PIX */}
                        {userPixKey ? (
                          <div className="p-3 rounded-lg border">
                            <p className="text-xs text-muted-foreground mb-1">Chave PIX cadastrada</p>
                            <p className="font-medium">{userPixKey}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {userPixKeyType === 'cpf' ? 'CPF' : 
                               userPixKeyType === 'email' ? 'E-mail' : 
                               userPixKeyType === 'phone' ? 'Telefone' : 
                               userPixKeyType === 'random' ? 'Aleatória' : userPixKeyType}
                            </Badge>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                              <p className="text-sm text-destructive">
                                Cadastre sua chave PIX no{' '}
                                <Link to="/perfil" className="underline font-medium">Perfil</Link>
                                {' '}antes de sacar.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Valor do saque */}
                        <div className="space-y-2">
                          <Label htmlFor="withdrawAmount">Valor do saque</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              R$
                            </span>
                            <Input
                              id="withdrawAmount"
                              type="number"
                              min="1"
                              max={balance}
                              step="0.01"
                              placeholder="0,00"
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              className="pl-10 text-lg h-12"
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Mínimo: R$ 10,00</span>
                            <button 
                              type="button"
                              className="text-primary hover:underline cursor-pointer"
                              onClick={() => setWithdrawAmount(balance.toFixed(2))}
                            >
                              Sacar tudo
                            </button>
                          </div>
                        </div>

                        {withdrawStep === 'form' ? (
                          <Button
                            onClick={() => {
                              const amt = parseFloat(withdrawAmount);
                              if (!amt || amt < 1) {
                                toast({ title: 'Valor mínimo R$ 1,00', description: 'O valor mínimo para saque é R$ 1,00', variant: 'destructive' });
                                return;
                              }
                              if (amt > balance) {
                                toast({ title: 'Saldo insuficiente', description: `Seu saldo é R$ ${balance.toFixed(2)}`, variant: 'destructive' });
                                return;
                              }
                              if (!userPixKey) {
                                toast({ title: 'Chave PIX não cadastrada', variant: 'destructive' });
                                return;
                              }
                              setWithdrawStep('confirm');
                            }}
                            disabled={!userPixKey || !parseFloat(withdrawAmount)}
                            className="w-full gap-2"
                            size="lg"
                          >
                            <Send className="h-5 w-5" />
                            Revisar Saque
                          </Button>
                        ) : (
                          <div className="space-y-4">
                            {/* Confirmation summary */}
                            <Card className="border-accent/30 bg-accent/5">
                              <CardContent className="py-4 space-y-3">
                                <p className="text-sm font-semibold text-foreground text-center">Resumo do Saque</p>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Nome</span>
                                    <span className="font-medium">{userFullName}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Chave PIX</span>
                                    <span className="font-medium text-right max-w-[180px] truncate">{userPixKey}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tipo</span>
                                    <Badge variant="outline" className="text-xs">
                                      {userPixKeyType === 'cpf' ? 'CPF' : 
                                       userPixKeyType === 'email' ? 'E-mail' : 
                                       userPixKeyType === 'phone' ? 'Telefone' : 
                                       userPixKeyType === 'random' ? 'Aleatória' : userPixKeyType}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Data</span>
                                    <span className="font-medium">{format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                                  </div>
                                  <div className="border-t pt-2 flex justify-between items-center">
                                    <span className="font-semibold text-foreground">Valor do saque</span>
                                    <span className="text-xl font-bold text-primary">R$ {parseFloat(withdrawAmount).toFixed(2)}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <div className="flex gap-3">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setWithdrawStep('form')}
                                disabled={withdrawLoading}
                              >
                                Voltar
                              </Button>
                              <Button
                                onClick={handleWithdraw}
                                disabled={withdrawLoading}
                                className="flex-1 gap-2"
                              >
                                {withdrawLoading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processando...
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4" />
                                    Confirmar Saque
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                </CardContent>
              </Card>

              {/* Card de Saldo Bônus */}
              <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <CardHeader className="relative pb-2">
                  <CardDescription className="text-amber-600 flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    Saldo Bônus
                  </CardDescription>
                  <CardTitle className="text-4xl font-bold text-amber-600">
                    R$ {bonusBalance.toFixed(2)}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Bônus de indicações • Não sacável
                  </p>
                </CardHeader>
                
                <CardContent className="relative pt-2">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      O saldo bônus só pode ser usado para jogar e não pode ser sacado.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Saldo Total */}
            <div className="p-4 rounded-lg bg-muted/50 border text-center">
              <p className="text-muted-foreground mb-1">Saldo Total (Principal + Bônus)</p>
              <p className="text-3xl font-bold">R$ {(balance + bonusBalance).toFixed(2)}</p>
            </div>

            {/* Histórico de Transações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Histórico de Transações
                </CardTitle>
                <CardDescription>
                  Suas últimas movimentações
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${getTransactionColor(transaction.type)}`}>
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <p className="font-medium">
                              {transaction.description || getTransactionLabel(transaction.type)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(transaction.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold text-lg ${
                            transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount >= 0 ? '+' : ''}R$ {transaction.amount.toFixed(2)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {getTransactionLabel(transaction.type)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nenhuma transação ainda
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Adicione créditos para começar a jogar!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Jogar Agora</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full gap-2" variant="outline">
                  <Link to="/sorteios">
                    <Ticket className="h-4 w-4" />
                    Ver Sorteios
                  </Link>
                </Button>
                <Button asChild className="w-full gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                  <Link to="/raspadinhas">
                    <Sparkles className="h-4 w-4" />
                    Jogar Raspadinhas
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}