import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface AdminInvitation {
  id: string;
  email: string;
  invited_by: string | null;
  invited_at: string;
  status: "pending" | "accepted" | "expired";
  token: string;
  accepted_at: string | null;
  expires_at: string;
}

export const useAdminInvitations = () => {
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ["admin-invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_invitations")
        .select("*")
        .order("invited_at", { ascending: false });

      if (error) throw error;
      return data as AdminInvitation[];
    },
    enabled: !!user && isSuperAdmin,
  });

  const inviteAdmin = useMutation({
    mutationFn: async (email: string) => {
      // Check if invitation already exists
      const { data: existing } = await supabase
        .from("admin_invitations")
        .select("id")
        .eq("email", email)
        .single();

      if (existing) {
        throw new Error("An invitation for this email already exists");
      }

      // Create invitation
      const { data: invitation, error } = await supabase
        .from("admin_invitations")
        .insert({
          email,
          invited_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email
      const { error: funcError } = await supabase.functions.invoke("send-admin-invitation", {
        body: { invitationId: invitation.id },
      });

      if (funcError) {
        console.error("Failed to send invitation email:", funcError);
      }

      return invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invitations"] });
      toast({
        title: "Invitation sent",
        description: "An email has been sent with the invitation link.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Invitation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resendInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase.functions.invoke("send-admin-invitation", {
        body: { invitationId },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Invitation resent",
        description: "The invitation email has been sent again.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Resend failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    invitations,
    isLoading,
    inviteAdmin,
    resendInvitation,
  };
};
