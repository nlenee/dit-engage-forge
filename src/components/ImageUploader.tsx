import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  bucket: "headshots" | "public-images";
  userId: string;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  shape?: "circle" | "square";
  label?: string;
  disabled?: boolean;
}

export const ImageUploader = ({ bucket, userId, currentUrl, onUploaded, shape = "circle", label = "Upload", disabled }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const onPick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum 8MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, cacheControl: "3600" });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    onUploaded(data.publicUrl);
    setPreview(data.publicUrl);
    setUploading(false);
    toast({ title: "Image uploaded" });
  };

  const display = preview || currentUrl;
  const radius = shape === "circle" ? "rounded-full" : "rounded-2xl";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative w-32 h-32 ${radius} bg-muted overflow-hidden border-2 border-border shadow-soft`}>
        {display ? (
          <img src={display} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <Button type="button" variant="outline" size="sm" onClick={onPick} disabled={uploading || disabled}>
        <Upload className="h-3 w-3 mr-2" /> {label}
      </Button>
    </div>
  );
};
