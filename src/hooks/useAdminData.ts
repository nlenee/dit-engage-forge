import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: "admin" | "user" | "super_admin";
  email?: string;
}

export interface EmailLog {
  id: string;
  letter_id: string | null;
  recipient_email: string;
  subject: string;
  sent_by: string | null;
  sent_at: string;
  status: string;
  delivery_status: string | null;
  opened_at: string | null;
  bounced_at: string | null;
  bounce_reason: string | null;
  resend_email_id: string | null;
}

export const useAdminData = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users with roles
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      return profiles.map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || "user",
        } as UserWithRole;
      });
    },
    enabled: !!user && isAdmin,
  });

  // Fetch all letters for admin
  const { data: allLetters = [], isLoading: lettersLoading } = useQuery({
    queryKey: ["admin-letters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("letters")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin,
  });

  // Fetch all email logs
  const { data: emailLogs = [], isLoading: emailLogsLoading } = useQuery({
    queryKey: ["admin-email-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .order("sent_at", { ascending: false });

      if (error) throw error;
      return data as EmailLog[];
    },
    enabled: !!user && isAdmin,
  });

  // Update user role
  const updateUserRole = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "user" | "super_admin";
    }) => {
      // First check if role exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (existingRole) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    users,
    usersLoading,
    allLetters,
    lettersLoading,
    emailLogs,
    emailLogsLoading,
    updateUserRole,
  };
};
