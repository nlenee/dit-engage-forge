import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { subDays, format, startOfDay, endOfDay } from "date-fns";

export interface EmailStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  bounced: number;
  pending: number;
  deliveryRate: number;
  openRate: number;
  bounceRate: number;
}

export interface DailyStats {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  bounced: number;
}

export const useEmailAnalytics = (days: number = 30) => {
  const { user, isAdmin } = useAuth();

  const { data: emailLogs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ["email-logs", days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days).toISOString();
      
      let query = supabase
        .from("email_logs")
        .select("*")
        .gte("sent_at", startDate)
        .order("sent_at", { ascending: false });

      if (!isAdmin) {
        query = query.eq("sent_by", user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const stats: EmailStats = {
    total: emailLogs.length,
    sent: emailLogs.filter((l) => l.delivery_status === "sent" || l.delivery_status === "delivered" || l.delivery_status === "opened").length,
    delivered: emailLogs.filter((l) => l.delivery_status === "delivered" || l.delivery_status === "opened").length,
    opened: emailLogs.filter((l) => l.delivery_status === "opened").length,
    bounced: emailLogs.filter((l) => l.delivery_status === "bounced").length,
    pending: emailLogs.filter((l) => l.delivery_status === "pending").length,
    deliveryRate: 0,
    openRate: 0,
    bounceRate: 0,
  };

  if (stats.total > 0) {
    stats.deliveryRate = Math.round((stats.delivered / stats.total) * 100);
    stats.openRate = stats.delivered > 0 ? Math.round((stats.opened / stats.delivered) * 100) : 0;
    stats.bounceRate = Math.round((stats.bounced / stats.total) * 100);
  }

  const dailyStats: DailyStats[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const dayLogs = emailLogs.filter((log) => {
      const sentAt = new Date(log.sent_at);
      return sentAt >= dayStart && sentAt <= dayEnd;
    });

    dailyStats.push({
      date: format(date, "MMM d"),
      sent: dayLogs.length,
      delivered: dayLogs.filter((l) => l.delivery_status === "delivered" || l.delivery_status === "opened").length,
      opened: dayLogs.filter((l) => l.delivery_status === "opened").length,
      bounced: dayLogs.filter((l) => l.delivery_status === "bounced").length,
    });
  }

  const recentBounces = emailLogs
    .filter((l) => l.delivery_status === "bounced")
    .slice(0, 10);

  return {
    emailLogs,
    stats,
    dailyStats,
    recentBounces,
    isLoading: isLoadingLogs,
  };
};
