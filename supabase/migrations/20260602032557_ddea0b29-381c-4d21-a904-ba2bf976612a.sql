
-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.application_type AS ENUM ('membership','volunteer','program','boe_appointment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.application_status AS ENUM (
    'submitted','under_review','interview_scheduled','approved','rejected',
    'reassigned','withdrawn','reapply_pending'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.app_document_type AS ENUM ('profile_photo','cv','portfolio','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.review_action AS ENUM (
    'approved','rejected','reassigned','interview_requested','flagged','commented'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.interview_channel AS ENUM ('video_call','voice_call','in_person');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.interview_outcome AS ENUM ('pending','passed','failed','deferred');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.form_type AS ENUM ('membership','volunteer','program','custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.question_type AS ENUM (
    'text','textarea','radio','checkbox','scale','file_upload','date'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'acknowledgement','status_update','interview_invite','decision','reapply_unlock'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.delivery_status AS ENUM ('sent','delivered','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ HELPER: reviewer/faction checks ============
CREATE OR REPLACE FUNCTION public.is_reviewer(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN (
        'admin','chief_executive_director','executive_secretary',
        'community_manager','executive_director','executive_assistant'
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.user_faction(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT faction FROM public.user_roles
   WHERE user_id = _user_id AND faction IS NOT NULL
   LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_org_leader(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','chief_executive_director','executive_secretary','community_manager')
  )
$$;

-- ============ REFERENCE NUMBER SEQUENCE ============
CREATE SEQUENCE IF NOT EXISTS public.application_ref_seq START 1;

CREATE OR REPLACE FUNCTION public.gen_application_reference()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  n := nextval('public.application_ref_seq');
  RETURN 'DIT-' || to_char(now(),'YYYY') || '-' || lpad(n::text, 4, '0');
END $$;

-- ============ APPLICATIONS ============
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text UNIQUE NOT NULL DEFAULT public.gen_application_reference(),
  application_type public.application_type NOT NULL DEFAULT 'membership',
  applicant_email text NOT NULL,
  applicant_name text NOT NULL,
  applicant_user_id uuid,
  status public.application_status NOT NULL DEFAULT 'submitted',
  selected_faction text,
  ai_suggested_faction text,
  ai_suggestion_accepted boolean,
  final_faction text,
  ai_role_suggestions jsonb DEFAULT '[]'::jsonb,
  placement_flag boolean NOT NULL DEFAULT false,
  ref_campaign text,
  link_slug text,
  reapply_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_email ON public.applications(applicant_email);
CREATE INDEX IF NOT EXISTS idx_applications_faction ON public.applications(final_faction);
CREATE INDEX IF NOT EXISTS idx_applications_ref ON public.applications(reference_number);

GRANT SELECT, INSERT ON public.applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
GRANT USAGE ON SEQUENCE public.application_ref_seq TO anon, authenticated, service_role;

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can submit applications" ON public.applications
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Applicants view own by email" ON public.applications
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND applicant_user_id = auth.uid())
    OR public.is_reviewer(auth.uid())
  );

CREATE POLICY "Reviewers update applications in scope" ON public.applications
  FOR UPDATE USING (
    public.is_org_leader(auth.uid())
    OR (public.is_reviewer(auth.uid()) AND public.user_faction(auth.uid()) IS NOT NULL
        AND (final_faction = public.user_faction(auth.uid())
             OR selected_faction = public.user_faction(auth.uid())
             OR ai_suggested_faction = public.user_faction(auth.uid())))
  );

CREATE POLICY "Admins delete applications" ON public.applications
  FOR DELETE USING (public.has_role(auth.uid(),'admin'));

-- updated_at trigger
CREATE TRIGGER trg_applications_updated
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ APPLICATION RESPONSES ============
CREATE TABLE IF NOT EXISTS public.application_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  section text NOT NULL,
  question_key text NOT NULL,
  question_text text,
  response_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_resp_app ON public.application_responses(application_id);

GRANT SELECT, INSERT ON public.application_responses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_responses TO authenticated;
GRANT ALL ON public.application_responses TO service_role;

ALTER TABLE public.application_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert responses" ON public.application_responses
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Reviewers and owners read" ON public.application_responses
  FOR SELECT USING (
    public.is_reviewer(auth.uid())
    OR EXISTS (SELECT 1 FROM public.applications a
               WHERE a.id = application_id AND a.applicant_user_id = auth.uid())
  );

-- ============ APPLICATION DOCUMENTS ============
CREATE TABLE IF NOT EXISTS public.application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_type public.app_document_type NOT NULL,
  storage_path text NOT NULL,
  file_name text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.application_documents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_documents TO authenticated;
GRANT ALL ON public.application_documents TO service_role;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert docs" ON public.application_documents
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Reviewers and owners read docs" ON public.application_documents
  FOR SELECT USING (
    public.is_reviewer(auth.uid())
    OR EXISTS (SELECT 1 FROM public.applications a
               WHERE a.id = application_id AND a.applicant_user_id = auth.uid())
  );

-- ============ STATUS LOG ============
CREATE TABLE IF NOT EXISTS public.application_status_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  previous_status text,
  new_status text NOT NULL,
  changed_by uuid,
  changed_by_role text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.application_status_log TO authenticated;
GRANT ALL ON public.application_status_log TO service_role;
ALTER TABLE public.application_status_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviewers manage status log" ON public.application_status_log
  FOR ALL USING (public.is_reviewer(auth.uid())) WITH CHECK (public.is_reviewer(auth.uid()));

-- ============ REVIEWS ============
CREATE TABLE IF NOT EXISTS public.application_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  reviewer_role text,
  action public.review_action NOT NULL,
  target_faction text,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_app ON public.application_reviews(application_id);
GRANT SELECT, INSERT ON public.application_reviews TO authenticated;
GRANT ALL ON public.application_reviews TO service_role;
ALTER TABLE public.application_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviewers manage reviews" ON public.application_reviews
  FOR ALL USING (public.is_reviewer(auth.uid())) WITH CHECK (public.is_reviewer(auth.uid()));

-- ============ AI PLACEMENT ============
CREATE TABLE IF NOT EXISTS public.ai_placement_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,
  faction_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  primary_faction text,
  faction_reasoning jsonb DEFAULT '{}'::jsonb,
  role_suggestions jsonb DEFAULT '[]'::jsonb,
  placement_flag boolean NOT NULL DEFAULT false,
  flag_reason text,
  model_version text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_placement_results TO authenticated;
GRANT ALL ON public.ai_placement_results TO service_role;
ALTER TABLE public.ai_placement_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviewers and owner read placement" ON public.ai_placement_results
  FOR SELECT USING (
    public.is_reviewer(auth.uid())
    OR EXISTS (SELECT 1 FROM public.applications a
               WHERE a.id = application_id AND a.applicant_user_id = auth.uid())
  );

-- ============ INTERVIEWS ============
CREATE TABLE IF NOT EXISTS public.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  scheduled_by uuid,
  interview_date date NOT NULL,
  interview_time time,
  channel public.interview_channel NOT NULL,
  channel_link text,
  channel_address text,
  interviewer_ids uuid[] DEFAULT '{}',
  applicant_notified boolean DEFAULT false,
  notes text,
  outcome public.interview_outcome NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.interviews TO authenticated;
GRANT ALL ON public.interviews TO service_role;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviewers manage interviews" ON public.interviews
  FOR ALL USING (public.is_reviewer(auth.uid())) WITH CHECK (public.is_reviewer(auth.uid()));
CREATE POLICY "Applicant read own interviews" ON public.interviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.applications a
            WHERE a.id = application_id AND a.applicant_user_id = auth.uid())
  );

-- ============ FORM TEMPLATES ============
CREATE TABLE IF NOT EXISTS public.form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faction text,
  form_type public.form_type NOT NULL,
  form_name text NOT NULL,
  form_description text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  last_edited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.form_templates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.form_templates TO authenticated;
GRANT ALL ON public.form_templates TO service_role;
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active forms public read" ON public.form_templates
  FOR SELECT USING (is_active = true OR public.is_reviewer(auth.uid()));
CREATE POLICY "Reviewers manage forms" ON public.form_templates
  FOR ALL USING (public.is_reviewer(auth.uid())) WITH CHECK (public.is_reviewer(auth.uid()));
CREATE TRIGGER trg_forms_updated BEFORE UPDATE ON public.form_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ QUESTION LIBRARY ============
CREATE TABLE IF NOT EXISTS public.question_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  question_type public.question_type NOT NULL,
  options jsonb DEFAULT '[]'::jsonb,
  scale_min integer,
  scale_max integer,
  scale_labels jsonb,
  created_by_faction text,
  is_global boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_library TO authenticated;
GRANT ALL ON public.question_library TO service_role;
ALTER TABLE public.question_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviewers manage question library" ON public.question_library
  FOR ALL USING (public.is_reviewer(auth.uid())) WITH CHECK (public.is_reviewer(auth.uid()));

-- ============ REAPPLICATION LOCKS ============
CREATE TABLE IF NOT EXISTS public.reapplication_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_email text NOT NULL,
  locked_at timestamptz NOT NULL DEFAULT now(),
  unlock_at timestamptz NOT NULL,
  lock_duration_days integer NOT NULL DEFAULT 90,
  set_by uuid,
  reason text
);
CREATE INDEX IF NOT EXISTS idx_locks_email ON public.reapplication_locks(applicant_email);
GRANT SELECT ON public.reapplication_locks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reapplication_locks TO authenticated;
GRANT ALL ON public.reapplication_locks TO service_role;
ALTER TABLE public.reapplication_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can check locks" ON public.reapplication_locks
  FOR SELECT USING (true);
CREATE POLICY "Reviewers manage locks" ON public.reapplication_locks
  FOR ALL USING (public.is_reviewer(auth.uid())) WITH CHECK (public.is_reviewer(auth.uid()));

-- ============ NOTIFICATIONS LOG ============
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  notification_type public.notification_type NOT NULL,
  subject text,
  body text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  delivery_status public.delivery_status NOT NULL DEFAULT 'sent'
);
GRANT SELECT, INSERT ON public.notifications_log TO authenticated;
GRANT ALL ON public.notifications_log TO service_role;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviewers read notifications log" ON public.notifications_log
  FOR SELECT USING (public.is_reviewer(auth.uid()));
CREATE POLICY "Service inserts notifications" ON public.notifications_log
  FOR INSERT WITH CHECK (true);

-- ============ APPLICATION LINKS ============
CREATE TABLE IF NOT EXISTS public.application_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faction text,
  link_slug text NOT NULL,
  ref_campaign text,
  created_by uuid,
  application_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (link_slug, ref_campaign)
);
GRANT SELECT ON public.application_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.application_links TO authenticated;
GRANT ALL ON public.application_links TO service_role;
ALTER TABLE public.application_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active links" ON public.application_links
  FOR SELECT USING (true);
