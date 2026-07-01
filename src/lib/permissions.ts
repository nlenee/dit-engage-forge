// Central permission catalog. Add entries here; office_permissions.permission_key
// stores the same string. UI checkboxes read from PERMISSION_CATALOG.

export const PERMISSION_CATALOG: Array<{ key: string; label: string; group: string; description: string }> = [
  { key: "applications.review",  group: "Recruitment", label: "Review applications",        description: "Read, comment on, and approve/reject applications" },
  { key: "applications.schedule", group: "Recruitment", label: "Schedule interviews",       description: "Send meeting invites to applicants" },
  { key: "members.manage",       group: "Community",   label: "Manage members",             description: "Edit profiles, suspend, restore members" },
  { key: "directory.manage",     group: "Community",   label: "Manage directory",           description: "Curate the member directory" },
  { key: "announcements.publish",group: "Community",   label: "Publish announcements",      description: "Post org-wide announcements" },
  { key: "letters.create",       group: "Governance",  label: "Create official letters",    description: "Draft and issue letters" },
  { key: "finance.view",         group: "Finance",     label: "View finances",              description: "Read budgets, transactions, campaigns" },
  { key: "finance.manage",       group: "Finance",     label: "Manage finances",            description: "Create/edit budgets and transactions" },
  { key: "faction.manage",       group: "Faction",     label: "Manage own faction",         description: "Faction-scoped leadership actions" },
  { key: "offices.manage",       group: "Governance",  label: "Manage offices",             description: "Create/edit offices and assignments" },
  { key: "admin.settings",       group: "Governance",  label: "Admin settings",             description: "Global admin configuration" },
];

export const PERMISSION_KEYS = PERMISSION_CATALOG.map(p => p.key);

export function hasPermission(perms: string[] | Set<string> | null | undefined, key: string): boolean {
  if (!perms) return false;
  const set = perms instanceof Set ? perms : new Set(perms);
  return set.has("*") || set.has(key);
}

// Canonical seats surfaced in the Executive Board panel.
export const LEADERSHIP_SEATS: Array<{ role: string; title: string; perFaction?: boolean }> = [
  { role: "chief_executive_director", title: "Chief Executive Director" },
  { role: "executive_secretary",      title: "Executive Secretary" },
  { role: "community_manager",        title: "Community Manager" },
  { role: "chief_finance_officer",    title: "Chief Finance Officer" },
  { role: "executive_director",       title: "Executive Director",  perFaction: true },
  { role: "executive_assistant",      title: "Executive Assistant", perFaction: true },
];

export const FACTIONS = ["SHI", "MindUp", "Tecknallogy", "DYP"] as const;