import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const useEvents = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["event_attendance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_attendance")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const createEvent = useMutation({
    mutationFn: async (event: { title: string; description?: string; location?: string; event_date: string; event_end_date?: string; max_attendees?: number }) => {
      const { error } = await supabase.from("events").insert({
        ...event,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Event created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating event", description: error.message, variant: "destructive" });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; description?: string; location?: string; event_date?: string; status?: string }) => {
      const { error } = await supabase.from("events").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Event updated" });
    },
  });

  const registerAttendance = useMutation({
    mutationFn: async ({ eventId, userId, status }: { eventId: string; userId: string; status: string }) => {
      const { error } = await supabase.from("event_attendance").upsert({
        event_id: eventId,
        user_id: userId,
        status,
        checked_in_at: status === "attended" ? new Date().toISOString() : null,
      }, { onConflict: "event_id,user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_attendance"] });
    },
  });

  const getEventAttendance = (eventId: string) => attendance.filter((a) => a.event_id === eventId);

  return { events, isLoading, attendance, createEvent, updateEvent, registerAttendance, getEventAttendance };
};
