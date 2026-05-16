import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, Share2, Loader2, Film } from "lucide-react";
import { toPng } from "html-to-image";
// @ts-ignore
import GIF from "gif.js";
import Header from "@/components/Header";
import { Facecard } from "@/components/Facecard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const FACTION_LABELS: Record<string, string> = {
  SHI: "Secured Health Initiative",
  TECK: "Technology",
  MINDUP: "Mind Up",
  DYP: "Discover Your Purpose",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  chief_executive_director: "Chief Executive Director",
  executive_secretary: "Executive Secretary",
  community_manager: "Community Manager",
  chief_finance_officer: "CFO",
  executive_director: "Executive Director",
  executive_assistant: "Executive Assistant",
  user: "Member",
};

export default function FacecardPage() {
  const { userId: routeUserId } = useParams();
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [gifBusy, setGifBusy] = useState(false);
  const targetId = routeUserId || user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["facecard", targetId],
    queryFn: async () => {
      if (!targetId) return null;
      const { data: profile } = await supabase.rpc("get_public_profile", { _user_id: targetId });
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", targetId)
        .maybeSingle();
      return { profile: (profile as any[])?.[0], role: roleRow?.role };
    },
    enabled: !!targetId,
  });

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${(data?.profile?.full_name || "facecard").replace(/\s+/g, "_")}_DIT_facecard.png`;
    a.click();
    toast({ title: "Facecard downloaded", description: "Ultra-HD PNG ready to share" });
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "dit-facecard.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "DIT Facecard", text: "My DIT 10th Anniversary facecard" });
      } else {
        const wa = `https://wa.me/?text=${encodeURIComponent("Check out my DIT 10th Anniversary facecard!")}`;
        window.open(wa, "_blank");
      }
    } catch {}
  };

  const handleGif = async () => {
    if (!cardRef.current) return;
    setGifBusy(true);
    toast({ title: "Rendering animated GIF…", description: "This may take a few seconds" });
    try {
      const frames = 18;
      const images: HTMLImageElement[] = [];
      const node = cardRef.current;
      for (let i = 0; i < frames; i++) {
        // small visual variation across frames via hue shift on overlay
        node.style.filter = `hue-rotate(${(i / frames) * 25}deg)`;
        const url = await toPng(node, { cacheBust: true, pixelRatio: 1 });
        const img = new Image();
        img.src = url;
        await new Promise((r) => (img.onload = r));
        images.push(img);
      }
      node.style.filter = "";
      const w = images[0].width;
      const h = images[0].height;
      const gif = new GIF({
        workers: 2,
        quality: 8,
        width: w,
        height: h,
        workerScript: "/gif.worker.js",
      });
      images.forEach((img) => gif.addFrame(img, { delay: 90 }));
      gif.on("finished", (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(data?.profile?.full_name || "facecard").replace(/\s+/g, "_")}_DIT_facecard.gif`;
        a.click();
        URL.revokeObjectURL(url);
        setGifBusy(false);
        toast({ title: "Animated GIF downloaded" });
      });
      gif.render();
    } catch (e: any) {
      setGifBusy(false);
      toast({ title: "GIF failed", description: e?.message || "Try PNG instead", variant: "destructive" });
    }
  };

  if (isLoading || !data?.profile) {
    return (
      <div className="min-h-screen bg-background"><Header />
        <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  const p = data.profile;
  const yearsInDIT = p.date_joined_year ? new Date().getFullYear() - p.date_joined_year : null;
  const joinedDate =
    p.date_joined_year && p.date_joined_month
      ? new Date(p.date_joined_year, (p.date_joined_month || 1) - 1, p.date_joined_day || 1)
          .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          .toUpperCase()
      : p.date_joined_year
      ? String(p.date_joined_year)
      : "—";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-[#0a0a24]">
      <Header />
      <main className="container mx-auto px-4 py-10 flex flex-col items-center">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-foreground">Your DIT Facecard</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Cinematic 10th Anniversary digital identity · Ultra-HD ready
          </p>
        </div>

        <div className="animate-fade-in">
          <Facecard
            ref={cardRef}
            fullName={p.full_name || "DIT Member"}
            faction={p.faction ? FACTION_LABELS[p.faction] || p.faction : undefined}
            role={ROLE_LABEL[data.role || "user"]}
            yearsInDIT={yearsInDIT}
            quote={p.favourite_quote}
            headshotUrl={p.headshot_url}
            xp={p.xp || 0}
            level={p.member_level || 1}
            joinedDate={joinedDate}
          />
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-10">
          <Button onClick={handleDownload} size="lg" className="gap-2">
            <Download className="h-4 w-4" /> Download Ultra-HD PNG
          </Button>
          <Button onClick={handleGif} disabled={gifBusy} size="lg" variant="secondary" className="gap-2">
            {gifBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
            {gifBusy ? "Rendering GIF…" : "Download Animated GIF"}
          </Button>
          <Button onClick={handleShare} size="lg" variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" /> Share
          </Button>
        </div>
      </main>
    </div>
  );
}
