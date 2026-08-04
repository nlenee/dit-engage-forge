import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DesignSystemId = "dit-dark" | "pure-white";

export const DESIGN_SYSTEMS: { id: DesignSystemId; name: string; description: string }[] = [
  { id: "dit-dark", name: "DIT Brand Dark", description: "Cinematic navy + gold, Kanit display type." },
  { id: "pure-white", name: "Pure White Minimal", description: "White canvas, black ink, Orbitron + Plus Jakarta Sans." },
];

export const DEFAULT_TOKENS: Record<DesignSystemId, Record<string, string>> = {
  "dit-dark": {
    "--dit-bg": "#0A0D1A",
    "--dit-gold": "#c9a84c",
    "--dit-gold-soft": "#c9a84c40",
    "--dit-text": "#D7E2EA",
    "--dit-offwhite": "#F9F6F0",
    "--dit-gradient-start": "#4a5568",
    "--dit-gradient-end": "#c9a84c",
  },
  "pure-white": {
    "--pw-bg": "#ffffff",
    "--pw-text": "#000000",
    "--pw-grid": "#64748b",
    "--pw-gray-200": "#e5e7eb",
    "--pw-gray-400": "#9ca3af",
  },
};

export const FONT_HREFS: Record<DesignSystemId, string> = {
  "dit-dark":
    "https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800;900&display=swap",
  "pure-white":
    "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Michroma&family=Orbitron:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
};

export interface PageStyleRow {
  id: string;
  route: string;
  label: string;
  design_system: DesignSystemId;
  tokens: Record<string, string> | null;
}

export function usePageStyles() {
  return useQuery({
    queryKey: ["page-styles"],
    queryFn: async (): Promise<PageStyleRow[]> => {
      const { data, error } = await supabase.from("page_styles").select("*").order("route");
      if (error) throw error;
      return (data ?? []) as unknown as PageStyleRow[];
    },
    staleTime: 30_000,
  });
}

/** Matches a concrete pathname against stored route patterns like "/members/:slug". */
export function matchRoute(pathname: string, routes: string[]): string | null {
  const exact = routes.find((r) => r === pathname);
  if (exact) return exact;
  for (const r of routes) {
    if (!r.includes(":")) continue;
    const re = new RegExp("^" + r.replace(/:[^/]+/g, "[^/]+") + "$");
    if (re.test(pathname)) return r;
  }
  return null;
}