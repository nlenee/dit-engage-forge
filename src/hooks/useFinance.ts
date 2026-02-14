import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const useFinance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["financial_transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("*")
        .order("transaction_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .order("fiscal_year", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["fundraising_campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fundraising_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createTransaction = useMutation({
    mutationFn: async (tx: { type: string; amount: number; description: string; category?: string; faction?: string; transaction_date: string; reference_number?: string }) => {
      const { error } = await supabase.from("financial_transactions").insert({
        ...tx,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_transactions"] });
      toast({ title: "Transaction recorded" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createBudget = useMutation({
    mutationFn: async (budget: { name: string; fiscal_year: number; total_amount: number; category?: string; notes?: string }) => {
      const { error } = await supabase.from("budgets").insert({
        ...budget,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({ title: "Budget created" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateBudget = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; spent_amount?: number; status?: string; notes?: string }) => {
      const { error } = await supabase.from("budgets").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({ title: "Budget updated" });
    },
  });

  const createCampaign = useMutation({
    mutationFn: async (campaign: { name: string; description?: string; target_amount: number; start_date: string; end_date?: string }) => {
      const { error } = await supabase.from("fundraising_campaigns").insert({
        ...campaign,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fundraising_campaigns"] });
      toast({ title: "Campaign created" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; raised_amount?: number; contributors_count?: number; status?: string }) => {
      const { error } = await supabase.from("fundraising_campaigns").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fundraising_campaigns"] });
      toast({ title: "Campaign updated" });
    },
  });

  // Computed stats
  const totalFunds = transactions.reduce((sum, t) => sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthlyTransactions = transactions.filter((t) => {
    const d = new Date(t.transaction_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthlyIncome = monthlyTransactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const monthlyExpenses = monthlyTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const totalBudget = budgets.filter((b) => b.status === "active").reduce((s, b) => s + Number(b.total_amount), 0);
  const totalSpent = budgets.filter((b) => b.status === "active").reduce((s, b) => s + Number(b.spent_amount), 0);
  const budgetUtilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return {
    transactions, transactionsLoading,
    budgets, budgetsLoading,
    campaigns, campaignsLoading,
    createTransaction, createBudget, updateBudget, createCampaign, updateCampaign,
    totalFunds, monthlyIncome, monthlyExpenses, budgetUtilization,
  };
};
