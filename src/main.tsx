import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./pwa/register";

// A deployment can briefly serve an older app bundle whose lazy-loaded assets
// have already been replaced. Recover once per failed asset without creating a
// reload loop if the asset is still unavailable after revalidating the page.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();

  const payload = (event as Event & { payload?: unknown }).payload;
  const failedAsset = payload instanceof Error ? payload.message : String(payload ?? "unknown");
  const recoveryKey = `dit:preload-recovery:${failedAsset}`;

  try {
    if (sessionStorage.getItem(recoveryKey) === "attempted") {
      console.error("A lazy-loaded app asset is still unavailable after refresh.", payload);
      return;
    }

    sessionStorage.setItem(recoveryKey, "attempted");
  } catch {
    // Storage can be unavailable in restricted browsers; still make one refresh.
  }

  window.location.reload();
});

createRoot(document.getElementById("root")!).render(<App />);

registerServiceWorker();
