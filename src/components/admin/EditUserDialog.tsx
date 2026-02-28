import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, User, MapPin, CreditCard } from 'lucide-react';
import { Profile } from '@/types';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile | null;
  onSaved: () => void;
}

export function EditUserDialog({ open, onOpenChange, user, onSaved }: EditUserDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    cpf: '',
    birth_date: '',
    pix_key: '',
    pix_key_type: '',
    address_cep: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        cpf: user.cpf || '',
        birth_date: user.birth_date || '',
        pix_key: user.pix_key || '',
        pix_key_type: user.pix_key_type || '',
        address_cep: user.address_cep || '',
        address_street: user.address_street || '',
        address_number: user.address_number || '',
        address_complement: user.address_complement || '',
        address_neighborhood: user.address_neighborhood || '',
        address_city: user.address_city || '',
        address_state: user.address_state || '',
      });
    }
  }, [user]);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const formatCEP = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const formatBirthDate = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  // Convert display date (DD/MM/YYYY) to DB format (YYYY-MM-DD)
  const displayToDbDate = (display: string): string => {
    if (!display || display.length < 10) return '';
    const parts = display.split('/');
    if (parts.length !== 3) return '';
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  // Convert DB date (YYYY-MM-DD) to display format (DD/MM/YYYY)
  const dbToDisplayDate = (db: string): string => {
    if (!db) return '';
    const parts = db.split('-');
    if (parts.length !== 3) return db;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const [birthDateDisplay, setBirthDateDisplay] = useState('');

  useEffect(() => {
    if (user?.birth_date) {
      setBirthDateDisplay(dbToDisplayDate(user.birth_date));
    } else {
      setBirthDateDisplay('');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    if (!form.full_name.trim()) {
      toast({ title: 'Nome completo é obrigatório', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const birthDateDb = displayToDbDate(birthDateDisplay);

      const updateData: Record<string, string | null> = {
        full_name: form.full_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.replace(/\D/g, '') || null,
        cpf: form.cpf.replace(/\D/g, '') || null,
        birth_date: birthDateDb || null,
        pix_key: form.pix_key.trim() || null,
        pix_key_type: form.pix_key_type || null,
        address_cep: form.address_cep.replace(/\D/g, '') || null,
        address_street: form.address_street.trim() || null,
        address_number: form.address_number.trim() || null,
        address_complement: form.address_complement.trim() || null,
        address_neighborhood: form.address_neighborhood.trim() || null,
        address_city: form.address_city.trim() || null,
        address_state: form.address_state.trim() || null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast({ title: 'Perfil atualizado com sucesso!' });
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Erro ao atualizar perfil', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Perfil do Usuário
          </DialogTitle>
          <DialogDescription>
            Edite os dados de <strong>{user.full_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-2">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                Dados Pessoais
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome Completo *</Label>
                  <Input
                    id="edit-name"
                    value={form.full_name}
                    onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">E-mail</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input
                    id="edit-phone"
                    value={formatPhone(form.phone)}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cpf">CPF</Label>
                  <Input
                    id="edit-cpf"
                    value={formatCPF(form.cpf)}
                    onChange={(e) => setForm(f => ({ ...f, cpf: e.target.value }))}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-birth">Data de Nascimento</Label>
                  <Input
                    id="edit-birth"
                    value={birthDateDisplay}
                    onChange={(e) => setBirthDateDisplay(formatBirthDate(e.target.value))}
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Chave PIX */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                Chave PIX
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-pix-type">Tipo de Chave</Label>
                  <Select
                    value={form.pix_key_type}
                    onValueChange={(v) => setForm(f => ({ ...f, pix_key_type: v }))}
                  >
                    <SelectTrigger id="edit-pix-type">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="phone">Telefone</SelectItem>
                      <SelectItem value="random">Chave Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-pix-key">Chave PIX</Label>
                  <Input
                    id="edit-pix-key"
                    value={form.pix_key}
                    onChange={(e) => setForm(f => ({ ...f, pix_key: e.target.value }))}
                    placeholder="Chave PIX do usuário"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Endereço
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-cep">CEP</Label>
                  <Input
                    id="edit-cep"
                    value={formatCEP(form.address_cep)}
                    onChange={(e) => setForm(f => ({ ...f, address_cep: e.target.value }))}
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-street">Rua</Label>
                  <Input
                    id="edit-street"
                    value={form.address_street}
                    onChange={(e) => setForm(f => ({ ...f, address_street: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-number">Número</Label>
                  <Input
                    id="edit-number"
                    value={form.address_number}
                    onChange={(e) => setForm(f => ({ ...f, address_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-complement">Complemento</Label>
                  <Input
                    id="edit-complement"
                    value={form.address_complement}
                    onChange={(e) => setForm(f => ({ ...f, address_complement: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-neighborhood">Bairro</Label>
                  <Input
                    id="edit-neighborhood"
                    value={form.address_neighborhood}
                    onChange={(e) => setForm(f => ({ ...f, address_neighborhood: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-city">Cidade</Label>
                  <Input
                    id="edit-city"
                    value={form.address_city}
                    onChange={(e) => setForm(f => ({ ...f, address_city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-state">Estado</Label>
                  <Select
                    value={form.address_state}
                    onValueChange={(v) => setForm(f => ({ ...f, address_state: v }))}
                  >
                    <SelectTrigger id="edit-state">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="flex-1 gap-2" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
