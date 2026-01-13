import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface BulkEmailJob {
  id: string;
  letter_id: string | null;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_by: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  subject: string;
  message: string;
}

export interface BulkEmailRecipient {
  id: string;
  job_id: string;
  recipient_email: string;
  recipient_name: string;
  status: "pending" | "sent" | "failed";
  sent_at: string | null;
  error_message: string | null;
}

export interface RecipientInput {
  email: string;
  name: string;
}

export const useBulkEmail = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["bulk-email-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bulk_email_jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BulkEmailJob[];
    },
    enabled: !!user,
  });

  const getJobRecipients = async (jobId: string) => {
    const { data, error } = await supabase
      .from("bulk_email_recipients")
      .select("*")
      .eq("job_id", jobId)
      .order("recipient_name", { ascending: true });

    if (error) throw error;
    return data as BulkEmailRecipient[];
  };

  const createBulkJob = useMutation({
    mutationFn: async (data: {
      letterId: string;
      subject: string;
      message: string;
      recipients: RecipientInput[];
      pdfBase64: string;
    }) => {
      // Create the job
      const { data: job, error: jobError } = await supabase
        .from("bulk_email_jobs")
        .insert({
          letter_id: data.letterId,
          subject: data.subject,
          message: data.message,
          total_recipients: data.recipients.length,
          created_by: user?.id,
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Create recipients
      const recipientData = data.recipients.map((r) => ({
        job_id: job.id,
        recipient_email: r.email,
        recipient_name: r.name,
      }));

      const { error: recipientError } = await supabase
        .from("bulk_email_recipients")
        .insert(recipientData);

      if (recipientError) throw recipientError;

      // Trigger the bulk send edge function
      const { error: funcError } = await supabase.functions.invoke("process-bulk-email", {
        body: { jobId: job.id, pdfBase64: data.pdfBase64 },
      });

      if (funcError) {
        console.error("Failed to start bulk email processing:", funcError);
      }

      return job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bulk-email-jobs"] });
      toast({
        title: "Bulk email started",
        description: "The emails are being sent. Check progress below.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const parseCSV = (csvContent: string): RecipientInput[] => {
    const lines = csvContent.trim().split("\n");
    const recipients: RecipientInput[] = [];

    // Skip header if present
    const startIdx = lines[0]?.toLowerCase().includes("email") ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
      if (parts.length >= 2) {
        const [nameOrEmail, emailOrName] = parts;
        // Determine which is email
        const email = nameOrEmail.includes("@") ? nameOrEmail : emailOrName;
        const name = nameOrEmail.includes("@") ? emailOrName : nameOrEmail;
        
        if (email && name) {
          recipients.push({ email, name });
        }
      } else if (parts.length === 1 && parts[0].includes("@")) {
        recipients.push({ email: parts[0], name: parts[0].split("@")[0] });
      }
    }

    return recipients;
  };

  return {
    jobs,
    jobsLoading,
    createBulkJob,
    getJobRecipients,
    parseCSV,
  };
};
