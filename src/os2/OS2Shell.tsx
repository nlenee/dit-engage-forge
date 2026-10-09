import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, ChevronLeft, ChevronRight, LogOut, Menu, Search, X, Settings2, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import ditLogo from "@/assets/dit-logo.jpg";
import { navLinks, type AccessContext } from "./navigation";
import "./os2.css";
import { readOS2Preference, saveOS2Preference } from "./os2Preference";

type Props = { children: ReactNode; title: string; description?: string; };
export default function OS2Shell({ children, title, description }: Props) {
  const auth = useAuth();
  const { unreadCount } = useMessages();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const access: AccessContext = auth;
  const sections = [
    { id: "workspace", title: "YOUR WORKSPACE" },
    { id: "organization", title: "ORGANIZATION" },
    { id: "management", title: "MANAGEMENT" }
  ] as const;
  const closeMenu = () => setMobileOpen(false);
  const switchToClassic = () => { saveOS2Preference("classic"); closeMenu(); };
  const [previewSelected, setPreviewSelected] = useState(() => readOS2Preference() === "os2");
  const selectPreview = () => { saveOS2Preference("os2"); setPreviewSelected(true); };
  const os2Href = (path: string) => ({ "/messages": "/os2-preview/messages", "/members": "/os2-preview/members", "/announcements": "/os2-preview/announcements", "/finance": "/os2-preview/finance", "/community": "/os2-preview/community", "/create": "/os2-preview/letters", "/dashboard/applications": "/os2-preview/applications", "/executive-summary": "/os2-preview/executive", "/admin": "/os2-preview/admin" } as Record<string, string>)[path] || path;
  const nav = (
    <>
      <Link to="/os2-preview" className="os2-brand" onClick={closeMenu}>
        <img src={ditLogo} alt="DIT logo" />
        <span><strong>DIT Operating System</strong><small>Workspace 2.0</small></span>
      </Link>
      <div className="os2-menu-scroll">
        {sections.map(section => {
          const links = navLinks.filter(item => item.section === section.id && (!item.allowed || item.allowed(access)));
          if (!links.length) return null;
          return <div className="os2-menu-group" key={section.id}>
            <div className="os2-section-title">{section.title}</div>
            {links.map(item => {
              const Icon = item.icon;
              const active = location.pathname === os2Href(item.to);
              return <Link key={item.to} to={os2Href(item.to)} onClick={closeMenu} title={item.label}
                className={`os2-menu-link ${active ? "os2-active" : ""}`}
                aria-current={active ? "page" : undefined}>
                <Icon size={18} aria-hidden="true" /><span>{item.label}</span>
                {item.to === "/messages" && unreadCount > 0 && <b className="os2-unread">{unreadCount > 99 ? "99+" : unreadCount}</b>}
              </Link>;
            })}
          </div>;
        })}
      </div>
      <div className="os2-sidebar-foot">
        <Link to="/dashboard" onClick={switchToClassic} className="os2-menu-link"><ChevronLeft size={18}/><span>Original dashboard</span></Link>
        <button type="button" className="os2-menu-link" onClick={() => void auth.signOut()}><LogOut size={18}/><span>Sign out</span></button>
      </div>
    </>
  );
  return <div className="os2-root">
    <aside aria-label="DIT OS navigation" className={`os2-sidebar ${collapsed ? "os2-collapsed" : ""}`}>
      {nav}
      <button aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="os2-collapse" onClick={() => setCollapsed(v => !v)} type="button">
        {collapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
      </button>
    </aside>
    {mobileOpen && <button type="button" aria-label="Close navigation overlay" className="os2-overlay" onClick={closeMenu}/>}
    <aside aria-label="Mobile navigation" className={`os2-mobile-nav ${mobileOpen ? "os2-mobile-open" : ""}`}>
      <button type="button" onClick={closeMenu} className="os2-mobile-close" aria-label="Close menu"><X/></button>
      {nav}
    </aside>
    <div className="os2-main">
      <header className="os2-topbar">
        <button type="button" className="os2-icon-button os2-menu-toggle" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={21}/></button>
        <div className="os2-breadcrumb"><span>DIT OS</span><ChevronRight size={15}/><strong>{title}</strong></div>
        <div className="os2-topbar-actions">
          <Link to="/os2-preview/members" className="os2-search-link"><Search size={17}/><span>Find members</span></Link>
          <Link to="/os2-preview/messages" className="os2-icon-button os2-bell" aria-label={`Messages: ${unreadCount} unread`}><Bell size={19}/>{unreadCount > 0 && <i/>}</Link>
          <Link to="/profile" className="os2-avatar" aria-label="My profile">{auth.user?.email?.slice(0,2).toUpperCase() || "ME"}</Link>
        </div>
      </header>
      <main id="main-content" className="os2-content">
        <div className="os2-page-heading"><div><p className="os2-eyebrow">DIT WORKSPACE</p><h1>{title}</h1>{description && <p>{description}</p>}</div><Link to="/dashboard" onClick={switchToClassic} className="os2-legacy-link"><Settings2 size={15}/> Original UI</Link></div>
        {auth.isAdmin && (
          <section className="os2-preview-preference" aria-label="Administrator interface preference">
            <div><strong>Administrator UI preview</strong><span>Changes apply only to this browser. Other members keep the classic interface.</span></div>
            <div className="os2-preference-actions">
              <Link to="/dashboard" onClick={switchToClassic} className="os2-preference-button">Classic UI</Link>
              <button type="button" aria-pressed={previewSelected} className="os2-preference-button os2-preference-current" onClick={selectPreview}>UI 2.0 preview</button>
            </div>
          </section>
        )}
        {children}
      </main>
      <nav className="os2-mobile-bottom" aria-label="Quick navigation">
        <Link to="/os2-preview" aria-label="Workspace"><LayoutDashboard size={20}/><span>Home</span></Link>
        <Link to="/os2-preview/messages" aria-label="Messages"><Bell size={20}/><span>Inbox</span></Link>
        <Link to="/os2-preview/members" aria-label="Members"><Search size={20}/><span>People</span></Link>
        <button type="button" onClick={() => setMobileOpen(true)} aria-label="More navigation"><Menu size={20}/><span>More</span></button>
      </nav>
    </div>
  </div>;
}
