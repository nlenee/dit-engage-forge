import { useState, useCallback } from "react";
import { Users, Upload, Plus, X, Send } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBulkEmail, RecipientInput } from "@/hooks/useBulkEmail";
import { useToast } from "@/hooks/use-toast";

interface BulkEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  letterId: string;
  generatePdf: () => Promise<string>;
}

export function BulkEmailDialog({
  open,
  onOpenChange,
  letterId,
  generatePdf,
}: BulkEmailDialogProps) {
  const { createBulkJob, parseCSV } = useBulkEmail();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [recipients, setRecipients] = useState<RecipientInput[]>([]);
  const [newRecipient, setNewRecipient] = useState({ name: "", email: "" });
  const [formData, setFormData] = useState({
    subject: "Letter of Engagement",
    message: "Please find attached your official Letter of Engagement from the Divine Intelligence Team.",
  });

  const handleAddRecipient = () => {
    if (newRecipient.name && newRecipient.email) {
      setRecipients([...recipients, newRecipient]);
      setNewRecipient({ name: "", email: "" });
    }
  };

  const handleRemoveRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseCSV(content);
      
      if (parsed.length === 0) {
        toast({
          title: "No recipients found",
          description: "Please check your CSV format. Expected columns: name, email",
          variant: "destructive",
        });
        return;
      }

      setRecipients((prev) => [...prev, ...parsed]);
      toast({
        title: "Recipients imported",
        description: `Added ${parsed.length} recipients from CSV.`,
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [parseCSV, toast]);

  const handleSend = async () => {
    if (recipients.length === 0) {
      toast({
        title: "No recipients",
        description: "Please add at least one recipient.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const pdfBase64 = await generatePdf();
      
      await createBulkJob.mutateAsync({
        letterId,
        subject: formData.subject,
        message: formData.message,
        recipients,
        pdfBase64,
      });

      setRecipients([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to start bulk email:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Bulk Email
          </DialogTitle>
          <DialogDescription>
            Send this letter to multiple recipients at once.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="bulk-subject">Subject</Label>
            <Input
              id="bulk-subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bulk-message">Message</Label>
            <Textarea
              id="bulk-message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Recipients ({recipients.length})</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <label className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                    <input
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Name"
                value={newRecipient.name}
                onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                className="flex-1"
              />
              <Input
                placeholder="Email"
                type="email"
                value={newRecipient.email}
                onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={handleAddRecipient}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {recipients.length > 0 && (
              <ScrollArea className="h-[150px] rounded-md border p-2">
                <div className="flex flex-wrap gap-2">
                  {recipients.map((recipient, index) => (
                    <Badge key={index} variant="secondary" className="gap-1 pr-1">
                      {recipient.name} &lt;{recipient.email}&gt;
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => handleRemoveRecipient(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={recipients.length === 0 || isSending}>
            {isSending ? (
              "Starting..."
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send to {recipients.length} Recipients
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
