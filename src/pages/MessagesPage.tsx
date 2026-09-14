import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Inbox, Send, Mail, MailOpen, Search, Loader2, CheckCheck } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMessages, type PlatformMessage } from "@/hooks/useMessages";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/hooks/useAuth";

const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("") || "?";

const MessagesPage = () => {
  const { user } = useAuth();
  const { inbox, sent, unreadCount, isLoading, sendMessage, markRead, markAllRead } = useMessages();
  const { members } = useMembers();

  const [composeOpen, setComposeOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [open, setOpen] = useState<PlatformMessage | null>(null);

  const people = useMemo(
    () =>
      members
        .filter((m) => m.user_id && m.user_id !== user?.id)
        .filter((m) =>
          `${m.full_name} ${m.faction ?? ""} ${m.role_in_dit ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        ),
    [members, search, user?.id],
  );

  const nameOf = (id: string) =>
    members.find((m) => m.user_id === id)?.full_name || "DIT member";
  const roleOf = (id: string) =>
    members.find((m) => m.user_id === id)?.role_in_dit || "Member";

  const resetCompose = () => {
    setRecipientId(null);
    setSubject("");
    setBody("");
    setSearch("");
  };

  const handleSend = async () => {
    if (!recipientId || !body.trim()) return;
    await sendMessage.mutateAsync({ recipient_id: recipientId, subject, body });
    resetCompose();
    setComposeOpen(false);
  };

  const openMessage = (m: PlatformMessage) => {
    setOpen(m);
    if (m.recipient_id === user?.id && !m.read_at) markRead.mutate(m.id);
  };

  const renderList = (list: PlatformMessage[], kind: "inbox" | "sent") => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (!list.length) {
      return (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {kind === "inbox" ? "No messages yet." : "You haven't sent any messages yet."}
        </p>
      );
    }
    return (
      <ul className="divide-y divide-border">
        {list.map((m) => {
          const otherId = kind === "inbox" ? m.sender_id : m.recipient_id;
          const unread = kind === "inbox" && !m.read_at;
          return (
            <li key={m.id}>
              <button
                onClick={() => openMessage(m)}
                className="flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-accent/50 sm:px-4 min-h-[56px]"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initials(nameOf(otherId))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className={`truncate text-sm ${unread ? "font-semibold text-foreground" : "text-foreground/90"}`}>
                      {nameOf(otherId)}
                    </span>
                    <Badge variant="outline" className="text-[10px]">{roleOf(otherId)}</Badge>
                    {unread && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </span>
                  <span className="mt-0.5 block truncate text-sm font-medium">{m.subject}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{m.body}</span>
                </span>
                <span className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-4xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold text-primary sm:text-3xl">Messages</h1>
            <p className="text-sm text-muted-foreground">
              Reach anyone on the platform. They also get an email alert.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
                <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
              </Button>
            )}
            <Dialog
              open={composeOpen}
              onOpenChange={(o) => {
                setComposeOpen(o);
                if (!o) resetCompose();
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Send className="mr-2 h-4 w-4" /> New message
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>New message</DialogTitle>
                  <DialogDescription>Pick a member, then write your message.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search members by name, faction or role"
                      className="pl-9"
                    />
                  </div>
                  <ScrollArea className="h-40 rounded-md border">
                    <ul className="divide-y divide-border">
                      {people.map((m) => (
                        <li key={m.user_id!}>
                          <button
                            onClick={() => setRecipientId(m.user_id!)}
                            className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/50 ${
                              recipientId === m.user_id ? "bg-accent" : ""
                            }`}
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{m.full_name}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {m.role_in_dit}
                                {m.faction ? ` · ${m.faction}` : ""}
                              </span>
                            </span>
                            {recipientId === m.user_id && <Badge className="shrink-0">Selected</Badge>}
                          </button>
                        </li>
                      ))}
                      {!people.length && (
                        <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                          No members match that search.
                        </li>
                      )}
                    </ul>
                  </ScrollArea>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject"
                  />
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your message…"
                    rows={6}
                  />
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    onClick={handleSend}
                    disabled={!recipientId || !body.trim() || sendMessage.isPending}
                    className="w-full sm:w-auto"
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Send message
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your mailbox</CardTitle>
            <CardDescription className="text-xs">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-2">
            <Tabs defaultValue="inbox">
              <TabsList className="mx-3 sm:mx-2">
                <TabsTrigger value="inbox" className="gap-2">
                  <Inbox className="h-4 w-4" /> Inbox
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                      {unreadCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent" className="gap-2">
                  <Send className="h-4 w-4" /> Sent
                </TabsTrigger>
              </TabsList>
              <TabsContent value="inbox">{renderList(inbox, "inbox")}</TabsContent>
              <TabsContent value="sent">{renderList(sent, "sent")}</TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-left text-base">
                  {open.recipient_id === user?.id ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  {open.subject}
                </DialogTitle>
                <DialogDescription className="text-left">
                  {open.recipient_id === user?.id
                    ? `From ${nameOf(open.sender_id)} · ${roleOf(open.sender_id)}`
                    : `To ${nameOf(open.recipient_id)} · ${roleOf(open.recipient_id)}`}
                </DialogDescription>
              </DialogHeader>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{open.body}</p>
              {open.recipient_id === user?.id && (
                <div className="space-y-2 border-t border-border pt-3">
                  <Textarea
                    value={recipientId === open.sender_id ? body : ""}
                    onChange={(e) => {
                      setRecipientId(open.sender_id);
                      setBody(e.target.value);
                    }}
                    placeholder="Write a reply…"
                    rows={4}
                  />
                  <Button
                    className="w-full sm:w-auto"
                    disabled={!body.trim() || sendMessage.isPending}
                    onClick={async () => {
                      await sendMessage.mutateAsync({
                        recipient_id: open.sender_id,
                        subject: open.subject.startsWith("Re:") ? open.subject : `Re: ${open.subject}`,
                        body,
                        parent_id: open.id,
                      });
                      resetCompose();
                      setOpen(null);
                    }}
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Send reply
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessagesPage;
