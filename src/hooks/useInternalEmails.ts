import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ensureSession } from "@/lib/ensureSession";

export interface InternalEmail {
  id: string;
  created_by: string;
  subject: string;
  body_html: string;
  recipient_modes: string[];
  member_ids: string[];
  faction_ids: string[];
  raw_to_emails: string[];
  cc_emails: string[];
  bcc_emails: string[];
  scheduled_at: string | null;
  timezone: string | null;
  status: string;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface InternalEmailRecipient {
  id: string;
  email_id: string;
  recipient_email: string;
  recipient_name: string | null;
  field: string;
  source: string;
  status: string;
  sent_at: string | null;
  error_message: string | null;
}

export interface ComposePayload {
  subject: string;
  bodyHtml: string;
  modes: string[];
  memberIds: string[];
  factionIds: string[];
  rawToEmails: string[];
  ccEmails: string[];
  bccEmails: string[];
  scheduledAt?: Date | null;
}

export const useInternalEmails = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ["internal-emails"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internal_emails")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as unknown as InternalEmail[];
    },
    refetchInterval: 30000,
  });

  const sendEmail = useMutation({
    mutationFn: async (payload: ComposePayload) => {
      const session = await ensureSession();
      const { data, error } = await supabase.functions.invoke("send-internal-email", {
        body: {
          subject: payload.subject,
          bodyHtml: payload.bodyHtml,
          modes: payload.modes,
          memberIds: payload.memberIds,
          factionIds: payload.factionIds,
          rawToEmails: payload.rawToEmails,
          ccEmails: payload.ccEmails,
          bccEmails: payload.bccEmails,
          scheduledAt: payload.scheduledAt ? payload.scheduledAt.toISOString() : null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { scheduled: boolean; recipientCount: number; sent?: number; failed?: number };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["internal-emails"] });
      toast({
        title: result.scheduled ? "Email scheduled" : "Email sent",
        description: result.scheduled
          ? `${result.recipientCount} recipient(s) queued for delivery.`
          : `${result.sent ?? 0} sent, ${result.failed ?? 0} failed.`,
      });
    },
    onError: (e: any) =>
      toast({ title: "Send failed", description: e.message, variant: "destructive" }),
  });

  const cancelEmail = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("internal_emails")
        .update({ status: "cancelled" })
        .eq("id", id)
        .eq("status", "pending");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-emails"] });
      toast({ title: "Scheduled email cancelled" });
    },
    onError: (e: any) =>
      toast({ title: "Could not cancel", description: e.message, variant: "destructive" }),
  });

  return { emails, isLoading, sendEmail, cancelEmail };
};

export const useEmailRecipients = (emailId: string | null) =>
  useQuery({
    queryKey: ["internal-email-recipients", emailId],
    enabled: !!emailId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internal_email_recipients")
        .select("*")
        .eq("email_id", emailId!)
        .order("created_at");
      if (error) throw error;
      return (data || []) as unknown as InternalEmailRecipient[];
    },
  });