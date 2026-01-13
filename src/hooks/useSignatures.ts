import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface SavedSignature {
  id: string;
  user_id: string;
  name: string;
  title: string;
  signature_url: string;
  created_at: string;
  updated_at: string;
}

export const useSignatures = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: signatures = [], isLoading } = useQuery({
    queryKey: ["signatures", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_signatures")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SavedSignature[];
    },
    enabled: !!user,
  });

  const uploadSignature = async (file: File): Promise<string> => {
    if (!user) throw new Error("Not authenticated");

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("signatures")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("signatures")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const saveSignature = useMutation({
    mutationFn: async ({
      name,
      title,
      signatureUrl,
    }: {
      name: string;
      title: string;
      signatureUrl: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("saved_signatures")
        .insert({
          user_id: user.id,
          name,
          title,
          signature_url: signatureUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signatures"] });
      toast({
        title: "Signature saved",
        description: "Your signature has been saved for reuse.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving signature",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSignature = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("saved_signatures")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signatures"] });
      toast({
        title: "Signature deleted",
        description: "The signature has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting signature",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    signatures,
    isLoading,
    uploadSignature,
    saveSignature,
    deleteSignature,
  };
};
