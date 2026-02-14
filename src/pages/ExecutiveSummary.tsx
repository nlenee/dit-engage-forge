import { Loader2, FileText, Activity, DollarSign, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useEvents } from "@/hooks/useEvents";
import { useEngagement } from "@/hooks/useEngagement";
import { useFinance } from "@/hooks/useFinance";
import { useLetters } from "@/hooks/useLetters";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";

const ExecutiveSummary = () => {
  const { isAdmin, isAdminOrES, loading } = useAuth();
  const { events, attendance } = useEvents();
  const { engagementLogs } = useEngagement();
  const { transactions, totalFunds, monthlyIncome, monthlyExpenses, budgets, campaigns, budgetUtilization } = useFinance();
  const { letters } = useLetters();
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles_exec"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!isAdminOrES) return <Navigate to="/" replace />;

  const currentMonth = format(new Date(), "MMMM yyyy");
  const totalMembers = profiles.length;
  const activeMembers = profiles.filter((p) => p.status === "active").length;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const newMembers = profiles.filter((p) => p.created_at >= thirtyDaysAgo).length;
  const totalEvents = events.length;
  const totalAttendance = attendance.length;
  const totalEngagementLogs = engagementLogs.length;
  const totalLetters = letters.length;
  const sentLetters = letters.filter((l) => l.status === "sent").length;

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Executive_Summary_${format(new Date(), "yyyy-MM")}.pdf`);
      toast({ title: "Report downloaded" });
    } catch {
      toast({ title: "Error generating PDF", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Monthly Executive Summary
            </h1>
            <p className="text-muted-foreground">{currentMonth} — Governance Report</p>
          </div>
          <Button onClick={handleDownloadPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>

        <div ref={reportRef} className="space-y-6 bg-card p-8 rounded-xl border border-border/50">
          <div className="text-center border-b border-border pb-4">
            <h2 className="font-display text-2xl font-bold text-primary">DIT Governance Report</h2>
            <p className="text-muted-foreground">{currentMonth}</p>
          </div>

          {/* Community Section */}
          <div>
            <h3 className="font-display text-lg font-semibold flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-primary" />
              Community & Engagement Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Members" value={totalMembers} />
              <StatCard label="Active Members" value={activeMembers} />
              <StatCard label="New Members (30d)" value={newMembers} />
              <StatCard label="Engagement Logs" value={totalEngagementLogs} />
              <StatCard label="Total Events" value={totalEvents} />
              <StatCard label="Total Attendance" value={totalAttendance} />
              <StatCard label="Engagement Rate" value={`${totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0}%`} />
            </div>
          </div>

          {/* Finance Section */}
          <div>
            <h3 className="font-display text-lg font-semibold flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-primary" />
              Financial Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Funds" value={formatCurrency(totalFunds)} />
              <StatCard label="Monthly Income" value={formatCurrency(monthlyIncome)} />
              <StatCard label="Monthly Expenses" value={formatCurrency(monthlyExpenses)} />
              <StatCard label="Budget Utilization" value={`${budgetUtilization}%`} />
              <StatCard label="Active Budgets" value={budgets.filter((b) => b.status === "active").length} />
              <StatCard label="Active Campaigns" value={campaigns.filter((c) => c.status === "active").length} />
            </div>
          </div>

          {/* Documentation Section */}
          <div>
            <h3 className="font-display text-lg font-semibold flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              Documentation Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Letters" value={totalLetters} />
              <StatCard label="Letters Sent" value={sentLetters} />
              <StatCard label="Drafts" value={letters.filter((l) => l.status === "draft").length} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-muted/50 rounded-lg p-3">
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export default ExecutiveSummary;
