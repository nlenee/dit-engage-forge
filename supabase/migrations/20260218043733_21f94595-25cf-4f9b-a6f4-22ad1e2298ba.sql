-- Allow community managers to manage email campaigns
CREATE POLICY "CM can manage campaigns"
ON public.email_campaigns
FOR ALL
USING (has_role(auth.uid(), 'community_manager'::app_role));

-- Allow community managers to manage email templates
CREATE POLICY "CM can manage email templates"
ON public.email_templates
FOR ALL
USING (has_role(auth.uid(), 'community_manager'::app_role));
