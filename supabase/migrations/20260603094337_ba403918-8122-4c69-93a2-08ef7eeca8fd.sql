
-- Storage policies for application-documents bucket
CREATE POLICY "Anyone can upload application docs"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'application-documents');

CREATE POLICY "Reviewers read application docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'application-documents' AND public.is_reviewer(auth.uid()));

CREATE POLICY "Admins full access app docs"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'application-documents' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'application-documents' AND public.has_role(auth.uid(), 'admin'));

-- Broaden application UPDATE so admins always have access regardless of faction
DROP POLICY IF EXISTS "Reviewers update applications in scope" ON public.applications;
CREATE POLICY "Reviewers update applications in scope" ON public.applications
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_org_leader(auth.uid())
    OR (public.is_reviewer(auth.uid()) AND public.user_faction(auth.uid()) IS NOT NULL
        AND (final_faction = public.user_faction(auth.uid())
             OR selected_faction = public.user_faction(auth.uid())
             OR ai_suggested_faction = public.user_faction(auth.uid())))
  );
