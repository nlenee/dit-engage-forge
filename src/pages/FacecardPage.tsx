import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Share2, Loader2, Film, Upload as UploadIcon, Image as ImageIcon } from "lucide-react";
import { toPng } from "html-to-image";
// @ts-ignore
import GIF from "gif.js";
import { removeBackground } from "@imgly/background-removal";
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

type Preset = { id: string; label: string; w: number; h: number };
const PRESETS: Preset[] = [
  { id: "story", label: "Story 1080×1920", w: 1080, h: 1920 },
  { id: "portrait", label: "Portrait 1080×1350", w: 1080, h: 1350 },
  { id: "square", label: "Square 1080×1080", w: 1080, h: 1080 },
];

export default function FacecardPage() {
  const { userId: routeUserId } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const cardRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [gifBusy, setGifBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bgRemoving, setBgRemoving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [exportPreset, setExportPreset] = useState<Preset | null>(null);
  const targetId = routeUserId || user?.id;
  const isOwner = !routeUserId || routeUserId === user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["facecard", targetId],
    queryFn: async () => {
      if (!targetId) return null;
      const { data: profile } = await supabase.rpc("get_public_profile", { _user_id: targetId });
      const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", targetId).maybeSingle();
      return { profile: (profile as any[])?.[0], role: roleRow?.role };
    },
    enabled: !!targetId,
  });

  const handleFile = async (file: File) => {
    if (!user?.id || !isOwner) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      toast({ title: "Unsupported file", description: "PNG, JPG, or WEBP only", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      // AI background removal for cinematic blending
      setBgRemoving(true);
      let uploadBlob: Blob = file;
      try {
        uploadBlob = await removeBackground(file, { output: { format: "image/png", quality: 0.92 } });
      } catch (bgErr) {
        console.warn("Background removal failed, uploading original", bgErr);
      }
      setBgRemoving(false);
      const path = `${user.id}/${Date.now()}.png`;
      const { error: upErr } = await supabase.storage
        .from("headshots")
        .upload(path, uploadBlob, { upsert: true, cacheControl: "3600", contentType: "image/png" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("headshots").getPublicUrl(path);
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ headshot_url: pub.publicUrl })
        .eq("user_id", user.id);
      if (profErr) throw profErr;
      await qc.invalidateQueries({ queryKey: ["facecard", targetId] });
      toast({ title: "Portrait uploaded", description: "Background removed · cinematic facecard ready" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setUploading(false);
      setBgRemoving(false);
    }
  };

  const captureNode = async (node: HTMLDivElement, pixelRatio = 3) =>
    toPng(node, {
      cacheBust: true,
      pixelRatio,
      fetchRequestInit: { cache: "no-cache", mode: "cors" },
      skipFonts: true,
      filter: (n: any) => n.tagName !== "LINK",
    });

  const downloadDataUrl = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  };

  const baseName = (data?.profile?.full_name || "DIT_Facecard").replace(/\s+/g, "_");

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    try {
      // Pre-warm: render twice (first render flushes fonts/images, second is the real export)
      await captureNode(cardRef.current, 1);
      const url = await captureNode(cardRef.current, 3);
      downloadDataUrl(url, `${baseName}_facecard.png`);
      toast({ title: "Ultra-HD PNG downloaded" });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Download failed", description: e?.message || "Try again", variant: "destructive" });
    }
  };

  const handleExportPreset = async (preset: Preset) => {
    setExportPreset(preset);
    // wait for hidden frame to render
    await new Promise((r) => setTimeout(r, 120));
    if (!exportRef.current) return setExportPreset(null);
    try {
      const url = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        width: preset.w,
        height: preset.h,
        canvasWidth: preset.w,
        canvasHeight: preset.h,
      });
      downloadDataUrl(url, `${baseName}_${preset.id}_${preset.w}x${preset.h}.png`);
      toast({ title: `${preset.label} downloaded` });
    } catch (e: any) {
      toast({ title: "Export failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setExportPreset(null);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const url = await captureNode(cardRef.current, 3);
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], "dit-facecard.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "DIT Facecard", text: "My DIT 10th Anniversary facecard" });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent("Check out my DIT 10th Anniversary facecard!")}`, "_blank");
      }
    } catch {}
  };

  const handleGif = async () => {
    if (!cardRef.current) return;
    setGifBusy(true);
    toast({ title: "Rendering animated GIF…" });
    try {
      const frames = 16;
      const imgs: HTMLImageElement[] = [];
      const node = cardRef.current;
      for (let i = 0; i < frames; i++) {
        node.style.filter = `hue-rotate(${(i / frames) * 20}deg)`;
        const url = await toPng(node, { cacheBust: true, pixelRatio: 1 });
        const img = new Image();
        img.src = url;
        await new Promise((r) => (img.onload = r));
        imgs.push(img);
      }
      node.style.filter = "";
      const gif = new GIF({
        workers: 2,
        quality: 8,
        width: imgs[0].width,
        height: imgs[0].height,
        workerScript: "/gif.worker.js",
      });
      imgs.forEach((img) => gif.addFrame(img, { delay: 90 }));
      gif.on("finished", (blob: Blob) => {
        const u = URL.createObjectURL(blob);
        downloadDataUrl(u, `${baseName}_facecard.gif`);
        URL.revokeObjectURL(u);
        setGifBusy(false);
        toast({ title: "Animated GIF downloaded" });
      });
      gif.render();
    } catch (e: any) {
      setGifBusy(false);
      toast({ title: "GIF failed", description: e?.message || "", variant: "destructive" });
    }
  };

  if (isLoading || !data?.profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
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
  const roleLabel = ROLE_LABEL[data.role || "user"];
  const factionLabel = p.faction ? FACTION_LABELS[p.faction] || p.faction : null;

  const cardProps = {
    fullName: p.full_name || "DIT Member",
    faction: factionLabel,
    role: roleLabel,
    yearsInDIT,
    quote: p.favourite_quote,
    headshotUrl: p.headshot_url,
    xp: p.xp || 0,
    level: p.member_level || 1,
    joinedDate,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-[#07061f]">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-foreground">Your DIT Facecard</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Cinematic 10th Anniversary digital identity · Upload your portrait → auto-generated
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-start max-w-6xl mx-auto">
          {/* LIVE PREVIEW (scaled to fit) */}
          <div className="flex justify-center">
            <div
              className="origin-top"
              style={{ transform: "scale(0.62)", width: 760, height: 1200, marginBottom: -460 }}
            >
              <Facecard ref={cardRef} {...cardProps} />
            </div>
          </div>

          {/* CONTROLS */}
          <aside className="w-full lg:w-[340px] space-y-5">
            {isOwner && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFile(f);
                }}
                onClick={() => fileRef.current?.click()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
                }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">{bgRemoving ? "Removing background…" : "Uploading…"}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="font-semibold text-foreground">Upload your portrait</div>
                    <div className="text-xs text-muted-foreground">
                      Drag & drop, click, or use camera<br />PNG · JPG · WEBP · max 10MB
                    </div>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
            )}

            <div className="rounded-2xl border border-border p-4 space-y-3">
              <div className="font-semibold text-foreground flex items-center gap-2">
                <Download className="h-4 w-4" /> Export
              </div>
              <Button onClick={handleDownloadCard} className="w-full justify-start gap-2">
                <Download className="h-4 w-4" /> Ultra-HD PNG (card)
              </Button>
              {PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  variant="secondary"
                  onClick={() => handleExportPreset(preset)}
                  disabled={!!exportPreset}
                  className="w-full justify-start gap-2"
                >
                  {exportPreset?.id === preset.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UploadIcon className="h-4 w-4" />
                  )}
                  {preset.label}
                </Button>
              ))}
              <Button onClick={handleGif} disabled={gifBusy} variant="secondary" className="w-full justify-start gap-2">
                {gifBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
                Animated GIF
              </Button>
              <Button onClick={handleShare} variant="outline" className="w-full justify-start gap-2">
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
          </aside>
        </div>
      </main>

      {/* HIDDEN EXPORT FRAMES (offscreen) */}
      {exportPreset && (
        <div
          style={{
            position: "fixed",
            left: -99999,
            top: 0,
            pointerEvents: "none",
          }}
        >
          <div
            ref={exportRef}
            style={{
              width: exportPreset.w,
              height: exportPreset.h,
              background:
                "radial-gradient(120% 80% at 50% 0%, #1d1a55 0%, #0f0d3a 40%, #07061f 75%, #030314 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {(() => {
              const cardW = 760, cardH = 1200;
              const pad = exportPreset.id === "story" ? 80 : 40;
              const scale = Math.min(
                (exportPreset.w - pad * 2) / cardW,
                (exportPreset.h - pad * 2) / cardH
              );
              return (
                <div style={{ transform: `scale(${scale})`, transformOrigin: "center center", width: cardW, height: cardH }}>
                  <Facecard {...cardProps} />
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
