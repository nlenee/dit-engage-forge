// Guarded service-worker registration. Only registers in production and
// outside Lovable preview/iframe contexts. Unregisters any stale worker
// when refusal conditions are met.

const SW_URL = "/sw.js";

function shouldRefuse(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  const url = new URL(window.location.href);
  if (url.searchParams.get("sw") === "off") return true;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  return false;
}

async function unregisterExisting() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => r.active?.scriptURL?.endsWith(SW_URL) || r.installing?.scriptURL?.endsWith(SW_URL) || r.waiting?.scriptURL?.endsWith(SW_URL))
      .map((r) => r.unregister()),
  );
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (shouldRefuse()) {
    void unregisterExisting();
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(SW_URL).catch((err) => {
      console.warn("[pwa] SW registration failed:", err);
    });
  });
}