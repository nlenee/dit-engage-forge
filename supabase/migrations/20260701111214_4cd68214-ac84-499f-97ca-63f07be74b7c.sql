
-- ============ OFFICES ============
CREATE TABLE public.offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  kpis jsonb NOT NULL DEFAULT '[]'::jsonb,
  faction text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offices TO authenticated;
GRANT ALL ON public.offices TO service_role;
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view offices" ON public.offices FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Leaders manage offices" ON public.offices FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'chief_executive_director') OR public.has_role(auth.uid(),'executive_secretary'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'chief_executive_director') OR public.has_role(auth.uid(),'executive_secretary'));

CREATE TRIGGER update_offices_updated_at BEFORE UPDATE ON public.offices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ OFFICE PERMISSIONS ============
CREATE TABLE public.office_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (office_id, permission_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.office_permissions TO authenticated;
GRANT ALL ON public.office_permissions TO service_role;
ALTER TABLE public.office_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view office permissions" ON public.office_permissions FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Leaders manage office permissions" ON public.office_permissions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'chief_executive_director') OR public.has_role(auth.uid(),'executive_secretary'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'chief_executive_director') OR public.has_role(auth.uid(),'executive_secretary'));

-- ============ OFFICE ASSIGNMENTS ============
CREATE TABLE public.office_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (office_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.office_assignments TO authenticated;
GRANT ALL ON public.office_assignments TO service_role;
ALTER TABLE public.office_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view office assignments" ON public.office_assignments FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Leaders manage office assignments" ON public.office_assignments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'chief_executive_director') OR public.has_role(auth.uid(),'executive_secretary'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'chief_executive_director') OR public.has_role(auth.uid(),'executive_secretary'));

-- ============ user_permissions RPC ============
CREATE OR REPLACE FUNCTION public.user_permissions(_user_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH role_perms AS (
    SELECT unnest(CASE ur.role::text
      WHEN 'admin' THEN ARRAY['*']
      WHEN 'chief_executive_director' THEN ARRAY['*']
      WHEN 'executive_secretary' THEN ARRAY['applications.review','members.manage','directory.manage','letters.create','announcements.publish','offices.manage']
      WHEN 'community_manager' THEN ARRAY['members.manage','announcements.publish','directory.manage']
      WHEN 'chief_finance_officer' THEN ARRAY['finance.view','finance.manage']
      WHEN 'executive_director' THEN ARRAY['applications.review','faction.manage']
      WHEN 'executive_assistant' THEN ARRAY['applications.review','faction.manage']
      ELSE ARRAY[]::text[]
    END) AS perm
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
  ),
  office_perms AS (
    SELECT op.permission_key AS perm
    FROM public.office_assignments oa
    JOIN public.office_permissions op ON op.office_id = oa.office_id
    WHERE oa.user_id = _user_id
  )
  SELECT COALESCE(array_agg(DISTINCT perm), ARRAY[]::text[])
  FROM (SELECT perm FROM role_perms UNION SELECT perm FROM office_perms) x;
$$;

GRANT EXECUTE ON FUNCTION public.user_permissions(uuid) TO authenticated, service_role;
