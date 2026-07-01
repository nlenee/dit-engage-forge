import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PERMISSION_CATALOG, FACTIONS } from "@/lib/permissions";
import { Plus, Sparkles, Trash2, Loader2, Briefcase, UserPlus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Office { id: string; code: string; title: string; description: string | null; kpis: any; faction: string | null; }
interface Member { user_id: string; full_name: string | null; faction: string | null; }

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,60);

export default function OfficesManager() {
  const { toast } = useToast();
  const [offices, setOffices] = useState<Office[]>([]);
  const [perms, setPerms] = useState<Record<string, string[]>>({});
  const [assigns, setAssigns] = useState<Record<string, Array<{ user_id: string; full_name: string | null }>>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [openAssign, setOpenAssign] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [o, p, a, m] = await Promise.all([
      supabase.from("offices").select("*").order("created_at", { ascending: false }),
      supabase.from("office_permissions").select("office_id, permission_key"),
      supabase.from("office_assignments").select("office_id, user_id"),
      supabase.from("profiles").select("user_id, full_name, faction").eq("profile_completed", true),
    ]);
    setOffices((o.data as any) || []);
    const permMap: Record<string,string[]> = {};
    (p.data || []).forEach((r: any) => { (permMap[r.office_id] ||= []).push(r.permission_key); });
    setPerms(permMap);
    const memberMap = new Map((m.data || []).map((x: any) => [x.user_id, x]));
    setMembers((m.data as any) || []);
    const assignMap: Record<string, Array<{ user_id: string; full_name: string | null }>> = {};
    (a.data || []).forEach((r: any) => {
      const mem: any = memberMap.get(r.user_id);
      (assignMap[r.office_id] ||= []).push({ user_id: r.user_id, full_name: mem?.full_name || null });
    });
    setAssigns(assignMap);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const removeOffice = async (id: string) => {
    if (!confirm("Delete this office and remove all its assignments?")) return;
    const { error } = await supabase.from("offices").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Office deleted" });
    load();
  };

  const removeAssignment = async (office_id: string, user_id: string) => {
    await supabase.from("office_assignments").delete().eq("office_id", office_id).eq("user_id", user_id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Offices & Access</h3>
          <p className="text-sm text-muted-foreground">Create offices, assign members, grant capabilities.</p>
        </div>
        <Button onClick={() => setOpenCreate(true)}><Plus className="w-4 h-4 mr-1"/> New Office</Button>
      </div>

      {loading ? (
        <div className="p-8 text-center"><Loader2 className="animate-spin inline"/></div>
      ) : offices.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">No offices yet. Create one to grant scoped access to members.</Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {offices.map(o => (
            <Card key={o.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary"/>
                    <h4 className="font-semibold">{o.title}</h4>
                  </div>
                  {o.faction && <div className="text-xs text-muted-foreground">Faction: {o.faction}</div>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeOffice(o.id)}><Trash2 className="w-4 h-4"/></Button>
              </div>
              {o.description && <p className="text-sm text-muted-foreground">{o.description}</p>}
              {Array.isArray(o.kpis) && o.kpis.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-1">KPIs</div>
                  <ul className="list-disc pl-5 text-xs space-y-0.5">{o.kpis.map((k: string, i: number) => <li key={i}>{k}</li>)}</ul>
                </div>
              )}
              <div>
                <div className="text-xs font-medium mb-1">Access</div>
                <div className="flex flex-wrap gap-1">
                  {(perms[o.id] || []).map(p => <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>)}
                  {(perms[o.id] || []).length === 0 && <span className="text-xs text-muted-foreground">No permissions granted</span>}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-medium">Occupants</div>
                  <Button size="sm" variant="ghost" onClick={() => setOpenAssign(o.id)}><UserPlus className="w-3 h-3 mr-1"/>Assign</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(assigns[o.id] || []).map(u => (
                    <Badge key={u.user_id} variant="outline" className="gap-1">
                      {u.full_name || u.user_id.slice(0,8)}
                      <button onClick={() => removeAssignment(o.id, u.user_id)}><X className="w-3 h-3"/></button>
                    </Badge>
                  ))}
                  {(assigns[o.id] || []).length === 0 && <span className="text-xs text-muted-foreground">Vacant</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateOfficeDialog open={openCreate} onOpenChange={setOpenCreate} onCreated={load} />
      <AssignDialog officeId={openAssign} onClose={() => setOpenAssign(null)} members={members} onAssigned={load} />
    </div>
  );
}

function CreateOfficeDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kpisText, setKpisText] = useState("");
  const [faction, setFaction] = useState<string>("none");
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [aiBusy, setAiBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const runAI = async () => {
    if (!title.trim()) return toast({ title: "Enter a title first", variant: "destructive" });
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("office-assist", {
        body: { title, intent: description, faction: faction === "none" ? null : faction },
      });
      if (error || (data as any)?.error) throw new Error(error?.message || (data as any)?.error);
      const r = data as any;
      if (r.description) setDescription(r.description);
      if (Array.isArray(r.kpis)) setKpisText(r.kpis.join("\n"));
      if (Array.isArray(r.permissions)) setSelectedPerms(new Set(r.permissions));
      toast({ title: "AI draft ready", description: "Review and edit before saving." });
    } catch (e: any) {
      toast({ title: "AI assist failed", description: e.message, variant: "destructive" });
    } finally { setAiBusy(false); }
  };

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const kpis = kpisText.split("\n").map(s => s.trim()).filter(Boolean);
      const { data: created, error } = await supabase.from("offices").insert({
        code: slugify(title) + "-" + Math.random().toString(36).slice(2,6),
        title, description: description || null, kpis, faction: faction === "none" ? null : faction,
        created_by: user.user?.id,
      }).select().single();
      if (error) throw error;
      if (selectedPerms.size > 0) {
        await supabase.from("office_permissions").insert(
          Array.from(selectedPerms).map(k => ({ office_id: created.id, permission_key: k }))
        );
      }
      toast({ title: "Office created" });
      setTitle(""); setDescription(""); setKpisText(""); setFaction("none"); setSelectedPerms(new Set());
      onOpenChange(false); onCreated();
    } catch (e: any) {
      toast({ title: "Create failed", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const grouped = PERMISSION_CATALOG.reduce<Record<string, typeof PERMISSION_CATALOG>>((acc, p) => {
    (acc[p.group] ||= []).push(p); return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Office</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Head of Media"/>
          </div>
          <div>
            <Label>Faction (optional)</Label>
            <Select value={faction} onValueChange={setFaction}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Organization-wide</SelectItem>
                {FACTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={runAI} disabled={aiBusy}>
              {aiBusy ? <Loader2 className="w-4 h-4 mr-1 animate-spin"/> : <Sparkles className="w-4 h-4 mr-1"/>}
              AI Assist
            </Button>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}/>
          </div>
          <div>
            <Label>KPIs (one per line)</Label>
            <Textarea value={kpisText} onChange={e => setKpisText(e.target.value)} rows={4}/>
          </div>
          <div>
            <Label>Permissions</Label>
            <div className="mt-2 space-y-3">
              {Object.entries(grouped).map(([group, list]) => (
                <div key={group}>
                  <div className="text-xs font-medium text-muted-foreground mb-1">{group}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {list.map(p => (
                      <label key={p.key} className="flex items-start gap-2 text-sm">
                        <Checkbox
                          checked={selectedPerms.has(p.key)}
                          onCheckedChange={(v) => {
                            const next = new Set(selectedPerms);
                            v ? next.add(p.key) : next.delete(p.key);
                            setSelectedPerms(next);
                          }}
                        />
                        <div>
                          <div className="font-medium">{p.label}</div>
                          <div className="text-xs text-muted-foreground">{p.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !title.trim()}>
            {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin"/>}Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignDialog({ officeId, onClose, members, onAssigned }: { officeId: string | null; onClose: () => void; members: Member[]; onAssigned: () => void }) {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const filtered = members.filter(m => (m.full_name || "").toLowerCase().includes(q.toLowerCase())).slice(0, 40);

  const assign = async (user_id: string) => {
    if (!officeId) return;
    setSaving(true);
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase.from("office_assignments").insert({ office_id: officeId, user_id, assigned_by: user.user?.id });
    setSaving(false);
    if (error) return toast({ title: "Assign failed", description: error.message, variant: "destructive" });
    toast({ title: "Assigned" }); onAssigned(); onClose();
  };

  return (
    <Dialog open={!!officeId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign a member</DialogTitle></DialogHeader>
        <Input placeholder="Search members…" value={q} onChange={e => setQ(e.target.value)}/>
        <div className="max-h-80 overflow-y-auto divide-y">
          {filtered.map(m => (
            <button
              key={m.user_id}
              disabled={saving}
              onClick={() => assign(m.user_id)}
              className="w-full text-left py-2 px-1 hover:bg-muted/40 flex items-center justify-between"
            >
              <span>{m.full_name || m.user_id.slice(0,8)}</span>
              <span className="text-xs text-muted-foreground">{m.faction || ""}</span>
            </button>
          ))}
          {filtered.length === 0 && <div className="text-sm text-muted-foreground py-4">No matches.</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}