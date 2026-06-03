import { useState } from "react";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import RouteAccess from "@/components/RouteAccess";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus } from "lucide-react";
import { z } from "zod";

const FACTIONS = ["shi","dyp","teck","mindup"];
const ROLES = ["chief_executive_director","executive_secretary","community_manager","chief_finance_officer","executive_director","executive_assistant"];

const AppointPage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "",
    role: "executive_director", faction: "shi", note: "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    const r = z.object({
      full_name: z.string().trim().min(2),
      email: z.string().trim().email(),
    }).safeParse(form);
    if (!r.success) { toast({ title: "Name and email are required", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const { data: app, error } = await supabase.from("applications").insert({
        application_type: "boe_appointment",
        applicant_name: form.full_name,
        applicant_email: form.email,
        selected_faction: form.faction,
        ai_suggested_faction: form.faction,
        status: "approved",
        final_faction: form.faction,
        applicant_user_id: user?.id,
      }).select("id, reference_number").single();
      if (error) throw error;

      await supabase.from("application_responses").insert(
        Object.entries(form).map(([k, v]) => ({
          application_id: app.id,
          section: "boe_appointment",
          question_key: k,
          question_text: k.replace(/_/g, " "),
          response_value: { value: v },
        }))
      );
      toast({ title: "Appointment recorded", description: `Reference ${app.reference_number}. Send the invite link to ${form.email}.` });
      setForm({ full_name: "", email: "", phone: "", role: form.role, faction: form.faction, note: "" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <RouteAccess allow={["admin","chief_executive_director","executive_secretary"]}>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-10 max-w-2xl">
          <h1 className="font-display text-3xl font-semibold mb-2">Direct BoE Appointment</h1>
          <p className="text-muted-foreground mb-6">Bypass the public funnel and appoint a Board of Executives member directly.</p>
          <Card className="p-6 space-y-4">
            <Field label="Full name"><Input value={form.full_name} onChange={e=>set("full_name", e.target.value)}/></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={e=>set("email", e.target.value)}/></Field>
            <Field label="Phone"><Input value={form.phone} onChange={e=>set("phone", e.target.value)}/></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Role">
                <select className="w-full border rounded-md h-10 px-3 bg-background text-sm" value={form.role} onChange={e=>set("role", e.target.value)}>
                  {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g," ")}</option>)}
                </select>
              </Field>
              <Field label="Faction">
                <select className="w-full border rounded-md h-10 px-3 bg-background text-sm" value={form.faction} onChange={e=>set("faction", e.target.value)}>
                  {FACTIONS.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Notes / appointment context"><Textarea rows={4} value={form.note} onChange={e=>set("note", e.target.value)} maxLength={1500}/></Field>
            <Button onClick={submit} disabled={busy} className="w-full">
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <UserPlus className="w-4 h-4 mr-2"/>}
              Record appointment
            </Button>
          </Card>
        </main>
      </div>
    </RouteAccess>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium">{label}</Label>
    {children}
  </div>
);

export default AppointPage;