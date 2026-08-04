CREATE TABLE IF NOT EXISTS public.page_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route text NOT NULL UNIQUE,
  label text NOT NULL,
  design_system text NOT NULL DEFAULT 'dit-dark',
  tokens jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.page_styles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_styles TO authenticated;
GRANT ALL ON public.page_styles TO service_role;

ALTER TABLE public.page_styles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "page_styles_public_read" ON public.page_styles;
CREATE POLICY "page_styles_public_read" ON public.page_styles FOR SELECT USING (true);

DROP POLICY IF EXISTS "page_styles_admin_write" ON public.page_styles;
CREATE POLICY "page_styles_admin_write" ON public.page_styles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP TRIGGER IF EXISTS trg_page_styles_updated_at ON public.page_styles;
CREATE TRIGGER trg_page_styles_updated_at BEFORE UPDATE ON public.page_styles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.page_styles (route, label, design_system)
VALUES ('/', 'Landing Page', 'dit-dark'),
       ('/members/:slug', 'Member Profile', 'pure-white')
ON CONFLICT (route) DO NOTHING;