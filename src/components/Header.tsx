import { FileText, LayoutDashboard, LogOut, Plus, Shield, Users, Megaphone, User, Activity, DollarSign, ClipboardList, IdCard, Sparkles, BarChart3, Home, ClipboardCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ditLogo from "@/assets/dit-logo.jpg";
import InstallButton from "@/components/pwa/InstallButton";

const Header = () => {
  const location = useLocation();
  const { user, isAdmin, isExecutiveSecretary, isAdminOrES, isCommunityManager, isCFO, isCED, signOut } = useAuth();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/anniversary", label: "Anniversary", icon: Sparkles },
    { path: "/members", label: "Directory", icon: Users },
    { path: "/facecard", label: "Facecard", icon: IdCard },
    { path: "/announcements", label: "Announcements", icon: Megaphone },
    ...(isAdminOrES ? [{ path: "/create", label: "New Letter", icon: Plus }] : []),
    ...(isCommunityManager || isAdmin ? [{ path: "/community", label: "Community", icon: Activity }] : []),
    ...(isCFO || isAdmin ? [{ path: "/finance", label: "Finance", icon: DollarSign }] : []),
    ...(isAdminOrES ? [{ path: "/executive-summary", label: "Summary", icon: ClipboardList }] : []),
    ...(isAdmin || isCED ? [{ path: "/analytics", label: "Analytics", icon: BarChart3 }] : []),
    ...(isAdmin || isCED || isExecutiveSecretary || isCommunityManager ? [{ path: "/dashboard/applications", label: "Applications", icon: ClipboardCheck }] : []),
    ...(isAdminOrES ? [{ path: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "U";
  const roleLabel = isCED ? "Chief Executive Director" : isAdmin ? "Admin" : isExecutiveSecretary ? "Executive Secretary" : isCommunityManager ? "Community Manager" : isCFO ? "Chief Finance Officer" : "Member";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 items-center justify-between gap-2 px-3 sm:px-4">
        <Link to="/dashboard" className="flex items-center gap-2 group shrink-0">
          <div className="relative overflow-hidden rounded-lg shadow-soft">
            <img src={ditLogo} alt="DIT Logo" className="h-8 w-8 sm:h-9 sm:w-9 object-cover transition-transform group-hover:scale-105" />
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-display text-sm font-semibold text-primary">DIT</span>
            <span className="text-[10px] text-muted-foreground -mt-0.5">Community Platform</span>
          </div>
        </Link>

        <div className="flex items-center gap-2 min-w-0">
          <nav className="flex items-center gap-0.5 overflow-x-auto no-scrollbar max-w-[calc(100vw-9rem)]">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] xl:text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <InstallButton />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">{user?.email}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {roleLabel}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
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
