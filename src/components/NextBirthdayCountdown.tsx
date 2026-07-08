import { useEffect, useMemo, useState } from "react";
import { Cake, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

function getNextBirthdayFrom(dob: string, from: Date): Date {
  const [, m, d] = dob.split("-").map(Number);
  let next = new Date(from.getFullYear(), m - 1, d);
  const startOfFrom = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  if (next.getTime() < startOfFrom.getTime())
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

interface Props {
  faction?: string | null;
}

export const NextBirthdayCountdown = ({ faction }: Props = {}) => {
  const { data: members } = useQuery({
    queryKey: ["next-birthday", faction || "all"],
    queryFn: async () => {
      let rows: any[] = [];
      if (faction) {
        const { data } = await supabase.rpc("get_faction_birthdays", { _faction: faction });
        rows = data || [];
      } else {
        const { data } = await supabase.rpc("get_member_directory");
        rows = data || [];
      }
      return rows.filter((r: any) => r.date_of_birth);
    },
    refetchInterval: 3600_000,
  });

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Recompute sorted upcoming list every tick using current time — makes it
  // continuous: when the top birthday hits zero and time advances past it, the
  // list re-sorts and the next person moves into place automatically.
  const sorted = useMemo(() => {
    if (!members?.length) return [];
    return members
      .map((r: any) => ({ ...r, _next: getNextBirthdayFrom(r.date_of_birth, now) }))
      .sort((a: any, b: any) => a._next.getTime() - b._next.getTime());
  }, [members, now]);

  if (!sorted.length) return null;

  // Group people who share the same next birthday date at the front of the list.
  const topDateKey = format(sorted[0]._next, "yyyy-MM-dd");
  const topGroup = sorted.filter((r: any) => format(r._next, "yyyy-MM-dd") === topDateKey);
  const rest = sorted.filter((r: any) => format(r._next, "yyyy-MM-dd") !== topDateKey).slice(0, 3);
  const t = diff(sorted[0]._next);
  const pad = (n: number) => String(n).padStart(2, "0");
  const primary = topGroup[0];

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
          {primary.headshot_url ? (
            <img src={primary.headshot_url} alt="" className="h-12 w-12 rounded-full object-cover border-2 border-primary" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              {(primary.full_name || "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <Cake className="h-4 w-4 text-primary" />
              {topGroup.map((r: any) => r.full_name).join(", ")}
            </div>
            <div className="text-xs text-muted-foreground">
              {primary.faction || "Member"} · {format(primary._next, "MMMM d")}
            </div>
          </div>
        </div>

        {rest.length > 0 && (
          <div className="mt-5 pt-4 border-t border-border/40">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Coming up</div>
            <ul className="space-y-1.5">
              {rest.map((r: any) => {
                const days = Math.ceil((r._next.getTime() - now.getTime()) / 86400000);
                return (
                  <li key={r.user_id} className="flex items-center justify-between text-xs">
                    <span className="font-medium truncate">{r.full_name}</span>
                    <span className="text-muted-foreground shrink-0 ml-2">
                      {format(r._next, "MMM d")} · {days}d
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
