import { useState } from "react";
import { format } from "date-fns";
import {
  DollarSign, TrendingUp, TrendingDown, PieChart, Plus, Loader2,
  Receipt, Wallet, Target, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Header from "@/components/Header";
import { AccessDenied, PageLoader } from "@/components/RouteAccess";
import { useAuth } from "@/hooks/useAuth";
import { useFinance } from "@/hooks/useFinance";

const CFODashboard = () => {
  const { isCFO, isAdmin, loading } = useAuth();
  const {
    transactions, transactionsLoading,
    budgets, budgetsLoading,
    campaigns, campaignsLoading,
    createTransaction, createBudget, createCampaign, updateCampaign,
    totalFunds, monthlyIncome, monthlyExpenses, budgetUtilization,
  } = useFinance();

  const [txOpen, setTxOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [txForm, setTxForm] = useState({ type: "income", amount: "", description: "", category: "", faction: "", transaction_date: format(new Date(), "yyyy-MM-dd"), reference_number: "" });
  const [budgetForm, setBudgetForm] = useState({ name: "", fiscal_year: new Date().getFullYear().toString(), total_amount: "", category: "", notes: "" });
  const [campaignForm, setCampaignForm] = useState({ name: "", description: "", target_amount: "", start_date: format(new Date(), "yyyy-MM-dd"), end_date: "" });

  if (loading) return <PageLoader />;
  if (!isCFO && !isAdmin) return <AccessDenied description="Finance tools are available to Chief Finance Officer and Admin roles only." />;

  const handleCreateTx = async () => {
    await createTransaction.mutateAsync({
      type: txForm.type,
      amount: parseFloat(txForm.amount),
      description: txForm.description,
      category: txForm.category || undefined,
      faction: txForm.faction || undefined,
      transaction_date: txForm.transaction_date,
      reference_number: txForm.reference_number || undefined,
    });
    setTxOpen(false);
    setTxForm({ type: "income", amount: "", description: "", category: "", faction: "", transaction_date: format(new Date(), "yyyy-MM-dd"), reference_number: "" });
  };

  const handleCreateBudget = async () => {
    await createBudget.mutateAsync({
      name: budgetForm.name,
      fiscal_year: parseInt(budgetForm.fiscal_year),
      total_amount: parseFloat(budgetForm.total_amount),
      category: budgetForm.category || undefined,
      notes: budgetForm.notes || undefined,
    });
    setBudgetOpen(false);
    setBudgetForm({ name: "", fiscal_year: new Date().getFullYear().toString(), total_amount: "", category: "", notes: "" });
  };

  const handleCreateCampaign = async () => {
    await createCampaign.mutateAsync({
      name: campaignForm.name,
      description: campaignForm.description || undefined,
      target_amount: parseFloat(campaignForm.target_amount),
      start_date: campaignForm.start_date,
      end_date: campaignForm.end_date || undefined,
    });
    setCampaignOpen(false);
    setCampaignForm({ name: "", description: "", target_amount: "", start_date: format(new Date(), "yyyy-MM-dd"), end_date: "" });
  };

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-primary" />
            Chief Finance Officer Dashboard
          </h1>
          <p className="text-muted-foreground">Manage finances, budgets, and fundraising campaigns.</p>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Funds", value: formatCurrency(totalFunds), icon: Wallet, color: "text-blue-600" },
            { label: "Monthly Income", value: formatCurrency(monthlyIncome), icon: ArrowUpRight, color: "text-green-600" },
            { label: "Monthly Expenses", value: formatCurrency(monthlyExpenses), icon: ArrowDownRight, color: "text-red-600" },
            { label: "Budget Used", value: `${budgetUtilization}%`, icon: PieChart, color: "text-purple-600" },
            { label: "Active Campaigns", value: campaigns.filter((c) => c.status === "active").length, icon: Target, color: "text-primary" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="transactions" className="gap-2"><Receipt className="h-4 w-4" />Transactions</TabsTrigger>
            <TabsTrigger value="budgets" className="gap-2"><Wallet className="h-4 w-4" />Budgets</TabsTrigger>
            <TabsTrigger value="fundraising" className="gap-2"><Target className="h-4 w-4" />Fundraising</TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-xl font-semibold">Financial Transactions</h2>
              <Dialog open={txOpen} onOpenChange={setTxOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="h-4 w-4" />Log Transaction</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Log Transaction</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Type</Label>
                      <Select value={txForm.type} onValueChange={(v) => setTxForm((p) => ({ ...p, type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Amount</Label><Input type="number" value={txForm.amount} onChange={(e) => setTxForm((p) => ({ ...p, amount: e.target.value }))} /></div>
                    <div><Label>Description</Label><Input value={txForm.description} onChange={(e) => setTxForm((p) => ({ ...p, description: e.target.value }))} /></div>
                    <div><Label>Category</Label><Input value={txForm.category} onChange={(e) => setTxForm((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. Tithes, Donations" /></div>
                    <div><Label>Faction</Label><Input value={txForm.faction} onChange={(e) => setTxForm((p) => ({ ...p, faction: e.target.value }))} placeholder="Optional" /></div>
                    <div><Label>Date</Label><Input type="date" value={txForm.transaction_date} onChange={(e) => setTxForm((p) => ({ ...p, transaction_date: e.target.value }))} /></div>
                    <div><Label>Reference</Label><Input value={txForm.reference_number} onChange={(e) => setTxForm((p) => ({ ...p, reference_number: e.target.value }))} placeholder="Optional" /></div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateTx} disabled={!txForm.amount || !txForm.description}>Record</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-card rounded-xl border border-border/50 shadow-soft overflow-hidden">
              {transactionsLoading ? (
                <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No transactions yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-muted-foreground">{format(new Date(tx.transaction_date), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Badge className={tx.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                            {tx.type === "income" ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{tx.description}</TableCell>
                        <TableCell className="text-muted-foreground">{tx.category || "—"}</TableCell>
                        <TableCell className={`text-right font-semibold ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                          {tx.type === "income" ? "+" : "-"}{formatCurrency(Number(tx.amount))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Budgets Tab */}
          <TabsContent value="budgets">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-xl font-semibold">Budget Management</h2>
              <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="h-4 w-4" />Create Budget</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Budget</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Name</Label><Input value={budgetForm.name} onChange={(e) => setBudgetForm((p) => ({ ...p, name: e.target.value }))} /></div>
                    <div><Label>Fiscal Year</Label><Input type="number" value={budgetForm.fiscal_year} onChange={(e) => setBudgetForm((p) => ({ ...p, fiscal_year: e.target.value }))} /></div>
                    <div><Label>Total Amount</Label><Input type="number" value={budgetForm.total_amount} onChange={(e) => setBudgetForm((p) => ({ ...p, total_amount: e.target.value }))} /></div>
                    <div><Label>Category</Label><Input value={budgetForm.category} onChange={(e) => setBudgetForm((p) => ({ ...p, category: e.target.value }))} /></div>
                    <div><Label>Notes</Label><Textarea value={budgetForm.notes} onChange={(e) => setBudgetForm((p) => ({ ...p, notes: e.target.value }))} /></div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateBudget} disabled={!budgetForm.name || !budgetForm.total_amount}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {budgetsLoading ? (
                <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
              ) : budgets.length === 0 ? (
                <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">No budgets created yet.</div>
              ) : (
                budgets.map((b) => {
                  const utilization = Number(b.total_amount) > 0 ? Math.round((Number(b.spent_amount) / Number(b.total_amount)) * 100) : 0;
                  const isOverBudget = utilization > 100;
                  return (
                    <Card key={b.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">{b.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">FY {b.fiscal_year}</Badge>
                            {isOverBudget && <Badge className="bg-red-100 text-red-700">Over Budget</Badge>}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Spent: {formatCurrency(Number(b.spent_amount))}</span>
                          <span className="text-muted-foreground">Total: {formatCurrency(Number(b.total_amount))}</span>
                        </div>
                        <Progress value={Math.min(utilization, 100)} className={isOverBudget ? "[&>div]:bg-destructive" : ""} />
                        <p className="text-xs text-muted-foreground mt-1">{utilization}% utilized</p>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Fundraising Tab */}
          <TabsContent value="fundraising">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-xl font-semibold">Fundraising Campaigns</h2>
              <Dialog open={campaignOpen} onOpenChange={setCampaignOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="h-4 w-4" />New Campaign</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Campaign</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Name</Label><Input value={campaignForm.name} onChange={(e) => setCampaignForm((p) => ({ ...p, name: e.target.value }))} /></div>
                    <div><Label>Description</Label><Textarea value={campaignForm.description} onChange={(e) => setCampaignForm((p) => ({ ...p, description: e.target.value }))} /></div>
                    <div><Label>Target Amount</Label><Input type="number" value={campaignForm.target_amount} onChange={(e) => setCampaignForm((p) => ({ ...p, target_amount: e.target.value }))} /></div>
                    <div><Label>Start Date</Label><Input type="date" value={campaignForm.start_date} onChange={(e) => setCampaignForm((p) => ({ ...p, start_date: e.target.value }))} /></div>
                    <div><Label>End Date</Label><Input type="date" value={campaignForm.end_date} onChange={(e) => setCampaignForm((p) => ({ ...p, end_date: e.target.value }))} /></div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateCampaign} disabled={!campaignForm.name || !campaignForm.target_amount}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {campaignsLoading ? (
                <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
              ) : campaigns.length === 0 ? (
                <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">No campaigns yet.</div>
              ) : (
                campaigns.map((c) => {
                  const progress = Number(c.target_amount) > 0 ? Math.round((Number(c.raised_amount) / Number(c.target_amount)) * 100) : 0;
                  return (
                    <Card key={c.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">{c.name}</CardTitle>
                          <Badge className={c.status === "active" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}>{c.status}</Badge>
                        </div>
                        {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Raised: {formatCurrency(Number(c.raised_amount))}</span>
                          <span className="text-muted-foreground">Target: {formatCurrency(Number(c.target_amount))}</span>
                        </div>
                        <Progress value={Math.min(progress, 100)} />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{progress}% of target</span>
                          <span>{c.contributors_count} contributors</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CFODashboard;
