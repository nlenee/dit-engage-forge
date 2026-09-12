import { useState } from "react";
import { LayoutDashboard, LogOut, Plus, Shield, Users, Megaphone, User, Activity, DollarSign, ClipboardList, IdCard, Sparkles, BarChart3, Home, ClipboardCheck, Menu, MessageSquare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ditLogo from "@/assets/dit-logo.jpg";
import InstallButton from "@/components/pwa/InstallButton";
import { roleTitle } from "@/lib/roleLabels";

const Header = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAdmin, isExecutiveSecretary, isAdminOrES, isCommunityManager, isCFO, isCED, canAny, signOut } = useAuth();
  const { unreadCount } = useMessages();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/messages", label: "Messages", icon: MessageSquare, badge: unreadCount },
    { path: "/anniversary", label: "Anniversary", icon: Sparkles },
    { path: "/members", label: "Directory", icon: Users },
    { path: "/facecard", label: "Facecard", icon: IdCard },
    { path: "/announcements", label: "Announcements", icon: Megaphone },
    ...(isAdminOrES || canAny(["letters.create"]) ? [{ path: "/create", label: "New Letter", icon: Plus }] : []),
    ...(isCommunityManager || isAdmin || canAny(["members.manage", "directory.manage", "view_all_members"]) ? [{ path: "/community", label: "Community", icon: Activity }] : []),
    ...(isCFO || isAdmin || canAny(["finance.view", "finance.manage", "view_financials"]) ? [{ path: "/finance", label: "Finance", icon: DollarSign }] : []),
    ...(isAdminOrES || canAny(["view_reports", "view_executive_system"]) ? [{ path: "/executive-summary", label: "Summary", icon: ClipboardList }] : []),
    ...(isAdmin || isCED || canAny(["view_reports", "export_data"]) ? [{ path: "/analytics", label: "Analytics", icon: BarChart3 }] : []),
    ...(isAdmin || isCED || isExecutiveSecretary || isCommunityManager || canAny(["applications.review"]) ? [{ path: "/dashboard/applications", label: "Applications", icon: ClipboardCheck }] : []),
    ...(isAdminOrES || canAny(["admin.settings", "offices.manage"]) ? [{ path: "/admin", label: "Admin", icon: Shield }] : []),
  ] as { path: string; label: string; icon: typeof Users; badge?: number }[];

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "U";
  const roleLabel = roleTitle(
    isCED ? "chief_executive_director"
      : isAdmin ? "admin"
      : isExecutiveSecretary ? "executive_secretary"
      : isCommunityManager ? "community_manager"
      : isCFO ? "chief_finance_officer"
      : "user"
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 items-center justify-between gap-2 px-3 sm:px-4">
        <Link to="/dashboard" className="flex items-center gap-2 group shrink-0">
          <div className="relative overflow-hidden rounded-lg shadow-soft">
            <img src={ditLogo} alt="DIT Logo" className="h-8 w-8 sm:h-9 sm:w-9 object-cover transition-transform group-hover:scale-105" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-sm font-semibold text-primary">DIT</span>
            <span className="hidden text-[10px] text-muted-foreground -mt-0.5 sm:block">Community Platform</span>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 min-w-0 sm:gap-2">
          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 overflow-x-auto no-scrollbar lg:flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium whitespace-nowrap transition-all duration-200 xl:text-xs ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden xl:inline">{item.label}</span>
                  {!!item.badge && (
                    <span className="ml-0.5 rounded-full bg-destructive px-1.5 text-[10px] font-semibold leading-4 text-destructive-foreground">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <InstallButton />

          {/* Mobile menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-10 w-10 lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(20rem,85vw)] overflow-y-auto p-0">
              <SheetHeader className="border-b border-border px-4 py-4 text-left">
                <SheetTitle className="text-base">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMenuOpen(false)}
                      className={`flex min-h-[48px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                        isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {!!item.badge && (
                        <span className="rounded-full bg-destructive px-2 text-[11px] font-semibold leading-5 text-destructive-foreground">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex min-w-0 flex-col space-y-1 leading-none">
                  <p className="truncate text-sm font-medium">{user?.email}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {roleLabel}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/messages" className="flex items-center gap-2 cursor-pointer">
                  <MessageSquare className="h-4 w-4" />
                  Messages
                  {unreadCount > 0 && (
                    <span className="ml-auto rounded-full bg-destructive px-2 text-[11px] font-semibold leading-5 text-destructive-foreground">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/" className="flex items-center gap-2 cursor-pointer">
                  <Home className="h-4 w-4" />
                  Public landing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
