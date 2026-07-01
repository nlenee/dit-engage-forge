import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CalendarClock } from "lucide-react";

interface Props {
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  onScheduled?: () => void;
  trigger?: React.ReactNode;
}

export default function ScheduleInterviewDialog({ applicationId, applicantName, applicantEmail, onScheduled, trigger }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [channel, setChannel] = useState<"video_call" | "voice_call" | "in_person">("video_call");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!date) return toast({ title: "Pick a date", variant: "destructive" });
    setSaving(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const { error: iErr } = await supabase.from("interviews").insert({
        application_id: applicationId,
        scheduled_by: userRes.user?.id,
        interview_date: date,
        interview_time: time || null,
        channel,
        channel_link: channel !== "in_person" ? (link || null) : null,
        channel_address: channel === "in_person" ? (link || null) : null,
        notes: notes || null,
        applicant_notified: true,
      });
      if (iErr) throw iErr;

      await supabase.from("applications").update({ status: "interview_scheduled" }).eq("id", applicationId);
      await supabase.from("application_reviews").insert({
        application_id: applicationId,
        reviewer_id: userRes.user?.id,
        action: "interview_requested",
        comment: `Scheduled for ${date}${time ? " " + time : ""} via ${channel}`,
      });

      await supabase.functions.invoke("send-interview-invite", {
        body: {
          application_id: applicationId,
          applicant_email: applicantEmail,
          applicant_name: applicantName,
          date, time, channel, link, notes,
        },
      });

      toast({ title: "Interview scheduled", description: "Invitation email sent to applicant." });
      setOpen(false);
      onScheduled?.();
    } catch (e: any) {
      toast({ title: "Failed to schedule", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <CalendarClock className="w-4 h-4 mr-1"/> Schedule Meeting
        </Button>
      )}
      <DialogContent>
        <DialogHeader><DialogTitle>Schedule Interview</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">Meeting with <b>{applicantName}</b> ({applicantEmail})</div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)}/></div>
            <div><Label>Time</Label><Input type="time" value={time} onChange={e => setTime(e.target.value)}/></div>
          </div>
          <div>
            <Label>Channel</Label>
            <Select value={channel} onValueChange={(v: any) => setChannel(v)}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="video_call">Video call</SelectItem>
                <SelectItem value="voice_call">Voice call</SelectItem>
                <SelectItem value="in_person">In person</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{channel === "in_person" ? "Address" : "Meeting link"}</Label>
            <Input value={link} onChange={e => setLink(e.target.value)} placeholder={channel === "in_person" ? "Venue address" : "https://meet…"} />
          </div>
          <div>
            <Label>Notes for applicant</Label>
            <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Agenda, what to prepare, etc."/>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-1 animate-spin"/>}Send invite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}