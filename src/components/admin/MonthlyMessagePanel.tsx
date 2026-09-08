import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles, Send, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const APPROVER = "divintelteam@gmail.com";

const statusBadge = (status: string) => {
  if (status === "sent") return <Badge className="gap-1"><CheckCircle2 className="w-3 h-3" />Sent</Badge>;
  if (status === "rejected") return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Declined</Badge>;
  if (status === "approved") return <Badge variant="secondary">Approved</Badge>;
  if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
  return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />Awaiting approval</Badge>;
};

const MonthlyMessagePanel = () => {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["monthly-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_messages" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(24);
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const generate = async (force = false) => {
    setBusy("generate");
    const { data, error } = await supabase.functions.invoke("monthly-new-month-email", {
      body: { mode: "generate", force },
    });
    setBusy(null);
    if (error || (data as any)?.error) {
      toast({ title: "Could not prepare the message", description: error?.message || (data as any)?.error, variant: "destructive" });
      return;
    }
    if ((data as any)?.alreadyExists) {
      toast({ title: "Already prepared", description: "This month's message exists. Use Regenerate to write a new one." });
    } else {
      toast({ title: "Draft sent for approval", description: `Approval email delivered to ${APPROVER}.` });
    }
    qc.invalidateQueries({ queryKey: ["monthly-messages"] });
  };

  const sendNow = async (id: string) => {
    setBusy(id);
    const { data, error } = await supabase.functions.invoke("monthly-new-month-email", {
      body: { mode: "send-approved", id },
    });
    setBusy(null);
    if (error || (data as any)?.error) {
      toast({ title: "Send failed", description: error?.message || (data as any)?.error, variant: "destructive" });
      return;
    }
    toast({ title: "Message sent", description: `${(data as any).sent} member(s) received it.` });
    qc.invalidateQueries({ queryKey: ["monthly-messages"] });
  };

  return (
    <div className="space-y-4">
      <Card className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Happy New Month message</h3>
          <p className="text-sm text-muted-foreground">
            On the first of every month the message is written automatically and emailed to {APPROVER} for approval.
            Once approved, it goes out to every member immediately.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => generate(false)} disabled={busy === "generate"} className="gap-2">
            {busy === "generate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Prepare now
          </Button>
          <Button variant="outline" onClick={() => generate(true)} disabled={busy === "generate"}>
            Regenerate
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
      ) : messages.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No monthly messages yet.</Card>
      ) : (
        messages.map((m) => (
          <Card key={m.id} className="p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-medium">{m.subject}</h4>
              {statusBadge(m.status)}
              {m.status === "sent" && (
                <span className="text-xs text-muted-foreground">
                  {m.sent_count} sent{m.failed_count ? `, ${m.failed_count} failed` : ""}
                </span>
              )}
              {(m.status === "pending_approval" || m.status === "approved") && (
                <Button size="sm" className="ml-auto gap-1.5" disabled={busy === m.id} onClick={() => sendNow(m.id)}>
                  {busy === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Approve &amp; send
                </Button>
              )}
            </div>
            <div
              className="prose prose-sm max-w-none text-muted-foreground [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: m.body_html }}
            />
          </Card>
        ))
      )}
    </div>
  );
};

export default MonthlyMessagePanel;
