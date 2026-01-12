import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { LetterFormData, Signatory } from "@/types/letter";

export interface DbLetter {
  id: string;
  recipient_name: string;
  recipient_email: string;
  country: string;
  state: string | null;
  office: string;
  date_of_assignment: string;
  letter_content: string;
  signatories: Signatory[];
  status: "draft" | "downloaded" | "sent";
  template_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LetterVersion {
  id: string;
  letter_id: string;
  version_number: number;
  recipient_name: string;
  recipient_email: string;
  country: string;
  state: string | null;
  office: string;
  date_of_assignment: string;
  letter_content: string;
  signatories: Signatory[];
  change_summary: string | null;
  created_by: string | null;
  created_at: string;
}

export const useLetters = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: letters = [], isLoading } = useQuery({
    queryKey: ["letters", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("letters")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map((letter: any) => ({
        ...letter,
        signatories: letter.signatories as Signatory[],
        status: letter.status as "draft" | "downloaded" | "sent",
      })) as DbLetter[];
    },
    enabled: !!user,
  });

  const createLetter = useMutation({
    mutationFn: async (formData: LetterFormData) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("letters")
        .insert({
          recipient_name: formData.recipientName,
          recipient_email: formData.recipientEmail,
          country: formData.country,
          state: formData.state || null,
          office: formData.office,
          date_of_assignment: formData.dateOfAssignment.toISOString().split("T")[0],
          letter_content: formData.letterContent,
          signatories: formData.signatories as unknown as any,
          status: "draft" as const,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letters"] });
      toast({ title: "Letter saved", description: "Your letter has been saved successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateLetter = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: LetterFormData }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("letters")
        .update({
          recipient_name: formData.recipientName,
          recipient_email: formData.recipientEmail,
          country: formData.country,
          state: formData.state || null,
          office: formData.office,
          date_of_assignment: formData.dateOfAssignment.toISOString().split("T")[0],
          letter_content: formData.letterContent,
          signatories: formData.signatories as unknown as any,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letters"] });
      toast({ title: "Letter updated", description: "Your changes have been saved." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "draft" | "downloaded" | "sent" }) => {
      const { error } = await supabase
        .from("letters")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letters"] });
    },
  });

  const deleteLetter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("letters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letters"] });
      toast({ title: "Letter deleted", description: "The letter has been removed." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getLetterVersions = async (letterId: string): Promise<LetterVersion[]> => {
    const { data, error } = await supabase
      .from("letter_versions")
      .select("*")
      .eq("letter_id", letterId)
      .order("version_number", { ascending: false });

    if (error) throw error;
    
    return (data || []).map((v: any) => ({
      ...v,
      signatories: v.signatories as Signatory[],
    }));
  };

  return {
    letters,
    isLoading,
    createLetter,
    updateLetter,
    updateStatus,
    deleteLetter,
    getLetterVersions,
  };
};
