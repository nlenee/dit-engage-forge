
-- Profile flags for new-to-DIT onboarding
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_new_to_dit boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pending_role_assignment boolean NOT NULL DEFAULT false;

-- Password reset requests requiring admin approval
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  notes text
);

ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request password reset"
  ON public.password_reset_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users view own reset requests"
  ON public.password_reset_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and ES manage reset requests"
  ON public.password_reset_requests FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'executive_secretary'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'executive_secretary'::app_role));

CREATE INDEX IF NOT EXISTS idx_password_reset_requests_status ON public.password_reset_requests(status, requested_at DESC);
