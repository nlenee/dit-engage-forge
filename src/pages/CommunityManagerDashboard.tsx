import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Users, Activity, Calendar, MessageSquare, Plus, Search,
  TrendingUp, UserCheck, UserX, Loader2, BarChart3, CheckCircle,
  AlertTriangle, ArrowUpRight, Cake, Mail, Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useEvents } from "@/hooks/useEvents";
import { useEngagement } from "@/hooks/useEngagement";
import { useFeedback } from "@/hooks/useFeedback";
import { useMembers } from "@/hooks/useMembers";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { EmailCampaignManager } from "@/components/EmailCampaignManager";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BirthdayMember {
  id: string;
  full_name: string;
  birthday: string;
  daysUntil: number;
  nextBirthday: Date;
}

function BirthdayCountdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <span className="font-mono text-lg font-bold text-primary">
      {pad(timeLeft.days)}:{pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
    </span>
  );
}

const CommunityManagerDashboard = () => {
  const { isCommunityManager, isAdmin, isAdminOrES, loading } = useAuth();
  const { events, isLoading: eventsLoading, createEvent, updateEvent, attendance, getEventAttendance } = useEvents();
  const { engagementLogs, isLoading: engLoading, createLog } = useEngagement();
  const { feedback, isLoading: fbLoading, updateFeedbackStatus } = useFeedback();
  const { members } = useMembers();

  const [newEventOpen, setNewEventOpen] = useState(false);
  const [newLogOpen, setNewLogOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ title: "", description: "", location: "", event_date: "", max_attendees: "" });
  const [logForm, setLogForm] = useState({ member_user_id: "", action_type: "follow_up", notes: "" });

  // Fetch profiles for member health
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles_cm"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Calculate upcoming birthdays from members table (within 30 days)
  const upcomingBirthdays: BirthdayMember[] = (() => {
    const now = new Date();
    const results: BirthdayMember[] = [];
    
    members.forEach((member) => {
      if (!member.birthday) return;
      const [year, month, day] = member.birthday.split("-").map(Number);
      const bdayThisYear = new Date(now.getFullYear(), month - 1, day);
      
      // If birthday has passed this year, check next year
      if (bdayThisYear < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        bdayThisYear.setFullYear(bdayThisYear.getFullYear() + 1);
      }
      
      const diffMs = bdayThisYear.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays <= 30) {
        results.push({
          id: member.id,
          full_name: member.full_name,
          birthday: member.birthday,
          daysUntil: diffDays,
          nextBirthday: bdayThisYear,
        });
      }
    });
    
    return results.sort((a, b) => a.daysUntil - b.daysUntil);
  })();

  const todayBirthdays = upcomingBirthdays.filter((b) => b.daysUntil === 0);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!isCommunityManager && !isAdmin) return <Navigate to="/" replace />;

  const totalMembers = profiles.length;
  const activeMembers = profiles.filter((p) => p.status === "active").length;
  const inactiveMembers = profiles.filter((p) => p.status !== "active").length;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const newMembers = profiles.filter((p) => p.created_at >= thirtyDaysAgo).length;
  const engagementRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;

  const handleCreateEvent = async () => {
    await createEvent.mutateAsync({
      title: eventForm.title,
      description: eventForm.description || undefined,
      location: eventForm.location || undefined,
      event_date: new Date(eventForm.event_date).toISOString(),
      max_attendees: eventForm.max_attendees ? parseInt(eventForm.max_attendees) : undefined,
    });
    setNewEventOpen(false);
    setEventForm({ title: "", description: "", location: "", event_date: "", max_attendees: "" });
  };

  const handleCreateLog = async () => {
    await createLog.mutateAsync({
      member_user_id: logForm.member_user_id,
      action_type: logForm.action_type,
      notes: logForm.notes || undefined,
    });
    setNewLogOpen(false);
    setLogForm({ member_user_id: "", action_type: "follow_up", notes: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            Community Manager Dashboard
          </h1>
          <p className="text-muted-foreground">Monitor community health, manage events, and track engagement.</p>
        </div>

        {/* Birthday Banner */}
        {upcomingBirthdays.length > 0 && (
          <Card className="mb-8 border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Cake className="h-6 w-6 text-primary" />
                Upcoming Birthdays This Month
                <Badge variant="secondary">{upcomingBirthdays.length}</Badge>
              </CardTitle>
              {todayBirthdays.length > 0 && (
                <CardDescription className="text-primary font-semibold">
                  🎉 {todayBirthdays.map((b) => b.full_name).join(", ")} — Happy Birthday Today!
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingBirthdays.map((bday) => (
                  <div
                    key={bday.id}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      bday.daysUntil === 0
                        ? "bg-primary/10 border-primary/40"
                        : "bg-card border-border/50"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-foreground">{bday.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(bday.birthday), "MMMM d")}
                      </p>
                      {bday.daysUntil === 0 && (
                        <Badge className="mt-1 bg-primary text-primary-foreground">🎂 Today!</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      {bday.daysUntil === 0 ? (
                        <span className="text-2xl">🎉</span>
                      ) : (
                        <div className="flex flex-col items-end">
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <Timer className="h-3 w-3" /> Next birthday in
                          </p>
                          <BirthdayCountdown targetDate={bday.nextBirthday} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Members", value: totalMembers, icon: Users, color: "text-blue-600" },
            { label: "Active Members", value: activeMembers, icon: UserCheck, color: "text-green-600" },
            { label: "Inactive", value: inactiveMembers, icon: UserX, color: "text-red-600" },
            { label: "New (30d)", value: newMembers, icon: TrendingUp, color: "text-purple-600" },
            { label: "Engagement", value: `${engagementRate}%`, icon: BarChart3, color: "text-primary" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="events" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="events" className="gap-2"><Calendar className="h-4 w-4" />Events</TabsTrigger>
            <TabsTrigger value="engagement" className="gap-2"><Activity className="h-4 w-4" />Engagement</TabsTrigger>
            <TabsTrigger value="feedback" className="gap-2"><MessageSquare className="h-4 w-4" />Feedback</TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2"><Mail className="h-4 w-4" />Campaigns</TabsTrigger>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-xl font-semibold">Events</h2>
              <Dialog open={newEventOpen} onOpenChange={setNewEventOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="h-4 w-4" />Create Event</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>Fill in the event details below.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Title</Label><Input value={eventForm.title} onChange={(e) => setEventForm((p) => ({ ...p, title: e.target.value }))} /></div>
                    <div><Label>Description</Label><Textarea value={eventForm.description} onChange={(e) => setEventForm((p) => ({ ...p, description: e.target.value }))} /></div>
                    <div><Label>Location</Label><Input value={eventForm.location} onChange={(e) => setEventForm((p) => ({ ...p, location: e.target.value }))} /></div>
                    <div><Label>Date & Time</Label><Input type="datetime-local" value={eventForm.event_date} onChange={(e) => setEventForm((p) => ({ ...p, event_date: e.target.value }))} /></div>
                    <div><Label>Max Attendees</Label><Input type="number" value={eventForm.max_attendees} onChange={(e) => setEventForm((p) => ({ ...p, max_attendees: e.target.value }))} /></div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateEvent} disabled={!eventForm.title || !eventForm.event_date}>Create Event</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-card rounded-xl border border-border/50 shadow-soft overflow-hidden">
              {eventsLoading ? (
                <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
              ) : events.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No events yet. Create your first event.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Attendees</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => {
                      const att = getEventAttendance(event.id);
                      return (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.title}</TableCell>
                          <TableCell className="text-muted-foreground">{format(new Date(event.event_date), "MMM d, yyyy h:mm a")}</TableCell>
                          <TableCell className="text-muted-foreground">{event.location || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{att.length}{event.max_attendees ? `/${event.max_attendees}` : ""}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={event.status === "upcoming" ? "bg-blue-100 text-blue-700" : event.status === "completed" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}>
                              {event.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-xl font-semibold">Engagement Logs</h2>
              <Dialog open={newLogOpen} onOpenChange={setNewLogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="h-4 w-4" />Log Engagement</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log Engagement</DialogTitle>
                    <DialogDescription>Record an engagement interaction with a member.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Member</Label>
                      <Select value={logForm.member_user_id} onValueChange={(v) => setLogForm((p) => ({ ...p, member_user_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                        <SelectContent>
                          {profiles.map((p) => (
                            <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.email || "Unknown"}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Action Type</Label>
                      <Select value={logForm.action_type} onValueChange={(v) => setLogForm((p) => ({ ...p, action_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="follow_up">Follow-up</SelectItem>
                          <SelectItem value="contacted">Contacted Inactive</SelectItem>
                          <SelectItem value="mentorship">Mentorship</SelectItem>
                          <SelectItem value="welcome">Welcome</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Notes</Label><Textarea value={logForm.notes} onChange={(e) => setLogForm((p) => ({ ...p, notes: e.target.value }))} /></div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateLog} disabled={!logForm.member_user_id}>Log Engagement</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-card rounded-xl border border-border/50 shadow-soft overflow-hidden">
              {engLoading ? (
                <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
              ) : engagementLogs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No engagement logs yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {engagementLogs.map((log) => {
                      const member = profiles.find((p) => p.user_id === log.member_user_id);
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{member?.full_name || "Unknown"}</TableCell>
                          <TableCell><Badge variant="outline">{log.action_type}</Badge></TableCell>
                          <TableCell className="text-muted-foreground max-w-[300px] truncate">{log.notes || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{format(new Date(log.created_at), "MMM d, yyyy")}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            <h2 className="font-display text-xl font-semibold mb-4">Community Feedback</h2>
            <div className="bg-card rounded-xl border border-border/50 shadow-soft overflow-hidden">
              {fbLoading ? (
                <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
              ) : feedback.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No feedback submitted yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedback.map((fb) => (
                      <TableRow key={fb.id}>
                        <TableCell className="font-medium">{fb.subject}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[300px] truncate">{fb.message}</TableCell>
                        <TableCell>
                          <Badge className={
                            fb.status === "addressed" ? "bg-green-100 text-green-700" :
                            fb.status === "escalated" ? "bg-yellow-100 text-yellow-700" :
                            "bg-muted text-muted-foreground"
                          }>{fb.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{format(new Date(fb.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Select
                            value={fb.status}
                            onValueChange={(v) => updateFeedbackStatus.mutate({ id: fb.id, status: v })}
                          >
                            <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="addressed">Addressed</SelectItem>
                              <SelectItem value="escalated_es">Escalated to ES</SelectItem>
                              <SelectItem value="escalated_ced">Escalated to CED</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <EmailCampaignManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CommunityManagerDashboard;