
CREATE OR REPLACE FUNCTION public.gen_application_reference()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE n bigint;
BEGIN
  n := nextval('public.application_ref_seq');
  RETURN 'DIT-' || to_char(now(),'YYYY') || '-' || lpad(n::text, 4, '0');
END $function$;

DROP POLICY IF EXISTS "Public can check locks" ON public.reapplication_locks;

CREATE OR REPLACE FUNCTION public.get_reapplication_lock_status(_email text)
 RETURNS TABLE(is_locked boolean, unlock_at timestamptz)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.reapplication_locks
      WHERE LOWER(applicant_email) = LOWER(_email)
        AND (unlock_at IS NULL OR unlock_at > now())
    ),
    (SELECT MAX(unlock_at) FROM public.reapplication_locks
      WHERE LOWER(applicant_email) = LOWER(_email)
        AND (unlock_at IS NULL OR unlock_at > now()));
$$;

GRANT EXECUTE ON FUNCTION public.get_reapplication_lock_status(text) TO anon, authenticated;

DROP POLICY IF EXISTS "Public insert docs" ON public.application_documents;

CREATE POLICY "Owners insert docs for own application"
ON public.application_documents
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_documents.application_id
      AND a.applicant_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "System can insert status logs" ON public.application_status_log;
DROP POLICY IF EXISTS "Service inserts notifications" ON public.notifications_log;

DROP POLICY IF EXISTS "Public read active links" ON public.application_links;
CREATE POLICY "Public read active links"
ON public.application_links
FOR SELECT
TO anon, authenticated
USING (is_active = true);
