import { useEffect, useState } from "react";
import { Cake, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

function getNextBirthday(dob: string): Date {
  const [, m, d] = dob.split("-").map(Number);
  const now = new Date();
  let next = new Date(now.getFullYear(), m - 1, d);
  if (next.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime())
    next.setFullYear(next.getFullYear() + 1);
  return next;
}

function diff(target: Date) {
  let ms = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(ms / 86400000); ms -= days * 86400000;
  const hours = Math.floor(ms / 3600000); ms -= hours * 3600000;
  const minutes = Math.floor(ms / 60000); ms -= minutes * 60000;
  const seconds = Math.floor(ms / 1000);
  return { days, hours, minutes, seconds };
}

export const NextBirthdayCountdown = () => {
  const { data } = useQuery({
    queryKey: ["next-birthday"],
    queryFn: async () => {
      const { data: rows } = await supabase.rpc("get_member_directory");
      const withBdays = (rows || []).filter((r: any) => r.date_of_birth) as any[];
      if (!withBdays.length) return null;
      const sorted = withBdays
        .map((r) => ({ ...r, _next: getNextBirthday(r.date_of_birth) }))
        .sort((a, b) => a._next.getTime() - b._next.getTime());
      return sorted[0];
    },
    refetchInterval: 60000,
  });

  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!data) return;
    const id = setInterval(() => setT(diff(data._next)), 1000);
    setT(diff(data._next));
    return () => clearInterval(id);
  }, [data]);

  if (!data) return null;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-card to-accent/10 border-primary/30 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 text-primary text-sm font-semibold tracking-wider uppercase mb-2">
          <Timer className="h-4 w-4" /> Next birthday in
        </div>
        <div className="font-mono text-4xl md:text-6xl font-black text-foreground tabular-nums leading-none mb-4">
          {pad(t.days)}<span className="text-primary">:</span>{pad(t.hours)}<span className="text-primary">:</span>{pad(t.minutes)}<span className="text-primary">:</span>{pad(t.seconds)}
        </div>
        <div className="flex items-center gap-3 mt-2">
          {data.headshot_url ? (
            <img src={data.headshot_url} alt="" className="h-12 w-12 rounded-full object-cover border-2 border-primary" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              {(data.full_name || "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <Cake className="h-4 w-4 text-primary" /> {data.full_name}
            </div>
            <div className="text-xs text-muted-foreground">
              {data.faction || "Member"} · {format(data._next, "MMMM d")}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
