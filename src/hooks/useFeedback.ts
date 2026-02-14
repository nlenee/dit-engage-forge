import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const useFeedback = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ["community_feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_feedback")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const submitFeedback = useMutation({
    mutationFn: async (fb: { subject: string; message: string }) => {
      const { error } = await supabase.from("community_feedback").insert({
        ...fb,
        submitted_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community_feedback"] });
      toast({ title: "Feedback submitted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateFeedbackStatus = useMutation({
    mutationFn: async ({ id, status, resolution_notes }: { id: string; status: string; resolution_notes?: string }) => {
      const { error } = await supabase.from("community_feedback").update({
        status,
        resolution_notes,
        resolved_by: user!.id,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community_feedback"] });
      toast({ title: "Feedback updated" });
    },
  });

  return { feedback, isLoading, submitFeedback, updateFeedbackStatus };
};
