
-- 1) Profiles: drop broad authenticated SELECT
DROP POLICY IF EXISTS "Authenticated users can view all profiles for directory" ON public.profiles;

-- Allow community_manager and executive_secretary to read all profiles
CREATE POLICY "Community managers can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'community_manager') OR public.has_role(auth.uid(), 'executive_secretary'));

-- 2) Safe directory function for any authenticated user
CREATE OR REPLACE FUNCTION public.get_member_directory()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  faction text,
  status text,
  bio text,
  avatar_url text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, user_id, full_name, faction, status, bio, avatar_url, created_at
  FROM public.profiles
  WHERE status = 'active'
  ORDER BY full_name ASC
$$;

REVOKE ALL ON FUNCTION public.get_member_directory() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_member_directory() TO authenticated;

-- 3) Member invitations: drop public SELECT, add token-validation RPC
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.member_invitations;

CREATE OR REPLACE FUNCTION public.validate_invitation_token(_token uuid)
RETURNS TABLE (id uuid, email text, status text, expires_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email, status, expires_at
  FROM public.member_invitations
  WHERE token = _token
    AND status = 'pending'
    AND expires_at > now()
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.validate_invitation_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_invitation_token(uuid) TO anon, authenticated;
