import { useQuery } from "@tanstack/react-query";
import { Loader2, Building2, ShieldCheck, User2 } from "lucide-react";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { factionColor, PERMISSION_CATALOG } from "@/lib/permissions";

interface Office {
  id: string;
  code: string;
  title: string;
  abbreviation: string | null;
  tier: string | null;
  faction: string | null;
  description: string | null;
}

const TIERS: Array<{ key: string; label: string; caption: string }> = [
  { key: "boe", label: "Board of Executives", caption: "Organisation-wide leadership" },
  { key: "faction_ed", label: "Executive Directors", caption: "Faction heads" },
  { key: "faction_level", label: "Faction Offices", caption: "Faction-level leadership" },
];

const permLabel = (key: string) =>
  PERMISSION_CATALOG.find((p) => p.key === key)?.label || key;

const OrgStructure = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["org-structure"],
    queryFn: async () => {
      const [{ data: offices }, { data: assignments }, { data: perms }] = await Promise.all([
        supabase.from("offices").select("id, code, title, abbreviation, tier, faction, description").order("title"),
        supabase.from("office_assignments").select("office_id, user_id, assigned_at").eq("is_active", true),
        supabase.from("office_permissions").select("office_id, permission_key"),
      ]);

      const userIds = Array.from(new Set((assignments || []).map((a: any) => a.user_id)));
      const { data: profiles } = userIds.length
        ? await supabase
            .from("profiles")
            .select("user_id, full_name, headshot_url, avatar_url, faction")
            .in("user_id", userIds)
        : { data: [] as any[] };

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      return {
        offices: (offices || []) as Office[],
        holders: (assignments || []).reduce((acc: Record<string, any[]>, a: any) => {
          const p = profileMap.get(a.user_id);
          (acc[a.office_id] ||= []).push({ ...a, profile: p });
          return acc;
        }, {}),
        perms: (perms || []).reduce((acc: Record<string, string[]>, p: any) => {
          (acc[p.office_id] ||= []).push(p.permission_key);
          return acc;
        }, {}),
      };
    },
  });

  const offices = data?.offices || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 py-6 sm:px-4 sm:py-8 max-w-6xl">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Divine Intelligence Team</p>
          <h1 className="font-display text-3xl font-bold text-foreground">Organisational Structure</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every recognised office, who holds it, and what it grants access to.
          </p>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-10">
            {TIERS.map((tier) => {
              const list = offices.filter((o) => (o.tier || "faction_level") === tier.key);
              if (!list.length) return null;
              return (
                <section key={tier.key}>
                  <div className="flex items-baseline gap-3 mb-4">
                    <h2 className="font-display text-xl font-semibold">{tier.label}</h2>
                    <span className="text-xs text-muted-foreground">{tier.caption}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{list.length} offices</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((office) => {
                      const holders = data?.holders?.[office.id] || [];
                      const permKeys = data?.perms?.[office.id] || [];
                      const color = factionColor(office.faction, office.tier);
                      return (
                        <Card key={office.id} className="p-4 space-y-3 border-l-4" style={{ borderLeftColor: color }}>
                          <div className="flex items-start gap-2">
                            <Building2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color }} />
                            <div className="min-w-0">
                              <h3 className="font-medium leading-tight">{office.title}</h3>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {office.abbreviation && (
                                  <Badge variant="outline" className="text-[10px]" style={{ borderColor: color, color }}>
                                    {office.abbreviation}
                                  </Badge>
                                )}
                                {office.faction && (
                                  <Badge variant="secondary" className="text-[10px]">{office.faction}</Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-sm">
                            {holders.length ? (
                              <ul className="space-y-1">
                                {holders.map((h: any) => (
                                  <li key={h.user_id} className="flex items-center gap-2">
                                    <User2 className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="truncate">{h.profile?.full_name || "Member"}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Vacant</span>
                            )}
                          </div>

                          {permKeys.length > 0 && (
                            <div className="pt-2 border-t">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Access rights
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {permKeys.slice(0, 6).map((k) => (
                                  <Badge key={k} variant="outline" className="text-[10px] font-normal">
                                    {permLabel(k)}
                                  </Badge>
                                ))}
                                {permKeys.length > 6 && (
                                  <Badge variant="outline" className="text-[10px]">+{permKeys.length - 6} more</Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default OrgStructure;
