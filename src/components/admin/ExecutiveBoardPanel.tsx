import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PERMISSION_CATALOG, factionColor } from "@/lib/permissions";
import { Crown, Users, UserPlus, Search } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface OfficeRow {
  id: string;
  code: string;
  title: string;
  abbreviation: string | null;
  tier: string | null;
  faction: string | null;
}
interface AssignmentRow {
  office_id: string;
  user_id: string;
  assigned_at: string;
  is_active: boolean;
}
interface ProfileRow {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  headshot_url: string | null;
  faction: string | null;
  executive_role: string | null;
}

const EXEC_PERMS = PERMISSION_CATALOG.filter(p =>
  ["view_all_members","edit_members","approve_members","manage_roles","view_financials",
   "edit_financials","view_programs","edit_programs","manage_escalations","view_reports",
   "export_data","manage_events","send_announcements","view_executive_system",
   "manage_succession","approve_annual_plans","manage_faction_shi","manage_faction_dyp",
   "manage_faction_teck","manage_faction_mindup"].includes(p.key)
);

export default function ExecutiveBoardPanel() {
  const [offices, setOffices] = useState<OfficeRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileRow>>(new Map());
  const [officePerms, setOfficePerms] = useState<Map<string, string[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [appointOffice, setAppointOffice] = useState<OfficeRow | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: offs }, { data: asns }, { data: profs }, { data: perms }] = await Promise.all([
      supabase.from("offices").select("id, code, title, abbreviation, tier, faction").order("tier"),
      supabase.from("office_assignments" as any).select("office_id, user_id, assigned_at, is_active"),
      supabase.from("profiles").select("user_id, full_name, avatar_url, headshot_url, faction, executive_role"),
      supabase.from("office_permissions").select("office_id, permission_key"),
    ]);
    setOffices((offs as OfficeRow[]) || []);
    setAssignments(((asns as any[]) || []).filter(a => a.is_active !== false));
    setProfiles(new Map(((profs as ProfileRow[]) || []).map(p => [p.user_id, p])));
    const permMap = new Map<string, string[]>();
    ((perms as any[]) || []).forEach(p => {
      const arr = permMap.get(p.office_id) || [];
      arr.push(p.permission_key);
      permMap.set(p.office_id, arr);
    });
    setOfficePerms(permMap);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const officeOccupants = useMemo(() => {
    const m = new Map<string, AssignmentRow[]>();
    assignments.forEach(a => {
      const arr = m.get(a.office_id) || [];
      arr.push(a);
      m.set(a.office_id, arr);
    });
    return m;
  }, [assignments]);

  const tierGroups = useMemo(() => ({
    boe: offices.filter(o => o.tier === "boe"),
    faction_ed: offices.filter(o => o.tier === "faction_ed"),
    faction_level: offices.filter(o => o.tier === "faction_level"),
  }), [offices]);

  if (loading) return <div className="p-6 text-muted-foreground">Loading executive board…</div>;

  const renderCard = (o: OfficeRow) => {
    const occ = officeOccupants.get(o.id) || [];
    const color = factionColor(o.faction, o.tier);
    const perms = officePerms.get(o.id) || [];
    const lastAssigned = occ.length ? occ.map(a => a.assigned_at).sort().pop() : null;
    return (
      <Card key={o.id} className="p-4 space-y-3 border-l-4" style={{ borderLeftColor: color }}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Crown className="w-4 h-4 shrink-0" style={{ color }} />
              <h4 className="font-semibold text-sm">{o.title}</h4>
              {o.abbreviation && (
                <Badge variant="outline" className="text-[10px]" style={{ borderColor: color, color }}>
                  {o.abbreviation}
                </Badge>
              )}
            </div>
            {o.faction && <div className="text-xs text-muted-foreground mt-1">Faction: {o.faction}</div>}
            {lastAssigned && (
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Last appointment: {format(new Date(lastAssigned), "MMM d, yyyy")}
              </div>
            )}
          </div>
          <Badge variant={occ.length ? "default" : "outline"}>
            {occ.length ? `${occ.length} occupant${occ.length > 1 ? "s" : ""}` : "Vacant"}
          </Badge>
        </div>

        {occ.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {occ.map(a => {
              const p = profiles.get(a.user_id);
              const av = p?.headshot_url || p?.avatar_url;
              return (
                <div key={a.user_id} className="flex items-center gap-2 bg-muted/40 rounded-full pl-1 pr-3 py-1 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium overflow-hidden">
                    {av ? <img src={av} alt="" className="w-full h-full object-cover" /> : (p?.full_name?.[0] || "?")}
                  </div>
                  <span>{p?.full_name || "Unnamed"}</span>
                </div>
              );
            })}
          </div>
        )}

        {perms.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Users className="w-3 h-3" /> Access
            </div>
            <div className="flex flex-wrap gap-1">
              {perms.slice(0, 6).map(p => (
                <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
              ))}
              {perms.length > 6 && <Badge variant="secondary" className="text-[10px]">+{perms.length - 6}</Badge>}
            </div>
          </div>
        )}

        <Button size="sm" variant="outline" className="w-full" onClick={() => setAppointOffice(o)}>
          <UserPlus className="w-3.5 h-3.5 mr-1" /> Appoint / Change
        </Button>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold mb-3">Tier 1 — Board of Executives</h3>
        <div className="grid gap-4 md:grid-cols-2">{tierGroups.boe.map(renderCard)}</div>
      </section>
      <section>
        <h3 className="text-lg font-semibold mb-3">Tier 2 — Faction Executive Directors</h3>
        <div className="grid gap-4 md:grid-cols-2">{tierGroups.faction_ed.map(renderCard)}</div>
      </section>
      <section>
        <h3 className="text-lg font-semibold mb-3">Tier 3 — Faction-Level Roles</h3>
        {(["SHI","DYP","TECK","MindUp"] as const).map(f => (
          <div key={f} className="mb-6">
            <div className="text-sm font-medium mb-2" style={{ color: factionColor(f) }}>{f}</div>
            <div className="grid gap-4 md:grid-cols-2">
              {tierGroups.faction_level.filter(o => o.faction === f).map(renderCard)}
            </div>
          </div>
        ))}
      </section>

      {appointOffice && (
        <AppointDialog
          office={appointOffice}
          currentOccupants={officeOccupants.get(appointOffice.id) || []}
          existingPerms={officePerms.get(appointOffice.id) || []}
          onClose={() => setAppointOffice(null)}
          onDone={async () => { setAppointOffice(null); await load(); }}
        />
      )}
    </div>
  );
}

