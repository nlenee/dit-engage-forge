import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy, Download, QrCode } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_BASE_URL = "https://dit-engage-forge.lovable.app";

interface Props {
  defaultFactionSlug?: string;
  defaultCampaign?: string;
}

const ShareLinkPanel = ({ defaultFactionSlug = "", defaultCampaign = "" }: Props) => {
  const [slug, setSlug] = useState(defaultFactionSlug);
  const [campaign, setCampaign] = useState(defaultCampaign);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const url = `${PUBLIC_BASE_URL}/apply${slug ? "/" + slug : ""}${campaign ? "?ref=" + encodeURIComponent(campaign) : ""}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 220, margin: 1 }, () => {});
    }
  }, [url]);

  const copy = () => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied", description: url });
  };

  const download = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `dit-apply-${slug || "all"}${campaign ? "-" + campaign : ""}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const persist = async () => {
    if (!campaign) return;
    await supabase.from("application_links").upsert({
      faction: slug || null,
      link_slug: slug || null,
      ref_campaign: campaign,
      target_url: url,
      is_active: true,
    } as any, { onConflict: "ref_campaign" } as any).then(() => {
      toast({ title: "Campaign saved" });
    });
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <QrCode className="w-4 h-4 text-primary" />
        <h3 className="font-display text-lg font-semibold">Share registration link</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Faction slug (optional)</Label>
          <Input value={slug} onChange={e=>setSlug(e.target.value)} placeholder="shi / dyp / teck / mindup" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Campaign tag (optional)</Label>
          <Input value={campaign} onChange={e=>setCampaign(e.target.value)} placeholder="autumn-drive" />
        </div>
      </div>
      <Input readOnly value={url} className="font-mono text-xs" />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={copy}><Copy className="w-3.5 h-3.5 mr-1"/>Copy link</Button>
        <Button size="sm" variant="outline" onClick={download}><Download className="w-3.5 h-3.5 mr-1"/>Download QR</Button>
        {campaign && <Button size="sm" onClick={persist}>Save campaign</Button>}
      </div>
      <div className="flex justify-center pt-2"><canvas ref={canvasRef} className="rounded-md border" /></div>
    </Card>
  );
};

export default ShareLinkPanel;