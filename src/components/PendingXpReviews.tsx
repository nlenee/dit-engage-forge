import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function PendingXpReviews() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          XP Verification Queue
          <Badge variant="secondary">{pending.length} pending</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : pending.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">No pending submissions.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((p: any) => (
              <div key={p.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{p.profile?.full_name || "Unknown"}</span>
                    <span className="text-sm text-muted-foreground">completed</span>
                    <span className="font-medium">{p.task?.title || "—"}</span>
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
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => review.mutate({ id: p.id, status: "approved" })}>
                    <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    const reason = window.prompt("Rejection reason (optional)") || undefined;
                    review.mutate({ id: p.id, status: "rejected", reason });
                  }}>
                    <XCircle className="h-4 w-4 mr-1 text-red-600" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}