function AppointDialog({
  office, currentOccupants, existingPerms, onClose, onDone,
}: {
  office: OfficeRow;
  currentOccupants: AssignmentRow[];
  existingPerms: string[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [q, setQ] = useState("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [picked, setPicked] = useState<any | null>(null);
  const [perms, setPerms] = useState<string[]>(existingPerms);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      const query = supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, headshot_url, faction, executive_role")
        .not("user_id", "is", null)
        .limit(20);
      const { data } = q
        ? await query.ilike("full_name", `%${q}%`)
        : await query;
      setCandidates(data || []);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const togglePerm = (k: string) =>
    setPerms(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);

  const confirm = async () => {
    if (!picked) return;
    setSaving(true);
    try {
      // Deactivate previous occupants
      const prevUserIds = currentOccupants.map(a => a.user_id);
      if (prevUserIds.length) {
        await (supabase.from("office_assignments" as any) as any)
          .update({ is_active: false })
          .eq("office_id", office.id);
        // Clear their executive_role labels
        await supabase.from("profiles")
          .update({ executive_role: null, executive_role_abbr: null })
          .in("user_id", prevUserIds);
      }
      // Insert new assignment (upsert to be safe against unique constraint)
      const { data: authUser } = await supabase.auth.getUser();
      await (supabase.from("office_assignments" as any) as any).upsert({
        office_id: office.id,
        user_id: picked.user_id,
        assigned_by: authUser.user?.id,
        is_active: true,
        assigned_at: new Date().toISOString(),
      }, { onConflict: "office_id,user_id" });

      // Update new occupant profile
      const profUpdate: any = {
        executive_role: office.title,
        executive_role_abbr: office.abbreviation,
      };
      if (office.faction) profUpdate.faction = office.faction;
      await supabase.from("profiles").update(profUpdate).eq("user_id", picked.user_id);

      // Reset office permissions
      await supabase.from("office_permissions").delete().eq("office_id", office.id);
      if (perms.length) {
        await supabase.from("office_permissions").insert(
          perms.map(p => ({ office_id: office.id, permission_key: p }))
        );
      }

      toast.success(`${picked.full_name} appointed as ${office.title}`);
      onDone();
    } catch (e: any) {
      toast.error(e.message || "Failed to appoint");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Appoint — {office.title}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span className={step >= 1 ? "font-semibold text-foreground" : ""}>1. Select member</span>
          <span>›</span>
          <span className={step >= 2 ? "font-semibold text-foreground" : ""}>2. Permissions</span>
          <span>›</span>
          <span className={step >= 3 ? "font-semibold text-foreground" : ""}>3. Confirm</span>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search members by name…" value={q} onChange={e => setQ(e.target.value)} className="pl-8" />
            </div>
            <div className="max-h-80 overflow-y-auto divide-y">
              {candidates.map(c => (
                <button
                  key={c.user_id}
                  onClick={() => { setPicked(c); setStep(2); }}
                  className="w-full flex items-center gap-3 py-2 px-2 hover:bg-muted/50 text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm overflow-hidden">
                    {c.headshot_url || c.avatar_url
                      ? <img src={c.headshot_url || c.avatar_url} alt="" className="w-full h-full object-cover"/>
                      : (c.full_name?.[0] || "?")}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{c.full_name || "Unnamed"}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.faction || "No faction"} · {c.executive_role || "Member"}
                    </div>
                  </div>
                </button>
              ))}
              {!candidates.length && <div className="p-4 text-sm text-muted-foreground">No matches.</div>}
            </div>
          </div>
        )}

        {step === 2 && picked && (
          <div className="space-y-3">
            <div className="text-sm">Selected: <span className="font-semibold">{picked.full_name}</span></div>
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
              {EXEC_PERMS.map(p => (
                <label key={p.key} className="flex items-start gap-2 p-2 border rounded text-xs cursor-pointer hover:bg-muted/40">
                  <Checkbox checked={perms.includes(p.key)} onCheckedChange={() => togglePerm(p.key)} />
                  <span>
                    <div className="font-medium">{p.label}</div>
                    <div className="text-muted-foreground text-[10px]">{p.description}</div>
                  </span>
                </label>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Next</Button>
            </DialogFooter>
          </div>
        )}

        {step === 3 && picked && (
          <div className="space-y-3">
            <div className="p-3 rounded bg-muted/40 text-sm space-y-1">
              <div><strong>Role:</strong> {office.title} ({office.abbreviation})</div>
              <div><strong>Appointing:</strong> {picked.full_name}</div>
              <div><strong>Permissions:</strong> {perms.length ? perms.join(", ") : "None"}</div>
              {currentOccupants.length > 0 && (
                <div className="text-xs text-amber-600">
                  This will replace {currentOccupants.length} current occupant(s).
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(2)} disabled={saving}>Back</Button>
              <Button onClick={confirm} disabled={saving}>
                {saving ? "Appointing…" : "Confirm Appointment"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}