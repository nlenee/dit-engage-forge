-- Create members table for birthday tracking
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  birthday DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- RLS policies for members
CREATE POLICY "Admins can manage members" ON public.members FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Users can view their own member record" ON public.members FOR SELECT USING (
  auth.uid() = user_id
);

-- Create email templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom', -- custom, birthday, monthly
  description TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for email templates
CREATE POLICY "Admins can manage email templates" ON public.email_templates FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Authenticated users can view email templates" ON public.email_templates FOR SELECT USING (true);

-- Create email campaigns table
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.email_templates,
  type TEXT NOT NULL DEFAULT 'manual', -- manual, birthday, monthly
  status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, sent, cancelled
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  recipients_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policies for email campaigns
CREATE POLICY "Admins can manage campaigns" ON public.email_campaigns FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Users can view their campaigns" ON public.email_campaigns FOR SELECT USING (
  auth.uid() = created_by
);

-- Insert default email templates
INSERT INTO public.email_templates (name, subject, content, type, description) VALUES
('Birthday Greeting', 'Happy Birthday from DIT! 🎂', 'Dear {{name}},

On behalf of everyone at DIT, we want to wish you a wonderful birthday filled with joy and happiness!

May this new year of your life bring you success, health, and all the blessings you deserve.

Warmest wishes,
The DIT Team', 'birthday', 'Automatic birthday greeting sent to members'),

('Monthly Newsletter', 'DIT Monthly Update - {{month}}', 'Dear {{name}},

Here is your monthly update from DIT for {{month}}.

[Add your monthly content here]

Best regards,
The DIT Team', 'monthly', 'Monthly newsletter template for all members');

-- Add trigger for updated_at
CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at
BEFORE UPDATE ON public.email_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();