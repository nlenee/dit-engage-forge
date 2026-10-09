import type { ComponentType } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import OS2Shell from "./OS2Shell";
import { navLinks } from "./navigation";

type Module = "messages" | "members" | "announcements" | "finance" | "community" | "letters" | "applications" | "executive" | "admin";
type ModuleConfig = { title: string; description: string; oldPath: string; component: ComponentType };
type Props = { modules: Record<Module, ModuleConfig> };

/** Reuse the working module's original data and actions while previewing it in the new shell.
 * Keep all legacy routes as the canonical fallback until authenticated QA is completed.
 */
export default function OS2ModuleBridge({ modules }: Props) {
  const { module } = useParams<{ module: string }>();
  const auth = useAuth();
  const key = module as Module;
  const config = Object.prototype.hasOwnProperty.call(modules, key) ? modules[key] : undefined;
  if (!config) return <OS2Shell title="Workspace"><p>Module not found. <Link to="/os2-preview">Go to workspace</Link></p></OS2Shell>;
  const nav = navLinks.find(item => item.to === config.oldPath);
  const allowed = !nav?.allowed || nav.allowed(auth);
  if (!allowed) return <OS2Shell title="Access restricted"><div className="os2-panel os2-access-denied"><ShieldAlert size={25}/><p>Your account is not authorized for this module.</p><Link to="/os2-preview">Return to workspace</Link></div></OS2Shell>;
  const Component = config.component;
  return <OS2Shell title={config.title} description={config.description}>
    <div className="os2-module-toolbar"><span>Existing DIT tools, presented inside the OS 2.0 workspace</span><Link to={config.oldPath}><ArrowLeft size={14}/> Open original view</Link></div>
    <div className="os2-legacy-module"><Component/></div>
  </OS2Shell>;
}
