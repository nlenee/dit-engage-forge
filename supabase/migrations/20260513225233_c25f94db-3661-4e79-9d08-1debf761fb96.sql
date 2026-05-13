
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS origin_country text,
  ADD COLUMN IF NOT EXISTS origin_state text,
  ADD COLUMN IF NOT EXISTS origin_city text,
  ADD COLUMN IF NOT EXISTS residence_country text,
  ADD COLUMN IF NOT EXISTS residence_state text,
  ADD COLUMN IF NOT EXISTS residence_city text,
  ADD COLUMN IF NOT EXISTS date_joined_month smallint,
  ADD COLUMN IF NOT EXISTS date_joined_year smallint,
  ADD COLUMN IF NOT EXISTS date_joined_day smallint,
  ADD COLUMN IF NOT EXISTS date_joined_approx boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS employment_status text,
  ADD COLUMN IF NOT EXISTS employer_name text,
  ADD COLUMN IF NOT EXISTS is_student boolean,
  ADD COLUMN IF NOT EXISTS school text,
  ADD COLUMN IF NOT EXISTS course text,
  ADD COLUMN IF NOT EXISTS level text,
  ADD COLUMN IF NOT EXISTS academic_background text,
  ADD COLUMN IF NOT EXISTS graduation_year smallint,
  ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.profiles (
    user_id, full_name, email, phone, date_of_birth, faction,
    origin_country, origin_state, origin_city,
    residence_country, residence_state, residence_city,
    date_joined_month, date_joined_year, date_joined_day, date_joined_approx,
    employment_status, employer_name,
    is_student, school, course, level,
    academic_background, graduation_year,
    profile_completed
  )
  VALUES (
    NEW.id,
    meta->>'full_name',
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
    COALESCE((meta->>'profile_completed')::boolean, false)
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
