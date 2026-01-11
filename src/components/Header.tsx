import { FileText, LayoutDashboard, Plus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import ditLogo from "@/assets/dit-logo.jpg";

const Header = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/create", label: "New Letter", icon: Plus },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative overflow-hidden rounded-lg shadow-soft">
            <img 
              src={ditLogo} 
              alt="DIT Logo" 
              className="h-10 w-10 object-cover transition-transform group-hover:scale-105"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-semibold text-primary">
              DIT
            </span>
            <span className="text-xs text-muted-foreground -mt-1">
              Letter Generator
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? "bg-primary text-primary-foreground shadow-soft" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Header;
