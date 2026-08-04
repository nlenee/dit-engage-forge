import { createContext, useContext, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  DEFAULT_TOKENS,
  DesignSystemId,
  FONT_HREFS,
  matchRoute,
  usePageStyles,
} from "./pageStyles";

interface DesignSystemContextValue {
  designSystem: DesignSystemId | null;
  tokens: Record<string, string>;
  loading: boolean;
}

const DesignSystemContext = createContext<DesignSystemContextValue>({
  designSystem: null,
  tokens: {},
  loading: true,
});

export const useDesignSystem = () => useContext(DesignSystemContext);

function useFontLink(href: string | null) {
  useEffect(() => {
    if (!href) return;
    const id = "ds-font-" + btoa(href).slice(0, 12);
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }, [href]);
}

export function DesignSystemProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { data, isLoading } = usePageStyles();

  const value = useMemo<DesignSystemContextValue>(() => {
    const rows = data ?? [];
    const key = matchRoute(location.pathname, rows.map((r) => r.route));
    const row = key ? rows.find((r) => r.route === key) : undefined;
    const ds = (row?.design_system ?? null) as DesignSystemId | null;
    const tokens = ds ? { ...DEFAULT_TOKENS[ds], ...(row?.tokens ?? {}) } : {};
    return { designSystem: ds, tokens, loading: isLoading };
  }, [data, isLoading, location.pathname]);

  useFontLink(value.designSystem ? FONT_HREFS[value.designSystem] : null);

  useEffect(() => {
    const root = document.documentElement;
    const applied = Object.entries(value.tokens);
    applied.forEach(([k, v]) => root.style.setProperty(k, v));
    return () => applied.forEach(([k]) => root.style.removeProperty(k));
  }, [value.tokens]);

  return (
    <DesignSystemContext.Provider value={value}>{children}</DesignSystemContext.Provider>
  );
}