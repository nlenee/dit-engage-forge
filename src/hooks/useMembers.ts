import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Member {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  birthday: string | null;
  country: string | null;
  state: string | null;
  faction: string | null;
  role_in_dit: string | null;
  previous_roles: string[] | null;
  bio: string | null;
  testimony: string | null;
  joined_dit_date: string | null;
  email_verified: boolean | null;
  locked_by_admin: boolean | null;
  invitation_sent_at: string | null;
  registered_at: string | null;
  created_at: string;
  updated_at: string;
}

const ROLE_LABEL: Record<string, string> = {
  user: "Member",
  community_manager: "Community Manager",
  chief_finance_officer: "Chief Financial Officer",
  executive_secretary: "Executive Secretary",
  executive_assistant: "Executive Assistant",
  executive_director: "Executive Director",
  chief_executive_director: "Chief Executive Director",
};

export const useMembers = () => {
  const { user, isAdminOrES } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      // Source of truth: registered users from profiles (admin excluded by RPC)
      const { data, error } = await supabase.rpc("get_member_directory");
      if (error) throw error;
      const rows = (data || []) as any[];
      return rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        full_name: r.full_name || "",
        email: r.email || "",
        phone: r.phone || null,
        birthday: r.date_of_birth || null,
        country: r.origin_country || null,
        state: r.origin_state || null,
        faction: r.faction || null,
        role_in_dit:
          r.custom_role_title || ROLE_LABEL[r.primary_role] || "Member",
        previous_roles: null,
        bio: r.bio || null,
        testimony: null,
        joined_dit_date: r.date_joined_year
          ? `${r.date_joined_year}-01-01`
          : null,
        email_verified: true,
        locked_by_admin: false,
        invitation_sent_at: null,
        registered_at: r.created_at,
        created_at: r.created_at,
        updated_at: r.created_at,
      })) as Member[];
    },
    enabled: !!user && isAdminOrES,
  });

  const createMember = useMutation({
    mutationFn: async (_data: any) => {
      throw new Error(
        "Manual member creation is disabled. Use 'Send Invite' so the user can register and appear here automatically."
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({
      id: _profileId,
      user_id,
      ...data
    }: any) => {
      // Map Member fields back onto profiles
      const update: Record<string, any> = {};
      if (data.full_name !== undefined) update.full_name = data.full_name;
      if (data.phone !== undefined) update.phone = data.phone || null;
      if (data.birthday !== undefined) update.date_of_birth = data.birthday || null;
      if (data.country !== undefined) update.origin_country = data.country || null;
      if (data.state !== undefined) update.origin_state = data.state || null;
      if (data.faction !== undefined) update.faction = data.faction || null;
      if (data.bio !== undefined) update.bio = data.bio || null;
      if (data.role_in_dit !== undefined) update.custom_role_title = data.role_in_dit || null;
      if (data.joined_dit_date !== undefined && data.joined_dit_date) {
        update.date_joined_year = Number(String(data.joined_dit_date).slice(0, 4));
      }
      const targetUserId = user_id;
      if (!targetUserId) throw new Error("Missing user id");
      const { error } = await supabase.from("profiles").update(update).eq("user_id", targetUserId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Member updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMember = useMutation({
    mutationFn: async (userIdToDelete: string) => {
      const { data, error } = await supabase.functions.invoke("admin-delete-user", {
        body: { target_user_id: userIdToDelete },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Member deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getTodaysBirthdays = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    
    return members.filter((member) => {
      if (!member.birthday) return false;
      const bday = member.birthday.slice(5); // Get MM-DD
      return bday === `${month}-${day}`;
    });
  };

  const getUpcomingBirthdays = (days: number = 7) => {
    const today = new Date();
    const upcoming = members.filter((member) => {
      if (!member.birthday) return false;
      const [year, month, day] = member.birthday.split("-").map(Number);
      const bdayThisYear = new Date(today.getFullYear(), month - 1, day);
      if (bdayThisYear < today) {
        bdayThisYear.setFullYear(bdayThisYear.getFullYear() + 1);
      }
      const diffDays = Math.ceil((bdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= days;
    });
    return upcoming;
  };

  return {
    members,
    isLoading,
    createMember,
    updateMember,
    deleteMember,
    getTodaysBirthdays,
    getUpcomingBirthdays,
  };
};
