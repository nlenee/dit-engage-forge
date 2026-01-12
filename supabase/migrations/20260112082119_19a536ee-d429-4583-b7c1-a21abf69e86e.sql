-- Create enum for letter status
CREATE TYPE public.letter_status AS ENUM ('draft', 'downloaded', 'sent');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create letter templates table
CREATE TABLE public.letter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create letters table
CREATE TABLE public.letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  country TEXT NOT NULL,
  state TEXT,
  office TEXT NOT NULL,
  date_of_assignment DATE NOT NULL,
  letter_content TEXT NOT NULL,
  signatories JSONB NOT NULL DEFAULT '[]'::jsonb,
  status letter_status DEFAULT 'draft',
  template_id UUID REFERENCES public.letter_templates(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create letter versions table for version history
CREATE TABLE public.letter_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id UUID REFERENCES public.letters(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  country TEXT NOT NULL,
  state TEXT,
  office TEXT NOT NULL,
  date_of_assignment DATE NOT NULL,
  letter_content TEXT NOT NULL,
  signatories JSONB NOT NULL DEFAULT '[]'::jsonb,
  change_summary TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email logs table for audit
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id UUID REFERENCES public.letters(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent'
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies (only admins can manage roles)
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Letter templates policies
CREATE POLICY "Authenticated users can view templates" ON public.letter_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage templates" ON public.letter_templates
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Letters policies
CREATE POLICY "Users can view their own letters" ON public.letters
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Admins can view all letters" ON public.letters
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create letters" ON public.letters
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own letters" ON public.letters
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Admins can update all letters" ON public.letters
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own letters" ON public.letters
  FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete all letters" ON public.letters
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Letter versions policies
CREATE POLICY "Users can view versions of their letters" ON public.letter_versions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.letters WHERE id = letter_id AND created_by = auth.uid())
  );

CREATE POLICY "Admins can view all versions" ON public.letter_versions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create versions of their letters" ON public.letter_versions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.letters WHERE id = letter_id AND created_by = auth.uid())
  );

-- Email logs policies
CREATE POLICY "Users can view logs of their sent emails" ON public.email_logs
  FOR SELECT USING (auth.uid() = sent_by);

CREATE POLICY "Admins can view all email logs" ON public.email_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create email logs" ON public.email_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sent_by);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_letter_templates_updated_at
  BEFORE UPDATE ON public.letter_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_letters_updated_at
  BEFORE UPDATE ON public.letters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile and assign default role on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to increment letter version
CREATE OR REPLACE FUNCTION public.create_letter_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
  FROM public.letter_versions
  WHERE letter_id = OLD.id;
  
  INSERT INTO public.letter_versions (
    letter_id, version_number, recipient_name, recipient_email, 
    country, state, office, date_of_assignment, letter_content, 
    signatories, created_by, change_summary
  )
  VALUES (
    OLD.id, next_version, OLD.recipient_name, OLD.recipient_email,
    OLD.country, OLD.state, OLD.office, OLD.date_of_assignment, 
    OLD.letter_content, OLD.signatories, auth.uid(), 
    'Updated letter content'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create version on letter update
CREATE TRIGGER on_letter_update_create_version
  BEFORE UPDATE ON public.letters
  FOR EACH ROW
  WHEN (OLD.letter_content IS DISTINCT FROM NEW.letter_content OR 
        OLD.signatories IS DISTINCT FROM NEW.signatories OR
        OLD.recipient_name IS DISTINCT FROM NEW.recipient_name)
  EXECUTE FUNCTION public.create_letter_version();

-- Insert default letter template
INSERT INTO public.letter_templates (name, description, content, is_default)
VALUES (
  'Standard Engagement Letter',
  'Default DIT Letter of Engagement template with standard terms and conditions',
  'Congratulations on your appointment as the [POSITION].

The appointment terms and conditions are stated below:

• Salary: There is currently no stipulated monetary benefit attached to the role.

• Working Hours: You are to choose your working hours and working days. Nevertheless, your presence will be required at all executive meetings both virtual and physical (meetings are currently almost always virtual).

• Appointment termination: The Executive Board (Board of Executive Directors) or the Chief Executive Director reserves the right to terminate this appointment should you violate any of these terms.

• Step Down or Resignation: You are to give a 3 month notice, if you desire to step-down or resign from the office of this appointment. In either case you are to present a candidate in your faction with potential to lead the faction effectively.

• Faction''s Autonomy and Control: The appointed department remains an inseparable part of DIT and will always work alongside other factions towards achieving the big picture painted by DIT regardless of her level of autonomy. Therefore, the department is subject to the leadership (not forceful control) of DIT, today and in the future.

We are pleased that you accept this offer, and we hope to have an enjoyable walk together with you towards making our nation and continent a better place to be.',
  true
);