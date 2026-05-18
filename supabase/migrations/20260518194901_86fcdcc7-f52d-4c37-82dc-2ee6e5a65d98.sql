
-- 1. Extend task_completions for verification workflow
ALTER TABLE public.task_completions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS evidence_url text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS notes text;

-- Backfill any existing rows as approved (legacy)
UPDATE public.task_completions SET status = 'approved' WHERE status = 'pending' AND points_awarded > 0;

-- 2. Replace award_task_xp trigger function: only award on approval; auto-approve login tasks
CREATE OR REPLACE FUNCTION public.award_task_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  pts integer;
  task_code text;
  task_cat text;
BEGIN
  SELECT points, code, category INTO pts, task_code, task_cat FROM public.tasks WHERE id = NEW.task_id;

  -- Auto-approve login / platform tasks
  IF (task_code ILIKE '%login%' OR task_cat ILIKE '%login%' OR task_cat = 'platform') THEN
    NEW.status := 'approved';
    NEW.reviewed_at := now();
  END IF;

  IF NEW.status = 'approved' THEN
    NEW.points_awarded := COALESCE(pts, 0);
    UPDATE public.profiles
      SET xp = xp + COALESCE(pts, 0),
          member_level = GREATEST(1, FLOOR(SQRT((xp + COALESCE(pts, 0))::numeric / 100))::int + 1)
      WHERE user_id = NEW.user_id;
  ELSE
    NEW.points_awarded := 0;
  END IF;
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if present, re-attach
DROP TRIGGER IF EXISTS trg_award_task_xp ON public.task_completions;
CREATE TRIGGER trg_award_task_xp
  BEFORE INSERT ON public.task_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.award_task_xp();

-- 3. Handle UPDATE (approve/reject) — award XP when transitioning to approved
CREATE OR REPLACE FUNCTION public.award_task_xp_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE pts integer;
BEGIN
  IF OLD.status <> 'approved' AND NEW.status = 'approved' THEN
    SELECT points INTO pts FROM public.tasks WHERE id = NEW.task_id;
    NEW.points_awarded := COALESCE(pts, 0);
    NEW.reviewed_at := now();
    UPDATE public.profiles
      SET xp = xp + COALESCE(pts, 0),
          member_level = GREATEST(1, FLOOR(SQRT((xp + COALESCE(pts, 0))::numeric / 100))::int + 1)
      WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_award_task_xp_update ON public.task_completions;
CREATE TRIGGER trg_award_task_xp_update
  BEFORE UPDATE ON public.task_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.award_task_xp_on_update();

-- 4. Allow admins / ES / CM to update + delete completions for review
DROP POLICY IF EXISTS "Reviewers can update completions" ON public.task_completions;
CREATE POLICY "Reviewers can update completions"
  ON public.task_completions FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'executive_secretary'::app_role)
    OR has_role(auth.uid(), 'community_manager'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'executive_secretary'::app_role)
    OR has_role(auth.uid(), 'community_manager'::app_role)
  );

DROP POLICY IF EXISTS "Reviewers can delete completions" ON public.task_completions;
CREATE POLICY "Reviewers can delete completions"
  ON public.task_completions FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'executive_secretary'::app_role)
  );

-- 5. Member suspension: profiles.status already exists (active/suspended).
-- Add policy so admins can update profile status (already covered by Admin full access).

-- 6. Restrict member_directory RPC to only active members (already in function definition)
-- Also exclude system admin email from directory
CREATE OR REPLACE FUNCTION public.get_member_directory()
RETURNS TABLE(id uuid, user_id uuid, full_name text, faction text, status text, bio text, avatar_url text, headshot_url text, public_image_url text, xp integer, member_level integer, date_of_birth date, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id, user_id, full_name, faction, status, bio, avatar_url, headshot_url, public_image_url, xp, member_level, date_of_birth, created_at
  FROM public.profiles
  WHERE status = 'active'
    AND lower(COALESCE(email, '')) <> 'divintelteam@gmail.com'
  ORDER BY full_name ASC
$function$;
