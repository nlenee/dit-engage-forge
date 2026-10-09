import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users, MessagesSquare, FileText, Megaphone, CalendarDays, Wallet, ClipboardCheck, BarChart3, Shield, UserRound, Network, Sparkles } from "lucide-react";

export type OS2Role = "member" | "community" | "finance" | "secretary" | "executive" | "admin";
export type AccessContext = {
  isAdmin: boolean; isCED: boolean; isAdminOrES: boolean; isExecutiveSecretary: boolean;
  isCommunityManager: boolean; isCFO: boolean; isED: boolean; isEA: boolean;
  canAny: (permissions: string[]) => boolean;
};
export type NavLink = { label: string; to: string; icon: LucideIcon; section: "workspace" | "organization" | "management"; allowed?: (access: AccessContext) => boolean };
export const navLinks: NavLink[] = [
  { label: "My Workspace", to: "/os2-preview", icon: LayoutDashboard, section: "workspace" },
  { label: "Messages", to: "/messages", icon: MessagesSquare, section: "workspace" },
  { label: "My Profile", to: "/profile", icon: UserRound, section: "workspace" },
  { label: "People & Teams", to: "/members", icon: Users, section: "organization" },
  { label: "Announcements", to: "/announcements", icon: Megaphone, section: "organization" },
  { label: "Org Structure", to: "/structure", icon: Network, section: "organization" },
  { label: "Events & Anniversary", to: "/anniversary", icon: CalendarDays, section: "organization" },
  { label: "Facecard", to: "/facecard", icon: Sparkles, section: "organization" },
  { label: "Create Letter", to: "/create", icon: FileText, section: "management", allowed: a => a.isAdminOrES || a.canAny(["letters.create"]) },
  { label: "Applications", to: "/dashboard/applications", icon: ClipboardCheck, section: "management", allowed: a => a.isAdmin || a.isCED || a.isExecutiveSecretary || a.isCommunityManager || a.canAny(["applications.review"]) },
  { label: "Community", to: "/community", icon: Users, section: "management", allowed: a => a.isCommunityManager || a.isAdmin || a.canAny(["members.manage", "directory.manage", "view_all_members"]) },
  { label: "Finance", to: "/finance", icon: Wallet, section: "management", allowed: a => a.isCFO || a.isAdmin || a.canAny(["finance.view", "finance.manage", "view_financials"]) },
  { label: "Executive Reports", to: "/executive-summary", icon: BarChart3, section: "management", allowed: a => a.isAdminOrES || a.canAny(["view_reports", "view_executive_system"]) },
  { label: "Analytics", to: "/analytics", icon: BarChart3, section: "management", allowed: a => a.isAdmin || a.isCED || a.canAny(["view_reports", "export_data"]) },
  { label: "Administration", to: "/admin", icon: Shield, section: "management", allowed: a => a.isAdminOrES || a.canAny(["admin.settings", "offices.manage"]) }
];
export function resolveOS2Role(a: AccessContext): OS2Role {
  if (a.isAdmin) return "admin";
  if (a.isCED || a.isED || a.isEA) return "executive";
  if (a.isExecutiveSecretary) return "secretary";
  if (a.isCFO) return "finance";
  if (a.isCommunityManager) return "community";
  return "member";
}
