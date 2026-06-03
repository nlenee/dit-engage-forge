import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const VolunteerPage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ ref: string } | null>(null);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", skills: "", availability: "", motivation: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    const schema = z.object({
      full_name: z.string().trim().min(2),
      email: z.string().trim().email(),
      phone: z.string().trim().min(5),
      motivation: z.string().trim().min(20),
    });
    const r = schema.safeParse(form);
    if (!r.success) {
      toast({ title: "Please complete the form", description: "Name, email, phone and motivation are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: app, error } = await supabase
        .from("applications")
        .insert({
          application_type: "volunteer",
          applicant_email: form.email,
          applicant_name: form.full_name,
        })
        .select("id, reference_number")
        .single();
      if (error) throw error;
      await supabase.from("application_responses").insert(
        Object.entries(form).map(([k, v]) => ({
          application_id: app.id,
          section: "volunteer",
          question_key: k,
          question_text: k.replace(/_/g, " "),
          response_value: { value: v },
        }))
      );
      supabase.functions.invoke("on-application-submit", { body: { application_id: app.id } }).catch(()=>{});
      setDone({ ref: app.reference_number });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="p-10 max-w-md text-center">
          <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3"/>
          <h2 className="font-display text-2xl font-semibold mb-2">Volunteer application received</h2>
          <p className="text-muted-foreground mb-4">Reference: <span className="font-mono">{done.ref}</span></p>
          <Button onClick={() => navigate(`/track?ref=${done.ref}`)}>Track application</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="font-display text-3xl font-semibold mb-2">Volunteer with DIT</h1>
        <p className="text-muted-foreground mb-6">Lend your time, skills and heart to our mission.</p>
        <Card className="p-6 space-y-4">
          <Field label="Full name"><Input value={form.full_name} onChange={e=>set("full_name", e.target.value)} maxLength={120}/></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={e=>set("email", e.target.value)} maxLength={200}/></Field>
          <Field label="Phone"><Input value={form.phone} onChange={e=>set("phone", e.target.value)} maxLength={40}/></Field>
          <Field label="Relevant skills"><Textarea rows={3} value={form.skills} onChange={e=>set("skills", e.target.value)} maxLength={1000}/></Field>
          <Field label="Availability"><Input value={form.availability} onChange={e=>set("availability", e.target.value)} maxLength={200}/></Field>
          <Field label="Why do you want to volunteer?"><Textarea rows={5} value={form.motivation} onChange={e=>set("motivation", e.target.value)} maxLength={2000}/></Field>
          <Button onClick={submit} disabled={submitting} className="w-full">
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}Submit
          </Button>
        </Card>
      </main>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium">{label}</Label>
    {children}
  </div>
);

export default VolunteerPage;