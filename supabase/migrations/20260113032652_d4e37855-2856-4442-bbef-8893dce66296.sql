-- Create scheduled_emails table for email scheduling
CREATE TABLE public.scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id UUID REFERENCES public.letters(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  pdf_base64 TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their scheduled emails"
ON public.scheduled_emails FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Users can create scheduled emails"
ON public.scheduled_emails FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their scheduled emails"
ON public.scheduled_emails FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their scheduled emails"
ON public.scheduled_emails FOR DELETE
USING (auth.uid() = created_by);

CREATE POLICY "Admins can view all scheduled emails"
ON public.scheduled_emails FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Create digital_seals table for seal management
CREATE TABLE public.digital_seals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id UUID REFERENCES public.letters(id) ON DELETE CASCADE NOT NULL,
  seal_image_url TEXT,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_by_email TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  approval_token UUID DEFAULT gen_random_uuid(),
  verification_emails_sent BOOLEAN DEFAULT false
);

ALTER TABLE public.digital_seals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view seals for their letters"
ON public.digital_seals FOR SELECT
USING (EXISTS (SELECT 1 FROM letters WHERE letters.id = digital_seals.letter_id AND letters.created_by = auth.uid()));

CREATE POLICY "Admins can manage all seals"
ON public.digital_seals FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Create bulk_email_jobs table
CREATE TABLE public.bulk_email_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id UUID REFERENCES public.letters(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  total_recipients INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL
);

ALTER TABLE public.bulk_email_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their bulk jobs"
ON public.bulk_email_jobs FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Users can create bulk jobs"
ON public.bulk_email_jobs FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can view all bulk jobs"
ON public.bulk_email_jobs FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Create bulk_email_recipients table
CREATE TABLE public.bulk_email_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.bulk_email_jobs(id) ON DELETE CASCADE NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

ALTER TABLE public.bulk_email_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recipients for their jobs"
ON public.bulk_email_recipients FOR SELECT
USING (EXISTS (SELECT 1 FROM bulk_email_jobs WHERE bulk_email_jobs.id = bulk_email_recipients.job_id AND bulk_email_jobs.created_by = auth.uid()));

CREATE POLICY "Users can create recipients"
ON public.bulk_email_recipients FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM bulk_email_jobs WHERE bulk_email_jobs.id = bulk_email_recipients.job_id AND bulk_email_jobs.created_by = auth.uid()));

CREATE POLICY "Admins can view all recipients"
ON public.bulk_email_recipients FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Create admin_invitations table
CREATE TABLE public.admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  token UUID DEFAULT gen_random_uuid() NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage invitations"
ON public.admin_invitations FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view invitations"
ON public.admin_invitations FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Update profiles table to add email for easier admin management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update profiles RLS to allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Create function to check super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  )
$$;