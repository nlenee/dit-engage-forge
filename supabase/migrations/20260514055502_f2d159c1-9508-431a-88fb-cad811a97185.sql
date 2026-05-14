
-- Faction scope
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS faction text;

-- Profile additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS headshot_url text,
  ADD COLUMN IF NOT EXISTS public_image_url text,
  ADD COLUMN IF NOT EXISTS favourite_quote text,
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS member_level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS edits_locked boolean NOT NULL DEFAULT false;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('headshots','headshots',true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('public-images','public-images',true) ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN CREATE POLICY "Headshots public read" ON storage.objects FOR SELECT USING (bucket_id='headshots'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Headshots owner write" ON storage.objects FOR INSERT WITH CHECK (bucket_id='headshots' AND auth.uid()::text=(storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Headshots owner update" ON storage.objects FOR UPDATE USING (bucket_id='headshots' AND auth.uid()::text=(storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Headshots owner delete" ON storage.objects FOR DELETE USING (bucket_id='headshots' AND auth.uid()::text=(storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public images public read" ON storage.objects FOR SELECT USING (bucket_id='public-images'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public images owner write" ON storage.objects FOR INSERT WITH CHECK (bucket_id='public-images' AND auth.uid()::text=(storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public images owner update" ON storage.objects FOR UPDATE USING (bucket_id='public-images' AND auth.uid()::text=(storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public images owner delete" ON storage.objects FOR DELETE USING (bucket_id='public-images' AND auth.uid()::text=(storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helper: any global role
CREATE OR REPLACE FUNCTION public.has_any_global_role(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','chief_executive_director','executive_secretary','community_manager','chief_finance_officer')
  )
$$;
REVOKE EXECUTE ON FUNCTION public.has_any_global_role(uuid) FROM anon;

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  points integer NOT NULL DEFAULT 10,
  category text DEFAULT 'general',
  repeatable boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "View active tasks" ON public.tasks FOR SELECT TO authenticated USING (active=true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins manage tasks" ON public.tasks FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  points_awarded integer NOT NULL DEFAULT 0,
  evidence_url text,
  completed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS task_completions_user_idx ON public.task_completions(user_id);
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "View own or all if global" ON public.task_completions FOR SELECT USING (auth.uid()=user_id OR has_any_global_role(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Insert own completion" ON public.task_completions FOR INSERT WITH CHECK (auth.uid()=user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.award_task_xp()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pts integer;
BEGIN
  SELECT points INTO pts FROM public.tasks WHERE id = NEW.task_id;
  NEW.points_awarded := COALESCE(pts,0);
  UPDATE public.profiles
    SET xp = xp + COALESCE(pts,0),
        member_level = GREATEST(1, FLOOR(SQRT((xp + COALESCE(pts,0))::numeric / 100))::int + 1)
    WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_award_task_xp ON public.task_completions;
CREATE TRIGGER trg_award_task_xp BEFORE INSERT ON public.task_completions
  FOR EACH ROW EXECUTE FUNCTION public.award_task_xp();

-- Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon text,
  threshold_xp integer DEFAULT 0
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "View achievements" ON public.achievements FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admins manage achievements" ON public.achievements FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "View own or global achievements" ON public.user_achievements FOR SELECT USING (auth.uid()=user_id OR has_any_global_role(auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Leaderboard
CREATE OR REPLACE FUNCTION public.get_leaderboard(_faction text DEFAULT NULL, _limit int DEFAULT 50)
RETURNS TABLE(user_id uuid, full_name text, faction text, xp integer, member_level integer, headshot_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id, full_name, faction, xp, member_level, headshot_url
  FROM public.profiles
  WHERE status='active' AND (_faction IS NULL OR faction=_faction)
  ORDER BY xp DESC, member_level DESC
  LIMIT _limit
$$;
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(text,int) FROM anon;

-- Public profile
CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id uuid)
RETURNS TABLE(
  user_id uuid, full_name text, faction text, bio text, favourite_quote text,
  headshot_url text, public_image_url text, xp integer, member_level integer,
  date_joined_year smallint, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id, full_name, faction, bio, favourite_quote,
         headshot_url, public_image_url, xp, member_level,
         date_joined_year, created_at
  FROM public.profiles
  WHERE user_id=_user_id AND status='active'
$$;
REVOKE EXECUTE ON FUNCTION public.get_public_profile(uuid) FROM anon;

-- Update directory RPC to include images & XP
DROP FUNCTION IF EXISTS public.get_member_directory();
CREATE OR REPLACE FUNCTION public.get_member_directory()
RETURNS TABLE(id uuid, user_id uuid, full_name text, faction text, status text, bio text, avatar_url text, headshot_url text, public_image_url text, xp integer, member_level integer, date_of_birth date, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, user_id, full_name, faction, status, bio, avatar_url, headshot_url, public_image_url, xp, member_level, date_of_birth, created_at
  FROM public.profiles
  WHERE status='active'
  ORDER BY full_name ASC
$$;
REVOKE EXECUTE ON FUNCTION public.get_member_directory() FROM anon;

-- Org account auto-promote on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  is_org boolean := lower(NEW.email) = 'divintelteam@gmail.com';
BEGIN
  INSERT INTO public.profiles (
    user_id, full_name, email, phone, date_of_birth, faction,
    origin_country, origin_state, origin_city,
    residence_country, residence_state, residence_city,
    date_joined_month, date_joined_year, date_joined_day, date_joined_approx,
    employment_status, employer_name,
    is_student, school, course, level,
    academic_background, graduation_year,
    profile_completed, edits_locked
  )
  VALUES (
    NEW.id,
    COALESCE(meta->>'full_name', CASE WHEN is_org THEN 'Divine Intelligence Team' ELSE NULL END),
    NEW.email,
    meta->>'phone',
    CASE WHEN meta->>'date_of_birth' IS NOT NULL AND meta->>'date_of_birth' <> ''
      THEN (meta->>'date_of_birth')::date ELSE NULL END,
    meta->>'faction',
    meta->>'origin_country', meta->>'origin_state', meta->>'origin_city',
    meta->>'residence_country', meta->>'residence_state', meta->>'residence_city',
    NULLIF(meta->>'date_joined_month','')::smallint,
    NULLIF(meta->>'date_joined_year','')::smallint,
    NULLIF(meta->>'date_joined_day','')::smallint,
    COALESCE((meta->>'date_joined_approx')::boolean, false),
    meta->>'employment_status',
    meta->>'employer_name',
    CASE WHEN meta->>'is_student' IS NOT NULL THEN (meta->>'is_student')::boolean ELSE NULL END,
    meta->>'school', meta->>'course', meta->>'level',
    meta->>'academic_background',
    NULLIF(meta->>'graduation_year','')::smallint,
    CASE WHEN is_org THEN true ELSE COALESCE((meta->>'profile_completed')::boolean, false) END,
    is_org
  );

  IF is_org THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'chief_executive_director') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed initial anniversary tasks
INSERT INTO public.tasks (code, title, description, points, category, repeatable) VALUES
  ('upload_facecard','Create your DIT Facecard','Upload your headshot and public image to complete your facecard',50,'profile',false),
  ('invite_member','Invite a new member','Invite a friend to join DIT for the 10th Anniversary',30,'community',true),
  ('share_flyer','Share the anniversary flyer','Share the official 10th Anniversary flyer on your status',20,'community',true),
  ('join_telegram','Join the Telegram group','Join the official DIT Telegram community',15,'community',false),
  ('join_whatsapp','Join the WhatsApp group','Join the official DIT WhatsApp community',15,'community',false),
  ('daily_checkin','Daily check-in','Open the app and check in every day',5,'engagement',true),
  ('post_testimony','Share a testimony','Share what DIT has meant to you',40,'engagement',false),
  ('attend_event','Attend an anniversary event','Attend any official anniversary event',60,'event',true)
ON CONFLICT (code) DO NOTHING;