CREATE POLICY "Reviewers manage links" ON public.application_links
  FOR ALL USING (public.is_reviewer(auth.uid())) WITH CHECK (public.is_reviewer(auth.uid()));

-- ============ AUTO-INCREMENT CAMPAIGN COUNT ============
CREATE OR REPLACE FUNCTION public.increment_application_link_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.ref_campaign IS NOT NULL OR NEW.link_slug IS NOT NULL THEN
    UPDATE public.application_links
       SET application_count = application_count + 1
     WHERE (NEW.ref_campaign IS NOT NULL AND ref_campaign = NEW.ref_campaign)
        OR (NEW.ref_campaign IS NULL AND NEW.link_slug IS NOT NULL
            AND link_slug = NEW.link_slug AND ref_campaign IS NULL);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_app_link_increment
AFTER INSERT ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.increment_application_link_count();

-- ============ STATUS LOG TRIGGER ============
CREATE OR REPLACE FUNCTION public.log_application_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.application_status_log(application_id, previous_status, new_status, changed_by)
    VALUES (NEW.id, NULL, NEW.status::text, NEW.applicant_user_id);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.application_status_log(application_id, previous_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status::text, NEW.status::text, auth.uid());
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_app_status_log
AFTER INSERT OR UPDATE OF status ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.log_application_status_change();

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.application_reviews;

