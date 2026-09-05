CREATE TABLE public.monthly_messages (
  id uuid primary key default gen_random_uuid(),
  month_key text not null unique,
  subject text not null,
  body_html text not null,
  status text not null default 'pending_approval',
  approval_token uuid not null default gen_random_uuid(),
  approved_at timestamptz,
  rejected_at timestamptz,
  sent_at timestamptz,
  recipient_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT ON public.monthly_messages TO authenticated;
GRANT ALL ON public.monthly_messages TO service_role;

ALTER TABLE public.monthly_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaders view monthly messages"
ON public.monthly_messages FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'chief_executive_director')
  OR public.has_role(auth.uid(), 'executive_secretary')
);

CREATE TRIGGER update_monthly_messages_updated_at
BEFORE UPDATE ON public.monthly_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();