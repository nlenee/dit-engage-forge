-- Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true);

-- Create policies for signature storage
CREATE POLICY "Anyone can view signatures" ON storage.objects FOR SELECT USING (bucket_id = 'signatures');
CREATE POLICY "Authenticated users can upload signatures" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'signatures' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own signatures" ON storage.objects FOR UPDATE USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own signatures" ON storage.objects FOR DELETE USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create saved_signatures table
CREATE TABLE public.saved_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  signature_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own signatures" ON public.saved_signatures FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create signatures" ON public.saved_signatures FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own signatures" ON public.saved_signatures FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own signatures" ON public.saved_signatures FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all signatures" ON public.saved_signatures FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Add email tracking columns to email_logs
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS bounce_reason TEXT;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS resend_email_id TEXT;

-- Create trigger for updated_at on saved_signatures
CREATE TRIGGER update_saved_signatures_updated_at
  BEFORE UPDATE ON public.saved_signatures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();