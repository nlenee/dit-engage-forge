
-- 1. Drop view exposing auth.users
DROP VIEW IF EXISTS public.admin_users_roles;

-- 2. Set search_path on functions missing it
ALTER FUNCTION public.has_role(app_role) SET search_path = public;
ALTER FUNCTION public.has_role_text(text) SET search_path = public;

-- 3. Explicit hardening on user_roles: admin-only writes (defensive)
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
CREATE POLICY "Only admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
CREATE POLICY "Only admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
CREATE POLICY "Only admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. activity_logs: validate that the inserted role matches the user's actual role
DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can insert activity logs" ON public.activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      role = 'user'
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role::text = activity_logs.role
      )
    )
  );

-- 5. digital_seals: allow letter owner to insert seal request
DROP POLICY IF EXISTS "Letter owners can request seals" ON public.digital_seals;
CREATE POLICY "Letter owners can request seals" ON public.digital_seals
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.letters l WHERE l.id = digital_seals.letter_id AND l.created_by = auth.uid())
  );

-- 6. scheduled_emails: scope to creator + admin/ES access
DROP POLICY IF EXISTS "Users manage their scheduled emails" ON public.scheduled_emails;
CREATE POLICY "Users manage their scheduled emails" ON public.scheduled_emails
  FOR ALL TO authenticated
  USING (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'executive_secretary'::app_role)
  )
  WITH CHECK (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'executive_secretary'::app_role)
  );

-- 7. members: allow community managers, ES, CED to SELECT
DROP POLICY IF EXISTS "Leadership can view members" ON public.members;
CREATE POLICY "Leadership can view members" ON public.members
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'community_manager'::app_role)
    OR public.has_role(auth.uid(), 'executive_secretary'::app_role)
    OR public.has_role(auth.uid(), 'chief_executive_director'::app_role)
  );
