import { useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, Share2, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
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
    const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${(data?.profile?.full_name || "facecard").replace(/\s+/g, "_")}_DIT_facecard.png`;
    a.click();
    toast({ title: "Facecard downloaded" });
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
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

  if (isLoading || !data?.profile) {
    return (
      <div className="min-h-screen bg-background"><Header />
        <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  const p = data.profile;
  const yearsInDIT = p.date_joined_year ? new Date().getFullYear() - p.date_joined_year : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 flex flex-col items-center">
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl font-bold text-foreground">DIT Facecard</h1>
          <p className="text-muted-foreground text-sm mt-1">Share your premium digital identity</p>
        </div>

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
        />

        <div className="flex gap-3 mt-8">
          <Button onClick={handleDownload} className="gap-2"><Download className="h-4 w-4" /> Download PNG</Button>
          <Button onClick={handleShare} variant="outline" className="gap-2"><Share2 className="h-4 w-4" /> Share</Button>
        </div>
      </main>
    </div>
  );
}
