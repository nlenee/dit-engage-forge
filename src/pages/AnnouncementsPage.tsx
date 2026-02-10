import { useState } from "react";
import { Megaphone, Plus, Trash2, Loader2, Send } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useAnnouncements } from "@/hooks/useAnnouncements";

const FACTIONS = [
  { value: "SHI", label: "Secured Health Initiative" },
  { value: "TECK", label: "Technology" },
  { value: "MINDUP", label: "Mind Up" },
  { value: "DYP", label: "Discover Your Purpose" },
];

export default function AnnouncementsPage() {
  const { isAdminOrES, userRole } = useAuth();
  const { announcements, isLoading, createAnnouncement, deleteAnnouncement } = useAnnouncements();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState("all");
  const [targetId, setTargetId] = useState("");

  const handleCreate = async () => {
    await createAnnouncement.mutateAsync({
      title,
      message,
      target_type: targetType,
      target_id: targetType !== "all" ? targetId : undefined,
    });
    setTitle("");
    setMessage("");
    setTargetType("all");
    setTargetId("");
    setOpen(false);
  };

  // Filter announcements based on user's role and faction
  const visibleAnnouncements = announcements.filter((a) => {
    if (a.target_type === "all") return true;
    if (a.target_type === "role" && a.target_id === userRole) return true;
    // For faction-targeted, we'd need user's faction - show all for admin
    if (isAdminOrES) return true;
    return a.target_type === "faction"; // show faction announcements to all for now
  });

  const getTargetLabel = (type: string, id: string | null) => {
    if (type === "all") return "All Members";
    if (type === "faction") {
      const faction = FACTIONS.find((f) => f.value === id);
      return faction ? faction.label : id || "Unknown";
    }
    if (type === "role") return id || "Unknown Role";
    return type;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-3">
              <Megaphone className="h-8 w-8 text-primary" />
              Announcements
            </h1>
            <p className="text-muted-foreground mt-1">Stay updated with community news</p>
          </div>

          {isAdminOrES && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Announcement
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Announcement</DialogTitle>
                  <DialogDescription>Post a new announcement to the community.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your announcement..." rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Select value={targetType} onValueChange={(v) => { setTargetType(v); setTargetId(""); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Members</SelectItem>
                        <SelectItem value="faction">Specific Faction</SelectItem>
                        <SelectItem value="role">Specific Role</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {targetType === "faction" && (
                    <div className="space-y-2">
                      <Label>Select Faction</Label>
                      <Select value={targetId} onValueChange={setTargetId}>
                        <SelectTrigger><SelectValue placeholder="Choose faction" /></SelectTrigger>
                        <SelectContent>
                          {FACTIONS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {targetType === "role" && (
                    <div className="space-y-2">
                      <Label>Select Role</Label>
                      <Select value={targetId} onValueChange={setTargetId}>
                        <SelectTrigger><SelectValue placeholder="Choose role" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Member</SelectItem>
                          <SelectItem value="executive_secretary">Executive Secretary</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={!title || !message || createAnnouncement.isPending} className="gap-2">
                    {createAnnouncement.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Post Announcement
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : visibleAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No announcements yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {visibleAnnouncements.map((a) => (
              <Card key={a.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{a.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{getTargetLabel(a.target_type, a.target_id)}</Badge>
                        <span>{format(new Date(a.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                      </CardDescription>
                    </div>
                    {isAdminOrES && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAnnouncement.mutate(a.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">{a.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
