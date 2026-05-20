CREATE OR REPLACE FUNCTION public.get_member_directory()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  faction text,
  status text,
  bio text,
  avatar_url text,
  headshot_url text,
  email text,
  phone text,
  date_of_birth date,
  custom_role_title text,
  origin_country text,
  origin_state text,
  date_joined_year smallint,
  primary_role text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.user_id,
    p.full_name,
    p.faction,
    p.status,
    p.bio,
    p.avatar_url,
    p.headshot_url,
    CASE WHEN public.has_any_global_role(auth.uid()) THEN p.email ELSE NULL END,
    CASE WHEN public.has_any_global_role(auth.uid()) THEN p.phone ELSE NULL END,
    CASE WHEN public.has_any_global_role(auth.uid()) THEN p.date_of_birth ELSE NULL END,
    p.custom_role_title,
    p.origin_country,
    p.origin_state,
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