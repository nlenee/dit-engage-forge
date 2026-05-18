import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export type AdminAppRole =
  | "admin"
  | "user"
  | "executive_secretary"
  | "community_manager"
  | "chief_finance_officer"
  | "chief_executive_director"
  | "executive_director"
  | "executive_assistant";

export const PROTECTED_ADMIN_EMAIL = "divintelteam@gmail.com";

export interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: AdminAppRole;
  email?: string | null;
  status?: string | null;
  xp?: number | null;
  member_level?: number | null;
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
      role: AdminAppRole;
    }) => {
      // Protect divintelteam@gmail.com from being demoted
      const { data: prof } = await supabase
        .from("profiles").select("email").eq("user_id", userId).maybeSingle();
      if (prof?.email?.toLowerCase() === PROTECTED_ADMIN_EMAIL && role !== "admin" && role !== "chief_executive_director") {
        throw new Error("The system admin account cannot be demoted.");
      }
      // Replace roles: delete then insert the chosen primary role
      const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (delErr) throw delErr;
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["member-directory"] });
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

  // Award XP to a user
  const awardXp = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const { data: prof } = await supabase
        .from("profiles").select("xp").eq("user_id", userId).maybeSingle();
      const newXp = (prof?.xp || 0) + amount;
      const newLevel = Math.max(1, Math.floor(Math.sqrt(newXp / 100)) + 1);
      const { error } = await supabase
        .from("profiles")
        .update({ xp: newXp, member_level: newLevel })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "XP awarded" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Suspend / unsuspend user
  const setUserStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: "active" | "suspended" }) => {
      const { data: prof } = await supabase
        .from("profiles").select("email").eq("user_id", userId).maybeSingle();
      if (prof?.email?.toLowerCase() === PROTECTED_ADMIN_EMAIL && status === "suspended") {
        throw new Error("The system admin account cannot be suspended.");
      }
      const { error } = await supabase.from("profiles").update({ status }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["member-directory"] });
      toast({ title: vars.status === "suspended" ? "User suspended" : "User reinstated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Delete user
  const deleteUserAccount = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { data, error } = await supabase.functions.invoke("admin-delete-user", {
        body: { target_user_id: userId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["member-directory"] });
      toast({ title: "User deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return {
    users,
    usersLoading,
    allLetters,
    lettersLoading,
    emailLogs,
    emailLogsLoading,
    updateUserRole,
    awardXp,
    setUserStatus,
    deleteUserAccount,
  };
};
