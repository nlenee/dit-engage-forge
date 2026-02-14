
-- Step 1: Add new roles to app_role enum only
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'community_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'chief_finance_officer';
