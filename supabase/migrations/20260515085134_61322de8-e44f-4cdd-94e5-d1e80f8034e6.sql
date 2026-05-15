
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    profile_completed, edits_locked,
    is_new_to_dit, pending_role_assignment
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
    is_org,
    COALESCE((meta->>'is_new_to_dit')::boolean, false),
    COALESCE((meta->>'pending_role_assignment')::boolean, false)
  );

  IF is_org THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'chief_executive_director') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$function$;
