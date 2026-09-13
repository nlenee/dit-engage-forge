import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface PlatformMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  body: string;
  parent_id: string | null;
  read_at: string | null;
  created_at: string;
}

const setBadge = (count: number) => {
  const nav = navigator as Navigator & {
    setAppBadge?: (n?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };
  try {
    if (count > 0) void nav.setAppBadge?.(count);
    else void nav.clearAppBadge?.();
  } catch {
    /* badging unsupported — ignore */
  }
};

export const useMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as PlatformMessage[];
    },
  });

  const inbox = messages.filter((m) => m.recipient_id === user?.id);
  const sent = messages.filter((m) => m.sender_id === user?.id);
  const unreadCount = inbox.filter((m) => !m.read_at).length;

  // Live updates + installed-app icon badge
  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    const channel = supabase
      .channel(`messages-live-${userId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => queryClient.invalidateQueries({ queryKey: ["messages", userId] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  useEffect(() => {
    if (user) setBadge(unreadCount);
  }, [unreadCount, user]);

  const sendMessage = useMutation({
    mutationFn: async (input: {
      recipient_id: string;
      subject: string;
      body: string;
      parent_id?: string | null;
    }) => {
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          recipient_id: input.recipient_id,
          subject: input.subject.trim() || "(no subject)",
          body: input.body.trim(),
          parent_id: input.parent_id ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      // Notify the recipient by DIT mail (non-blocking for the sender)
      try {
        await supabase.functions.invoke("send-message-notification", {
          body: { message_id: data.id },
        });
      } catch (e) {
        console.warn("[messages] notification email failed", e);
      }
      return data as PlatformMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", user?.id] });
      toast({ title: "Message sent", description: "They'll also get an email alert." });
    },
    onError: (e: Error) =>
      toast({ title: "Could not send", description: e.message, variant: "destructive" }),
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages", user?.id] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("recipient_id", user.id)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages", user?.id] }),
  });

  return { messages, inbox, sent, unreadCount, isLoading, sendMessage, markRead, markAllRead };
};
