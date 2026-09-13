CREATE OR REPLACE FUNCTION public.get_message_recipients()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  faction text,
  role_title text,
  role_abbr text,
  headshot_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.full_name,
    p.faction,
    COALESCE(
      p.executive_role,
      p.custom_role_title,
      CASE primary_role.role_code
        WHEN 'chief_executive_director' THEN 'Chief Executive Director'
        WHEN 'executive_secretary' THEN 'Executive Secretary'
        WHEN 'community_manager' THEN 'Chief Community Officer'
        WHEN 'chief_finance_officer' THEN 'Chief Finance Officer'
        WHEN 'executive_director' THEN 'Executive Director'
        WHEN 'executive_assistant' THEN 'Executive Assistant'
        ELSE 'Member'
      END
    ) AS role_title,
    COALESCE(
      p.executive_role_abbr,
      CASE primary_role.role_code
        WHEN 'chief_executive_director' THEN 'CED'
        WHEN 'executive_secretary' THEN 'ES'
        WHEN 'community_manager' THEN 'CCO'
        WHEN 'chief_finance_officer' THEN 'CFO'
        WHEN 'executive_director' THEN 'ED'
        WHEN 'executive_assistant' THEN 'EA'
        ELSE NULL
      END
    ) AS role_abbr,
    p.headshot_url
  FROM public.profiles p
  LEFT JOIN LATERAL (
    SELECT ur.role::text AS role_code
    FROM public.user_roles ur
    WHERE ur.user_id = p.user_id
      AND ur.role::text NOT IN ('admin', 'super_admin', 'user')
    ORDER BY CASE ur.role::text
      WHEN 'chief_executive_director' THEN 1
      WHEN 'executive_secretary' THEN 2
      WHEN 'community_manager' THEN 3
      WHEN 'chief_finance_officer' THEN 4
      WHEN 'executive_director' THEN 5
      WHEN 'executive_assistant' THEN 6
      ELSE 99
    END
    LIMIT 1
  ) primary_role ON true
  WHERE auth.uid() IS NOT NULL
    AND p.user_id IS NOT NULL
    AND p.full_name IS NOT NULL
    AND COALESCE(p.status, 'active') = 'active'
    AND COALESCE(p.profile_completed, false) = true
    AND LOWER(COALESCE(p.email, '')) <> 'divintelteam@gmail.com'
  ORDER BY p.full_name ASC;
$$;

REVOKE ALL ON FUNCTION public.get_message_recipients() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_message_recipients() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_message_recipients() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_message_recipients() TO service_role;