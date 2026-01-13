import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface DigitalSeal {
  id: string;
  letter_id: string;
  seal_image_url: string | null;
  purpose: string;
  status: "pending" | "approved" | "rejected";
  requested_by: string | null;
  requested_at: string;
  approved_by_email: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  approval_token: string;
  verification_emails_sent: boolean;
}

export const useDigitalSeals = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: seals = [], isLoading } = useQuery({
    queryKey: ["digital-seals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("digital_seals")
        .select("*")
        .order("requested_at", { ascending: false });

      if (error) throw error;
      return data as DigitalSeal[];
    },
    enabled: !!user,
  });

  const requestSeal = useMutation({
    mutationFn: async (data: { letterId: string; purpose: string }) => {
      // First create the seal request
      const { data: seal, error } = await supabase
        .from("digital_seals")
        .insert({
          letter_id: data.letterId,
          purpose: data.purpose,
          requested_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Then trigger the verification email edge function
      const { error: funcError } = await supabase.functions.invoke("send-seal-verification", {
        body: { sealId: seal.id },
      });

      if (funcError) {
        console.error("Failed to send verification emails:", funcError);
      }

      return seal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["digital-seals"] });
      toast({
        title: "Seal requested",
        description: "Verification emails have been sent to approvers.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getSealForLetter = (letterId: string) => {
    return seals.find((seal) => seal.letter_id === letterId);
  };

  return {
    seals,
    isLoading,
    requestSeal,
    getSealForLetter,
  };
};
