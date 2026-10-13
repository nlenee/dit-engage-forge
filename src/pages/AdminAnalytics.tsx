import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Users, TrendingUp, Cake } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import Header from "@/components/Header";
import { AccessDenied, PageLoader } from "@/components/RouteAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays } from "date-fns";
import { getCountryName } from "@/data/countries";
import { Button } from "@/components/ui/button";

const FACTION_COLORS = ["#4f46e5", "#22d3ee", "#f59e0b", "#ec4899", "#10b981"];

export default function AdminAnalytics() {
  const { isAdmin, loading , canAny } = useAuth();
  const [period, setPeriod] = useState<7 | 30 | 90>(30);

  const { data: profiles = [], isLoading: profilesLoading, isError, refetch } = useQuery({
    queryKey: ["analytics-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, faction, residence_country, date_of_birth, created_at, xp");
      if (error) throw error;
      return data || [];
    },
  });

  if (loading || profilesLoading) return <PageLoader />;
  if (!isAdmin && !canAny(["view_reports", "export_data"])) return <AccessDenied description="Analytics are available to Admin users and offices granted reporting access." />;

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
    const rawCountry = p.residence_country.trim();
    const resolvedCountry = getCountryName(rawCountry.toUpperCase());
    const country = resolvedCountry === rawCountry.toUpperCase() ? rawCountry : resolvedCountry;
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});
  const geoData = Object.entries(geoCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  // Signup trend last 30 days
  const trend = Array.from({ length: period }).map((_, i) => {
    const d = subDays(new Date(), period - 1 - i);
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
      <main className="container mx-auto px-3 py-6 sm:px-4 sm:py-8 max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-widest text-primary">DIT Workspace · Insights</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2"><BarChart3 className="h-7 w-7 text-primary"/> Administrative Insights</h1>
            <p className="mt-1 text-sm text-muted-foreground">Membership trends and organizational reach.</p>
          </div>
          <div className="flex gap-1 rounded-lg border bg-card p-1" role="group" aria-label="Reporting period">
            {([7,30,90] as const).map(days => <Button key={days} size="sm" variant={period===days ? "default" : "ghost"} aria-pressed={period===days} onClick={()=>setPeriod(days)}>{days} days</Button>)}
          </div>
        </div>
        {isError && <div role="alert" className="mb-4 rounded-lg border p-4 text-sm">Analytics could not load. <Button size="sm" variant="outline" onClick={()=>void refetch()}>Retry</Button></div>}
        {!isError && profiles.length===0 && <p className="mb-4 rounded-lg border p-4 text-sm text-muted-foreground">No membership data available yet.</p>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6">
          {[
            { label: "Total Members", value: profiles.length, icon: Users },
            { label: "Factions", value: Object.keys(factionCounts).length, icon: TrendingUp },
            { label: "Countries", value: Object.keys(geoCounts).length, icon: Users },
            { label: "Birthdays Tracked", value: profiles.filter((p:any)=>p.date_of_birth).length, icon: Cake },
          ].map((s) => (
            <Card key={s.label}><CardContent className="p-3 sm:p-5">
              <s.icon className="h-5 w-5 text-primary mb-2" />
              <div className="text-2xl sm:text-3xl font-bold tabular-nums">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent></Card>
          ))}
        </div>

        <div className="grid min-w-0 lg:grid-cols-2 gap-3 sm:gap-6">
          <Card><CardHeader><CardTitle>Signup Growth ({period} days)</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip /><Line type="monotone" dataKey="signups" stroke="#4f46e5" strokeWidth={2} dot={false} /></LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card><CardHeader><CardTitle>Members per Faction</CardTitle></CardHeader>
            <CardContent className="min-h-72">
              <div className="h-56 sm:h-64"><ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={factionData} dataKey="value" nameKey="name" outerRadius="78%" label={false}>
                    {factionData.map((_, i) => <Cell key={i} fill={FACTION_COLORS[i % FACTION_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer></div>
              <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {factionData.map((item,i) => <li key={item.name} className="flex items-center justify-between gap-2 min-w-0">
                  <span className="min-w-0 flex items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{backgroundColor:FACTION_COLORS[i%FACTION_COLORS.length]}}/><span className="break-words">{item.name}</span></span>
                  <strong className="tabular-nums">{item.value}</strong>
                </li>)}
              </ul>
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
