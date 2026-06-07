
-- Pending Google sign-ups (people who started Google OAuth but haven't applied yet)
CREATE TABLE IF NOT EXISTS public.pending_google_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.pending_google_signups TO authenticated;
GRANT INSERT ON public.pending_google_signups TO anon;
GRANT ALL ON public.pending_google_signups TO service_role;

ALTER TABLE public.pending_google_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can stage google signup"
  ON public.pending_google_signups
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Self can read own staged signup"
  ON public.pending_google_signups
  FOR SELECT TO authenticated
  USING (LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')));

CREATE POLICY "Self can update own staged signup"
  ON public.pending_google_signups
  FOR UPDATE TO authenticated
  USING (LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')));

CREATE POLICY "Admins manage staged signups"
  ON public.pending_google_signups
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Check if an email is already an active registered DIT member
CREATE OR REPLACE FUNCTION public.is_registered_member(_email text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(email) = LOWER(_email)
      AND COALESCE(status, 'active') = 'active'
      AND COALESCE(profile_completed, false) = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_registered_member(text) TO anon, authenticated;

-- Faction-scoped birthday list (used by ED/EA dashboards)
CREATE OR REPLACE FUNCTION public.get_faction_birthdays(_faction text)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  faction text,
  date_of_birth date,
  headshot_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.user_id, p.full_name, p.faction, p.date_of_birth, p.headshot_url
  FROM public.profiles p
  WHERE p.faction = _faction
    AND p.date_of_birth IS NOT NULL
    AND COALESCE(p.status, 'active') = 'active'
$$;

GRANT EXECUTE ON FUNCTION public.get_faction_birthdays(text) TO authenticated;
