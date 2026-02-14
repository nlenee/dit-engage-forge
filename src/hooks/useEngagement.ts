import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const useEngagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: engagementLogs = [], isLoading } = useQuery({
    queryKey: ["engagement_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engagement_logs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createLog = useMutation({
    mutationFn: async (log: { member_user_id: string; action_type: string; notes?: string }) => {
      const { error } = await supabase.from("engagement_logs").insert({
        ...log,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement_logs"] });
      toast({ title: "Engagement log created" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return { engagementLogs, isLoading, createLog };
};
