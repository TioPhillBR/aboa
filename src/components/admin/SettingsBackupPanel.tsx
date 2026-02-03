import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Archive,
  Download,
  Upload,
  History,
  Trash2,
  RotateCcw,
  Clock,
  User,
  FileJson,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
import { useSettingsBackup, type SettingsBackup, type SettingsHistoryEntry } from '@/hooks/useSettingsBackup';
import type { AllSettings } from '@/hooks/usePlatformSettings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SettingsBackupPanelProps {
  currentSettings: AllSettings;
  onRestore: (settings: AllSettings) => void;
}

export function SettingsBackupPanel({ currentSettings, onRestore }: SettingsBackupPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [backupDescription, setBackupDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  const {
    backups,
    history,
    isLoading,
    isLoadingHistory,
    fetchBackups,
    fetchHistory,
    createBackup,
    deleteBackup,
    exportSettings,
    importSettings,
  } = useSettingsBackup();

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreateBackup = async () => {
    if (!backupName.trim()) return;
    
    setIsCreating(true);
    const success = await createBackup(backupName, backupDescription, currentSettings);
    setIsCreating(false);
    
    if (success) {
      setShowCreateDialog(false);
      setBackupName('');
      setBackupDescription('');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const settings = await importSettings(file);
    if (settings) {
      onRestore(settings);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRestoreBackup = (backup: SettingsBackup) => {
    onRestore(backup.settings_data);
  };

  const handleShowHistory = () => {
    setShowHistoryDialog(true);
    fetchHistory();
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      general: 'Geral',
      payment: 'Pagamentos',
      games: 'Jogos',
      commissions: 'Comissões',
      notifications: 'Notificações',
      security: 'Segurança',
    };
    return labels[category] || category;
  };

  const getChangeTypeLabel = (type: string): { label: string; color: string } => {
    switch (type) {
      case 'update':
        return { label: 'Alteração', color: 'bg-blue-500/10 text-blue-600' };
      case 'restore':
        return { label: 'Restauração', color: 'bg-amber-500/10 text-amber-600' };
      case 'import':
        return { label: 'Importação', color: 'bg-purple-500/10 text-purple-600' };
      default:
        return { label: type, color: 'bg-muted text-muted-foreground' };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Backup e Restauração
        </CardTitle>
        <CardDescription>
          Gerencie backups das configurações e visualize o histórico de alterações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {/* Create Backup */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Backup
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Backup</DialogTitle>
                <DialogDescription>
                  Salve uma cópia das configurações atuais para restaurar depois
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-name">Nome do Backup *</Label>
                  <Input
                    id="backup-name"
                    value={backupName}
                    onChange={(e) => setBackupName(e.target.value)}
                    placeholder="Ex: Antes de atualização"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup-description">Descrição</Label>
                  <Textarea
                    id="backup-description"
                    value={backupDescription}
                    onChange={(e) => setBackupDescription(e.target.value)}
                    placeholder="Notas sobre este backup..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateBackup} 
                  disabled={!backupName.trim() || isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Backup'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Export */}
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => exportSettings(currentSettings)}
          >
            <Download className="h-4 w-4" />
            Exportar JSON
          </Button>

          {/* Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Importar JSON
          </Button>

          {/* History */}
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleShowHistory}
          >
            <History className="h-4 w-4" />
            Histórico
          </Button>
        </div>

        <Separator />

        {/* Backups List */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <FileJson className="h-4 w-4" />
            Backups Salvos
          </h4>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum backup salvo</p>
              <p className="text-sm">Crie um backup para ter uma cópia das configurações</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium truncate">{backup.name}</h5>
                    {backup.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {backup.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(backup.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          <RotateCcw className="h-3 w-3" />
                          Restaurar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Restaurar Backup?</AlertDialogTitle>
                          <AlertDialogDescription>
                            As configurações atuais serão substituídas pelas do backup "{backup.name}".
                            Você ainda precisará salvar as alterações após restaurar.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRestoreBackup(backup)}>
                            Restaurar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Backup?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O backup "{backup.name}" será permanentemente excluído.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteBackup(backup.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History Dialog */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Alterações
              </DialogTitle>
              <DialogDescription>
                Registro de todas as mudanças nas configurações
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="h-[400px] pr-4">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma alteração registrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((entry) => {
                    const changeType = getChangeTypeLabel(entry.change_type);
                    const isExpanded = expandedHistoryId === entry.id;
                    
                    return (
                      <div
                        key={entry.id}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={entry.profile?.avatar_url || ''} />
                              <AvatarFallback className="text-xs">
                                {entry.profile?.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">
                                  {entry.profile?.full_name || 'Sistema'}
                                </span>
                                <Badge className={cn("text-xs", changeType.color)}>
                                  {changeType.label}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {getCategoryLabel(entry.category)}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedHistoryId(isExpanded ? null : entry.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 space-y-3">
                            {entry.old_value && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Valor Anterior:</Label>
                                <pre className="mt-1 p-2 rounded bg-muted text-xs overflow-auto max-h-32">
                                  {JSON.stringify(entry.old_value, null, 2)}
                                </pre>
                              </div>
                            )}
                            <div>
                              <Label className="text-xs text-muted-foreground">Novo Valor:</Label>
                              <pre className="mt-1 p-2 rounded bg-muted text-xs overflow-auto max-h-32">
                                {JSON.stringify(entry.new_value, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
