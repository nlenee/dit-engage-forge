import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, CheckCircle2, Sparkles, Crown, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const FACTIONS = ["SHI", "TECK", "MINDUP", "DYP"];

export default function AnniversaryHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [factionFilter, setFactionFilter] = useState<string | null>(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("*").eq("active", true).order("points", { ascending: false });
      return data || [];
    },
  });

  const { data: completions = [] } = useQuery({
    queryKey: ["my-completions", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("task_completions").select("*").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-xp", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("xp, member_level, full_name, faction").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["leaderboard", factionFilter],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_leaderboard", { _faction: factionFilter, _limit: 25 });
      return (data as any[]) || [];
    },
  });

  const complete = useMutation({
    mutationFn: async ({ taskId, evidence }: { taskId: string; evidence?: string }) => {
      const { error } = await supabase.from("task_completions").insert({
        user_id: user!.id,
        task_id: taskId,
        evidence_url: evidence || null,
        notes: evidence ? null : null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      // Login/platform tasks auto-approve via DB trigger
      toast({
        title: "Submitted for review",
        description: "Admins will verify and award your XP shortly.",
      });
      qc.invalidateQueries({ queryKey: ["my-completions"] });
      qc.invalidateQueries({ queryKey: ["profile-xp"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: (e: any) => toast({ title: "Could not submit", description: e.message, variant: "destructive" }),
  });

  const completedIds = new Set(completions.map((c: any) => c.task_id));
  const xp = profile?.xp || 0;
  const level = profile?.member_level || 1;
  const xpForNext = level ** 2 * 100;
  const progress = Math.min(100, (xp / xpForNext) * 100);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" /> Anniversary Hub
          </h1>
          <p className="text-muted-foreground">Complete tasks, earn XP, win the 10th Anniversary movement.</p>
        </div>

        {/* My Progress */}
        <Card className="mb-8 bg-gradient-to-br from-primary/10 to-indigo-500/10 border-primary/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-xs tracking-widest text-muted-foreground">YOUR LEVEL</div>
                <div className="text-5xl font-black text-foreground">{level}</div>
              </div>
              <div className="flex-1 max-w-md">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{xp.toLocaleString()} XP</span><span>{xpForNext.toLocaleString()} XP</span>
                </div>
                <Progress value={progress} className="h-3" />
                <div className="text-xs text-muted-foreground mt-2">Tasks completed: {completions.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="tasks">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              {tasks.map((t: any) => {
                const myCompletion = completions.find((c: any) => c.task_id === t.id);
                const status = myCompletion?.status;
                const done = !!myCompletion && !t.repeatable && status === "approved";
                const pending = !!myCompletion && status === "pending" && !t.repeatable;
                const rejected = status === "rejected";
                const isLoginTask =
                  (t.code || "").toLowerCase().includes("login") ||
                  (t.category || "").toLowerCase() === "platform" ||
                  (t.category || "").toLowerCase().includes("login");
                return (
                  <Card key={t.id} className={done ? "bg-muted/40" : ""}>
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-pink-500 text-white flex items-center justify-center font-bold">
                        +{t.points}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          {t.title}
                          {done && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          {pending && <Badge variant="outline" className="text-[9px]">PENDING REVIEW</Badge>}
                          {rejected && <Badge variant="destructive" className="text-[9px]">REJECTED</Badge>}
                          {t.repeatable && <Badge variant="outline" className="text-[9px]">REPEATABLE</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{t.description}</div>
                        {!isLoginTask && !done && !pending && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            Requires admin verification. Provide a proof link if available.
                          </p>
                        )}
                        <Button
                          size="sm" className="mt-3" disabled={done || pending || complete.isPending}
                          onClick={() => {
                            if (isLoginTask) {
                              complete.mutate({ taskId: t.id });
                            } else {
                              const evidence =
                                window.prompt("Paste a proof link (screenshot, post, doc) — optional:") || undefined;
                              complete.mutate({ taskId: t.id, evidence });
                            }
                          }}
                        >
                          {done ? "Completed" : pending ? "Awaiting review" : isLoginTask ? "Claim XP" : "Submit for review"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-4">
            <div className="flex gap-2 mb-4">
              <Button size="sm" variant={factionFilter === null ? "default" : "outline"} onClick={() => setFactionFilter(null)}>All</Button>
              {FACTIONS.map((f) => (
                <Button key={f} size="sm" variant={factionFilter === f ? "default" : "outline"} onClick={() => setFactionFilter(f)}>{f}</Button>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Trophy className="h-5 w-5 text-amber-500" /> Top Members</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {leaderboard.map((row: any, i: number) => (
                  <div key={row.user_id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
                    <div className={`w-8 text-center font-black ${i === 0 ? "text-amber-500" : i < 3 ? "text-foreground" : "text-muted-foreground"}`}>
                      {i === 0 ? <Crown className="h-5 w-5 mx-auto text-amber-500" /> : `#${i + 1}`}
                    </div>
                    {row.headshot_url ? (
                      <img src={row.headshot_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {(row.full_name || "?").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{row.full_name}</div>
                      <div className="text-xs text-muted-foreground">{row.faction || "—"} · Level {row.member_level}</div>
                    </div>
                    <Badge variant="secondary">{(row.xp || 0).toLocaleString()} XP</Badge>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <div className="text-center text-muted-foreground py-6">No members yet — be the first!</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
