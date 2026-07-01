import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import ShareLinkPanel from "@/components/applications/ShareLinkPanel";
import ScheduleInterviewDialog from "@/components/applications/ScheduleInterviewDialog";
import { Sparkles, CheckCircle2, XCircle, MessageSquare, ShieldAlert, Flag, Loader2, Lock } from "lucide-react";

const STATUS_FILTERS = ["all", "submitted", "under_review", "interview_scheduled", "approved", "rejected"] as const;

const ApplicationsReviewPage = () => {
  const { user, isAdmin, isExecutiveSecretary, isCED, isED, isEA, rolesLoading } = useAuth();
  const canAccess = isAdmin || isExecutiveSecretary || isCED || isED || isEA;
  const isFactionScoped = !isAdmin && !isExecutiveSecretary && !isCED && (isED || isEA);
  const [apps, setApps] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [search, setSearch] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setApps(data || []);
  };

  useEffect(() => { load(); }, []);

  // Realtime subscriptions
  useEffect(() => {
    const ch = supabase.channel("apps-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const openApp = async (a: any) => {
    setSelected(a);
    setLoading(true);
    const [{ data: rs }, { data: rv }] = await Promise.all([
      supabase.from("application_responses").select("*").eq("application_id", a.id),
      supabase.from("application_reviews").select("*").eq("application_id", a.id).order("created_at", { ascending: false }),
    ]);
    setResponses(rs || []);
    setReviews(rv || []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return apps.filter(a => {
      if (filter !== "all" && a.status !== filter) return false;
      if (search && !`${a.applicant_name} ${a.applicant_email} ${a.reference_number}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [apps, filter, search]);

  const act = async (action: "approved" | "rejected" | "reassigned" | "interview_requested" | "flagged" | "commented", extra?: any) => {
    if (!selected || !user) return;

    // Approval path: call edge function which provisions the member + sends welcome
    if (action === "approved") {
      const { data, error } = await supabase.functions.invoke("approve-application", {
        body: {
          application_id: selected.id,
          faction_override: extra?.new_faction,
          role_title: extra?.role_title,
        },
      });
      if (error || (data as any)?.error) {
        toast({ title: "Approval failed", description: error?.message || (data as any)?.error, variant: "destructive" });
        return;
      }
      toast({ title: "Approved", description: "Member provisioned. Welcome email sent." });
      setComment("");
      openApp({ ...selected, status: "approved", final_faction: (data as any)?.faction });
      load();
      return;
    }

    // Only persist columns that exist on application_reviews. Extras like
    // new_faction / role_title are used to patch the application itself below.
    const { error: revErr } = await supabase.from("application_reviews").insert({
      application_id: selected.id,
      reviewer_id: user.id,
      action,
      comment: comment || null,
    });
    if (revErr) { toast({ title: "Failed", description: revErr.message, variant: "destructive" }); return; }

    let newStatus: string | null = null;
    let patch: any = {};
    if (action === "rejected") newStatus = "rejected";
    if (action === "reassigned") { newStatus = "reassigned"; if (extra?.new_faction) patch.final_faction = extra.new_faction; }
    if (action === "interview_requested") newStatus = "interview_scheduled";
    if (newStatus) patch.status = newStatus;

    if (Object.keys(patch).length) {
      const { error: uErr } = await supabase.from("applications").update(patch).eq("id", selected.id);
      if (uErr) { toast({ title: "Status update failed", description: uErr.message, variant: "destructive" }); return; }
    }
    toast({ title: `Recorded: ${action.replace("_", " ")}` });
    setComment("");
    openApp({ ...selected, ...patch });
    load();
  };

  if (rolesLoading) {
    return (
      <div className="min-h-screen bg-background"><Header />
        <div className="flex justify-center py-20"><Loader2 className="animate-spin"/></div>
      </div>
    );
  }
  if (!canAccess) {
    return (
      <div className="min-h-screen bg-background"><Header />
        <main className="container mx-auto px-4 py-20 max-w-lg text-center">
          <Lock className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <h1 className="font-display text-2xl font-semibold mb-2">Restricted area</h1>
          <p className="text-muted-foreground text-sm">
            Application reviews are limited to Admin, Executive Secretary,
            Executive Director, and Executive Assistant roles.
          </p>
        </main>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-semibold">Applications</h1>
            <p className="text-muted-foreground text-sm">
              {isFactionScoped
                ? "Showing applications for your faction only."
                : "Review, decide, and track applicants in real time."}
            </p>
          </div>
        </div>

        <ShareLinkPanel />

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_360px] gap-4 mt-6">
          {/* Left: list */}
          <Card className="p-3 flex flex-col">
            <Input placeholder="Search name, email, ref…" value={search} onChange={e=>setSearch(e.target.value)} className="mb-2" />
            <Tabs value={filter} onValueChange={(v)=>setFilter(v as any)}>
              <TabsList className="grid grid-cols-3 mb-2 h-auto">
                {STATUS_FILTERS.slice(0,3).map(s => <TabsTrigger key={s} value={s} className="text-xs">{s.replace(/_/g, " ")}</TabsTrigger>)}
              </TabsList>
              <TabsList className="grid grid-cols-3 h-auto">
                {STATUS_FILTERS.slice(3).map(s => <TabsTrigger key={s} value={s} className="text-xs">{s.replace(/_/g, " ")}</TabsTrigger>)}
              </TabsList>
            </Tabs>
            <ScrollArea className="flex-1 mt-3 max-h-[60vh]">
              <ul className="space-y-1.5">
                {filtered.map(a => (
                  <li key={a.id}>
                    <button
                      onClick={()=>openApp(a)}
                      className={`w-full text-left p-2.5 rounded-md border hover:bg-accent/40 ${selected?.id === a.id ? "bg-accent/60 border-primary" : ""}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="font-medium truncate text-sm">{a.applicant_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.reference_number}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] capitalize shrink-0">{a.status.replace(/_/g," ")}</Badge>
                      </div>
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">No applications.</p>}
              </ul>
            </ScrollArea>
          </Card>

          {/* Middle: detail */}
          <Card className="p-5">
            {!selected ? (
              <div className="text-center text-muted-foreground py-20">Select an application to review.</div>
            ) : loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin"/></div>
            ) : (
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-display text-xl font-semibold">{selected.applicant_name}</h2>
                    <p className="text-sm text-muted-foreground">{selected.applicant_email}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{selected.reference_number}</p>
                  </div>
                  <Badge className="capitalize">{selected.status.replace(/_/g," ")}</Badge>
                </div>

                {selected.ai_suggested_faction && (
                  <div className="rounded-md border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5"/>
                    <div className="text-sm">
                      <p><strong>AI suggestion:</strong> {selected.ai_suggested_faction}</p>
                      <p className="text-xs text-muted-foreground">Treat as a recommendation only.</p>
                    </div>
                  </div>
                )}

                {(selected.ai_about_ai_score != null || selected.ai_why_ai_score != null) && (
                  <div className="rounded-md border bg-muted/30 p-3 text-xs grid grid-cols-2 gap-3">
                    <div>
                      <p className="font-medium mb-0.5">About-you content</p>
                      <p>AI likelihood: <strong>{Math.round((selected.ai_about_ai_score || 0) * 100)}%</strong></p>
                      <p>Human likelihood: <strong>{Math.round((selected.ai_about_human_score || 0) * 100)}%</strong></p>
                    </div>
                    <div>
                      <p className="font-medium mb-0.5">Why-DIT content</p>
                      <p>AI likelihood: <strong>{Math.round((selected.ai_why_ai_score || 0) * 100)}%</strong></p>
                      <p>Human likelihood: <strong>{Math.round((selected.ai_why_human_score || 0) * 100)}%</strong></p>
                    </div>
                    <p className="col-span-2 text-muted-foreground italic">Advisory only — never auto-reject based on these scores.</p>
                  </div>
                )}

                <div>
                  <h3 className="font-medium mb-2 text-sm uppercase tracking-wide text-muted-foreground">Responses</h3>
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                    {responses.map(r => (
                      <div key={r.id} className="border rounded-md p-3">
                        <p className="text-xs text-muted-foreground capitalize">{r.section} · {r.question_text}</p>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{(r.response_value?.value ?? JSON.stringify(r.response_value)) || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2 text-sm uppercase tracking-wide text-muted-foreground">Review log</h3>
                  <ul className="space-y-1.5 text-sm">
                    {reviews.map(r => (
                      <li key={r.id} className="border rounded-md p-2">
                        <div className="flex justify-between"><span className="capitalize">{r.action.replace(/_/g," ")}</span>
                        <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span></div>
                        {r.comment && <p className="text-xs text-muted-foreground mt-1">{r.comment}</p>}
                      </li>
                    ))}
                    {reviews.length === 0 && <p className="text-xs text-muted-foreground">No reviews yet.</p>}
                  </ul>
                </div>
              </div>
            )}
          </Card>

          {/* Right: actions */}
          <Card className="p-4 space-y-3 h-fit">
            <h3 className="font-display text-lg font-semibold">Actions</h3>
            {!selected ? (
              <p className="text-sm text-muted-foreground">Pick an application first.</p>
            ) : (
              <>
                <Textarea placeholder="Optional comment…" value={comment} onChange={e=>setComment(e.target.value)} rows={3} maxLength={1000}/>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" onClick={()=>act("approved")} className="w-full"><CheckCircle2 className="w-3.5 h-3.5 mr-1"/>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={()=>act("rejected")} className="w-full"><XCircle className="w-3.5 h-3.5 mr-1"/>Reject</Button>
                  <div className="w-full">
                    <ScheduleInterviewDialog
                      applicationId={selected.id}
                      applicantName={selected.applicant_name}
                      applicantEmail={selected.applicant_email}
                      onScheduled={() => { openApp({ ...selected, status: "interview_scheduled" }); load(); }}
                      trigger={<Button size="sm" variant="outline" className="w-full"><MessageSquare className="w-3.5 h-3.5 mr-1"/>Schedule Interview</Button>}
                    />
                  </div>
                  <Button size="sm" variant="outline" onClick={()=>act("flagged")} className="w-full"><Flag className="w-3.5 h-3.5 mr-1"/>Flag</Button>
                  <Button size="sm" variant="outline" onClick={()=>act("commented")} className="w-full col-span-2"><ShieldAlert className="w-3.5 h-3.5 mr-1"/>Add comment only</Button>
                </div>
                <div className="pt-3 border-t space-y-1.5">
                  <p className="text-xs text-muted-foreground">Reassign to faction</p>
                  <div className="flex gap-1.5">
                    {["shi","dyp","teck","mindup"].map(f => (
                      <Button key={f} size="sm" variant="outline" className="flex-1 text-xs"
                        onClick={()=>act("reassigned", { new_faction: f })}>{f}</Button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ApplicationsReviewPage;