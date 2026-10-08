/** Post-sign-in destination helpers. Only same-origin relative paths are accepted. */
const KEY = "auth_next";
export const DEFAULT_AFTER_LOGIN = "/dashboard";

export function safeNext(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (/[\u0000-\u001f]/.test(raw)) return null;
  const path = raw.split(/[?#]/)[0];
  if (path === "/auth" || path === "/" ) return null;
  return raw;
}

export function storeNext(raw: string | null | undefined) {
  const n = safeNext(raw);
  try {
    if (n) sessionStorage.setItem(KEY, n);
  } catch {}
}

export function peekNext(): string | null {
  try { return safeNext(sessionStorage.getItem(KEY)); } catch { return null; }
}

export function consumeNext(): string {
  const n = peekNext();
  try { sessionStorage.removeItem(KEY); } catch {}
  return n || DEFAULT_AFTER_LOGIN;
}
