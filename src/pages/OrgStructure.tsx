import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Building2, ShieldCheck, User2 } from "lucide-react";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { factionColor, PERMISSION_CATALOG } from "@/lib/permissions";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown } from "lucide-react";

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
  const [activeTier, setActiveTier] = useState("boe");
  const [search, setSearch] = useState("");
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
  const visibleTiers = search.trim() ? TIERS : TIERS.filter(t => t.key === activeTier);

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
          <div className="space-y-6">
            <nav aria-label="Organizational tiers" className="rounded-xl border bg-card p-4 sm:p-6">
              <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">Leadership hierarchy</p>
              <div className="mx-auto mt-4 flex max-w-md flex-col items-center gap-2">
                {TIERS.map((tier, index) => <div key={tier.key} className="w-full">
                  {index > 0 && <ChevronDown className="mx-auto my-1 h-5 w-5 text-muted-foreground" aria-hidden="true" />}
                  <button type="button" onClick={() => {setActiveTier(tier.key); setSearch("");}} className={`w-full rounded-xl border px-4 py-3 text-center transition-colors focus-visible:outline focus-visible:outline-2 ${activeTier === tier.key ? "border-primary bg-primary/10" : "bg-background hover:bg-muted"}`}>
                    <span className="block text-xs text-muted-foreground">Tier {index + 1} · {offices.filter(o => (o.tier || "faction_level") === tier.key).length} offices</span>
                    <span className="block font-semibold">{tier.label}</span>
                    <span className="block text-xs text-muted-foreground">{tier.caption}</span>
                  </button>
                </div>)}
              </div>
            </nav>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div role="group" aria-label="Browse leadership tier" className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-muted/60 p-1">
                {TIERS.map(t => <button type="button" key={t.key} aria-pressed={activeTier === t.key} onClick={() => {setActiveTier(t.key); setSearch("");}} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${activeTier === t.key ? "bg-primary text-primary-foreground" : "hover:bg-background"}`}>{t.label}</button>)}
              </div>
              <div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" aria-label="Find office or holder" placeholder="Search office or holder…" value={search} onChange={e => setSearch(e.target.value)} /></div>
            </div>
            {visibleTiers.map((tier) => {
              const term = search.trim().toLowerCase();
              const list = offices.filter(o => (o.tier || "faction_level") === tier.key).filter(o => !term ||
                o.title.toLowerCase().includes(term) || (o.abbreviation || "").toLowerCase().includes(term) ||
                (data?.holders?.[o.id] || []).some((h: any) => (h.profile?.full_name || "").toLowerCase().includes(term)));
              if (!list.length) return null;
              return (
                <section key={tier.key}>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                    <h2 className="font-display text-xl font-semibold">{tier.label}</h2>
                    <span className="text-xs text-muted-foreground">{tier.caption}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{list.length} offices</span>
                  </div>
                  <div className="grid gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((office) => {
                      const holders = data?.holders?.[office.id] || [];
                      const permKeys = data?.perms?.[office.id] || [];
                      const color = factionColor(office.faction, office.tier);
                      return (
                        <Card key={office.id} className="p-3 sm:p-4 space-y-2 sm:space-y-3 border-l-4" style={{ borderLeftColor: color }}>
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
                                    <span className="min-w-0 break-words">{h.profile?.full_name || "Member"}</span>
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
                              <details className="group">
                                <summary className="cursor-pointer list-none rounded-md border px-3 py-2 text-xs font-medium text-primary focus-visible:outline focus-visible:outline-2">
                                  View {permKeys.length} access {permKeys.length === 1 ? "right" : "rights"} <span className="text-muted-foreground group-open:hidden">▾</span><span className="hidden text-muted-foreground group-open:inline">▴</span>
                                </summary>
                                <div className="mt-2 flex flex-wrap gap-1.5" aria-label={`Permissions for ${office.title}`}>
                                  {permKeys.map(k => <Badge key={k} variant="outline" className="max-w-full whitespace-normal break-words text-[11px] font-normal">{permLabel(k)}</Badge>)}
                                </div>
                              </details>
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
