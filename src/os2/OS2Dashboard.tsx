import { Link } from "react-router-dom";
import { ArrowRight, Bell, FileText, Users, ShieldCheck, Wallet, ClipboardCheck, BriefcaseBusiness, Megaphone, MessagesSquare, CalendarDays } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import OS2Shell from "./OS2Shell";
import { resolveOS2Role } from "./navigation";

const copy = {
  member: ["My Workspace", "Your day, organized.", "Stay informed and connected with your team."],
  community: ["Community Workspace", "Lead your community with clarity.", "Manage members, applications and communication."],
  finance: ["Finance Workspace", "Keep your financial work in focus.", "Access financial operations and organizational reporting."],
  secretary: ["Secretariat Workspace", "Keep official work moving.", "Draft correspondence and coordinate official communication."],
  executive: ["Executive Workspace", "Make the next decision count.", "Your leadership tools and organizational overview."],
  admin: ["Administration Workspace", "Keep DIT running smoothly.", "Oversight, access management and organizational operations."]
} as const;
type Tile = { title: string; desc: string; to: string; icon: typeof Bell; permission?: boolean };
export default function OS2Dashboard() {
  const auth = useAuth();
  const { inbox, unreadCount, isLoading: messagesLoading } = useMessages();
  const { announcements, isLoading: announcementsLoading } = useAnnouncements();
  const role = resolveOS2Role(auth);
  const [title, greeting, description] = copy[role];
  const canLetter = auth.isAdminOrES || auth.canAny(["letters.create"]);
  const canApplications = auth.isAdmin || auth.isCED || auth.isExecutiveSecretary || auth.isCommunityManager || auth.canAny(["applications.review"]);
  const tiles: Tile[] = [
    { title: "Messages", desc: "Your team inbox", to: "/messages", icon: MessagesSquare },
    { title: "Directory", desc: "Find DIT members", to: "/members", icon: Users },
    { title: "Announcements", desc: "Latest information", to: "/announcements", icon: Megaphone },
    { title: "Events", desc: "Community calendar", to: "/anniversary", icon: CalendarDays },
    { title: "Letters", desc: "Official correspondence", to: "/create", icon: FileText, permission: canLetter },
    { title: "Applications", desc: "Review applicants", to: "/dashboard/applications", icon: ClipboardCheck, permission: canApplications },
    { title: "Finance", desc: "Budgets and transactions", to: "/finance", icon: Wallet, permission: auth.isCFO || auth.isAdmin || auth.canAny(["finance.view", "finance.manage", "view_financials"]) },
    { title: "Community", desc: "Member operations", to: "/community", icon: Users, permission: auth.isCommunityManager || auth.isAdmin || auth.canAny(["members.manage", "directory.manage", "view_all_members"]) },
    { title: "Executive reports", desc: "Leadership insights", to: "/executive-summary", icon: BriefcaseBusiness, permission: auth.isAdminOrES || auth.canAny(["view_reports", "view_executive_system"]) },
    { title: "Administration", desc: "Access and controls", to: "/admin", icon: ShieldCheck, permission: auth.isAdminOrES || auth.canAny(["admin.settings", "offices.manage"]) }
  ].filter(x => x.permission !== false);
  const os2Href = (path: string) => ({ "/messages": "/os2-preview/messages", "/members": "/os2-preview/members", "/announcements": "/os2-preview/announcements", "/finance": "/os2-preview/finance", "/community": "/os2-preview/community", "/create": "/os2-preview/letters", "/dashboard/applications": "/os2-preview/applications", "/executive-summary": "/os2-preview/executive", "/admin": "/os2-preview/admin" } as Record<string, string>)[path] || path;
  return <OS2Shell title={title} description={description}>
    <section className="os2-welcome">
      <div><p>WELCOME TO YOUR WORKSPACE</p><h2>{greeting}</h2><span>What needs your attention today?</span></div>
      <Link to="/os2-preview/messages" className="os2-hero-action">Open inbox <ArrowRight size={16}/></Link>
    </section>
    <div className="os2-stat-grid" aria-label="Workspace overview">
      <Link to="/messages" className="os2-stat"><MessagesSquare size={19}/><span>Unread messages</span><strong>{messagesLoading ? "—" : unreadCount}</strong><small>{messagesLoading ? "Loading messages…" : unreadCount ? "Waiting for your attention" : "You're all caught up"}</small></Link>
      <Link to="/os2-preview/announcements" className="os2-stat"><Megaphone size={19}/><span>Announcements</span><strong>{announcementsLoading ? "—" : announcements.length}</strong><small>{announcementsLoading ? "Loading announcements…" : "Available to your account"}</small></Link>
      <Link to="/os2-preview/members" className="os2-stat"><Users size={19}/><span>People</span><strong>Directory</strong><small>Connect with your team</small></Link>
      <Link to="/profile" className="os2-stat"><ShieldCheck size={19}/><span>My account</span><strong>Profile</strong><small>Manage your information</small></Link>
    </div>
    <div className="os2-dashboard-grid">
      <section className="os2-panel"><div className="os2-panel-heading"><div><h3>Quick access</h3><p>Tools available for your role</p></div></div>
        <div className="os2-quick-grid">{tiles.map(({ title: label, desc, to, icon: Icon }) => <Link key={to} to={os2Href(to)} className="os2-quick-tile"><div className="os2-tile-icon"><Icon size={19}/></div><strong>{label}</strong><span>{desc}</span><ArrowRight size={15} className="os2-tile-arrow"/></Link>)}</div>
      </section>
      <div className="os2-side-panels">
        <section className="os2-panel"><div className="os2-panel-heading"><div><h3>Recent messages</h3><p>Your latest conversations</p></div><Link to="/messages">View all</Link></div>
          {messagesLoading ? <p className="os2-state">Loading your messages…</p> : inbox.length === 0 ? <p className="os2-state">No messages yet. Your conversations will appear here.</p> : <div className="os2-feed">{inbox.slice(0,3).map(m=><Link to="/messages" key={m.id} className="os2-feed-row"><i className={m.read_at?"os2-dot-muted":"os2-dot"}/><div><strong>{m.subject || "Message"}</strong><span>{m.body}</span></div></Link>)}</div>}
        </section>
        <section className="os2-panel"><div className="os2-panel-heading"><div><h3>Announcements</h3><p>Updates from DIT</p></div><Link to="/announcements">View all</Link></div>
          {announcementsLoading ? <p className="os2-state">Loading announcements…</p> : announcements.length === 0 ? <p className="os2-state">No announcements available.</p> : <div className="os2-feed">{announcements.slice(0,3).map(a=><Link to="/announcements" key={a.id} className="os2-feed-row"><i className="os2-dot-muted"/><div><strong>{a.title}</strong><span>{a.message}</span></div></Link>)}</div>}
        </section>
      </div>
    </div>
  </OS2Shell>;
}
