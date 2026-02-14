
-- Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and ES can view all activity logs" ON public.activity_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'executive_secretary'::app_role));
CREATE POLICY "Authenticated users can insert activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own activity logs" ON public.activity_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location text,
  event_date timestamptz NOT NULL,
  event_end_date timestamptz,
  status text NOT NULL DEFAULT 'upcoming',
  max_attendees integer,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CM and admins can manage events" ON public.events
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'community_manager'::app_role) OR
    has_role(auth.uid(), 'executive_secretary'::app_role)
  );
CREATE POLICY "Authenticated users can view events" ON public.events
  FOR SELECT USING (true);

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create event_attendance table
CREATE TABLE IF NOT EXISTS public.event_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'registered',
  checked_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CM and admins can manage attendance" ON public.event_attendance
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'community_manager'::app_role) OR
    has_role(auth.uid(), 'executive_secretary'::app_role)
  );
CREATE POLICY "Users can view their own attendance" ON public.event_attendance
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can register for events" ON public.event_attendance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create engagement_logs table
CREATE TABLE IF NOT EXISTS public.engagement_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_user_id uuid NOT NULL,
  action_type text NOT NULL,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.engagement_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CM and admins can manage engagement logs" ON public.engagement_logs
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'community_manager'::app_role) OR
    has_role(auth.uid(), 'executive_secretary'::app_role)
  );

CREATE TRIGGER update_engagement_logs_updated_at BEFORE UPDATE ON public.engagement_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create community_feedback table
CREATE TABLE IF NOT EXISTS public.community_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by uuid NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  resolved_by uuid,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can submit feedback" ON public.community_feedback
  FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Members can view own feedback" ON public.community_feedback
  FOR SELECT USING (auth.uid() = submitted_by);
CREATE POLICY "CM and admins can manage feedback" ON public.community_feedback
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'community_manager'::app_role) OR
    has_role(auth.uid(), 'executive_secretary'::app_role)
  );

CREATE TRIGGER update_community_feedback_updated_at BEFORE UPDATE ON public.community_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create financial_transactions table
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  amount numeric(12,2) NOT NULL,
  description text NOT NULL,
  category text,
  faction text,
  reference_number text,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  document_url text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CFO and admins can manage transactions" ON public.financial_transactions
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'chief_finance_officer'::app_role)
  );
CREATE POLICY "ES can view transactions" ON public.financial_transactions
  FOR SELECT USING (has_role(auth.uid(), 'executive_secretary'::app_role));

CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  fiscal_year integer NOT NULL,
  total_amount numeric(12,2) NOT NULL,
  spent_amount numeric(12,2) NOT NULL DEFAULT 0,
  category text,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CFO and admins can manage budgets" ON public.budgets
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'chief_finance_officer'::app_role)
  );
CREATE POLICY "ES can view budgets" ON public.budgets
  FOR SELECT USING (has_role(auth.uid(), 'executive_secretary'::app_role));

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create fundraising_campaigns table
CREATE TABLE IF NOT EXISTS public.fundraising_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  target_amount numeric(12,2) NOT NULL,
  raised_amount numeric(12,2) NOT NULL DEFAULT 0,
  contributors_count integer NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  end_date date,
  status text NOT NULL DEFAULT 'active',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fundraising_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CFO and admins can manage fundraising" ON public.fundraising_campaigns
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'chief_finance_officer'::app_role)
  );
CREATE POLICY "ES can view fundraising" ON public.fundraising_campaigns
  FOR SELECT USING (has_role(auth.uid(), 'executive_secretary'::app_role));
CREATE POLICY "Authenticated users can view active fundraising" ON public.fundraising_campaigns
  FOR SELECT USING (status = 'active');

CREATE TRIGGER update_fundraising_campaigns_updated_at BEFORE UPDATE ON public.fundraising_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
