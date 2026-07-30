import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Faction {
  id: string;
  code: string;
  name: string;
  description: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FactionMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  faction_id: string | null;
  avatar_url: string | null;
  executive_role: string | null;
  executive_role_abbr: string | null;
}

export const useFactions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: factions = [], isLoading: factionsLoading } = useQuery({
    queryKey: ["factions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("factions")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []) as Faction[];
    },
  });

  // Always fresh — faction membership must never be served stale.
  const { data: memberProfiles = [], isLoading: membersLoading } = useQuery({
    queryKey: ["faction-member-profiles"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email, faction_id, avatar_url, executive_role, executive_role_abbr")
        .order("full_name");
      if (error) throw error;
      return (data || []) as unknown as FactionMember[];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["factions"] });
    queryClient.invalidateQueries({ queryKey: ["faction-member-profiles"] });
    queryClient.invalidateQueries({ queryKey: ["members"] });
  };

  const createFaction = useMutation({
    mutationFn: async (input: { code: string; name: string; description?: string; color?: string }) => {
      const { error } = await supabase.from("factions").insert({
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        description: input.description?.trim() || null,
        color: input.color || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Faction created" });
    },
    onError: (e: any) => toast({ title: "Could not create faction", description: e.message, variant: "destructive" }),
  });

  const updateFaction = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Faction> & { id: string }) => {
      const { error } = await supabase.from("factions").update(patch as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Faction updated" });
    },
    onError: (e: any) => toast({ title: "Could not update faction", description: e.message, variant: "destructive" }),
  });

  const deleteFaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("factions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Faction deleted", description: "Members in it are now unassigned." });
    },
    onError: (e: any) => toast({ title: "Could not delete faction", description: e.message, variant: "destructive" }),
  });

  const assignMember = useMutation({
    mutationFn: async ({ profileId, factionId }: { profileId: string; factionId: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ faction_id: factionId, ...(factionId ? {} : { faction: null }) } as any)
        .eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Membership updated" });
    },
    onError: (e: any) => toast({ title: "Could not update membership", description: e.message, variant: "destructive" }),
  });

  return {
    factions,
    factionsLoading,
    memberProfiles,
    membersLoading,
    createFaction,
    updateFaction,
    deleteFaction,
    assignMember,
  };
};