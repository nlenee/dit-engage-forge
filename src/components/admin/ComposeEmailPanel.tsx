import { Fragment, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Mail,
  Users,
  Layers,
  AtSign,
  Clock,
  Send,
  Loader2,
  Check,
  X,
  CalendarIcon,
  History,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useFactions } from "@/hooks/useFactions";
import { useInternalEmails, useEmailRecipients } from "@/hooks/useInternalEmails";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const parseList = (raw: string) =>
  raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

const splitValid = (raw: string) => {
  const all = parseList(raw);
  return {
    valid: all.filter((e) => EMAIL_RE.test(e)),
    invalid: all.filter((e) => !EMAIL_RE.test(e)),
  };
};

const MODES = [
  { id: "individuals", label: "Individuals", icon: Users },
  { id: "group", label: "Ad hoc group", icon: Users },
  { id: "faction", label: "Faction", icon: Layers },
  { id: "raw", label: "Raw addresses", icon: AtSign },
] as const;

export default function ComposeEmailPanel() {
  const { factions, memberProfiles, membersLoading } = useFactions();
  const { emails, isLoading: historyLoading, sendEmail, cancelEmail } = useInternalEmails();

  const [modes, setModes] = useState<string[]>(["individuals"]);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedFaction, setSelectedFaction] = useState<string>("");
  const [rawTo, setRawTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduleOn, setScheduleOn] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("09:00");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: recipients = [] } = useEmailRecipients(expanded);

  const toggleMode = (id: string) =>
    setModes((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

  const memberOptions = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    const withEmail = memberProfiles.filter((m) => !!m.email);
    if (!q) return withEmail.slice(0, 20);
    return withEmail
      .filter(
        (m) =>
          (m.full_name || "").toLowerCase().includes(q) ||
          (m.email || "").toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [memberProfiles, memberSearch]);

  const usesMembers = modes.includes("individuals") || modes.includes("group");

  // Resolved recipient preview — computed live from current faction membership.
  const resolved = useMemo(() => {
    const map = new Map<string, { email: string; name: string; source: string }>();
    if (usesMembers) {
      memberProfiles
        .filter((m) => selectedMembers.includes(m.id) && m.email)
        .forEach((m) => map.set(m.email!.toLowerCase(), { email: m.email!, name: m.full_name, source: "member" }));
    }
    if (modes.includes("faction") && selectedFaction) {
      memberProfiles
        .filter((m) => m.faction_id === selectedFaction && m.email)
        .forEach((m) => map.set(m.email!.toLowerCase(), { email: m.email!, name: m.full_name, source: "faction" }));
    }
    if (modes.includes("raw")) {
      splitValid(rawTo).valid.forEach((e) =>
        map.set(e.toLowerCase(), { email: e, name: e, source: "raw" }),
      );
    }
    return Array.from(map.values());
  }, [usesMembers, modes, memberProfiles, selectedMembers, selectedFaction, rawTo]);

  const rawInvalid = modes.includes("raw") ? splitValid(rawTo).invalid : [];
  const ccParsed = splitValid(cc);
  const bccParsed = splitValid(bcc);
  const invalidAll = [...rawInvalid, ...ccParsed.invalid, ...bccParsed.invalid];

  const scheduledAt = useMemo(() => {
    if (!scheduleOn || !date) return null;
    const [h, m] = time.split(":").map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d;
  }, [scheduleOn, date, time]);

  const groupModeInvalid = modes.includes("group") && selectedMembers.length < 2;

  const canSend =
    subject.trim().length > 0 &&
    body.replace(/<[^>]*>/g, "").trim().length > 0 &&
    resolved.length > 0 &&
    invalidAll.length === 0 &&
    !groupModeInvalid &&
    (!scheduleOn || (!!scheduledAt && scheduledAt.getTime() > Date.now())) &&
    !sendEmail.isPending;

  const handleSend = async () => {
    await sendEmail.mutateAsync({
      subject: subject.trim(),
      bodyHtml: body,
      modes,
      memberIds: usesMembers ? selectedMembers : [],
      factionIds: modes.includes("faction") && selectedFaction ? [selectedFaction] : [],
      rawToEmails: modes.includes("raw") ? splitValid(rawTo).valid : [],
      ccEmails: ccParsed.valid,
      bccEmails: bccParsed.valid,
      scheduledAt,
    });
    setSubject("");
    setBody("");
    setSelectedMembers([]);
    setRawTo("");
    setCc("");
    setBcc("");
    setScheduleOn(false);
    setDate(undefined);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      sent: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
      pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
      sending: "bg-blue-500/10 text-blue-600 border-blue-500/30",
      failed: "bg-destructive/10 text-destructive border-destructive/30",
      cancelled: "bg-muted text-muted-foreground border-border",
    };
    return (
      <Badge variant="outline" className={cn("capitalize", map[status] || "")}>
        {status}
      </Badge>
    );
  };

  return (
    <Tabs defaultValue="compose" className="space-y-4">
      <TabsList>
        <TabsTrigger value="compose" className="gap-2">
          <Mail className="h-4 w-4" /> Compose
        </TabsTrigger>
        <TabsTrigger value="history" className="gap-2">
          <History className="h-4 w-4" /> Sent & Scheduled
        </TabsTrigger>
      </TabsList>

      <TabsContent value="compose">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5 rounded-xl border border-border/50 bg-card p-5 shadow-soft">
            {/* Mode selector */}
            <div className="space-y-2">
              <Label>Recipient modes (combinable)</Label>
              <div className="flex flex-wrap gap-2">
                {MODES.map((m) => (
                  <Button
                    key={m.id}
                    type="button"
                    size="sm"
                    variant={modes.includes(m.id) ? "default" : "outline"}
                    className="gap-2"
                    onClick={() => toggleMode(m.id)}
                  >
                    <m.icon className="h-4 w-4" />
                    {m.label}
                  </Button>
                ))}
              </div>
            </div>

            {usesMembers && (
              <div className="space-y-2">
                <Label htmlFor="member-search">
                  Members {modes.includes("group") && <span className="text-muted-foreground">(select 2 or more)</span>}
                </Label>
                <Input
                  id="member-search"
                  placeholder="Type a name or email..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
                {membersLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded-md border border-border/50 divide-y divide-border/50">
                    {memberOptions.map((m) => {
                      const active = selectedMembers.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            setSelectedMembers((prev) =>
                              active ? prev.filter((x) => x !== m.id) : [...prev, m.id],
                            )
                          }
                          className={cn(
                            "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent/50",
                            active && "bg-accent/60",
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{m.full_name || "Unnamed"}</span>
                            <span className="block truncate text-xs text-muted-foreground">{m.email}</span>
                          </span>
                          {active && <Check className="h-4 w-4 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                    {memberOptions.length === 0 && (
                      <p className="p-3 text-sm text-muted-foreground">No matches.</p>
                    )}
                  </div>
                )}
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {memberProfiles
                      .filter((m) => selectedMembers.includes(m.id))
                      .map((m) => (
                        <Badge key={m.id} variant="secondary" className="gap-1 font-normal">
                          {m.full_name || m.email}
                          <button
                            type="button"
                            onClick={() => setSelectedMembers((p) => p.filter((x) => x !== m.id))}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                  </div>
                )}
                {groupModeInvalid && (
                  <p className="text-xs text-destructive">Ad hoc group needs at least 2 members.</p>
                )}
              </div>
            )}

            {modes.includes("faction") && (
              <div className="space-y-2">
                <Label>Faction</Label>
                <Select value={selectedFaction} onValueChange={setSelectedFaction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a faction" />
                  </SelectTrigger>
                  <SelectContent>
                    {factions.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Membership is resolved again at send time, so late joiners are included.
                </p>
              </div>
            )}

            {modes.includes("raw") && (
              <div className="space-y-2">
                <Label htmlFor="raw-to">External addresses</Label>
                <Textarea
                  id="raw-to"
                  rows={2}
                  placeholder="person@example.com, another@example.com"
                  value={rawTo}
                  onChange={(e) => setRawTo(e.target.value)}
                />
                {rawInvalid.length > 0 && (
                  <p className="text-xs text-destructive">Invalid: {rawInvalid.join(", ")}</p>
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cc">Cc (optional)</Label>
                <Input id="cc" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="comma separated" />
                {ccParsed.invalid.length > 0 && (
                  <p className="text-xs text-destructive">Invalid: {ccParsed.invalid.join(", ")}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bcc">Bcc (optional)</Label>
                <Input id="bcc" value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="comma separated" />
                {bccParsed.invalid.length > 0 && (
                  <p className="text-xs text-destructive">Invalid: {bccParsed.invalid.join(", ")}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <RichTextEditor value={body} onChange={setBody} placeholder="Write your message..." />
            </div>

            <div className="space-y-3 rounded-lg border border-border/50 p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="schedule" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Schedule for later
                </Label>
                <Switch id="schedule" checked={scheduleOn} onCheckedChange={setScheduleOn} />
              </div>
              {scheduleOn && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                  {scheduledAt && (
                    <p className="sm:col-span-2 text-xs text-muted-foreground">
                      Sends {format(scheduledAt, "PPPP 'at' p")} ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Preview column */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border/50 bg-card p-4 shadow-soft">
              <p className="text-sm font-semibold text-foreground">Resolved recipients</p>
              <p className="mt-1 text-3xl font-bold text-primary">{resolved.length}</p>
              <p className="text-xs text-muted-foreground">
                {ccParsed.valid.length} Cc · {bccParsed.valid.length} Bcc
              </p>
              <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
                {resolved.slice(0, 60).map((r) => (
                  <div key={r.email} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-foreground">{r.name}</span>
                    <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
                      {r.source}
                    </Badge>
                  </div>
                ))}
                {resolved.length > 60 && (
                  <p className="text-xs text-muted-foreground">+{resolved.length - 60} more</p>
                )}
                {resolved.length === 0 && (
                  <p className="text-xs text-muted-foreground">Pick recipients to see a preview.</p>
                )}
              </div>
            </div>
            <Button className="w-full gap-2" disabled={!canSend} onClick={handleSend}>
              {sendEmail.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {scheduleOn ? "Schedule email" : "Send now"}
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="history">
        <div className="rounded-xl border border-border/50 bg-card shadow-soft overflow-hidden">
          {historyLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.map((e) => (
                  <Fragment key={e.id}>
                    <TableRow>
                      <TableCell className="font-medium max-w-[240px] truncate">{e.subject}</TableCell>
                      <TableCell>
                        {e.recipient_count}
                        {e.status === "sent" && (
                          <span className="text-xs text-muted-foreground"> ({e.sent_count} ok / {e.failed_count} failed)</span>
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(e.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {e.scheduled_at && e.status === "pending"
                          ? `Scheduled ${format(new Date(e.scheduled_at), "PPp")}`
                          : format(new Date(e.sent_at || e.created_at), "PPp")}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                        >
                          {expanded === e.id ? "Hide" : "Details"}
                        </Button>
                        {e.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive gap-1"
                            onClick={() => cancelEmail.mutate(e.id)}
                          >
                            <Ban className="h-3.5 w-3.5" /> Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {expanded === e.id && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted/30">
                          <div className="max-h-64 overflow-y-auto space-y-1">
                            {recipients.map((r) => (
                              <div key={r.id} className="flex flex-wrap items-center gap-2 text-xs">
                                <Badge variant="outline" className="uppercase text-[10px]">{r.field}</Badge>
                                <span className="text-foreground">{r.recipient_email}</span>
                                <Badge variant="outline" className="text-[10px] capitalize">{r.source}</Badge>
                                <span
                                  className={cn(
                                    "capitalize",
                                    r.status === "sent" ? "text-emerald-600" : r.status === "failed" ? "text-destructive" : "text-muted-foreground",
                                  )}
                                >
                                  {r.status}
                                </span>
                                {r.error_message && (
                                  <span className="text-destructive">{r.error_message}</span>
                                )}
                              </div>
                            ))}
                            {recipients.length === 0 && (
                              <p className="text-xs text-muted-foreground">No recipient records.</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
                {emails.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No emails yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}