// Single source of truth for how a person's role/title is shown across the platform.

export const ROLE_TITLES: Record<string, string> = {
  admin: "Admin",
  chief_executive_director: "Chief Executive Director",
  executive_secretary: "Executive Secretary",
  chief_finance_officer: "Chief Finance Officer",
  cfo: "Chief Finance Officer",
  community_manager: "Chief Community Officer",
  executive_director: "Executive Director",
  executive_assistant: "Executive Assistant",
  super_admin: "Admin",
  user: "Member",
};

export const ROLE_ABBR: Record<string, string> = {
  chief_executive_director: "CED",
  executive_secretary: "ES",
  chief_finance_officer: "CFO",
  cfo: "CFO",
  community_manager: "CCO",
  executive_director: "ED",
  executive_assistant: "EA",
};

export const roleTitle = (role?: string | null): string =>
  (role && ROLE_TITLES[role]) || "Member";

export const roleAbbr = (role?: string | null): string | null =>
  (role && ROLE_ABBR[role]) || null;

export interface TitleSource {
  executive_role?: string | null;
  executive_role_abbr?: string | null;
  custom_role_title?: string | null;
  primary_role?: string | null;
  role?: string | null;
}

/** Resolve the one title shown for a person, in priority order. */
export const memberTitle = (m: TitleSource): string =>
  m.executive_role || m.custom_role_title || roleTitle(m.primary_role || m.role);

/** Short code (CED, ES, CFO…) or null for ordinary members. */
export const memberAbbr = (m: TitleSource): string | null =>
  m.executive_role_abbr || roleAbbr(m.primary_role || m.role);
