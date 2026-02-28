import { supabase } from '@/integrations/supabase/client';

interface SendEmailParams {
  to: string | string[];
  template?: 'welcome' | 'password_recovery' | 'notification' | 'prize_won' | 'deposit_confirmed';
  data?: Record<string, string>;
  subject?: string;
  html?: string;
}

export async function sendEmail(params: SendEmailParams) {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: params,
  });

  if (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }

  return data;
}
