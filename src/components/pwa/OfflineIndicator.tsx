import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export const OfflineIndicator = () => {
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs font-medium text-amber-100 shadow-lg backdrop-blur-md"
    >
      <WifiOff className="h-3.5 w-3.5" />
      You're offline — some features may be limited.
    </div>
  );
};

export default OfflineIndicator;