
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS about_yourself text,
  ADD COLUMN IF NOT EXISTS why_join_dit text,
  ADD COLUMN IF NOT EXISTS ai_about_human_score numeric,
  ADD COLUMN IF NOT EXISTS ai_about_ai_score numeric,
  ADD COLUMN IF NOT EXISTS ai_why_human_score numeric,
  ADD COLUMN IF NOT EXISTS ai_why_ai_score numeric,
  ADD COLUMN IF NOT EXISTS referred_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS referred_faction text;

ALTER TABLE public.application_links
  ADD COLUMN IF NOT EXISTS target_url text;

DROP POLICY IF EXISTS "Applicants view own by email" ON public.applications;
CREATE POLICY "Applicants and scoped reviewers view"
ON public.applications FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND applicant_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_org_leader(auth.uid())
  OR (
    public.is_reviewer(auth.uid())
    AND public.user_faction(auth.uid()) IS NOT NULL
    AND (
      final_faction = public.user_faction(auth.uid())
      OR selected_faction = public.user_faction(auth.uid())
      OR ai_suggested_faction = public.user_faction(auth.uid())
      OR referred_faction = public.user_faction(auth.uid())
    )
  )
);

CREATE OR REPLACE FUNCTION public.application_email_status(_email text)
RETURNS TABLE(has_active_member boolean, has_pending boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    EXISTS(
      SELECT 1 FROM public.profiles
      WHERE LOWER(email) = LOWER(_email)
        AND COALESCE(status, 'active') = 'active'
    ),
    EXISTS(
      SELECT 1 FROM public.applications
      WHERE LOWER(applicant_email) = LOWER(_email)
        AND status::text IN ('submitted', 'under_review', 'interview_scheduled')
    );
$$;

GRANT EXECUTE ON FUNCTION public.application_email_status(text) TO anon, authenticated;
