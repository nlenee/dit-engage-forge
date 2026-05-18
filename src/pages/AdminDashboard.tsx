import { useState } from "react";
import { format } from "date-fns";
import {
  Users,
  FileText,
  Mail,
  Shield,
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  Loader2,
  UserPlus,
  Crown,
  BarChart3,
  Cake,
  Send,
  FileEdit,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Header from "@/components/Header";
import { AdminInviteDialog } from "@/components/AdminInviteDialog";
import { EmailAnalyticsDashboard } from "@/components/EmailAnalyticsDashboard";
import { MemberManagement } from "@/components/MemberManagement";
import { EmailTemplateManager } from "@/components/EmailTemplateManager";
import { EmailCampaignManager } from "@/components/EmailCampaignManager";
import PasswordResetRequests from "@/components/PasswordResetRequests";
import { useAdminData } from "@/hooks/useAdminData";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { getCountryName, getStateName } from "@/data/countries";

type AppRole = "admin" | "user" | "executive_secretary" | "community_manager" | "chief_finance_officer";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, isAdminOrES, loading } = useAuth();
  const {
    users,
    usersLoading,
    allLetters,
    lettersLoading,
    emailLogs,
    emailLogsLoading,
    updateUserRole,
  } = useAdminData();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleChangeUser, setRoleChangeUser] = useState<{
    userId: string;
    name: string;
    newRole: AppRole;
  } | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdminOrES) {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.user_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLetters = allLetters.filter(
    (letter) =>
      letter.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      letter.office?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEmails = emailLogs.filter(
    (log) =>
      log.recipient_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalUsers: users.length,
    adminUsers: users.filter((u) => u.role === "admin" || u.role === "executive_secretary").length,
    totalLetters: allLetters.length,
    sentEmails: emailLogs.filter((e) => e.status === "sent").length,
    deliveredEmails: emailLogs.filter((e) => e.delivery_status === "delivered").length,
    bouncedEmails: emailLogs.filter((e) => e.bounced_at).length,
  };

  const getDeliveryStatusBadge = (log: typeof emailLogs[0]) => {
    if (log.bounced_at) {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Bounced
        </Badge>
      );
    }
    if (log.opened_at) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <Eye className="h-3 w-3 mr-1" />
          Opened
        </Badge>
      );
    }
    if (log.delivery_status === "delivered") {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Delivered
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "executive_secretary":
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
            <Crown className="h-3 w-3 mr-1" />
            Executive Secretary
          </Badge>
        );
      case "admin":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      case "community_manager":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            Community Manager
          </Badge>
        );
      case "chief_finance_officer":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            CFO
          </Badge>
        );
      default:
        return <Badge variant="secondary">Member</Badge>;
    }
  };

  const handleRoleChange = async () => {
    if (roleChangeUser) {
      await updateUserRole.mutateAsync({
        userId: roleChangeUser.userId,
        role: roleChangeUser.newRole,
      });
      setRoleChangeUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              Admin Dashboard
              {isAdmin && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">
              Manage users, members, view all letters, and monitor email delivery.
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Admin
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600" },
            { label: "Admins", value: stats.adminUsers, icon: Shield, color: "text-purple-600" },
            { label: "Total Letters", value: stats.totalLetters, icon: FileText, color: "text-dit-navy" },
            { label: "Emails Sent", value: stats.sentEmails, icon: Mail, color: "text-green-600" },
            { label: "Delivered", value: stats.deliveredEmails, icon: CheckCircle, color: "text-emerald-600" },
            { label: "Bounced", value: stats.bouncedEmails, icon: AlertTriangle, color: "text-red-600" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-card rounded-xl p-4 shadow-soft border border-border/50"
            >
              <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users, letters, or emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Cake className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="letters" className="gap-2">
              <FileText className="h-4 w-4" />
              Letters
            </TabsTrigger>
            <TabsTrigger value="emails" className="gap-2">
              <Mail className="h-4 w-4" />
              Email Logs
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileEdit className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Send className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="password-resets" className="gap-2">
              <KeyRound className="h-4 w-4" />
              Resets
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="bg-card rounded-xl border border-border/50 shadow-soft overflow-hidden">
              {usersLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.full_name || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs font-mono">
                          {user.user_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {isAdmin ? (
                            <Select
                              value={user.role}
                              onValueChange={(value: AppRole) =>
                                setRoleChangeUser({
                                  userId: user.user_id,
                                  name: user.full_name || "this user",
                                  newRole: value,
                                })
                              }
                            >
                              <SelectTrigger className="w-40 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Member</SelectItem>
                                <SelectItem value="community_manager">Community Manager</SelectItem>
                                <SelectItem value="chief_finance_officer">CFO</SelectItem>
                                <SelectItem value="executive_secretary">Executive Secretary</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            getRoleBadge(user.role)
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(user.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <MemberManagement />
          </TabsContent>

          {/* Letters Tab */}
          <TabsContent value="letters">
            <div className="bg-card rounded-xl border border-border/50 shadow-soft overflow-hidden">
              {lettersLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Office</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLetters.map((letter) => (
                      <TableRow key={letter.id}>
                        <TableCell className="font-medium">
                          {letter.recipient_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {letter.office}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {letter.state && `${getStateName(letter.country, letter.state)}, `}
                          {getCountryName(letter.country)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              letter.status === "sent"
                                ? "bg-green-100 text-green-700"
                                : letter.status === "downloaded"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                            }
                          >
                            {letter.status || "draft"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(letter.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/edit/${letter.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Email Logs Tab */}
          <TabsContent value="emails">
            <div className="bg-card rounded-xl border border-border/50 shadow-soft overflow-hidden">
              {emailLogsLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Sent At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmails.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.recipient_email}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {log.subject}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              log.status === "sent"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{getDeliveryStatusBadge(log)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(log.sent_at), "MMM d, yyyy HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <EmailAnalyticsDashboard />
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <EmailTemplateManager />
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <EmailCampaignManager />
          </TabsContent>

          {/* Password Reset Requests Tab */}
          <TabsContent value="password-resets">
            <PasswordResetRequests />
          </TabsContent>
        </Tabs>
      </main>

      {/* Role Change Confirmation */}
      <AlertDialog open={!!roleChangeUser} onOpenChange={() => setRoleChangeUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change {roleChangeUser?.name}'s role to{" "}
              <strong>{roleChangeUser?.newRole}</strong>?
              {roleChangeUser?.newRole === "admin" &&
                " This will give them full administrative access."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange}>
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Invite Dialog */}
      <AdminInviteDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} />
    </div>
  );
};

export default AdminDashboard;
