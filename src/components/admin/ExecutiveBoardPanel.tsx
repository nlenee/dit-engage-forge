import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LEADERSHIP_SEATS, FACTIONS } from "@/lib/permissions";
import { Crown, Users } from "lucide-react";

interface Seat {
  role: string;
  title: string;
  faction?: string | null;
  occupants: Array<{ user_id: string; full_name: string | null; avatar_url?: string | null }>;
  permissions: string[];
}

const ROLE_PERMS: Record<string, string[]> = {
  chief_executive_director: ["*"],
  executive_secretary: ["applications.review","members.manage","directory.manage","letters.create","announcements.publish","offices.manage"],
  community_manager: ["members.manage","announcements.publish","directory.manage"],
  chief_finance_officer: ["finance.view","finance.manage"],
  executive_director: ["applications.review","faction.manage"],
  executive_assistant: ["applications.review","faction.manage"],
};

export default function ExecutiveBoardPanel() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id, role, faction");
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, avatar_url, headshot_url");
      const nameMap = new Map((profs || []).map((p: any) => [p.user_id, p]));
      const built: Seat[] = [];
      for (const s of LEADERSHIP_SEATS) {
        if (s.perFaction) {
          for (const f of FACTIONS) {
            const rs = (roles || []).filter((r: any) => r.role === s.role && (r.faction === f));
            built.push({
              role: s.role, title: `${s.title} — ${f}`, faction: f,
              occupants: rs.map((r: any) => ({
                user_id: r.user_id,
                full_name: nameMap.get(r.user_id)?.full_name || null,
                avatar_url: nameMap.get(r.user_id)?.avatar_url || nameMap.get(r.user_id)?.headshot_url,
              })),
              permissions: ROLE_PERMS[s.role] || [],
            });
          }
        } else {
          const rs = (roles || []).filter((r: any) => r.role === s.role);
          built.push({
            role: s.role, title: s.title,
            occupants: rs.map((r: any) => ({
              user_id: r.user_id,
              full_name: nameMap.get(r.user_id)?.full_name || null,
              avatar_url: nameMap.get(r.user_id)?.avatar_url || nameMap.get(r.user_id)?.headshot_url,
            })),
            permissions: ROLE_PERMS[s.role] || [],
          });
        }
      }
      setSeats(built);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-6 text-muted-foreground">Loading executive board…</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {seats.map((s, i) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-primary" />
                <h4 className="font-semibold">{s.title}</h4>
              </div>
              {s.faction && <div className="text-xs text-muted-foreground mt-1">Faction: {s.faction}</div>}
            </div>
            <Badge variant={s.occupants.length ? "default" : "outline"}>
              {s.occupants.length ? `${s.occupants.length} occupant${s.occupants.length > 1 ? "s" : ""}` : "Vacant"}
            </Badge>
          </div>

          {s.occupants.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {s.occupants.map(o => (
                <div key={o.user_id} className="flex items-center gap-2 bg-muted/40 rounded-full pl-1 pr-3 py-1 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium overflow-hidden">
                    {o.avatar_url ? <img src={o.avatar_url} alt="" className="w-full h-full object-cover"/> : (o.full_name?.[0] || "?")}
                  </div>
                  <span>{o.full_name || "Unnamed"}</span>
                </div>
              ))}
            </div>
          )}

          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Users className="w-3 h-3"/> Access
            </div>
            <div className="flex flex-wrap gap-1">
              {s.permissions.includes("*")
                ? <Badge>Full access</Badge>
                : s.permissions.map(p => <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>)}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}