-- ============ SEED FORM TEMPLATES ============
INSERT INTO public.form_templates (faction, form_type, form_name, form_description, sections, is_active)
VALUES
('SHI','membership','SHI Membership Application','Faction-specific questions for Secured Health Initiative applicants.',
 '[{"name":"Faction Specific","questions":[
    {"key":"shi_motivation","type":"textarea","text":"Why are you drawn to community health work?","required":true},
    {"key":"shi_experience","type":"textarea","text":"Describe any health, wellness, or care experience you have.","required":false},
    {"key":"shi_focus","type":"radio","text":"Which area of health work resonates most?","options":["Health awareness","Healthcare access","Community health solutions","Research & policy"],"required":true}
 ]}]'::jsonb, true),
('DYP','membership','DYP Membership Application','Faction-specific questions for Discover Your Purpose applicants.',
 '[{"name":"Faction Specific","questions":[
    {"key":"dyp_purpose","type":"textarea","text":"How would you describe your current sense of purpose?","required":true},
    {"key":"dyp_helping","type":"textarea","text":"Describe a time you helped someone discover something meaningful about themselves.","required":true},
    {"key":"dyp_focus","type":"radio","text":"Which area excites you most?","options":["Coaching","Workshops & facilitation","Content & storytelling","Research"],"required":true}
 ]}]'::jsonb, true),
('TECK','membership','TECK Membership Application','Faction-specific questions for Tecknallogy applicants.',
 '[{"name":"Faction Specific","questions":[
    {"key":"teck_stack","type":"text","text":"What technologies do you work with most?","required":true},
    {"key":"teck_project","type":"textarea","text":"Describe a tech project you built or contributed to.","required":true},
    {"key":"teck_focus","type":"checkbox","text":"Which areas interest you?","options":["Software engineering","Product design","Data & AI","Hardware/IoT","DevOps","Cybersecurity"],"required":true}
 ]}]'::jsonb, true),
('MindUp','membership','MindUp Membership Application','Faction-specific questions for MindUp applicants.',
 '[{"name":"Faction Specific","questions":[
    {"key":"mindup_wellness","type":"textarea","text":"How do you currently care for your mental wellness?","required":true},
    {"key":"mindup_support","type":"textarea","text":"Describe a time you supported someone through a mental or emotional challenge.","required":true},
    {"key":"mindup_focus","type":"radio","text":"Which area calls you most?","options":["Mental health awareness","Mindset coaching","Counselling support","Research & content"],"required":true}
 ]}]'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Seed link rows for each faction so counts start tracking immediately
INSERT INTO public.application_links (faction, link_slug, is_active)
VALUES ('SHI','shi',true),('DYP','dyp',true),('TECK','teck',true),('MindUp','mindup',true),(NULL,'apply',true)
ON CONFLICT DO NOTHING;
