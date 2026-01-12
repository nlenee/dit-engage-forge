import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface LetterTemplate {
  id: string;
  name: string;
  description: string | null;
  content: string;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useTemplates = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("letter_templates")
        .select("*")
        .order("is_default", { ascending: false })
        .order("name");

      if (error) throw error;
      return data as LetterTemplate[];
    },
    enabled: !!user,
  });

  const createTemplate = useMutation({
    mutationFn: async ({ name, description, content }: { name: string; description?: string; content: string }) => {
      if (!user) throw new Error("Not authenticated");
      if (!isAdmin) throw new Error("Admin access required");

      const { data, error } = await supabase
        .from("letter_templates")
        .insert({
          name,
          description: description || null,
          content,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({ title: "Template created", description: "Your template has been saved." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, name, description, content }: { id: string; name: string; description?: string; content: string }) => {
      if (!isAdmin) throw new Error("Admin access required");

      const { data, error } = await supabase
        .from("letter_templates")
        .update({ name, description: description || null, content })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({ title: "Template updated", description: "Your changes have been saved." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      if (!isAdmin) throw new Error("Admin access required");

      const { error } = await supabase.from("letter_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({ title: "Template deleted", description: "The template has been removed." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
};
