import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Check, X, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Req = {
  id: string;
  email: string;
  reason: string | null;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
};

export default function PasswordResetRequests() {
  const { toast } = useToast();
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("password_reset_requests").select("*").order("requested_at", { ascending: false }).limit(100);
    setItems((data as Req[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const act = async (id: string, action: "approve" | "reject") => {
    setBusy(id);
    try {
      const { error } = await supabase.functions.invoke("approve-password-reset", { body: { requestId: id, action } });
      if (error) throw error;
      toast({ title: action === "approve" ? "Approved — email sent" : "Rejected" });
      await load();
    } catch (e) {
      toast({ title: "Failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const pending = items.filter((i) => i.status === "pending");
  const reviewed = items.filter((i) => i.status !== "pending");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Password Reset Requests</CardTitle>
        <CardDescription>Approve to send a Supabase recovery email to the member.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="space-y-6">
            <section>
              <h4 className="font-medium mb-2">Pending ({pending.length})</h4>
              {pending.length === 0 && <p className="text-sm text-muted-foreground">No pending requests.</p>}
              <div className="space-y-2">
                {pending.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-4 p-3 border rounded-lg">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{r.email}</p>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.requested_at))} ago</p>
                      {r.reason && <p className="text-xs mt-1 italic">"{r.reason}"</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => act(r.id, "reject")} disabled={busy === r.id}>
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button size="sm" onClick={() => act(r.id, "approve")} disabled={busy === r.id}>
                        {busy === r.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />} Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h4 className="font-medium mb-2">Recently reviewed</h4>
              {reviewed.length === 0 && <p className="text-sm text-muted-foreground">No history.</p>}
              <div className="space-y-1">
                {reviewed.slice(0, 10).map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm p-2 border rounded">
                    <span className="truncate">{r.email}</span>
                    <Badge variant={r.status === "approved" ? "default" : "secondary"}>{r.status}</Badge>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </CardContent>
    </Card>
  );
}