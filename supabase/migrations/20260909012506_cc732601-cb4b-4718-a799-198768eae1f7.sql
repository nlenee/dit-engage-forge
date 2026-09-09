-- 1. Keep profile executive title in sync with the user's access role
CREATE OR REPLACE FUNCTION public.role_title(_role text)
RETURNS TABLE(title text, abbr text)
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT t.title, t.abbr FROM (VALUES
    ('chief_executive_director', 'Chief Executive Director', 'CED'),
    ('executive_secretary',      'Executive Secretary',      'ES'),
    ('chief_finance_officer',    'Chief Finance Officer',    'CFO'),
    ('cfo',                      'Chief Finance Officer',    'CFO'),
    ('community_manager',        'Chief Community Officer',  'CCO'),
    ('executive_director',       'Executive Director',       'ED'),
    ('executive_assistant',      'Executive Assistant',      'EA')
  ) AS t(code, title, abbr)
  WHERE t.code = _role;
$$;

CREATE OR REPLACE FUNCTION public.sync_profile_role_title()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target uuid := COALESCE(NEW.user_id, OLD.user_id);
  best text;
  t record;
BEGIN
  SELECT ur.role::text INTO best
  FROM public.user_roles ur
  WHERE ur.user_id = target
    AND ur.role::text NOT IN ('admin', 'user', 'super_admin')
  ORDER BY CASE ur.role::text
    WHEN 'chief_executive_director' THEN 1
    WHEN 'executive_secretary' THEN 2
    WHEN 'chief_finance_officer' THEN 3
    WHEN 'cfo' THEN 3
    WHEN 'community_manager' THEN 4
    WHEN 'executive_director' THEN 5
    WHEN 'executive_assistant' THEN 6
    ELSE 99 END
  LIMIT 1;

  IF best IS NULL THEN
    UPDATE public.profiles
       SET executive_role = NULL, executive_role_abbr = NULL
     WHERE user_id = target
       AND (executive_role IS NOT NULL OR executive_role_abbr IS NOT NULL);
  ELSE
    SELECT * INTO t FROM public.role_title(best);
    UPDATE public.profiles
       SET executive_role = t.title, executive_role_abbr = t.abbr
     WHERE user_id = target
       AND (executive_role IS DISTINCT FROM t.title OR executive_role_abbr IS DISTINCT FROM t.abbr);
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_role_title ON public.user_roles;
CREATE TRIGGER trg_sync_profile_role_title
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_title();

-- 2. Backfill existing members
UPDATE public.profiles p
SET executive_role = rt.title,
    executive_role_abbr = rt.abbr
FROM (
  SELECT DISTINCT ON (ur.user_id) ur.user_id, t.title, t.abbr
  FROM public.user_roles ur
  CROSS JOIN LATERAL public.role_title(ur.role::text) t
  ORDER BY ur.user_id, CASE ur.role::text
    WHEN 'chief_executive_director' THEN 1
    WHEN 'executive_secretary' THEN 2
    WHEN 'chief_finance_officer' THEN 3
    WHEN 'cfo' THEN 3
    WHEN 'community_manager' THEN 4
    WHEN 'executive_director' THEN 5
    WHEN 'executive_assistant' THEN 6
    ELSE 99 END
) rt
WHERE p.user_id = rt.user_id
  AND (p.executive_role IS DISTINCT FROM rt.title OR p.executive_role_abbr IS DISTINCT FROM rt.abbr);

-- 3. Richer, uniform member directory
DROP FUNCTION IF EXISTS public.get_member_directory();
CREATE FUNCTION public.get_member_directory()
RETURNS TABLE(
  id uuid, user_id uuid, full_name text, faction text, status text, bio text,
  avatar_url text, headshot_url text, email text, phone text, date_of_birth date,
  custom_role_title text, executive_role text, executive_role_abbr text,
  origin_country text, origin_state text, origin_city text,
  residence_country text, residence_state text, residence_city text,
  academic_background text, school text, course text, graduation_year smallint,
  employment_status text, employer_name text,
  date_joined_year smallint, primary_role text, xp integer, member_level integer,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.user_id, p.full_name, p.faction, p.status, p.bio,
    p.avatar_url, p.headshot_url,
    CASE WHEN public.has_any_global_role(auth.uid()) THEN p.email ELSE NULL END,
    CASE WHEN public.has_any_global_role(auth.uid()) THEN p.phone ELSE NULL END,
    CASE WHEN public.has_any_global_role(auth.uid()) THEN p.date_of_birth ELSE NULL END,
    p.custom_role_title, p.executive_role, p.executive_role_abbr,
    p.origin_country, p.origin_state, p.origin_city,
    p.residence_country, p.residence_state, p.residence_city,
    p.academic_background, p.school, p.course, p.graduation_year,
    p.employment_status, p.employer_name,
    p.date_joined_year,
    COALESCE(
      (SELECT ur.role::text
         FROM public.user_roles ur
        WHERE ur.user_id = p.user_id
          AND ur.role <> 'admin'
        ORDER BY CASE ur.role::text
          WHEN 'chief_executive_director' THEN 1
          WHEN 'executive_secretary' THEN 2
          WHEN 'community_manager' THEN 3
          WHEN 'chief_finance_officer' THEN 4
          WHEN 'executive_director' THEN 5
          WHEN 'executive_assistant' THEN 6
          ELSE 99
        END
        LIMIT 1),
      'user'
    ) AS primary_role,
    p.xp, p.member_level,
    p.created_at
  FROM public.profiles p
  WHERE p.user_id IS NOT NULL
    AND p.full_name IS NOT NULL
    AND COALESCE(p.status, 'active') <> 'suspended'
    AND LOWER(COALESCE(p.email, '')) <> 'divintelteam@gmail.com'
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = p.user_id AND ur.role = 'admin'
    )
  ORDER BY p.full_name ASC
$$;