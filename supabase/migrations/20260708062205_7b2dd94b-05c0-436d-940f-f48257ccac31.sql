
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS abbreviation text;
ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS tier text;

ALTER TABLE public.office_assignments ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS executive_role text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS executive_role_abbr text;

-- Seed / reconcile 32 official DIT offices
INSERT INTO public.offices (code, title, abbreviation, tier, faction, description)
VALUES
  -- Tier 1 BoE
  ('ced','Chief Executive Director','CED','boe',NULL,'Head of the Board of Executives.'),
  ('coo','Chief Operating Officer','COO','boe',NULL,'Oversees org-wide operations.'),
  ('es','Executive Secretary','ES','boe',NULL,'Secretariat and governance.'),
  ('cfo','Chief Financial Officer','CFO','boe',NULL,'Head of finance.'),
  ('cpo','Chief Programs Officer','CPO','boe',NULL,'Head of programs.'),
  ('cco','Chief Community Officer','CCO','boe',NULL,'Head of community (formerly Community Manager, org-wide).'),
  ('cbco','Chief Brand & Creative Officer','CBCO','boe',NULL,'Head of brand and creative.'),
  ('fc','Financial Controller','FC','boe',NULL,'Financial controls and reporting.'),
  -- Tier 2 Faction EDs
  ('ed_shi','Executive Director — SHI','ED·SHI','faction_ed','SHI','Leads SHI faction.'),
  ('ed_dyp','Executive Director — DYP','ED·DYP','faction_ed','DYP','Leads DYP faction.'),
  ('ed_teck','Executive Director — TECK','ED·TECK','faction_ed','TECK','Leads TECK faction.'),
  ('ed_mindup','Executive Director — MindUp','ED·MindUp','faction_ed','MindUp','Leads MindUp faction.'),
  -- Tier 3 faction-level (SHI)
  ('ea_shi','Executive Assistant — SHI','EA·SHI','faction_level','SHI','Assists ED·SHI.'),
  ('dof_shi','Director of Finance — SHI','DoF·SHI','faction_level','SHI','Finance lead — SHI.'),
  ('dop_shi','Director of Programs — SHI','DoP·SHI','faction_level','SHI','Programs lead — SHI.'),
  ('cm_shi','Community Manager — SHI','CM·SHI','faction_level','SHI','Community lead — SHI.'),
  -- DYP
  ('ea_dyp','Executive Assistant — DYP','EA·DYP','faction_level','DYP','Assists ED·DYP.'),
  ('dof_dyp','Director of Finance — DYP','DoF·DYP','faction_level','DYP','Finance lead — DYP.'),
  ('dop_dyp','Director of Programs — DYP','DoP·DYP','faction_level','DYP','Programs lead — DYP.'),
  ('cm_dyp','Community Manager — DYP','CM·DYP','faction_level','DYP','Community lead — DYP.'),
  -- TECK
  ('ea_teck','Executive Assistant — TECK','EA·TECK','faction_level','TECK','Assists ED·TECK.'),
  ('dof_teck','Director of Finance — TECK','DoF·TECK','faction_level','TECK','Finance lead — TECK.'),
  ('dop_teck','Director of Programs — TECK','DoP·TECK','faction_level','TECK','Programs lead — TECK.'),
  ('cm_teck','Community Manager — TECK','CM·TECK','faction_level','TECK','Community lead — TECK.'),
  -- MindUp
  ('ea_mindup','Executive Assistant — MindUp','EA·MindUp','faction_level','MindUp','Assists ED·MindUp.'),
  ('dof_mindup','Director of Finance — MindUp','DoF·MindUp','faction_level','MindUp','Finance lead — MindUp.'),
  ('dop_mindup','Director of Programs — MindUp','DoP·MindUp','faction_level','MindUp','Programs lead — MindUp.'),
  ('cm_mindup','Community Manager — MindUp','CM·MindUp','faction_level','MindUp','Community lead — MindUp.')
ON CONFLICT (code) DO UPDATE
SET title = EXCLUDED.title,
    abbreviation = EXCLUDED.abbreviation,
    tier = EXCLUDED.tier,
    faction = EXCLUDED.faction,
    updated_at = now();
