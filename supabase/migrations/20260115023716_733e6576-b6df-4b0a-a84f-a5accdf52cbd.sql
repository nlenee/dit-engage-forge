-- First, upload the DIT seal image to storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('seals', 'seals', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for public read access to seals
CREATE POLICY "Public seal images are accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'seals');

-- Policy for admins to upload seals
CREATE POLICY "Admins can upload seals" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'seals' AND (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
));

-- Add new columns to members table
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS joined_dit_date DATE,
ADD COLUMN IF NOT EXISTS faction TEXT CHECK (faction IN ('DYP', 'TECK', 'SHI', 'MINDUP')),
ADD COLUMN IF NOT EXISTS bio VARCHAR(50),
ADD COLUMN IF NOT EXISTS role_in_dit TEXT,
ADD COLUMN IF NOT EXISTS previous_roles TEXT[],
ADD COLUMN IF NOT EXISTS testimony TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verification_code TEXT,
ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS locked_by_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS invitation_token UUID,
ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ;

-- Create member invitations table
CREATE TABLE IF NOT EXISTS public.member_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  accepted_at TIMESTAMPTZ
);

-- Enable RLS on member_invitations
ALTER TABLE public.member_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can manage invitations
CREATE POLICY "Admins can manage member invitations" 
ON public.member_invitations FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Allow public to read their own invitation by token (for registration)
CREATE POLICY "Anyone can view invitation by token" 
ON public.member_invitations FOR SELECT 
USING (true);

-- Create birthday notifications table
CREATE TABLE IF NOT EXISTS public.birthday_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('7_days', '24_hours')),
  scheduled_for DATE NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on birthday_notifications
ALTER TABLE public.birthday_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can view all birthday notifications
CREATE POLICY "Admins can view birthday notifications" 
ON public.birthday_notifications FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Update members RLS to allow self-update for non-locked fields
CREATE POLICY "Members can update their own non-locked profile" 
ON public.members FOR UPDATE 
USING (auth.uid() = user_id AND NOT locked_by_admin)
WITH CHECK (auth.uid() = user_id AND NOT locked_by_admin);

-- Allow public insert for registration via invitation
CREATE POLICY "Public can register via invitation" 
ON public.members FOR INSERT 
WITH CHECK (
  invitation_token IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.member_invitations 
    WHERE token = invitation_token 
    AND status = 'pending' 
    AND expires_at > now()
  )
);

-- Create index for faster birthday lookups
CREATE INDEX IF NOT EXISTS idx_members_birthday ON public.members(birthday);
CREATE INDEX IF NOT EXISTS idx_member_invitations_token ON public.member_invitations(token);
CREATE INDEX IF NOT EXISTS idx_birthday_notifications_scheduled ON public.birthday_notifications(scheduled_for);