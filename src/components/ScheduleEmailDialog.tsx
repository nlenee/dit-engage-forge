import { useState } from "react";
import { format } from "date-fns";
import { Calendar, Clock, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useScheduledEmails } from "@/hooks/useScheduledEmails";

interface ScheduleEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  letterId: string;
  recipientEmail: string;
  recipientName: string;
  generatePdf: () => Promise<string>;
}

export function ScheduleEmailDialog({
  open,
  onOpenChange,
  letterId,
  recipientEmail,
  recipientName,
  generatePdf,
}: ScheduleEmailDialogProps) {
  const { scheduleEmail } = useScheduledEmails();
  const [isScheduling, setIsScheduling] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("09:00");
  const [formData, setFormData] = useState({
    email: recipientEmail,
    subject: `Letter of Engagement - ${recipientName}`,
    message: `Please find attached your official Letter of Engagement from the Divine Intelligence Team.`,
  });

  const handleSchedule = async () => {
    if (!date) return;

    setIsScheduling(true);
    try {
      const pdfBase64 = await generatePdf();
      
      // Combine date and time
      const [hours, minutes] = time.split(":").map(Number);
      const scheduledAt = new Date(date);
      scheduledAt.setHours(hours, minutes, 0, 0);

      // Get user's timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      await scheduleEmail.mutateAsync({
        letterId,
        recipientEmail: formData.email,
        recipientName,
        subject: formData.subject,
        message: formData.message,
        scheduledAt,
        timezone,
        pdfBase64,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to schedule email:", error);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Schedule Email
          </DialogTitle>
          <DialogDescription>
            Schedule this letter to be sent at a specific date and time.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="schedule-email">Recipient Email</Label>
            <Input
              id="schedule-email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="schedule-subject">Subject</Label>
            <Input
              id="schedule-subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="schedule-message">Message</Label>
            <Textarea
              id="schedule-message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="schedule-time">Time (Your Local Time)</Label>
              <Input
                id="schedule-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {date && (
            <p className="text-sm text-muted-foreground">
              Email will be sent on {format(date, "PPPP")} at {time} ({Intl.DateTimeFormat().resolvedOptions().timeZone})
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={!date || isScheduling}>
            {isScheduling ? (
              "Scheduling..."
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Schedule Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
