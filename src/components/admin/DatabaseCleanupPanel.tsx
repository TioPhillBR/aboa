import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Trash2, 
  AlertTriangle, 
  Loader2, 
  Database,
  Users,
  Ticket,
  Wallet,
  MessageSquare,
  Gift,
  Share2,
  CheckCircle,
  XCircle,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CleanupOption {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  tables: string[];
  dangerous?: boolean;
}

const cleanupOptions: CleanupOption[] = [
  {
    id: 'users',
    label: 'Usuários não-admin',
    description: 'Remove todos os perfis e dados de usuários que não são administradores',
    icon: Users,
    tables: ['profiles', 'user_locations', 'user_sessions'],
    dangerous: true
  },
  {
    id: 'raffles',
    label: 'Sorteios e Tickets',
    description: 'Remove todos os sorteios, tickets e prêmios',
    icon: Ticket,
    tables: ['raffle_tickets', 'raffle_prizes', 'raffles']
  },
  {
    id: 'scratch',
    label: 'Raspadinhas',
    description: 'Remove raspadinhas, chances e símbolos',
    icon: Gift,
    tables: ['scratch_chances', 'scratch_symbols', 'scratch_card_batches', 'scratch_cards']
  },
  {
    id: 'financial',
    label: 'Dados Financeiros',
    description: 'Remove carteiras, transações, saques e pagamentos',
    icon: Wallet,
    tables: ['wallet_transactions', 'wallets', 'user_withdrawals', 'payment_transactions']
  },
  {
    id: 'support',
    label: 'Tickets de Suporte',
    description: 'Remove todos os tickets e mensagens de suporte',
    icon: MessageSquare,
    tables: ['support_messages', 'support_tickets']
  },
  {
    id: 'affiliates',
    label: 'Afiliados e Vendas',
    description: 'Remove afiliados, vendas e saques de afiliados',
    icon: Share2,
    tables: ['affiliate_sales', 'affiliate_withdrawals', 'affiliates']
  },
  {
    id: 'referrals',
    label: 'Indicações',
    description: 'Remove códigos de indicação e registros de indicações',
    icon: Users,
    tables: ['referrals', 'referral_codes']
  },
  {
    id: 'shares',
    label: 'Compartilhamentos',
    description: 'Remove tracking de compartilhamentos e eventos',
    icon: Share2,
    tables: ['share_events', 'share_tracking']
  }
];

export function DatabaseCleanupPanel() {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [results, setResults] = useState<{ table: string; success: boolean; message: string }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [preserveAdminData, setPreserveAdminData] = useState(false);

  const CONFIRM_PHRASE = 'LIMPAR DADOS';

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const selectAll = () => {
    setSelectedOptions(cleanupOptions.map(opt => opt.id));
  };

  const clearSelection = () => {
    setSelectedOptions([]);
  };

  const getSelectedTables = (): string[] => {
    const tables: string[] = [];
    selectedOptions.forEach(optionId => {
      const option = cleanupOptions.find(o => o.id === optionId);
      if (option) {
        tables.push(...option.tables);
      }
    });
    return [...new Set(tables)];
  };

  const handleCleanup = async () => {
    if (confirmText !== CONFIRM_PHRASE) {
      toast.error('Digite a frase de confirmação corretamente');
      return;
    }

    setIsClearing(true);
    setResults([]);
    setShowResults(true);

    const tablesToClear = getSelectedTables();

    try {
      // Call edge function with service role (bypasses RLS)
      const { data, error } = await supabase.functions.invoke('cleanup-database', {
        body: {
          tables: tablesToClear,
          confirmPhrase: CONFIRM_PHRASE,
          preserveAdminData: preserveAdminData
        }
      });

      if (error) {
        toast.error(`Erro na limpeza: ${error.message}`);
        setResults([{ table: 'all', success: false, message: error.message }]);
      } else if (data) {
        setResults(data.results || []);
        
        if (data.success) {
          toast.success(data.message);
        } else {
          toast.warning(data.message);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro: ${message}`);
      setResults([{ table: 'all', success: false, message }]);
    }

    setIsClearing(false);
    setConfirmText('');
    setSelectedOptions([]);
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Database className="h-5 w-5" />
          Limpeza do Banco de Dados
        </CardTitle>
        <CardDescription>
          Remova dados de teste mantendo apenas os usuários administradores.
          <span className="block mt-1 text-destructive font-medium">
            ⚠️ Esta ação é irreversível!
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info about force cleanup */}
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-primary mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-primary">Modo Forçado:</span> Esta limpeza utiliza 
              privilégios administrativos que ignoram as políticas de segurança (RLS), garantindo 
              que todos os dados selecionados sejam removidos completamente.
            </div>
          </div>
        </div>

        {/* Preserve admin data toggle */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Preservar dados dos administradores
              </Label>
              <p className="text-xs text-muted-foreground">
                {preserveAdminData 
                  ? "Dados de carteira, tickets e transações dos admins serão mantidos"
                  : "Todos os dados serão limpos, exceto perfis e permissões dos admins"
                }
              </p>
            </div>
            <Checkbox 
              checked={preserveAdminData} 
              onCheckedChange={(checked) => setPreserveAdminData(checked === true)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Selecionar Todos
          </Button>
          <Button variant="outline" size="sm" onClick={clearSelection}>
            Limpar Seleção
          </Button>
          <Badge variant="secondary">
            {selectedOptions.length} selecionado(s)
          </Badge>
        </div>

        <Separator />

        <div className="grid gap-3 sm:grid-cols-2">
          {cleanupOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedOptions.includes(option.id);
            
            return (
              <div
                key={option.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-destructive bg-destructive/5' 
                    : 'border-border hover:border-muted-foreground/50'
                }`}
                onClick={() => toggleOption(option.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox 
                    checked={isSelected} 
                    onCheckedChange={() => toggleOption(option.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{option.label}</span>
                      {option.dangerous && (
                        <Badge variant="destructive" className="text-xs">
                          Crítico
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Tabelas: {option.tables.join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showResults && results.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium">Resultados da Limpeza</Label>
              <div className="max-h-48 overflow-y-auto space-y-1 p-3 bg-muted/50 rounded-lg">
                {results.map((result, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center gap-2 text-sm ${
                      result.success ? 'text-green-600' : 'text-destructive'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span className="font-mono">{result.table}</span>
                    <span className="text-muted-foreground">- {result.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="space-y-4">
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium text-destructive">
                  Atenção: Esta ação não pode ser desfeita!
                </p>
                <p className="text-xs text-muted-foreground">
                  Todos os dados selecionados serão permanentemente removidos do banco de dados. 
                  Apenas os usuários com papel de administrador e seus dados relacionados serão preservados.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">
              Digite <strong className="text-destructive">{CONFIRM_PHRASE}</strong> para confirmar:
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="Digite a frase de confirmação"
              className="max-w-sm"
              disabled={isClearing}
            />
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                disabled={selectedOptions.length === 0 || confirmText !== CONFIRM_PHRASE || isClearing}
                className="gap-2"
              >
                {isClearing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Limpando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Limpar Dados Selecionados
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Confirmar Limpeza do Banco
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    Você está prestes a deletar permanentemente os dados de:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {selectedOptions.map(optId => {
                      const opt = cleanupOptions.find(o => o.id === optId);
                      return opt ? <li key={optId}>{opt.label}</li> : null;
                    })}
                  </ul>
                  <p className="font-medium text-destructive">
                    Esta ação é IRREVERSÍVEL. Deseja continuar?
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleCleanup}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Sim, Limpar Dados
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
