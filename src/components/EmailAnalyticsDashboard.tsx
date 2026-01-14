import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, CheckCircle, Eye, XCircle, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { useEmailAnalytics } from "@/hooks/useEmailAnalytics";
import { format } from "date-fns";

export const EmailAnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState<number>(30);
  const { stats, dailyStats, recentBounces, isLoading } = useEmailAnalytics(timeRange);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Sent", value: stats.total, icon: Mail, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Delivered", value: stats.delivered, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", rate: stats.deliveryRate },
    { label: "Opened", value: stats.opened, icon: Eye, color: "text-purple-600", bg: "bg-purple-50", rate: stats.openRate },
    { label: "Bounced", value: stats.bounced, icon: XCircle, color: "text-red-600", bg: "bg-red-50", rate: stats.bounceRate },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Email Analytics</h2>
        <Tabs value={String(timeRange)} onValueChange={(v) => setTimeRange(Number(v))}>
          <TabsList>
            <TabsTrigger value="7">7 days</TabsTrigger>
            <TabsTrigger value="30">30 days</TabsTrigger>
            <TabsTrigger value="90">90 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    {stat.rate !== undefined && (
                      <Badge variant="secondary" className="text-xs">
                        {stat.rate}%
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Email Volume Over Time</CardTitle>
            <CardDescription>Daily email sending activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sent" stroke="hsl(var(--primary))" strokeWidth={2} name="Sent" />
                <Line type="monotone" dataKey="delivered" stroke="#22c55e" strokeWidth={2} name="Delivered" />
                <Line type="monotone" dataKey="opened" stroke="#a855f7" strokeWidth={2} name="Opened" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delivery Performance</CardTitle>
            <CardDescription>Comparison of email outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Bar dataKey="delivered" fill="#22c55e" name="Delivered" />
                <Bar dataKey="bounced" fill="#ef4444" name="Bounced" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bounces */}
      {recentBounces.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Recent Bounces
            </CardTitle>
            <CardDescription>Emails that failed to deliver</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBounces.map((bounce) => (
                <div key={bounce.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <p className="font-medium text-sm">{bounce.recipient_email}</p>
                    <p className="text-xs text-muted-foreground">{bounce.subject}</p>
                    {bounce.bounce_reason && (
                      <p className="text-xs text-red-600 mt-1">{bounce.bounce_reason}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {bounce.bounced_at && format(new Date(bounce.bounced_at), "MMM d, HH:mm")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
