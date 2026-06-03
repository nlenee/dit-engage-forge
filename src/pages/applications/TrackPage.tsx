import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search } from "lucide-react";

const TrackPage = () => {
  const [params] = useSearchParams();
  const [ref, setRef] = useState(params.get("ref") || "");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [app, setApp] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const search = async () => {
    setLoading(true); setErr(null); setApp(null); setHistory([]);
    const { data, error } = await supabase
      .from("applications")
      .select("id, reference_number, status, applicant_name, applicant_email, selected_faction, final_faction, ai_suggested_faction, created_at, updated_at")
      .eq("reference_number", ref.trim())
      .eq("applicant_email", email.trim().toLowerCase())
      .maybeSingle();
    if (error || !data) {
      setErr("No application found with that reference and email.");
      setLoading(false);
      return;
    }
    setApp(data);
    const { data: logs } = await supabase
      .from("application_status_log")
      .select("previous_status, new_status, created_at")
      .eq("application_id", data.id)
      .order("created_at", { ascending: true });
    setHistory(logs || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="font-display text-3xl font-semibold mb-2">Track your application</h1>
        <p className="text-muted-foreground mb-6">Enter your reference number and the email you applied with.</p>

        <Card className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Reference number</Label>
            <Input value={ref} onChange={e=>setRef(e.target.value)} placeholder="DIT-2026-0001" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <Button onClick={search} disabled={loading || !ref || !email} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Search className="w-4 h-4 mr-2"/>}
            Check status
          </Button>
          {err && <p className="text-sm text-destructive">{err}</p>}
        </Card>

        {app && (
          <Card className="p-6 mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Reference</p>
                <p className="font-mono">{app.reference_number}</p>
              </div>
              <Badge variant="outline" className="capitalize">{app.status.replace(/_/g," ")}</Badge>
            </div>
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Applicant:</span> {app.applicant_name}</p>
              <p><span className="text-muted-foreground">Faction preference:</span> {app.selected_faction || "—"}</p>
              <p><span className="text-muted-foreground">Suggested faction:</span> {app.ai_suggested_faction || "pending review"}</p>
              <p><span className="text-muted-foreground">Final faction:</span> {app.final_faction || "pending"}</p>
              <p><span className="text-muted-foreground">Submitted:</span> {new Date(app.created_at).toLocaleString()}</p>
            </div>
            {history.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">History</p>
                <ul className="space-y-1 text-sm">
                  {history.map((h, i) => (
                    <li key={i} className="flex justify-between border-b py-1">
                      <span>{h.previous_status ? `${h.previous_status} → ` : ""}{h.new_status}</span>
                      <span className="text-muted-foreground text-xs">{new Date(h.created_at).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}
      </main>
    </div>
  );
};

export default TrackPage;