import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ditLogo from "@/assets/dit-logo.jpg";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { data: prof } = await supabase.from("profiles").select("user_id").eq("email", email.trim().toLowerCase()).maybeSingle();
      const { error } = await supabase.from("password_reset_requests").insert({
        email: email.trim().toLowerCase(),
        reason: reason || null,
        user_id: prof?.user_id ?? null,
      });
      if (error) throw error;
      setSubmitted(true);
      toast({ title: "Request submitted", description: "An admin will review it shortly." });
    } catch (err) {
      toast({ title: "Could not submit", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen anniversary-bg text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10">
        <Link to="/auth" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
        <div className="text-center mb-6">
          <img src={ditLogo} alt="DIT" className="h-14 w-14 mx-auto mb-3 rounded-xl shadow-2xl" />
          <h1 className="font-display text-2xl font-bold">Forgot your password?</h1>
          <p className="text-white/70 text-sm mt-1">Submit a reset request — an admin will approve it.</p>
        </div>
        <div className="bg-card text-foreground rounded-3xl shadow-2xl p-6 border border-white/10">
          {submitted ? (
            <div className="text-center space-y-3 py-6">
              <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
              <h2 className="text-lg font-semibold">Request received</h2>
              <p className="text-sm text-muted-foreground">Once an admin approves your request, a password reset email will be sent to <span className="font-medium">{email}</span>.</p>
              <Button asChild className="w-full mt-2"><Link to="/auth">Back to sign in</Link></Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fp-email">Account email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="fp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" placeholder="you@example.com" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fp-reason">Reason (optional)</Label>
                <Textarea id="fp-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} rows={3} placeholder="Briefly tell admins why you need a reset" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : "Submit request"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}