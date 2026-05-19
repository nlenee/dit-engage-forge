import { useQuery } from "@tanstack/react-query";
import { BarChart3, Users, TrendingUp, Cake } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import Header from "@/components/Header";
import { AccessDenied, PageLoader } from "@/components/RouteAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays } from "date-fns";

const FACTION_COLORS = ["#4f46e5", "#22d3ee", "#f59e0b", "#ec4899", "#10b981"];

export default function AdminAnalytics() {
  const { isAdmin, loading } = useAuth();

  const { data: profiles = [] } = useQuery({
    queryKey: ["analytics-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, faction, residence_country, date_of_birth, created_at, xp");
      return data || [];
    },
  });

  if (loading) return <PageLoader />;
  if (!isAdmin) return <AccessDenied description="Analytics are available to Admin users only." />;

  // Per-faction
  const factionCounts = profiles.reduce<Record<string, number>>((acc, p: any) => {
    const k = p.faction || "Unassigned";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const factionData = Object.entries(factionCounts).map(([name, value]) => ({ name, value }));

  // Country
  const geoCounts = profiles.reduce<Record<string, number>>((acc, p: any) => {
    if (!p.residence_country) return acc;
    acc[p.residence_country] = (acc[p.residence_country] || 0) + 1;
    return acc;
  }, {});
  const geoData = Object.entries(geoCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  // Signup trend last 30 days
  const trend = Array.from({ length: 30 }).map((_, i) => {
    const d = subDays(new Date(), 29 - i);
    const key = format(d, "yyyy-MM-dd");
    const count = profiles.filter((p: any) => p.created_at?.slice(0, 10) === key).length;
    return { date: format(d, "MMM d"), signups: count };
  });

  // Birthdays per month
  const monthCounts = profiles.reduce<Record<string, number>>((acc, p: any) => {
    if (!p.date_of_birth) return acc;
    const m = format(new Date(p.date_of_birth), "MMM");
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});
  const monthOrder = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthData = monthOrder.map((m) => ({ month: m, count: monthCounts[m] || 0 }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="font-display text-3xl font-bold flex items-center gap-3 mb-8">
          <BarChart3 className="h-8 w-8 text-primary" /> Admin Analytics
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Members", value: profiles.length, icon: Users },
            { label: "Factions", value: Object.keys(factionCounts).length, icon: TrendingUp },
            { label: "Countries", value: Object.keys(geoCounts).length, icon: Users },
            { label: "Birthdays Tracked", value: profiles.filter((p:any)=>p.date_of_birth).length, icon: Cake },
          ].map((s) => (
            <Card key={s.label}><CardContent className="p-5">
              <s.icon className="h-5 w-5 text-primary mb-2" />
              <div className="text-3xl font-black">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent></Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card><CardHeader><CardTitle>Signup Growth (last 30 days)</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip /><Line type="monotone" dataKey="signups" stroke="#4f46e5" strokeWidth={2} dot={false} /></LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card><CardHeader><CardTitle>Members per Faction</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={factionData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {factionData.map((_, i) => <Cell key={i} fill={FACTION_COLORS[i % FACTION_COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card><CardHeader><CardTitle>Top Countries</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={geoData}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="value" fill="#22d3ee" /></BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card><CardHeader><CardTitle>Birthdays by Month</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthData}><XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="count" fill="#f59e0b" /></BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
