import { useMemo, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, Users, UserMinus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFactions, type Faction } from "@/hooks/useFactions";
import { useAuth } from "@/hooks/useAuth";

const UNASSIGNED = "__none__";

export default function FactionsManager() {
  const { isAdmin } = useAuth();
  const {
    factions,
    factionsLoading,
    memberProfiles,
    membersLoading,
    createFaction,
    updateFaction,
    deleteFaction,
    assignMember,
  } = useFactions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Faction | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Faction | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ code: "", name: "", description: "", color: "#143352" });

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    memberProfiles.forEach((m) => {
      if (m.faction_id) map[m.faction_id] = (map[m.faction_id] || 0) + 1;
    });
    return map;
  }, [memberProfiles]);

  const unassigned = useMemo(
    () => memberProfiles.filter((m) => !m.faction_id),
    [memberProfiles],
  );

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return memberProfiles;
    return memberProfiles.filter(
      (m) =>
        (m.full_name || "").toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q),
    );
  }, [memberProfiles, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: "", name: "", description: "", color: "#143352" });
    setDialogOpen(true);
  };

  const openEdit = (f: Faction) => {
    setEditing(f);
    setForm({
      code: f.code,
      name: f.name,
      description: f.description || "",
      color: f.color || "#143352",
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!form.code.trim() || !form.name.trim()) return;
    if (editing) {
      await updateFaction.mutateAsync({
        id: editing.id,
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        color: form.color,
      });
    } else {
      await createFaction.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  if (factionsLoading || membersLoading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Factions
          </h2>
          <p className="text-sm text-muted-foreground">
            Groups members belong to. Membership is optional — a member can have no faction.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> New Faction
          </Button>
        )}
      </div>

      {/* Faction cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {factions.map((f) => (
          <div
            key={f.id}
            className="rounded-xl border border-border/50 bg-card p-4 shadow-soft space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: f.color || "hsl(var(--primary))" }}
                />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.code}</p>
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(f)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setConfirmDelete(f)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {f.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{f.description}</p>
            )}
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {counts[f.id] || 0} member{(counts[f.id] || 0) === 1 ? "" : "s"}
            </Badge>
          </div>
        ))}
        {factions.length === 0 && (
          <p className="text-sm text-muted-foreground">No factions yet.</p>
        )}
      </div>

      {/* Unassigned */}
      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-soft">
        <div className="flex items-center gap-2 mb-3">
          <UserMinus className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Unassigned members</h3>
          <Badge variant="outline">{unassigned.length}</Badge>
        </div>
        {unassigned.length === 0 ? (
          <p className="text-sm text-muted-foreground">Everyone belongs to a faction.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {unassigned.slice(0, 40).map((m) => (
              <Badge key={m.id} variant="secondary" className="font-normal">
                {m.full_name || m.email}
              </Badge>
            ))}
            {unassigned.length > 40 && (
              <span className="text-xs text-muted-foreground self-center">
                +{unassigned.length - 40} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Assignment table */}
      <div className="rounded-xl border border-border/50 bg-card shadow-soft overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <Input
            placeholder="Search members by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-[480px] overflow-y-auto divide-y divide-border/50">
          {filteredMembers.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {m.full_name || "Unnamed"}
                  {m.executive_role_abbr && (
                    <Badge variant="outline" className="ml-2 text-[10px]">
                      {m.executive_role_abbr}
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground truncate">{m.email}</p>
              </div>
              <Select
                value={m.faction_id ?? UNASSIGNED}
                disabled={!isAdmin || assignMember.isPending}
                onValueChange={(v) =>
                  assignMember.mutate({
                    profileId: m.id,
                    factionId: v === UNASSIGNED ? null : v,
                  })
                }
              >
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="No faction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>No faction</SelectItem>
                  {factions.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          {filteredMembers.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">No members found.</p>
          )}
        </div>
      </div>

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit faction" : "New faction"}</DialogTitle>
            <DialogDescription>
              Factions group members into units. Codes are short and unique (e.g. SHI).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="faction-name">Name</Label>
              <Input
                id="faction-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-4">
              <div className="grid gap-2">
                <Label htmlFor="faction-code">Code</Label>
                <Input
                  id="faction-code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="faction-color">Colour</Label>
                <Input
                  id="faction-color"
                  type="color"
                  className="h-10 w-16 p-1"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="faction-desc">Description</Label>
              <Textarea
                id="faction-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={!form.name.trim() || !form.code.trim() || createFaction.isPending || updateFaction.isPending}
            >
              {editing ? "Save changes" : "Create faction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Members currently in this faction become unassigned. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (confirmDelete) await deleteFaction.mutateAsync(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}