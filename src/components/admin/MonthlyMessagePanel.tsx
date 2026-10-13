import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles, Send, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  const [search, setSearch] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

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

  const visibleMessages = messages.filter(m => (!onlyPending || m.status === "pending_approval") && (!search.trim() || String(m.subject || "").toLowerCase().includes(search.trim().toLowerCase())));
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
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => generate(false)} disabled={busy === "generate"} className="gap-2">
            {busy === "generate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Prepare now
          </Button>
          <Button variant="outline" onClick={() => generate(true)} disabled={busy === "generate"}>
            Regenerate
          </Button>
        </div>
      </Card>

      <section aria-label="Monthly messages overview" className="space-y-3 rounded-xl border bg-card p-3">
        <div className="grid grid-cols-3 gap-2">
          {[{label:"Recent",count:messages.length},{label:"Pending",count:messages.filter(m=>m.status==="pending_approval").length},{label:"Sent",count:messages.filter(m=>m.status==="sent").length}].map(x=><div key={x.label} className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">{x.label}</p><p className="text-xl font-semibold tabular-nums">{x.count}</p></div>)}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input aria-label="Search monthly message subjects" placeholder="Search messages…" value={search} onChange={e=>setSearch(e.target.value)}/>
          <Button variant={onlyPending ? "default" : "outline"} onClick={()=>setOnlyPending(x=>!x)} aria-pressed={onlyPending}>Awaiting approval</Button>
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">{visibleMessages.length} of {messages.length} messages</p>
      </section>
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
      ) : visibleMessages.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">{messages.length ? "No messages match the filters." : "No monthly messages yet."}</Card>
      ) : (
        visibleMessages.map((m) => (
          <Card key={m.id} className="p-3 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-medium">{m.subject}</h4>
              {statusBadge(m.status)}
              {m.status === "sent" && (
                <span className="text-xs text-muted-foreground">
                  {m.sent_count} sent{m.failed_count ? `, ${m.failed_count} failed` : ""}
                </span>
              )}
              {(m.status === "pending_approval" || m.status === "approved") && (
                <Button size="sm" className="ml-auto gap-1.5" disabled={busy === m.id} onClick={() => setConfirmId(m.id)}>
                  {busy === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Approve &amp; send
                </Button>
              )}
            </div>
            <details className="group rounded-lg border p-3" open={m.status === "pending_approval" ? true : undefined}>
              <summary className="cursor-pointer text-sm font-medium text-primary">
                {m.status === "pending_approval" ? "Review message for approval" : "Read full message"}
              </summary>
              <div
                className="prose prose-sm max-w-none pt-3 text-muted-foreground [&_p]:mb-2"
                dangerouslySetInnerHTML={{ __html: m.body_html }}
              />
            </details>
          </Card>
        ))
      )}
      <AlertDialog open={!!confirmId} onOpenChange={open=>{if(!open)setConfirmId(null);}}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Send this message to all members?</AlertDialogTitle>
          <AlertDialogDescription>This invokes the existing sending service and may deliver email immediately. Review the message and verify approval first.</AlertDialogDescription>
        </AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={!!busy} onClick={()=>{const id=confirmId;setConfirmId(null);if(id)void sendNow(id);}}>Confirm and send</AlertDialogAction>
        </AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MonthlyMessagePanel;
