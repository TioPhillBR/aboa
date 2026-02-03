import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import type { AllSettings } from './usePlatformSettings';

export interface SettingsBackup {
  id: string;
  name: string;
  description: string | null;
  settings_data: AllSettings;
  created_by: string | null;
  created_at: string;
}

export interface SettingsHistoryEntry {
  id: string;
  category: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown>;
  changed_by: string | null;
  change_type: string;
  created_at: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function useSettingsBackup() {
  const { user } = useAuth();
  const [backups, setBackups] = useState<SettingsBackup[]>([]);
  const [history, setHistory] = useState<SettingsHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch all backups
  const fetchBackups = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('settings_backups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Parse settings_data from JSONB
      const parsedBackups = (data || []).map(backup => ({
        ...backup,
        settings_data: backup.settings_data as unknown as AllSettings,
      }));

      setBackups(parsedBackups);
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast.error('Erro ao carregar backups');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch settings history
  const fetchHistory = useCallback(async (limit = 50) => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('settings_history')
        .select(`
          *,
          profile:changed_by(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const entries = (data || []).map(entry => ({
        ...entry,
        old_value: entry.old_value as Record<string, unknown> | null,
        new_value: entry.new_value as Record<string, unknown>,
        profile: entry.profile as { full_name: string; avatar_url: string | null } | undefined,
      }));

      setHistory(entries);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Create a new backup
  const createBackup = useCallback(async (
    name: string,
    description: string,
    settings: AllSettings
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('settings_backups')
        .insert({
          name,
          description: description || null,
          settings_data: JSON.parse(JSON.stringify(settings)),
          created_by: user?.id,
        });

      if (error) throw error;

      toast.success('Backup criado com sucesso!');
      await fetchBackups();
      return true;
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Erro ao criar backup');
      return false;
    }
  }, [user?.id, fetchBackups]);

  // Delete a backup
  const deleteBackup = useCallback(async (backupId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('settings_backups')
        .delete()
        .eq('id', backupId);

      if (error) throw error;

      toast.success('Backup excluído');
      setBackups(prev => prev.filter(b => b.id !== backupId));
      return true;
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Erro ao excluir backup');
      return false;
    }
  }, []);

  // Record a settings change in history
  const recordChange = useCallback(async (
    category: string,
    oldValue: Record<string, unknown> | null,
    newValue: Record<string, unknown>,
    changeType: 'update' | 'restore' | 'import' = 'update'
  ): Promise<void> => {
    try {
      await supabase
        .from('settings_history')
        .insert({
          category,
          old_value: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
          new_value: JSON.parse(JSON.stringify(newValue)),
          changed_by: user?.id,
          change_type: changeType,
        });
    } catch (error) {
      console.error('Error recording change:', error);
      // Don't show error to user - this is a background operation
    }
  }, [user?.id]);

  // Export settings to JSON file
  const exportSettings = useCallback((settings: AllSettings, filename?: string) => {
    const data = JSON.stringify(settings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `configuracoes-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Configurações exportadas!');
  }, []);

  // Import settings from JSON file
  const importSettings = useCallback(async (
    file: File
  ): Promise<AllSettings | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content) as AllSettings;
          
          // Basic validation
          if (!parsed.general || !parsed.payment || !parsed.games) {
            toast.error('Arquivo de configurações inválido');
            resolve(null);
            return;
          }

          toast.success('Configurações importadas! Salve para aplicar.');
          resolve(parsed);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          toast.error('Erro ao ler arquivo. Verifique se é um JSON válido.');
          resolve(null);
        }
      };
      reader.onerror = () => {
        toast.error('Erro ao ler arquivo');
        resolve(null);
      };
      reader.readAsText(file);
    });
  }, []);

  return {
    backups,
    history,
    isLoading,
    isLoadingHistory,
    fetchBackups,
    fetchHistory,
    createBackup,
    deleteBackup,
    recordChange,
    exportSettings,
    importSettings,
  };
}
