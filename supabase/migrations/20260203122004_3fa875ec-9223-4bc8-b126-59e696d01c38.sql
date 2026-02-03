-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT DEFAULT 'general',
  assigned_to UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support_messages table
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_from_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Policies for support_tickets
CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own open tickets"
  ON public.support_tickets FOR UPDATE
  USING (auth.uid() = user_id AND status = 'open');

CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all tickets"
  ON public.support_tickets FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Policies for support_messages
CREATE POLICY "Users can view messages from their tickets"
  ON public.support_messages FOR SELECT
  USING (ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = auth.uid()));

CREATE POLICY "Users can add messages to their tickets"
  ON public.support_messages FOR INSERT
  WITH CHECK (
    ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = auth.uid())
    AND auth.uid() = user_id
    AND is_from_admin = false
  );

CREATE POLICY "Admins can view all messages"
  ON public.support_messages FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can add messages to any ticket"
  ON public.support_messages FOR INSERT
  WITH CHECK (is_admin(auth.uid()) AND is_from_admin = true);

-- Indexes for performance
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_messages_ticket_id ON public.support_messages(ticket_id);

-- Trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();