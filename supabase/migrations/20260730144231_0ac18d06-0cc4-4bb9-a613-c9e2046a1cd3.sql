-- ============ FACTIONS ============
CREATE TABLE public.factions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  color text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.factions TO authenticated;
GRANT SELECT ON public.factions TO anon;
GRANT INSERT, UPDATE, DELETE ON public.factions TO authenticated;
GRANT ALL ON public.factions TO service_role;

ALTER TABLE public.factions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Factions readable by everyone"
  ON public.factions FOR SELECT
  USING (true);

CREATE POLICY "Leaders manage factions"
  ON public.factions FOR ALL
  TO authenticated
  USING (public.is_org_leader(auth.uid()))
  WITH CHECK (public.is_org_leader(auth.uid()));

CREATE TRIGGER factions_updated_at
  BEFORE UPDATE ON public.factions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.factions (code, name, description, color) VALUES
  ('SHI',    'Secured Health Initiative', 'Health advocacy, wellness and community care.', '#16a34a'),
  ('DYP',    'Discover Your Purpose',     'Purpose discovery, mentorship and personal development.', '#2563eb'),
  ('TECK',   'Tecknallogy',               'Technology, innovation and digital capacity building.', '#9333ea'),
  ('MINDUP', 'Mind Up',                   'Mindset, mental health and intellectual growth.', '#d97706');

-- Optional faction link on profiles
ALTER TABLE public.profiles
  ADD COLUMN faction_id uuid REFERENCES public.factions(id) ON DELETE SET NULL;

CREATE INDEX idx_profiles_faction_id ON public.profiles(faction_id);

-- Backfill from the existing text codes (tolerant of legacy spellings)
UPDATE public.profiles p
SET faction_id = f.id
FROM public.factions f
WHERE p.faction IS NOT NULL
  AND (
    UPPER(TRIM(p.faction)) = f.code
    OR (UPPER(TRIM(p.faction)) IN ('MINDUP','MIND UP','MIND-UP') AND f.code = 'MINDUP')
    OR (UPPER(TRIM(p.faction)) IN ('TECK','TECKNALLOGY','TECH') AND f.code = 'TECK')
  );

-- Keep the legacy text column in sync with faction_id in both directions
CREATE OR REPLACE FUNCTION public.sync_profile_faction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_code text;
  resolved_id uuid;
BEGIN
  IF NEW.faction_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.faction_id IS DISTINCT FROM OLD.faction_id) THEN
    SELECT code INTO resolved_code FROM public.factions WHERE id = NEW.faction_id;
    NEW.faction := resolved_code;
    RETURN NEW;
  END IF;

  IF NEW.faction_id IS NULL AND NEW.faction IS NOT NULL THEN
    SELECT id INTO resolved_id FROM public.factions
      WHERE code = UPPER(TRIM(NEW.faction))
         OR (UPPER(TRIM(NEW.faction)) IN ('MIND UP','MIND-UP') AND code = 'MINDUP')
         OR (UPPER(TRIM(NEW.faction)) = 'TECKNALLOGY' AND code = 'TECK')
      LIMIT 1;
    NEW.faction_id := resolved_id;
  ELSIF NEW.faction_id IS NULL AND NEW.faction IS NULL THEN
    NEW.faction_id := NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_sync_faction
  BEFORE INSERT OR UPDATE OF faction, faction_id ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_faction();

-- ============ INTERNAL EMAIL ============
CREATE TABLE public.internal_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  recipient_modes text[] NOT NULL DEFAULT '{}',
  member_ids uuid[] NOT NULL DEFAULT '{}',
  faction_ids uuid[] NOT NULL DEFAULT '{}',
  raw_to_emails text[] NOT NULL DEFAULT '{}',
  cc_emails text[] NOT NULL DEFAULT '{}',
  bcc_emails text[] NOT NULL DEFAULT '{}',
  scheduled_at timestamptz,
  timezone text,
  status text NOT NULL DEFAULT 'pending',
  recipient_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_internal_emails_status ON public.internal_emails(status, scheduled_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.internal_emails TO authenticated;
GRANT ALL ON public.internal_emails TO service_role;

ALTER TABLE public.internal_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and ES manage internal emails"
  ON public.internal_emails FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_executive_secretary(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_executive_secretary(auth.uid()));

CREATE TRIGGER internal_emails_updated_at
  BEFORE UPDATE ON public.internal_emails
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.internal_email_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id uuid NOT NULL REFERENCES public.internal_emails(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  recipient_name text,
  field text NOT NULL DEFAULT 'to',
  source text NOT NULL DEFAULT 'raw',
  member_user_id uuid,
  faction_id uuid REFERENCES public.factions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_internal_email_recipients_email_id ON public.internal_email_recipients(email_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.internal_email_recipients TO authenticated;
GRANT ALL ON public.internal_email_recipients TO service_role;

ALTER TABLE public.internal_email_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and ES manage internal email recipients"
  ON public.internal_email_recipients FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_executive_secretary(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_executive_secretary(auth.uid()));