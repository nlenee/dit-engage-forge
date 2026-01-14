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
  created_at: string;
  updated_at: string;
}

export const useMembers = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("full_name", { ascending: true });

      if (error) throw error;
      return data as Member[];
    },
    enabled: !!user && isAdmin,
  });

  const createMember = useMutation({
    mutationFn: async (data: { full_name: string; email: string; phone?: string; birthday?: string }) => {
      const { data: member, error } = await supabase
        .from("members")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({ title: "Member added", description: "New member has been registered." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; full_name?: string; email?: string; phone?: string; birthday?: string }) => {
      const { error } = await supabase.from("members").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({ title: "Member updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
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
