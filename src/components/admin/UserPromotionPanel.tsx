import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
  ShieldCheck,
  Users,
  Crown,
  Loader2,
  ChevronDown,
  ShieldOff,
  UserX,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UserWithRoles {
  id: string;
  full_name: string;
  avatar_url: string | null;
  isAdmin: boolean;
  isAffiliate: boolean;
  affiliateStatus?: string;
}

interface UserPromotionPanelProps {
  user: UserWithRoles;
  onUpdate: () => void;
}

export function UserPromotionPanel({ user, onUpdate }: UserPromotionPanelProps) {
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'promote_admin' | 'remove_admin' | 'approve_affiliate' | 'reject_affiliate' | null;
    title: string;
    description: string;
  }>({ type: null, title: '', description: '' });

  const handlePromoteToAdmin = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.from('user_roles').insert({
        user_id: user.id,
        role: 'admin',
        created_by: currentUser.id,
      });

      if (error) throw error;

      toast.success(`${user.full_name} agora é administrador!`);
      onUpdate();
    } catch (error) {
      console.error('Error promoting user:', error);
      toast.error('Erro ao promover usuário');
    } finally {
      setIsLoading(false);
      setConfirmAction({ type: null, title: '', description: '' });
    }
  };

  const handleRemoveAdmin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (error) throw error;

      toast.success(`Permissões de admin removidas de ${user.full_name}`);
      onUpdate();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Erro ao remover permissões');
    } finally {
      setIsLoading(false);
      setConfirmAction({ type: null, title: '', description: '' });
    }
  };

  const handleApproveAffiliate = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ 
          status: 'approved',
          approved_by: currentUser?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(`${user.full_name} aprovado como afiliado!`);
      onUpdate();
    } catch (error) {
      console.error('Error approving affiliate:', error);
      toast.error('Erro ao aprovar afiliado');
    } finally {
      setIsLoading(false);
      setConfirmAction({ type: null, title: '', description: '' });
    }
  };

  const handleRejectAffiliate = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ status: 'rejected' })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(`Afiliação de ${user.full_name} rejeitada`);
      onUpdate();
    } catch (error) {
      console.error('Error rejecting affiliate:', error);
      toast.error('Erro ao rejeitar afiliado');
    } finally {
      setIsLoading(false);
      setConfirmAction({ type: null, title: '', description: '' });
    }
  };

  const executeAction = () => {
    switch (confirmAction.type) {
      case 'promote_admin':
        handlePromoteToAdmin();
        break;
      case 'remove_admin':
        handleRemoveAdmin();
        break;
      case 'approve_affiliate':
        handleApproveAffiliate();
        break;
      case 'reject_affiliate':
        handleRejectAffiliate();
        break;
    }
  };

  // Don't show actions for current user
  if (user.id === currentUser?.id) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crown className="h-4 w-4" />
            )}
            Promover
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Admin Actions */}
          {!user.isAdmin ? (
            <DropdownMenuItem
              onClick={() => setConfirmAction({
                type: 'promote_admin',
                title: 'Promover a Administrador?',
                description: `${user.full_name} terá acesso total ao painel administrativo, incluindo gerenciamento de usuários, configurações e finanças.`,
              })}
            >
              <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
              Promover a Admin
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setConfirmAction({
                type: 'remove_admin',
                title: 'Remover Permissões de Admin?',
                description: `${user.full_name} perderá acesso ao painel administrativo.`,
              })}
              className="text-destructive focus:text-destructive"
            >
              <ShieldOff className="h-4 w-4 mr-2" />
              Remover Admin
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Affiliate Actions */}
          {!user.isAffiliate ? (
            <DropdownMenuItem
              onClick={() => setConfirmAction({
                type: 'approve_affiliate',
                title: 'Aprovar como Afiliado?',
                description: `${user.full_name} será aprovado como afiliado e poderá compartilhar links de indicação.`,
              })}
            >
              <Users className="h-4 w-4 mr-2 text-success" />
              Aprovar como Afiliado
            </DropdownMenuItem>
          ) : user.affiliateStatus === 'pending' ? (
            <>
              <DropdownMenuItem
                onClick={() => setConfirmAction({
                  type: 'approve_affiliate',
                  title: 'Aprovar Afiliação?',
                  description: `Aprovar o pedido de afiliação de ${user.full_name}.`,
                })}
              >
                <Users className="h-4 w-4 mr-2 text-success" />
                Aprovar Afiliação
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setConfirmAction({
                  type: 'reject_affiliate',
                  title: 'Rejeitar Afiliação?',
                  description: `Rejeitar o pedido de afiliação de ${user.full_name}.`,
                })}
                className="text-destructive focus:text-destructive"
              >
                <UserX className="h-4 w-4 mr-2" />
                Rejeitar Afiliação
              </DropdownMenuItem>
            </>
          ) : user.affiliateStatus === 'approved' ? (
            <DropdownMenuItem
              onClick={() => setConfirmAction({
                type: 'reject_affiliate',
                title: 'Suspender Afiliado?',
                description: `${user.full_name} será suspenso do programa de afiliados.`,
              })}
              className="text-destructive focus:text-destructive"
            >
              <UserX className="h-4 w-4 mr-2" />
              Suspender Afiliado
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={confirmAction.type !== null} 
        onOpenChange={(open) => !open && setConfirmAction({ type: null, title: '', description: '' })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <Avatar>
              <AvatarImage src={user.avatar_url || ''} />
              <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.full_name}</p>
              <div className="flex gap-2 mt-1">
                {user.isAdmin && (
                  <Badge className="bg-primary/10 text-primary">Admin</Badge>
                )}
                {user.isAffiliate && (
                  <Badge className="bg-success/10 text-success">Afiliado</Badge>
                )}
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeAction}
              disabled={isLoading}
              className={confirmAction.type?.includes('remove') || confirmAction.type?.includes('reject') 
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                : ''
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
