import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ScheduledEmail {
  id: string;
  letter_id: string | null;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  message: string;
  scheduled_at: string;
  timezone: string;
  status: "pending" | "processing" | "sent" | "failed" | "cancelled";
  pdf_base64: string | null;
  created_by: string | null;
  created_at: string;
  sent_at: string | null;
  error_message: string | null;
}

export const useScheduledEmails = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scheduledEmails = [], isLoading } = useQuery({
    queryKey: ["scheduled-emails"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_emails")
        .select("*")
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      return data as ScheduledEmail[];
    },
    enabled: !!user,
  });

  const scheduleEmail = useMutation({
    mutationFn: async (emailData: {
      letterId: string;
      recipientEmail: string;
      recipientName: string;
      subject: string;
      message: string;
      scheduledAt: Date;
      timezone: string;
      pdfBase64: string;
    }) => {
      const { data, error } = await supabase.from("scheduled_emails").insert({
        letter_id: emailData.letterId,
        recipient_email: emailData.recipientEmail,
        recipient_name: emailData.recipientName,
        subject: emailData.subject,
        message: emailData.message,
        scheduled_at: emailData.scheduledAt.toISOString(),
        timezone: emailData.timezone,
        pdf_base64: emailData.pdfBase64,
        created_by: user?.id,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-emails"] });
      toast({
        title: "Email scheduled",
        description: "The email has been scheduled for delivery.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Scheduling failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelScheduledEmail = useMutation({
    mutationFn: async (emailId: string) => {
      const { error } = await supabase
        .from("scheduled_emails")
        .update({ status: "cancelled" })
        .eq("id", emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-emails"] });
      toast({
        title: "Email cancelled",
        description: "The scheduled email has been cancelled.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    scheduledEmails,
    isLoading,
    scheduleEmail,
    cancelScheduledEmail,
  };
};
