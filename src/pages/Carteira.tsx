import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trophy,
  Ticket,
  Sparkles,
  Clock,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TransactionType } from '@/types';

const CREDIT_OPTIONS = [10, 25, 50, 100, 200, 500];

export default function Carteira() {
  const { user } = useAuth();
  const { wallet, transactions, balance, isLoading, deposit, refetch } = useWallet();
  const { toast } = useToast();
  
  const [isAddingCredits, setIsAddingCredits] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAddCredits = async () => {
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

    setIsProcessing(true);

    // Simular processamento de pagamento
    await new Promise(resolve => setTimeout(resolve, 1500));

    const { error } = await deposit(amount);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar créditos. Tente novamente.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Créditos adicionados!',
        description: `R$ ${amount.toFixed(2)} foram adicionados à sua carteira.`,
      });
      setSelectedAmount(null);
      setCustomAmount('');
      setDialogOpen(false);
      refetch();
    }

    setIsProcessing(false);
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
      default:
        return 'bg-muted';
    }
  };

  // Calcular estatísticas
  const totalDeposits = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalPrizes = transactions
    .filter(t => t.type === 'prize')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalSpent = transactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

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
            {/* Card de Saldo */}
            <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <CardHeader className="relative">
                <CardDescription className="text-primary-foreground/70">
                  Saldo Disponível
                </CardDescription>
                <CardTitle className="text-5xl font-bold">
                  R$ {balance.toFixed(2)}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="relative">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="lg" 
                      variant="secondary"
                      className="gap-2 shadow-lg"
                    >
                      <Plus className="h-5 w-5" />
                      Adicionar Créditos
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Adicionar Créditos
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
                    </div>

                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleAddCredits}
                        disabled={isProcessing || (!selectedAmount && !parseFloat(customAmount))}
                        className="gap-2"
                      >
                        {isProcessing ? (
                          'Processando...'
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Adicionar
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

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
            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Resumo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Total Depositado</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    R$ {totalDeposits.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Prêmios Ganhos</span>
                  </div>
                  <span className="font-semibold text-yellow-600">
                    R$ {totalPrizes.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Total Gasto</span>
                  </div>
                  <span className="font-semibold text-red-600">
                    R$ {totalSpent.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

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
