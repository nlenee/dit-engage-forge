import { useState, useEffect } from "react";
import { Mail, Send, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  letterId: string;
  recipientEmail: string;
  recipientName: string;
  pdfBase64?: string;
  generatePdf?: () => Promise<string>;
  onEmailSent?: () => void;
}

const EmailDialog = ({
  open,
  onOpenChange,
  letterId,
  recipientEmail,
  recipientName,
  pdfBase64: initialPdfBase64,
  generatePdf,
  onEmailSent,
}: EmailDialogProps) => {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pdfBase64, setPdfBase64] = useState(initialPdfBase64 || "");
  const [formData, setFormData] = useState({
    to: recipientEmail,
    subject: `Letter of Engagement - ${recipientName}`,
    message: `We are pleased to inform you of your engagement with the Divine Intelligence Team (DIT). Please find your official Letter of Engagement attached to this email.`,
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      to: recipientEmail,
      subject: `Letter of Engagement - ${recipientName}`,
    }));
  }, [recipientEmail, recipientName]);

  useEffect(() => {
    if (initialPdfBase64) {
      setPdfBase64(initialPdfBase64);
    }
  }, [initialPdfBase64]);

  const handlePrepareAndSend = async () => {
    if (!pdfBase64 && generatePdf) {
      setIsGeneratingPdf(true);
      try {
        const generatedPdf = await generatePdf();
        setPdfBase64(generatedPdf);
        setShowConfirm(true);
      } catch (error: any) {
        toast({
          title: "Failed to generate PDF",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingPdf(false);
      }
    } else {
      setShowConfirm(true);
    }
  };

  const handleSendEmail = async () => {
    setIsSending(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error("You must be logged in to send emails");
      }

      const { data, error } = await supabase.functions.invoke("send-letter-email", {
        body: {
          letterId,
          recipientEmail: formData.to,
          recipientName,
          subject: formData.subject,
          message: formData.message,
          pdfBase64,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Email sent successfully!",
        description: `Letter has been sent to ${formData.to}`,
      });

      onEmailSent?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Failed to send email",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-dit-teal" />
              Send Letter via Email
            </DialogTitle>
            <DialogDescription>
              The Letter of Engagement PDF will be attached to this email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-to">Recipient Email</Label>
              <Input
                id="email-to"
                type="email"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg text-sm">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">
                PDF attachment: DIT_Letter_of_Engagement_{recipientName.replace(/\s+/g, "_")}.pdf
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePrepareAndSend}
              disabled={isSending || isGeneratingPdf || !formData.to || !formData.subject}
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparing PDF...
                </>
              ) : isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirm Email Send
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send this Letter of Engagement to{" "}
              <strong>{formData.to}</strong>? This action will be logged for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendEmail} disabled={isSending}>
              {isSending ? "Sending..." : "Confirm & Send"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EmailDialog;
