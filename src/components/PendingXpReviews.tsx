import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function PendingXpReviews() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [reviewItem, setReviewItem] = useState<{id:string;title:string;decision:"approved"|"rejected"} | null>(null);
  const [reason, setReason] = useState("");

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ["pending-completions"],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("task_completions")
        .select("*")
        .eq("status", "pending")
        .order("submitted_at", { ascending: false });
      if (!rows?.length) return [];
      const taskIds = [...new Set(rows.map((r: any) => r.task_id))];
      const userIds = [...new Set(rows.map((r: any) => r.user_id))];
      const { data: tasks } = await supabase.from("tasks").select("id,title,points,category").in("id", taskIds);
      const { data: profiles } = await supabase.from("profiles").select("user_id,full_name").in("user_id", userIds);
      return rows.map((r: any) => ({
        ...r,
        task: tasks?.find((t) => t.id === r.task_id),
        profile: profiles?.find((p) => p.user_id === r.user_id),
      }));
    },
  });

  const review = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: "approved" | "rejected"; reason?: string }) => {
      const { error } = await supabase
        .from("task_completions")
        .update({ status, reviewed_by: user!.id, rejection_reason: reason || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-completions"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      toast({ title: "Review submitted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const visible = pending.filter((p:any)=>!query.trim() || [p.profile?.full_name,p.task?.title,p.task?.category].some(v=>String(v||"").toLowerCase().includes(query.trim().toLowerCase())));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          XP Verification Queue
          <Badge variant="secondary">{pending.length} pending</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Input aria-label="Search XP submissions" placeholder="Search member, task or category…" value={query} onChange={e=>setQuery(e.target.value)} className="w-full sm:max-w-sm"/>
          <p className="text-xs text-muted-foreground" aria-live="polite">{visible.length} of {pending.length} pending reviews</p>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : visible.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">{pending.length ? "No submissions match your search." : "No pending submissions."}</p>
        ) : (
          <div className="space-y-3">
            {visible.map((p: any) => (
              <div key={p.id} className="flex min-w-0 flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold break-words">{p.profile?.full_name || "Unknown"}</span>
                    <span className="text-sm text-muted-foreground">completed</span>
                    <span className="font-medium break-words">{p.task?.title || "—"}</span>
                    <Badge>+{p.task?.points || 0} XP</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Submitted {format(new Date(p.submitted_at || p.completed_at), "MMM d, yyyy HH:mm")}
                  </div>
                  {p.evidence_url && (
                    <a href={p.evidence_url} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 mt-1">
                      <ExternalLink className="h-3 w-3" /> View evidence
                    </a>
                  )}
                  {p.notes && <p className="text-xs italic mt-1">"{p.notes}"</p>}
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  <Button size="sm" variant="outline" className="min-h-10 flex-1 sm:flex-none" disabled={review.isPending} onClick={() => {setReviewItem({id:p.id,title:p.task?.title||"this task",decision:"approved"});setReason("");}}>
                    <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="min-h-10 flex-1 sm:flex-none" disabled={review.isPending} onClick={() => {setReviewItem({id:p.id,title:p.task?.title||"this task",decision:"rejected"});setReason("");}}>
                    <XCircle className="h-4 w-4 mr-1 text-red-600" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <AlertDialog open={!!reviewItem} onOpenChange={open=>{if(!open)setReviewItem(null);}}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{reviewItem?.decision === "approved" ? "Approve XP submission?" : "Reject XP submission?"}</AlertDialogTitle>
            <AlertDialogDescription>Review the evidence for {reviewItem?.title} before changing its status. This decision affects the member's XP.</AlertDialogDescription>
          </AlertDialogHeader>
          {reviewItem?.decision === "rejected" && <div className="space-y-2"><Label htmlFor="xp-reject-reason">Reason for rejection</Label><Textarea id="xp-reject-reason" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Explain what needs correction…"/></div>}
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={review.isPending || (reviewItem?.decision === "rejected" && !reason.trim())} onClick={()=>{if(reviewItem)review.mutate({id:reviewItem.id,status:reviewItem.decision,reason:reason.trim()||undefined});setReviewItem(null);}}>Confirm {reviewItem?.decision === "approved" ? "approval" : "rejection"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}